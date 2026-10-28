// Testes das contas da boleta e da carteira (sem servidor).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { efeitoNoSaldo, previa, resumoCarteira, usoDoStop } from '../src/lib/regras.js';
import { agoraEmSaoPaulo, pct, reais, reaisComSinal } from '../src/lib/formato.js';
import { textoStatus } from '../src/lib/pregao.js';

const config = { corretagem: 15, limite_descoberto: 0.4, aluguel_mensal: 0.03 };
const total = (p) => p.linhas.find((l) => l.destaque).valor;

test('compra: valor + corretagem, máximo pelo saldo', () => {
  const p = previa({ tipo: 'compra', quantidade: 100, preco: 40, saldo: 10000, config });
  assert.equal(total(p), 4015);
  assert.equal(p.efeitoSaldo, -4015);
  assert.equal(p.maximo, 249);           // (10000 - 15) / 40
  assert.equal(p.erro, null);
  assert.match(previa({ tipo: 'compra', quantidade: 250, preco: 40, saldo: 10000, config }).erro, /Saldo insuficiente/);
});

test('venda: só o que tem, corretagem descontada', () => {
  const p = previa({ tipo: 'venda', quantidade: 50, preco: 40, saldo: 0, config, qtdComprada: 80 });
  assert.equal(total(p), 1985);
  assert.equal(p.maximo, 80);
  assert.match(previa({ tipo: 'venda', quantidade: 81, preco: 40, saldo: 0, config, qtdComprada: 80 }).erro, /Você tem 80/);
});

test('venda a descoberto: limite de 40% do saldo menos o que já está vendido', () => {
  const p = previa({ tipo: 'venda_descoberto', quantidade: 100, preco: 40, saldo: 10000, config });
  assert.equal(p.maximo, 100);           // 4000 / 40
  assert.equal(p.erro, null);
  assert.equal(p.efeitoSaldo, -15);
  assert.equal(p.linhas.find((l) => l.rotulo.startsWith('Aluguel')).valor, 4);   // 4000 * 3% / 30
  const cheio = previa({ tipo: 'venda_descoberto', quantidade: 1, preco: 40, saldo: 9985, config, exposicao: 4000 });
  assert.equal(cheio.maximo, 0);
  assert.match(cheio.erro, /já usou todo o limite/);
  const parcial = previa({ tipo: 'venda_descoberto', quantidade: 50, preco: 40, saldo: 10000, config, exposicao: 3000 });
  assert.match(parcial.erro, /até 25 ações/);
});

test('recompra: garantia proporcional − custo − corretagem', () => {
  const vendida = { quantidade: 100, garantia: 4000 };
  const p = previa({ tipo: 'recompra', quantidade: 50, preco: 50, saldo: 9945, config, vendida });
  assert.equal(p.efeitoSaldo, -515);     // 2000 − 2500 − 15
  assert.equal(p.maximo, 100);
});

test('resumo da carteira inclui o resultado das vendas a descoberto', () => {
  const r = resumoCarteira({
    saldo: 9430,
    carteira: [{ valor_atual: 1000 }],
    vendidas: [{ garantia: 2000, custo_recompra: 2500 }],
  });
  assert.equal(r.vendido, -500);
  assert.equal(r.patrimonio, 9930);
  assert.equal(Math.round(r.rentabilidade * 100) / 100, -0.7);
});

test('uso do limite de prejuízo (80% do saldo)', () => {
  const s = usoDoStop({ resultado_acumulado: -1000 }, 2500);
  assert.equal(s.limite, 2000);
  assert.equal(s.uso, 0.5);
  assert.equal(usoDoStop({ resultado_acumulado: 300 }, 2500).uso, 0);
});

test('efeito de cada ordem no saldo (extrato)', () => {
  assert.equal(efeitoNoSaldo({ tipo: 'compra', valor_total: 4015 }), -4015);
  assert.equal(efeitoNoSaldo({ tipo: 'venda', valor_total: 1985 }), 1985);
  assert.equal(efeitoNoSaldo({ tipo: 'venda_descoberto', valor_total: 4000, corretagem: 15 }), -15);
  assert.equal(efeitoNoSaldo({ tipo: 'recompra', valor_total: -515 }), -515);
});

test('formatação brasileira', () => {
  const s = (x) => x.replace(/\s/g, ' ');   // Intl usa espaço não separável
  assert.equal(s(reais(10148.92)), 'R$ 10.148,92');
  assert.equal(pct(1.4912), '+1,49%');
  assert.equal(pct(-0.4), '−0,40%');
  assert.equal(s(reaisComSinal(-515)), '−R$ 515,00');
});

test('status do pregão no horário de Brasília', () => {
  // terça 15h em SP = 18h UTC
  assert.deepEqual(agoraEmSaoPaulo(new Date('2026-10-27T18:00:00Z')), { diaSemana: 2, hora: 15 });
  const fechado = textoStatus({ liberada: false, agora: new Date('2026-10-27T18:00:00Z') });
  assert.equal(fechado.aberto, false);
  const noite = textoStatus({ liberada: true, agora: new Date('2026-10-27T23:00:00Z') });   // terça 20h
  assert.match(noite.detalhe, /amanhã, às 9h/);
  const sexta = textoStatus({ liberada: true, agora: new Date('2026-10-30T23:00:00Z') });   // sexta 20h
  assert.match(sexta.detalhe, /segunda/);
  const sabado = textoStatus({ liberada: true, agora: new Date('2026-10-31T15:00:00Z') });
  assert.match(sabado.detalhe, /segunda/);
  assert.match(textoStatus({ liberada: true, pausada: true }).titulo, /pausada/);
});
