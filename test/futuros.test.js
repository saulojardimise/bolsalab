import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lado, pontos, previaFuturo, serieFuturo } from '../src/lib/futuros.js';

const win = { preco: 131000, margem: 3930, corretagem: 10, valor_ponto: 0.2 };

test('prévia: abrir, aumentar, zerar e virar a posição (igual ao banco)', () => {
  let p = previaFuturo({ operacao: 'compra', quantidade: 2, contrato: win, posicao: null, saldo: 10000 });
  assert.deepEqual([p.abre, p.fecha, p.depositada, p.saldoApos, p.nova, p.porPonto], [2, 0, 7860, 2130, 2, 0.4]);
  p = previaFuturo({ operacao: 'venda', quantidade: 2, contrato: win, posicao: { quantidade: 2, garantia: 7860 }, saldo: 2532 });
  assert.deepEqual([p.fecha, p.abre, p.devolvida, p.saldoApos, p.nova], [2, 0, 7860, 10382, 0]);
  p = previaFuturo({ operacao: 'venda', quantidade: 3, contrato: { ...win, margem: 3960.15 }, posicao: { quantidade: 1, garantia: 3960.15 }, saldo: 6411.85 });
  assert.deepEqual([p.fecha, p.abre, p.devolvida, p.depositada, p.saldoApos, p.nova], [1, 2, 3960.15, 7920.3, 2441.7, -2]);
});

test('prévia: erros', () => {
  assert.equal(previaFuturo({ operacao: 'compra', quantidade: 0, contrato: win, saldo: 1e5 }).erro, 'Digite quantos contratos.');
  assert.match(previaFuturo({ operacao: 'compra', quantidade: 3, contrato: win, saldo: 10000 }).erro, /Saldo insuficiente/);
});

test('textos e série', () => {
  assert.equal(lado(-2).texto, 'Vendido em 2 contratos');
  assert.equal(lado(0).texto, 'Sem posição');
  assert.equal(pontos(131005, 'WIN'), '131.005');
  assert.equal(pontos(5432.5, 'WDO'), '5.432,5');
  assert.deepEqual(serieFuturo([{ serie: 'IBOV', data: 'd', valor: 131002 }, { serie: 'PTAX', data: 'd', valor: 5.4321 }], 'WDO'),
    [{ data: 'd', valor: 5432 }]);
});
