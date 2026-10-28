// Modo demonstração: mesma interface da api do Supabase, com dados fictícios
// em memória e as mesmas regras do banco. Serve para ver as telas sem servidor.
import { previa } from '../lib/regras.js';

const CONFIG = {
  dominio_email: 'isecensa.edu.br', saldo_inicial: 10000, corretagem: 15,
  aluguel_mensal: 0.03, limite_descoberto: 0.4, stop_prejuizo: 0.8,
  hora_abre: 19, hora_fecha: 9, negociacao_pausada: false,
};

// Preços fictícios, só para demonstração
const EMPRESAS = [
  ['ABEV3', 'Ambev', 'Bebidas', 13.42, 13.31], ['ASAI3', 'Assaí', 'Varejo', 9.87, 10.12],
  ['B3SA3', 'B3', 'Serviços Financeiros', 13.05, 12.88], ['BBAS3', 'Banco do Brasil', 'Bancos', 27.64, 27.9],
  ['BBDC4', 'Bradesco', 'Bancos', 16.21, 16.02], ['BBSE3', 'BB Seguridade', 'Seguros', 36.1, 35.8],
  ['BPAC11', 'BTG Pactual', 'Bancos', 46.75, 45.92], ['CMIG4', 'Cemig', 'Energia Elétrica', 11.3, 11.41],
  ['EQTL3', 'Equatorial', 'Energia Elétrica', 36.2, 35.94], ['GGBR4', 'Gerdau', 'Siderurgia', 17.88, 18.3],
  ['ITSA4', 'Itaúsa', 'Holdings', 11.02, 10.95], ['ITUB4', 'Itaú Unibanco', 'Bancos', 38.9, 38.41],
  ['KLBN11', 'Klabin', 'Papel e Celulose', 19.6, 19.72], ['LREN3', 'Lojas Renner', 'Varejo', 16.45, 16.9],
  ['MGLU3', 'Magazine Luiza', 'Varejo', 8.92, 9.41], ['PETR4', 'Petrobras', 'Petróleo e Gás', 31.86, 31.2],
  ['PRIO3', 'PRIO', 'Petróleo e Gás', 41.5, 40.73], ['RADL3', 'Raia Drogasil', 'Saúde', 21.34, 21.6],
  ['RDOR3', "Rede D'Or", 'Saúde', 38.75, 38.22], ['SANB11', 'Santander Brasil', 'Bancos', 29.1, 29.05],
  ['SBSP3', 'Sabesp', 'Saneamento', 118.4, 116.9], ['SUZB3', 'Suzano', 'Papel e Celulose', 54.3, 55.02],
  ['TAEE11', 'Taesa', 'Energia Elétrica', 35.6, 35.6], ['TIMS3', 'TIM', 'Telecomunicações', 18.7, 18.55],
  ['TOTS3', 'Totvs', 'Tecnologia', 44.1, 43.2], ['UGPA3', 'Ultrapar', 'Petróleo e Gás', 19.95, 20.31],
  ['VALE3', 'Vale', 'Mineração', 57.8, 56.95], ['VBBR3', 'Vibra Energia', 'Petróleo e Gás', 22.4, 22.18],
  ['VIVT3', 'Telefônica Vivo', 'Telecomunicações', 30.25, 30.4], ['WEGE3', 'WEG', 'Bens Industriais', 43.6, 44.35],
];

const hojeISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const r2 = (v) => Math.round(v * 100) / 100;

// ---- histórico fictício, sempre igual para a mesma ação (gerador com semente)
function semente(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// dias úteis dos últimos N dias corridos, terminando no último pregão
function diasUteis(n) {
  const fim = new Date(hojeISO() + 'T12:00:00Z');
  const datas = [];
  for (let i = n; i >= 0; i--) {
    const d = new Date(fim); d.setUTCDate(fim.getUTCDate() - i);
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6) datas.push(d.toISOString().slice(0, 10));
  }
  return datas;
}

const historicos = {};
function historicoDe(ticker, preco, anterior) {
  if (historicos[ticker]) return historicos[ticker];
  const rnd = semente(ticker);
  const datas = diasUteis(92);
  const fech = new Array(datas.length);
  fech[datas.length - 1] = preco;
  fech[datas.length - 2] = anterior;
  const tendencia = (rnd() - 0.45) * 0.004;
  for (let i = datas.length - 3; i >= 0; i--) {
    fech[i] = fech[i + 1] / (1 + tendencia + (rnd() - 0.5) * 0.035);
  }
  const volumeBase = 5e6 + rnd() * 6e7;
  historicos[ticker] = datas.map((data, i) => {
    const preco = r2(fech[i]);
    const abertura = r2(i ? fech[i - 1] * (1 + (rnd() - 0.5) * 0.01) : preco);
    return {
      data, preco, abertura,
      maxima: r2(Math.max(abertura, preco) * (1 + rnd() * 0.012)),
      minima: r2(Math.min(abertura, preco) * (1 - rnd() * 0.012)),
      volume: Math.round(volumeBase * (0.6 + rnd() * 0.8)),
    };
  });
  return historicos[ticker];
}
const atraso = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const horasAtras = (h) => new Date(Date.now() - h * 3600e3).toISOString();

function criarEstado() {
  const precos = Object.fromEntries(EMPRESAS.map(([t, , , p, a]) => [t, { preco: p, anterior: a }]));
  const s = {
    uid: 'demo-aluno',
    perfil: { user_id: 'demo-aluno', email: 'ana.souza@isecensa.edu.br', nome: 'Ana Souza', turma: 'ADM 3º período', turma_id: 1, saldo: 10000 },
    precos,
    posicoes: {},   // ticker -> { quantidade, preco_medio }
    vendidas: {},   // ticker -> { quantidade, preco_medio, garantia, aluguel_pago, corretagem_paga, aberta_em }
    ordens: [],
    cobrancas: [],
    proximoId: 1,
  };
  // histórico inicial da Ana
  const ordem = (ticker, tipo, qtd, preco, h) => executar(s, ticker, tipo, qtd, preco, horasAtras(h));
  ordem('ITUB4', 'compra', 60, 37.2, 150);
  ordem('PETR4', 'compra', 80, 32.4, 148);
  ordem('WEGE3', 'compra', 30, 42.1, 75);
  ordem('MGLU3', 'venda_descoberto', 150, 9.6, 50);
  ordem('PETR4', 'venda', 20, 32.9, 26);
  s.cobrancas.push({ id: 1, ticker: 'MGLU3', data: hojeISO(), dias: 2, base: 1338, valor: 2.68, criado_em: horasAtras(2) });
  s.perfil.saldo = r2(s.perfil.saldo - 2.68);
  s.vendidas.MGLU3.aluguel_pago = 2.68;
  return s;
}

function executar(s, ticker, tipo, q, preco, quando = new Date().toISOString()) {
  const c = CONFIG.corretagem;
  const bruto = r2(q * preco);
  let valor_total;
  let aluguel = 0;
  if (tipo === 'compra') {
    valor_total = bruto + c;
    const p = s.posicoes[ticker] ?? { quantidade: 0, preco_medio: 0 };
    p.preco_medio = (p.quantidade * p.preco_medio + valor_total) / (p.quantidade + q);
    p.quantidade += q;
    s.posicoes[ticker] = p;
    s.perfil.saldo = r2(s.perfil.saldo - valor_total);
  } else if (tipo === 'venda') {
    valor_total = bruto - c;
    s.posicoes[ticker].quantidade -= q;
    if (!s.posicoes[ticker].quantidade) delete s.posicoes[ticker];
    s.perfil.saldo = r2(s.perfil.saldo + valor_total);
  } else if (tipo === 'venda_descoberto') {
    valor_total = bruto;
    const v = s.vendidas[ticker] ?? { quantidade: 0, garantia: 0, aluguel_pago: 0, corretagem_paga: 0, aberta_em: quando };
    v.quantidade += q; v.garantia = r2(v.garantia + bruto); v.corretagem_paga += c;
    v.preco_medio = v.garantia / v.quantidade;
    s.vendidas[ticker] = v;
    s.perfil.saldo = r2(s.perfil.saldo - c);
  } else {
    const v = s.vendidas[ticker];
    const liberada = r2(v.garantia * q / v.quantidade);
    valor_total = r2(liberada - bruto - c);
    if (q === v.quantidade) delete s.vendidas[ticker];
    else {
      v.aluguel_pago = r2(v.aluguel_pago - v.aluguel_pago * q / v.quantidade);
      v.corretagem_paga = r2(v.corretagem_paga - v.corretagem_paga * q / v.quantidade);
      v.quantidade -= q; v.garantia = r2(v.garantia - liberada);
    }
    s.perfil.saldo = r2(s.perfil.saldo + valor_total);
  }
  const o = {
    id: s.proximoId++, user_id: s.uid, ticker, tipo, quantidade: q, preco, data_preco: hojeISO(),
    corretagem: c, valor_total: r2(valor_total), saldo_apos: s.perfil.saldo, aluguel,
    automatica: false, observacao: tipo === 'venda_descoberto' ? 'Valor da venda bloqueado como garantia até a recompra.' : null,
    criado_em: quando,
  };
  s.ordens.unshift(o);
  return o;
}

const EMAIL_GESTOR = 'saulojardim@id.uff.br';

function tokenAleatorio() {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let t = '';
  for (let i = 0; i < 8; i++) t += (i === 4 ? '-' : '') + a[Math.floor(Math.random() * a.length)];
  return t;
}

// Turmas, alunos e alertas fictícios da área do gestor
function criarGestao() {
  const aluno = (nome, turma_id, patrimonio, ordens, dominio = 'isecensa.edu.br') => ({
    user_id: nome, nome, turma_id, patrimonio, saldo: r2(patrimonio * 0.35), ordens,
    email: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(' ', '.') + '@' + dominio,
    ultima_ordem: horasAtras(ordens * 7), criado_em: horasAtras(300),
  });
  return {
    pausada: false,
    turmas: [
      { id: 1, nome: 'ADM 3º período', token: 'ADM3-2026', dominio_email: 'isecensa.edu.br', ativa: true, criada_em: horasAtras(400) },
      { id: 2, nome: 'ADM 5º período', token: 'K7QM-P2XA', dominio_email: 'isecensa.edu.br', ativa: true, criada_em: horasAtras(380) },
      { id: 3, nome: 'Finanças UFF', token: 'UFF7-H3RT', dominio_email: 'id.uff.br', ativa: false, criada_em: horasAtras(200) },
    ],
    alunos: [
      aluno('Bruno Lima', 1, 10612.4, 9), aluno('Carla Menezes', 1, 10388.1, 6), aluno('Eduarda Prates', 1, 9978.35, 4),
      aluno('Gabriela Tavares', 1, 9433.9, 12), aluno('Ana Souza', 1, 10148.92, 6),
      aluno('Diego Rocha', 2, 10251.0, 5), aluno('Felipe Arruda', 2, 9711.2, 3),
      aluno('Helena Castro', 3, 10044.0, 2, 'id.uff.br'),
    ],
    alertas: [
      { id: 2, tipo: 'variacao_brusca', ticker: 'BBDC4', criado_em: horasAtras(3), alunos: 2,
        mensagem: 'BBDC4 foi de R$ 32,42 para R$ 16,21 no último pregão (−50%). Pode ser um desdobramento de 1 para 2.',
        detalhes: { de: 1, para: 2 } },
      { id: 1, tipo: 'sem_cotacao', ticker: 'TAEE11', criado_em: horasAtras(27), alunos: 0,
        mensagem: 'TAEE11 está sem cotação há 2 pregões. Pode ter sido suspensa, saído da bolsa ou mudado de código.',
        detalhes: { pregoes: 2 } },
    ],
    eventos: [],
  };
}

export function criarApiDemo() {
  let estado = criarEstado();
  let gestao = criarGestao();
  const params = new URLSearchParams(location.search);
  let gestor = params.has('gestor');
  let logado = params.has('entrar') || gestor;
  const ouvintes = new Set();
  const sessaoAtual = () => (logado ? { id: gestor ? 'demo-gestor' : estado.uid, email: gestor ? EMAIL_GESTOR : estado.perfil.email } : null);
  const avisar = (ev) => ouvintes.forEach((cb) => cb(ev, sessaoAtual()));
  const evento = (tipo, ticker, descricao, alunos = 0) => {
    gestao.eventos.unshift({ id: gestao.eventos.length + 1, tipo, ticker, descricao, alunos, executado_em: new Date().toISOString() });
    gestao.alertas = gestao.alertas.filter((a) => a.ticker !== ticker);
  };
  const precoDe = (t) => estado.precos[t].preco;

  const carteira = () => Object.entries(estado.posicoes).map(([ticker, p]) => {
    const atual = precoDe(ticker);
    return {
      user_id: estado.uid, ticker, nome: EMPRESAS.find((e) => e[0] === ticker)[1], setor: EMPRESAS.find((e) => e[0] === ticker)[2], logo_url: null,
      quantidade: p.quantidade, preco_medio: p.preco_medio, preco_atual: atual,
      valor_atual: r2(p.quantidade * atual), resultado: r2(p.quantidade * (atual - p.preco_medio)),
      resultado_pct: r2((atual / p.preco_medio - 1) * 100),
    };
  });
  const vendidas = () => Object.entries(estado.vendidas).map(([ticker, v]) => {
    const atual = precoDe(ticker);
    const custo = r2(v.quantidade * atual);
    return {
      user_id: estado.uid, ticker, nome: EMPRESAS.find((e) => e[0] === ticker)[1], logo_url: null,
      quantidade: v.quantidade, preco_venda: v.preco_medio, preco_atual: atual, garantia: v.garantia,
      custo_recompra: custo, resultado: r2(v.garantia - custo), aluguel_pago: v.aluguel_pago,
      aberta_em: v.aberta_em, corretagem_paga: v.corretagem_paga,
      resultado_acumulado: r2(v.garantia - custo - v.aluguel_pago - v.corretagem_paga),
    };
  });

  return {
    modoDemo: true,
    async sessao() { return sessaoAtual(); },
    aoMudarSessao(cb) { ouvintes.add(cb); return () => ouvintes.delete(cb); },
    async entrar(email, senha) {
      await atraso(300);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || senha.length < 6) throw new Error('E-mail ou senha incorretos.');
      gestor = email.trim().toLowerCase() === EMAIL_GESTOR;
      logado = true; avisar('SIGNED_IN');
    },
    async verificarToken(token) {
      const limpo = token.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const t = gestao.turmas.find((x) => x.token.replace('-', '') === limpo && x.ativa);
      return t ? { turma: t.nome, dominio_email: t.dominio_email } : null;
    },
    async cadastrar({ email, token }) {
      await atraso(300);
      const t = await this.verificarToken(token);
      if (!t) throw new Error('Token de turma inválido ou turma fechada. Peça o token ao professor.');
      if (t.dominio_email && email.trim().toLowerCase().split('@')[1] !== t.dominio_email) {
        throw new Error(`A turma ${t.turma} só aceita e-mails @${t.dominio_email}.`);
      }
      return { precisaConfirmar: true, turma: t.turma };
    },
    async sair() { logado = false; gestor = false; estado = criarEstado(); gestao = criarGestao(); avisar('SIGNED_OUT'); },
    async recuperarSenha() { await atraso(300); },
    async definirNovaSenha() { await atraso(300); },

    async perfil() { await atraso(); return { ...estado.perfil }; },
    async config() { return { ...CONFIG, negociacao_pausada: gestao.pausada }; },
    async mercado() {
      await atraso();
      return EMPRESAS.map(([ticker, nome, setor]) => {
        const { preco, anterior } = estado.precos[ticker];
        const ultimo = historicoDe(ticker, preco, anterior).at(-1);
        return { ticker, nome, setor, preco, data: ultimo.data, preco_anterior: anterior,
          variacao_pct: r2((preco / anterior - 1) * 100), logo_url: null,
          abertura: ultimo.abertura, maxima: ultimo.maxima, minima: ultimo.minima, volume: ultimo.volume, situacao: 'ativa' };
      });
    },
    async historico(ticker, desde = null) {
      await atraso();
      const { preco, anterior } = estado.precos[ticker];
      return historicoDe(ticker, preco, anterior).filter((x) => !desde || x.data >= desde);
    },
    async linhasMercado(desde) {
      return Object.fromEntries(EMPRESAS.map(([t]) => {
        const { preco, anterior } = estado.precos[t];
        return [t, historicoDe(t, preco, anterior).filter((x) => x.data >= desde).map((x) => x.preco)];
      }));
    },
    async patrimonioDiario() {
      await atraso();
      const atual = estado.perfil.saldo + carteira().reduce((s, x) => s + x.valor_atual, 0)
        + vendidas().reduce((s, x) => s + x.resultado, 0);
      const datas = diasUteis(30);
      const rnd = semente('patrimonio');
      return datas.map((data, i) => {
        const t = i / (datas.length - 1);
        const ruido = i === datas.length - 1 || i === 0 ? 0 : (rnd() - 0.5) * 90;
        return { data, patrimonio: r2(10000 + (atual - 10000) * t + ruido) };
      });
    },
    async carteira() { await atraso(); return carteira(); },
    async vendidas() { await atraso(); return vendidas(); },
    async ordens() { await atraso(); return estado.ordens.map((o) => ({ ...o })); },
    async cobrancas() { await atraso(); return estado.cobrancas.map((c) => ({ ...c })); },
    async ajustes() { await atraso(); return []; },
    async enviarFoto(uid, blob) {
      await atraso(400);
      const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
      estado.perfil.foto_url = url;
      return url;
    },
    async removerFoto() { estado.perfil.foto_url = null; },
    async ranking(turmaId) {
      await atraso();
      const v = vendidas().reduce((s, x) => s + x.resultado, 0);
      const meu = estado.perfil.saldo + carteira().reduce((s, x) => s + x.valor_atual, 0) + v;
      const lista = [
        ...gestao.alunos.filter((a) => a.nome !== estado.perfil.nome).map((a) => [a.nome, a.turma_id, a.patrimonio, false]),
        [estado.perfil.nome, estado.perfil.turma_id, r2(meu), true],
      ].filter(([, t]) => !turmaId || t === turmaId).sort((a, b) => b[2] - a[2]);
      return lista.map(([nome, t, patrimonio, eu], i) => ({
        posicao: i + 1, nome, turma: gestao.turmas.find((x) => x.id === t)?.nome ?? '', patrimonio,
        rentabilidade_pct: r2((patrimonio / 10000 - 1) * 100), eu,
      }));
    },
    async negociacaoLiberada() { return !gestao.pausada && !params.has('fechado'); },
    async souAdmin() { return gestor; },
    async executarOrdem(ticker, tipo, quantidade) {
      await atraso(400);
      if (!(await this.negociacaoLiberada())) {
        throw new Error('Negociação fechada. Liberada em dias úteis das 19h às 9h, e o dia todo nos fins de semana e feriados.');
      }
      const preco = precoDe(ticker);
      const exposicao = vendidas().reduce((s, v) => s + v.custo_recompra, 0);
      const p = previa({
        tipo, quantidade, preco, saldo: estado.perfil.saldo, config: CONFIG,
        qtdComprada: estado.posicoes[ticker]?.quantidade ?? 0,
        vendida: estado.vendidas[ticker] ?? null, exposicao,
      });
      if (quantidade <= 0) throw new Error('A quantidade precisa ser maior que zero.');
      if (p.erro) throw new Error(p.erro);
      return executar(estado, ticker, tipo, quantidade, preco);
    },
    async coletas() {
      return [0, 1, 24, 25, 72].map((h, i) => ({
        id: 20 - i, executada_em: horasAtras(h + 2.5), origem: i % 2 ? 'agendada 18h35' : 'agendada 18h50',
        total: 76, gravadas: i === 3 ? 75 : 76, com_erro: i === 3 ? 1 : 0,
        erros: i === 3 ? [{ ticker: 'TAEE11', erro: 'HTTP 429' }] : [], datas: {}, processamento: [],
      }));
    },

    // ---------------- área do gestor (dados fictícios) ----------------
    async turmas() {
      await atraso();
      return gestao.turmas.map((t) => {
        const as = gestao.alunos.filter((a) => a.turma_id === t.id);
        const media = as.length ? r2(as.reduce((s, a) => s + (a.patrimonio / 10000 - 1) * 100, 0) / as.length) : null;
        return { ...t, alunos: as.length, rentabilidade_media: media, patrimonio_medio: null };
      });
    },
    async criarTurma(nome, dominio) {
      await atraso();
      const t = { id: gestao.turmas.length + 1, nome, token: tokenAleatorio(), dominio_email: dominio || null, ativa: true, criada_em: new Date().toISOString() };
      gestao.turmas.unshift(t);
      return t;
    },
    async atualizarTurma(id, { nome, dominio, ativa }) {
      const t = gestao.turmas.find((x) => x.id === id);
      Object.assign(t, { nome, dominio_email: dominio || null, ativa });
      return t;
    },
    async novoToken(id) {
      const t = gestao.turmas.find((x) => x.id === id);
      t.token = tokenAleatorio();
      return t.token;
    },
    async alunosTurma(id) {
      await atraso();
      return gestao.alunos.filter((a) => a.turma_id === id).sort((a, b) => b.patrimonio - a.patrimonio)
        .map((a, i) => ({ ...a, posicao: i + 1, rentabilidade_pct: r2((a.patrimonio / 10000 - 1) * 100) }));
    },
    async definirPausa(p) { gestao.pausada = p; return p; },
    async alertas() { await atraso(); return gestao.alertas.map((a) => ({ ...a })); },
    async resolverAlerta(id) { gestao.alertas = gestao.alertas.filter((a) => a.id !== id); },
    async eventos() { await atraso(); return gestao.eventos.map((e) => ({ ...e })); },
    async impactoAcao(ticker) {
      await atraso();
      const e = EMPRESAS.find((x) => x[0] === ticker);
      if (!e) throw new Error(`A ação ${ticker} não está cadastrada.`);
      const n = { PETR4: 7, VALE3: 5, MGLU3: 3, BBDC4: 2 }[ticker] ?? 0;
      return { ticker, nome: e[1], situacao: 'ativa', ultimo_preco: e[3], ultima_data: hojeISO(),
        alunos_comprados: n, acoes_compradas: n * 60, alunos_vendidos: n ? 1 : 0, acoes_vendidas: n ? 40 : 0 };
    },
    async trocarCodigo(antigo, novo) { evento('troca_codigo', antigo, `${antigo} passou a se chamar ${novo}.`, 3); },
    async desdobrar(t, de, para) { evento(para > de ? 'desdobramento' : 'grupamento', t, `${para > de ? 'Desdobramento' : 'Grupamento'} de ${t}, de ${de} para ${para}.`, 2); },
    async converter(a, nova, de, para) { evento('conversao', a, `${a} convertida em ${nova}, de ${de} para ${para}.`, 2); },
    async encerrar(t, preco) { evento('encerramento', t, `${t} saiu da bolsa. Posições encerradas a R$ ${String(preco).replace('.', ',')}.`, 2); },
    async suspender(t, s) { evento(s ? 'suspensao' : 'reativacao', t, s ? `Negociação de ${t} suspensa.` : `Negociação de ${t} liberada de novo.`); },
  };
}
