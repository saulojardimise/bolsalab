import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acaoAgora, futuroAgora, horaBR, mercadoAgora, oscilacaoHoje } from '../src/lib/intradia.js';

const mercado = [
  { ticker: 'PETR4', preco: 38, data: '2026-11-05', variacao_pct: 1 },
  { ticker: 'MGLU3', preco: 10, data: '2026-11-05', variacao_pct: -2 },
];
const intradia = [
  { codigo: 'PETR4', preco: 38.76, horario: '2026-11-06T16:30:00Z' },
  { codigo: 'MGLU3', preco: 9.5, horario: '2026-11-05T19:00:00Z' },       // de ontem: não vale
  { codigo: 'IBOV', preco: 167003, horario: '2026-11-06T16:30:00Z' },
  { codigo: 'USD', preco: 5.4812, horario: '2026-11-06T16:40:00Z' },
];

test('cotação do dia só vale se for depois do último fechamento', () => {
  assert.deepEqual(acaoAgora(intradia, mercado[0]), { preco: 38.76, variacao_pct: 2, horario: '2026-11-06T16:30:00Z' });
  assert.equal(acaoAgora(intradia, mercado[1]), null);
  assert.equal(acaoAgora(intradia, { ...mercado[0], data: '2026-11-06' }), null);   // já fechou hoje
  const m = mercadoAgora(mercado, intradia);
  assert.deepEqual([m[0].preco, m[0].variacao_pct, m[1].preco], [38.76, 2, 10]);
  assert.equal(horaBR('2026-11-06T16:30:00Z'), '13h30');
});

test('minicontratos: WIN pelo Ibovespa (5 em 5) e WDO pelo dólar (0,5 em 0,5)', () => {
  assert.equal(futuroAgora(intradia, { ativo: 'WIN', preco: 166190, data: '2026-11-05' }).preco, 167005);
  assert.equal(futuroAgora(intradia, { ativo: 'WDO', preco: 5462, data: '2026-11-05' }).preco, 5481);
});

test('oscilação de hoje: compradas, vendidas e minicontratos', () => {
  const o = oscilacaoHoje({
    carteira: [{ ticker: 'PETR4', quantidade: 100 }],                     // +0,76 × 100 = +76
    vendidas: [{ ticker: 'PETR4', quantidade: 10 }],                      // −0,76 × 10 = −7,60
    futuros: [{ ativo: 'WIN', quantidade: -1, preco_ajuste: 166190 }],    // −(167005 − 166190) × 0,20 = −163
    mercado, intradia,
    futurosMercado: [{ ativo: 'WIN', preco: 166190, data: '2026-11-05', valor_ponto: 0.2 }],
  });
  assert.deepEqual(o, { valor: -94.6, horario: '2026-11-06T16:30:00Z' });
});
