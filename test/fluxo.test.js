// Fluxo de caixa do extrato (sem servidor)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fluxoDeCaixa } from '../src/lib/fluxo.js';

const t = (h) => new Date(Date.UTC(2026, 10, 1, h)).toISOString();

test('fluxo de caixa separa ações, corretagem, garantia e aluguel, e fecha com o saldo', () => {
  const ordens = [
    // compra 100 a 40: sai 4.000 + 15
    { id: 1, tipo: 'compra', ticker: 'PETR4', quantidade: 100, preco: 40, corretagem: 15, valor_total: 4015, criado_em: t(1) },
    // vende 50 a 42: entra 2.100 − 15
    { id: 2, tipo: 'venda', ticker: 'PETR4', quantidade: 50, preco: 42, corretagem: 15, valor_total: 2085, criado_em: t(2) },
    // vende a descoberto 100 a 10: só a corretagem sai; 1.000 de garantia
    { id: 3, tipo: 'venda_descoberto', ticker: 'MGLU3', quantidade: 100, preco: 10, corretagem: 15, valor_total: 1000, criado_em: t(3) },
    // recompra 100 a 9: garantia 1.000 − 900 − 15 = +85 (o aluguel vem antes, no mesmo instante)
    { id: 4, tipo: 'recompra', ticker: 'MGLU3', quantidade: 100, preco: 9, corretagem: 15, valor_total: 85, criado_em: t(4) },
  ];
  const cobrancas = [{ id: 1, ticker: 'MGLU3', valor: 2.5, dias: 2, base: 900, data: '2026-11-01', criado_em: t(4) }];
  const ajustes = [{ id: 1, ticker: 'ITUB4', tipo: 'conversao', valor_saldo: 7.3, descricao: 'fração em dinheiro', criado_em: t(5) }];

  const { lancamentos, totais } = fluxoDeCaixa({ ordens, cobrancas, ajustes, saldoInicial: 10000 });

  assert.deepEqual(totais, {
    inicial: 10000, compras: -4000, vendas: 2100, descoberto: 100, corretagens: -60,
    aluguel: -2.5, ajustes: 7.3, futuros: 0, margem: 0, ordens: 4, final: 10000 - 4015 + 2085 - 15 - 2.5 + 85 + 7.3,
  });
  // os totais somam o saldo final
  const soma = totais.inicial + totais.compras + totais.vendas + totais.descoberto + totais.corretagens + totais.aluguel + totais.ajustes;
  assert.equal(Math.round(soma * 100) / 100, totais.final);

  // do mais recente para o mais antigo, terminando no saldo inicial
  assert.deepEqual(lancamentos.map((l) => l.tipo),
    ['ajuste', 'recompra', 'aluguel', 'venda_descoberto', 'venda', 'compra', 'inicial']);
  const compra = lancamentos.at(-2);
  assert.deepEqual(compra.partes, [{ rotulo: 'Ações', valor: -4000 }, { rotulo: 'Corretagem', valor: -15 }]);
  assert.equal(compra.saldo, 5985);
  const recompra = lancamentos[1];
  assert.deepEqual(recompra.partes.map((p) => p.valor), [1000, -900, -15]);
  assert.equal(lancamentos[3].garantia, 1000);
  assert.equal(lancamentos[0].saldo, totais.final);
});

test('conta nova: só o saldo inicial', () => {
  const { lancamentos, totais } = fluxoDeCaixa({ saldoInicial: 10000 });
  assert.equal(lancamentos.length, 1);
  assert.equal(totais.final, 10000);
  assert.equal(totais.corretagens, 0);
});

test('minicontratos: margem depositada e devolvida, corretagem e ajustes diários fecham com o saldo', () => {
  const futurosOrdens = [
    { id: 1, contrato: 'WINZ26', lado: 'compra', quantidade: 2, preco: 131000, corretagem: 10, margem: 7860, criado_em: t(1) },
    { id: 2, contrato: 'WINZ26', lado: 'venda', quantidade: 2, preco: 132005, corretagem: 10, margem: -7860, criado_em: t(3) },
  ];
  const futurosAjustes = [
    { id: 1, contrato: 'WINZ26', tipo: 'ajuste', quantidade: 2, preco_anterior: 131000, preco: 132005, valor: 402, criado_em: t(2) },
    { id: 2, contrato: 'WINZ26', tipo: 'ajuste', quantidade: 2, preco_anterior: 132005, preco: 132005, valor: 0, criado_em: t(3) },
  ];
  const { lancamentos, totais } = fluxoDeCaixa({ futurosOrdens, futurosAjustes, saldoInicial: 10000 });
  assert.deepEqual([totais.margem, totais.futuros, totais.corretagens, totais.final], [0, 402, -20, 10382]);
  assert.deepEqual(lancamentos.map((l) => [l.titulo, l.saldo]), [
    ['Venda de minicontrato', 10382], ['Ajuste diário', 2532], ['Compra de minicontrato', 2130], ['Saldo inicial', 10000],
  ]);
  assert.equal(lancamentos[1].detalhe, 'Comprado em 2: 131.000 → 132.005 pontos');
});
