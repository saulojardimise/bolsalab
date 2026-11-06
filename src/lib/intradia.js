// Cotação do dia (coletada a cada 1h30 no pregão, com cerca de 30 min de atraso).
// Só para acompanhar: as ordens, o patrimônio e o ranking continuam pelo fechamento.

const diaBR = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
export const horaBR = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
const r2 = (v) => Math.round(v * 100) / 100;

/** Linha da cotação do dia, se for de um dia depois do último fechamento (senão já está velha) */
export function doDia(intradia, codigo, dataFechamento) {
  const i = intradia?.find((x) => x.codigo === codigo);
  if (!i || !dataFechamento) return null;
  return diaBR(i.horario) > dataFechamento ? i : null;
}

/** Ação com o preço do dia: { preco, variacao_pct, horario } ou null */
export function acaoAgora(intradia, acao) {
  const i = doDia(intradia, acao.ticker, acao.data);
  if (!i || !(Number(acao.preco) > 0)) return null;
  return { preco: Number(i.preco), variacao_pct: r2((Number(i.preco) / Number(acao.preco) - 1) * 100), horario: i.horario };
}

/** Minicontrato com o preço do dia (WIN pelo Ibovespa, WDO pelo dólar comercial) */
export function futuroAgora(intradia, contrato) {
  const i = doDia(intradia, contrato.ativo === 'WIN' ? 'IBOV' : 'USD', contrato.data);
  if (!i) return null;
  const preco = contrato.ativo === 'WIN' ? Math.round(Number(i.preco) / 5) * 5 : Math.round(Number(i.preco) * 2000) / 2;
  return { preco, variacao_pct: r2((preco / Number(contrato.preco) - 1) * 100), horario: i.horario };
}

/** Lista do mercado com o preço do dia no lugar do fechamento (marcada com agora: true) */
export function mercadoAgora(mercado, intradia) {
  if (!intradia?.length) return mercado;
  return mercado.map((e) => {
    const a = acaoAgora(intradia, e);
    return a ? { ...e, preco: a.preco, variacao_pct: a.variacao_pct, agora: a.horario } : e;
  });
}

/** Horário da cotação do dia mais recente que ainda vale (ou null) */
export function horarioDoDia(mercado, intradia) {
  let h = null;
  for (const e of mercado) {
    const a = acaoAgora(intradia, e);
    if (a && (!h || a.horario > h)) h = a.horario;
  }
  return h;
}

/**
 * Quanto a carteira oscilou hoje até a última cotação do dia:
 * ações compradas, vendas a descoberto e minicontratos (em relação ao último ajuste).
 */
export function oscilacaoHoje({ carteira = [], vendidas = [], futuros = [], mercado = [], futurosMercado = [], intradia = [] }) {
  const porTicker = Object.fromEntries(mercado.map((e) => [e.ticker, e]));
  let valor = 0;
  let horario = null;
  const marca = (h) => { if (!horario || h > horario) horario = h; };
  for (const p of carteira) {
    const e = porTicker[p.ticker];
    const a = e && acaoAgora(intradia, e);
    if (!a) continue;
    valor += Number(p.quantidade) * (a.preco - Number(e.preco));
    marca(a.horario);
  }
  for (const v of vendidas) {
    const e = porTicker[v.ticker];
    const a = e && acaoAgora(intradia, e);
    if (!a) continue;
    valor -= Number(v.quantidade) * (a.preco - Number(e.preco));
    marca(a.horario);
  }
  for (const f of futuros) {
    const c = futurosMercado.find((x) => x.ativo === f.ativo);
    const a = c && futuroAgora(intradia, c);
    if (!a) continue;
    valor += Number(f.quantidade) * (a.preco - Number(f.preco_ajuste)) * Number(c.valor_ponto);
    marca(a.horario);
  }
  if (!horario) return null;
  return { valor: r2(valor), horario };
}
