// Testa a camada de dados do app (src/api/supabase.js) contra o banco de verdade:
// Postgres com as migrações + PostgREST (o mesmo servidor de API do Supabase).
// O scripts/testar.sh sobe tudo e define as variáveis abaixo; sem elas, o teste é pulado.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { criarApi } from '../src/api/supabase.js';
import { previa } from '../src/lib/regras.js';

const { POSTGREST_URL, JWT_SECRET, PGDATABASE } = process.env;
const pular = !POSTGREST_URL || !JWT_SECRET || !PGDATABASE;

const ANA = '11111111-1111-1111-1111-111111111111';
const BRUNO = '22222222-2222-2222-2222-222222222222';
const PROF = '99999999-9999-9999-9999-999999999999';

const sql = (comando) => execFileSync('psql', ['-q', '-tA', '-v', 'ON_ERROR_STOP=1', '-c', comando], { encoding: 'utf8' }).trim();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(sub, email, role = 'authenticated') {
  const corpo = b64({ alg: 'HS256', typ: 'JWT' }) + '.' +
    b64({ sub, email, role, aud: role, exp: Math.floor(Date.now() / 1000) + 3600 });
  return corpo + '.' + createHmac('sha256', JWT_SECRET).update(corpo).digest('base64url');
}

// O supabase-js chama /rest/v1/...; o PostgREST responde na raiz. Um proxy mínimo faz a ponte.
let proxy;
let URL_PROXY;
const apis = {};

before(async () => {
  if (pular) return;
  proxy = createServer((req, res) => {
    const destino = new URL(req.url.replace(/^\/rest\/v1/, ''), POSTGREST_URL);
    const r = request(destino, { method: req.method, headers: { ...req.headers, host: destino.host } }, (resp) => {
      res.writeHead(resp.statusCode, resp.headers); resp.pipe(res);
    });
    req.pipe(r);
  });
  await new Promise((ok) => proxy.listen(0, ok));
  URL_PROXY = `http://127.0.0.1:${proxy.address().port}`;

  sql(`insert into turmas (nome, token, dominio_email) values
        ('ADM3', 'ADM3-TEST', 'isecensa.edu.br'), ('ADM5', 'ADM5-TEST', 'isecensa.edu.br');
       insert into auth.users (id, email, raw_user_meta_data) values
        ('${ANA}', 'ana@isecensa.edu.br', '{"nome":"Ana Souza","token":"ADM3-TEST"}'),
        ('${BRUNO}', 'bruno@isecensa.edu.br', '{"nome":"Bruno Lima","token":"adm5test"}'),
        ('${PROF}', 'saulojardim@id.uff.br', '{"nome":"Gestor"}');
       insert into cotacoes (ticker, data, preco)
         select ticker, current_date - 1, 20 from empresas;
       insert into cotacoes (ticker, data, preco)
         select ticker, current_date, case ticker when 'PETR4' then 40 when 'VALE3' then 60 else 21 end from empresas;
       insert into feriados values (current_date, 'TESTE') on conflict do nothing;`);

  for (const [nome, id, email] of [['ana', ANA, 'ana@isecensa.edu.br'], ['bruno', BRUNO, 'bruno@isecensa.edu.br'],
    ['prof', PROF, 'saulojardim@id.uff.br']]) {
    const t = token(id, email);
    apis[nome] = criarApi(createClient(URL_PROXY, 'chave-anon-de-teste', { accessToken: async () => t }));
  }
  const tAnon = token(null, null, 'anon');
  apis.visitante = criarApi(createClient(URL_PROXY, 'chave-anon-de-teste', { accessToken: async () => tAnon }));
});

after(() => proxy?.close());

test('aluno lê perfil, config e mercado', { skip: pular }, async () => {
  const perfil = await apis.ana.perfil(ANA);
  assert.equal(perfil.nome, 'Ana Souza');
  assert.equal(Number(perfil.saldo), 10000);

  const config = await apis.ana.config();
  assert.equal(Number(config.corretagem), 15);
  assert.equal(Number(config.limite_descoberto), 0.4);

  const mercado = await apis.ana.mercado();
  assert.equal(mercado.length, 76);
  const petr = mercado.find((e) => e.ticker === 'PETR4');
  assert.equal(Number(petr.preco), 40);
  assert.equal(Number(petr.variacao_pct), 100);   // 20 -> 40

  assert.equal(await apis.ana.negociacaoLiberada(), true);
  assert.equal(await apis.ana.souAdmin(), false);
});

test('a prévia da boleta bate com o que o banco executa', { skip: pular }, async () => {
  const cfg = await apis.ana.config();
  let saldo = Number((await apis.ana.perfil(ANA)).saldo);

  // compra
  let p = previa({ tipo: 'compra', quantidade: 100, preco: 40, saldo, config: cfg });
  let o = await apis.ana.executarOrdem('PETR4', 'compra', 100);
  assert.equal(Number(o.saldo_apos), saldo + p.efeitoSaldo);
  saldo = Number(o.saldo_apos);

  const carteira = await apis.ana.carteira(ANA);
  assert.equal(carteira.length, 1);
  assert.equal(carteira[0].quantidade, 100);
  assert.equal(Number(carteira[0].preco_medio), 40.15);

  // venda parcial
  p = previa({ tipo: 'venda', quantidade: 30, preco: 40, saldo, config: cfg, qtdComprada: 100 });
  o = await apis.ana.executarOrdem('PETR4', 'venda', 30);
  assert.equal(Number(o.saldo_apos), saldo + p.efeitoSaldo);
  saldo = Number(o.saldo_apos);

  // venda a descoberto dentro do limite
  p = previa({ tipo: 'venda_descoberto', quantidade: 10, preco: 60, saldo, config: cfg });
  assert.equal(p.erro, null);
  o = await apis.ana.executarOrdem('VALE3', 'venda_descoberto', 10);
  assert.equal(Number(o.saldo_apos), saldo + p.efeitoSaldo);
  saldo = Number(o.saldo_apos);

  const vendidas = await apis.ana.vendidas(ANA);
  assert.equal(vendidas.length, 1);
  assert.equal(Number(vendidas[0].garantia), 600);
  assert.equal(Number(vendidas[0].resultado_acumulado), -15);

  // recompra parcial
  p = previa({ tipo: 'recompra', quantidade: 4, preco: 60, saldo, config: cfg, vendida: vendidas[0] });
  o = await apis.ana.executarOrdem('VALE3', 'recompra', 4);
  assert.equal(Number(o.saldo_apos), saldo + p.efeitoSaldo);

  // limite de 40%: a prévia e o banco recusam juntos
  saldo = Number(o.saldo_apos);
  const exposicao = (await apis.ana.vendidas(ANA)).reduce((s, v) => s + Number(v.custo_recompra), 0);
  p = previa({ tipo: 'venda_descoberto', quantidade: 1000, preco: 21, saldo, config: cfg, exposicao });
  assert.ok(p.erro);
  await assert.rejects(apis.ana.executarOrdem('ITUB4', 'venda_descoberto', 1000), /Limite de venda a descoberto/);

  const ordens = await apis.ana.ordens(ANA);
  assert.equal(ordens.length, 4);
  assert.deepEqual(ordens.map((x) => x.tipo), ['recompra', 'venda_descoberto', 'venda', 'compra']);
});

test('mensagens de erro do banco chegam em português', { skip: pular }, async () => {
  await assert.rejects(apis.bruno.executarOrdem('PETR4', 'compra', 100000), /Saldo insuficiente: a ordem custa R\$ 4\.000\.015,00/);
  await assert.rejects(apis.bruno.executarOrdem('PETR4', 'venda', 1), /Você tem 0 ações de PETR4/);
  await assert.rejects(apis.bruno.executarOrdem('XXXX3', 'compra', 1), /não está disponível/);
});

test('negociação fechada é recusada', { skip: pular }, async () => {
  sql(`update config set negociacao_pausada = true`);
  try {
    assert.equal(await apis.bruno.negociacaoLiberada(), false);
    await assert.rejects(apis.bruno.executarOrdem('PETR4', 'compra', 1), /Negociação fechada/);
  } finally {
    sql(`update config set negociacao_pausada = false`);
  }
});

test('um aluno não enxerga a conta do outro', { skip: pular }, async () => {
  assert.deepEqual(await apis.bruno.carteira(ANA), []);
  assert.deepEqual(await apis.bruno.vendidas(ANA), []);
  assert.deepEqual(await apis.bruno.ordens(ANA), []);
  await assert.rejects(apis.bruno.perfil(ANA));          // .single() sem linha
  assert.deepEqual(await apis.bruno.coletas(), []);      // log só para o gestor
  await assert.rejects(apis.bruno.turmas(), /Apenas o gestor/);
  await assert.rejects(apis.bruno.criarTurma('X', null), /Apenas o gestor/);
  await assert.rejects(apis.bruno.encerrar('PETR4', 10), /Apenas o gestor/);
  assert.deepEqual(await apis.bruno.alertas().catch((e) => e.message), 'Apenas o gestor pode fazer isso.');
});

test('ranking geral e por turma, sem o gestor', { skip: pular }, async () => {
  const geral = await apis.bruno.ranking(null);
  assert.deepEqual(geral.map((r) => r.nome).sort(), ['Ana Souza', 'Bruno Lima']);
  const perfil = await apis.bruno.perfil(BRUNO);
  assert.equal(perfil.turma, 'ADM5');
  const turma = await apis.bruno.ranking(perfil.turma_id);
  assert.deepEqual(turma.map((r) => [r.nome, r.eu]), [['Bruno Lima', true]]);
  assert.equal(Number(turma[0].patrimonio), 10000);
});

test('visitante confere o token antes do cadastro', { skip: pular }, async () => {
  assert.deepEqual(await apis.visitante.verificarToken('adm3-test'), { turma: 'ADM3', dominio_email: 'isecensa.edu.br' });
  assert.equal(await apis.visitante.verificarToken('NAOE-XIST'), null);
  await assert.rejects(apis.visitante.turmas());
});

test('gestor: turmas, alunos, token novo e pausa', { skip: pular }, async () => {
  assert.equal(await apis.prof.souAdmin(), true);
  const nova = await apis.prof.criarTurma('UFF 2026', '@id.uff.br');
  assert.match(nova.token, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(nova.dominio_email, 'id.uff.br');
  await assert.rejects(apis.prof.criarTurma('Ruim', 'semponto'), /Domínio de e-mail inválido/);

  const turmas = await apis.prof.turmas();
  assert.deepEqual(turmas.map((t) => [t.nome, Number(t.alunos)]).sort(), [['ADM3', 1], ['ADM5', 1], ['UFF 2026', 0]]);
  const adm3 = turmas.find((t) => t.nome === 'ADM3');
  const alunos = await apis.prof.alunosTurma(adm3.id);
  assert.deepEqual(alunos.map((a) => a.nome), ['Ana Souza']);
  assert.ok(Number(alunos[0].ordens) >= 0);

  const editada = await apis.prof.atualizarTurma(nova.id, { nome: 'UFF 2026.2', dominio: '', ativa: false });
  assert.deepEqual([editada.nome, editada.dominio_email, editada.ativa], ['UFF 2026.2', null, false]);
  const token = await apis.prof.novoToken(nova.id);
  assert.notEqual(token, nova.token);

  assert.equal(await apis.prof.definirPausa(true), true);
  assert.equal(await apis.ana.negociacaoLiberada(), false);
  assert.equal(await apis.prof.definirPausa(false), false);
  assert.deepEqual(await apis.prof.alertas(), []);
});

test('gestor: suspensão bloqueia ordens e aparece para o aluno', { skip: pular }, async () => {
  const impacto = await apis.prof.impactoAcao('bbas3');
  assert.equal(impacto.ticker, 'BBAS3');
  await apis.prof.suspender('BBAS3', true);
  const m = (await apis.ana.mercado()).find((e) => e.ticker === 'BBAS3');
  assert.equal(m.situacao, 'suspensa');
  await assert.rejects(apis.ana.executarOrdem('BBAS3', 'compra', 1), /suspensa/);
  await apis.prof.suspender('BBAS3', false);
  const eventos = await apis.prof.eventos();
  assert.deepEqual(eventos.map((e) => e.tipo), ['reativacao', 'suspensao']);
  assert.deepEqual(await apis.ana.eventos(), []);           // aluno não vê eventos
  assert.deepEqual(await apis.ana.ajustes(ANA), []);
});

test('gestor vê o próprio perfil e não aparece no ranking', { skip: pular }, async () => {
  const perfil = await apis.prof.perfil(PROF);
  assert.equal(perfil.email, 'saulojardim@id.uff.br');
  // carteira filtrada pelo próprio id, mesmo enxergando a de todos
  assert.deepEqual(await apis.prof.carteira(PROF), []);
  assert.ok(Array.isArray(await apis.prof.coletas()));
});

test('histórico diário, minigráficos e patrimônio do aluno', { skip: pular }, async () => {
  const h = await apis.ana.historico('PETR4');
  assert.deepEqual(h.map((x) => Number(x.preco)), [20, 40]);
  assert.ok('abertura' in h[0] && 'volume' in h[0]);
  const ontem = h[0].data;
  assert.deepEqual((await apis.ana.historico('PETR4', h[1].data)).length, 1);

  const linhas = await apis.ana.linhasMercado(ontem);
  assert.equal(Object.keys(linhas).length, 76);                  // todas as ações do Ibovespa
  assert.deepEqual(linhas.PETR4, [20, 40]);                      // em ordem de data, como números
  assert.deepEqual(await apis.ana.linhasMercado('2099-01-01'), {});

  // conta nova nasce com um ponto; aluno só vê o próprio
  const patr = await apis.ana.patrimonioDiario(ANA);
  assert.equal(patr.length, 1);
  assert.equal(Number(patr[0].patrimonio), 10000);
  assert.deepEqual(await apis.bruno.patrimonioDiario(ANA), []);

  // o mercado traz os campos novos
  const m = (await apis.ana.mercado())[0];
  for (const campo of ['logo_url', 'abertura', 'maxima', 'minima', 'volume']) assert.ok(campo in m, campo);
});
