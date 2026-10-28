import { diasAtras } from './formato.js';

// Períodos dos gráficos. Guardamos um preço por dia (fechamento), então não há "1D".
export const PERIODOS = [
  { id: '1S', rotulo: '1S', dias: 7 },
  { id: '1M', rotulo: '1M', dias: 31 },
  { id: '3M', rotulo: '3M', dias: 92 },
  { id: 'TUDO', rotulo: 'Tudo', dias: null },
];

/** Filtra uma série [{data:'AAAA-MM-DD', ...}] pelo período escolhido. */
export function noPeriodo(serie, periodoId) {
  const p = PERIODOS.find((x) => x.id === periodoId);
  if (!p?.dias) return serie;
  const desde = diasAtras(p.dias);
  return serie.filter((x) => x.data >= desde);
}

/** Variação % entre o primeiro e o último ponto. */
export function variacaoSerie(serie, campo = 'valor') {
  if (serie.length < 2) return 0;
  const a = Number(serie[0][campo]);
  const b = Number(serie.at(-1)[campo]);
  return a > 0 ? (b / a - 1) * 100 : 0;
}
