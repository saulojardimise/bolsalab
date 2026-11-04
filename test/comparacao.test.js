import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparar } from '../src/lib/comparacao.js';

const r = (v) => Math.round(v * 100) / 100;

test('compara aluno, Ibovespa e CDI a partir do primeiro dia do período', () => {
  const aluno = [
    { data: '2026-11-02', valor: 10000 }, { data: '2026-11-03', valor: 10100 }, { data: '2026-11-04', valor: 10200 },
  ];
  const indices = [
    { serie: 'IBOV', data: '2026-10-30', valor: 130000 },   // 02/11 é feriado: base é o fechamento anterior
    { serie: 'IBOV', data: '2026-11-03', valor: 132600 },
    { serie: 'CDI', data: '2026-10-30', valor: 0.05 },        // antes do período: não conta
    { serie: 'CDI', data: '2026-11-03', valor: 0.05 },
    { serie: 'CDI', data: '2026-11-04', valor: 0.05 },
  ];
  const c = comparar(aluno, indices);
  assert.deepEqual(c.pontos.map((p) => [p.data, r(p.aluno), r(p.ibov), r(p.cdi * 100) / 100]), [
    ['2026-11-02', 0, 0, 0],
    ['2026-11-03', 1, 2, 0.05],
    ['2026-11-04', 2, 2, 0.1],
  ]);
  assert.equal(r(c.final.aluno), 2);
});

test('sem índices ainda: só o aluno', () => {
  const c = comparar([{ data: '2026-11-02', valor: 10000 }, { data: '2026-11-03', valor: 9900 }], []);
  assert.equal(c.final.ibov, null);
  assert.equal(c.final.cdi, null);
  assert.equal(r(c.final.aluno), -1);
  assert.equal(comparar([{ data: '2026-11-02', valor: 1 }], []), null);
});
