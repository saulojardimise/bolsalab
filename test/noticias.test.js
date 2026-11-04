// Capa e filtros das notícias (sem servidor)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrar, montarCapa, quando } from '../src/lib/noticias.js';

const agora = new Date('2026-11-04T01:00:00Z');
const h = (horas) => new Date(agora - horas * 3600e3).toISOString();
const n = (id, tipo, tickers, horas, titulo = `Notícia ${id}`) => ({ id, tipo, tickers, publicada_em: h(horas), titulo });
const mercado = [
  { ticker: 'PETR4', nome: 'Petrobras', setor: 'Petróleo e Gás', variacao_pct: 0.5 },
  { ticker: 'MGLU3', nome: 'Magazine Luiza', setor: 'Varejo', variacao_pct: -6.2 },
  { ticker: 'VALE3', nome: 'Vale', setor: 'Mineração', variacao_pct: 1.1 },
  { ticker: 'ITUB4', nome: 'Itaú Unibanco', setor: 'Bancos', variacao_pct: 0.2 },
];

test('capa: manchete é a empresa que mais mexeu; uma chamada por empresa; mercado e fatos à parte', () => {
  const lista = [
    n(1, 'empresa', ['PETR4'], 1), n(2, 'empresa', ['PETR4'], 2), n(3, 'empresa', ['MGLU3'], 5),
    n(4, 'mercado', [], 1), n(5, 'fato_relevante', ['VALE3'], 30), n(6, 'empresa', ['ITUB4'], 60),
  ];
  const c = montarCapa(lista, mercado, agora);
  assert.equal(c.manchete.id, 3);                       // MGLU3 caiu 6,2%
  assert.deepEqual(c.chamadas.map((x) => x.id), [5, 1, 6]);   // fato relevante pesa mais; PETR4 só uma vez
  assert.deepEqual(c.mercado.map((x) => x.id), [4]);
  assert.deepEqual(c.fatos.map((x) => x.id), []);       // o fato relevante já está nas chamadas
  assert.deepEqual(c.resto.map((x) => x.id), [2]);
});

test('filtros: minhas ações, setor, busca e fatos relevantes', () => {
  const lista = [n(1, 'empresa', ['PETR4'], 1, 'Petrobras sobe'), n(2, 'empresa', ['MGLU3'], 2),
                 n(3, 'mercado', [], 1, 'Dólar cai'), n(4, 'fato_relevante', ['VALE3'], 3)];
  const ids = (f) => filtrar(lista, { empresas: mercado, minhas: ['MGLU3'], ...f }).map((x) => x.id);
  assert.deepEqual(ids({ filtro: 'minhas' }), [2]);
  assert.deepEqual(ids({ filtro: 'mercado' }), [3]);
  assert.deepEqual(ids({ filtro: 'fatos' }), [4]);
  assert.deepEqual(ids({ setor: 'Varejo' }), [2]);
  assert.deepEqual(ids({ busca: 'petro' }), [1]);
  assert.deepEqual(ids({ busca: 'dólar' }), [3]);
});

test('quando: minutos, horas, ontem e data', () => {
  assert.equal(quando(h(0.2), agora), 'há 12 min');
  assert.equal(quando(h(3), agora), 'há 3 h');
  assert.equal(quando(h(26), agora), 'ontem');
  assert.equal(quando('2026-10-30T15:00:00Z', agora), '30/10');
});
