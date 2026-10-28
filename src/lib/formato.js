// Formatação no padrão brasileiro, sempre no fuso de São Paulo.
const FUSO = 'America/Sao_Paulo';

const fmtReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNumero = new Intl.NumberFormat('pt-BR');
const fmtPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const reais = (v) => fmtReais.format(Number(v) || 0);
export const numero = (v) => fmtNumero.format(Number(v) || 0);

// +1,25%  /  −0,40%  /  0,00%
export function pct(v) {
  const n = Number(v) || 0;
  const s = fmtPct.format(Math.abs(n));
  return n > 0 ? `+${s}%` : n < 0 ? `−${s}%` : `${s}%`;
}

// +R$ 10,00  /  −R$ 10,00
export function reaisComSinal(v) {
  const n = Number(v) || 0;
  const s = fmtReais.format(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}

// classe CSS de alta/baixa
export const tendencia = (v) => (Number(v) > 0 ? 'alta' : Number(v) < 0 ? 'baixa' : '');

// "27/10" a partir de "2026-10-27" (data pura, sem fuso)
export function diaMes(dataISO) {
  if (!dataISO) return '';
  const [, m, d] = dataISO.split('-');
  return `${d}/${m}`;
}

// "27/10 às 19:42"
export function dataHora(ts) {
  const d = new Date(ts);
  const dia = d.toLocaleDateString('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

// Volume: 52,4 mi / 1,2 bi / 850 mil
export function volume(v) {
  const n = Number(v) || 0;
  const f = (x) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (n >= 1e9) return `${f(n / 1e9)} bi`;
  if (n >= 1e6) return `${f(n / 1e6)} mi`;
  if (n >= 1e3) return `${f(n / 1e3)} mil`;
  return f(n);
}

// "seg, 27/10" a partir de "2026-10-27"
export function diaSemanaMes(dataISO) {
  const d = new Date(dataISO + 'T12:00:00Z');
  const sem = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  return `${sem}, ${diaMes(dataISO)}`;
}

// Data de hoje em São Paulo, menos N dias: "2026-09-27"
export function diasAtras(n, d = new Date()) {
  const hoje = d.toLocaleDateString('en-CA', { timeZone: FUSO });
  const x = new Date(hoje + 'T12:00:00Z');
  x.setUTCDate(x.getUTCDate() - n);
  return x.toISOString().slice(0, 10);
}

// Partes da data/hora atual em São Paulo: { diaSemana: 1..7 (seg..dom), hora }
export function agoraEmSaoPaulo(d = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO, weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const dias = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    diaSemana: dias[partes.find((p) => p.type === 'weekday').value],
    hora: Number(partes.find((p) => p.type === 'hour').value),
  };
}
