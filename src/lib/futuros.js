// Minicontratos (WIN e WDO): contas da boleta e textos. A conta oficial é a do banco.

export const ATIVOS = {
  WIN: { nome: 'Mini Ibovespa', unidade: 'pontos', base: 'Ibovespa', serie: 'IBOV', tick: 5, ponto: 0.2 },
  WDO: { nome: 'Mini dólar', unidade: 'pontos', base: 'dólar PTAX', serie: 'PTAX', tick: 0.5, ponto: 10 },
};

const r2 = (v) => Math.round(v * 100) / 100;

/** Pontos no formato da B3: 131.005 (WIN) e 5.432,5 (WDO) */
export function pontos(v, ativo) {
  const casas = ativo === 'WDO' ? 1 : 0;
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Lado e tamanho da posição: { texto: 'Comprado em 2', sinal: 1 } */
export function lado(quantidade) {
  const q = Number(quantidade);
  if (!q) return { texto: 'Sem posição', sinal: 0 };
  return { texto: `${q > 0 ? 'Comprado' : 'Vendido'} em ${Math.abs(q)} ${Math.abs(q) === 1 ? 'contrato' : 'contratos'}`, sinal: Math.sign(q) };
}

/**
 * Prévia da ordem, igual à regra do banco (executar_ordem_futuro).
 * @param {object} p
 * @param {'compra'|'venda'} p.operacao
 * @param {number} p.quantidade
 * @param {object} p.contrato   item de futuros_mercado (preco, margem, corretagem, valor_ponto)
 * @param {object|null} p.posicao  futuros_posicoes do contrato (quantidade com sinal, garantia)
 * @param {number} p.saldo
 */
export function previaFuturo({ operacao, quantidade, contrato, posicao, saldo }) {
  const q = Math.floor(Number(quantidade) || 0);
  const atual = Number(posicao?.quantidade ?? 0);
  const sinal = operacao === 'compra' ? 1 : -1;
  const fecha = atual && Math.sign(atual) !== sinal ? Math.min(Math.abs(atual), q) : 0;
  const abre = q - fecha;
  const devolvida = fecha ? r2(Number(posicao.garantia) * fecha / Math.abs(atual)) : 0;
  const depositada = r2(Number(contrato.margem) * abre);
  const corretagem = Number(contrato.corretagem);
  const nova = atual + sinal * q;
  const saldoApos = r2(Number(saldo) + devolvida - depositada - corretagem);
  let erro = null;
  if (q <= 0) erro = 'Digite quantos contratos.';
  else if (q > 100) erro = 'No máximo 100 contratos por ordem.';
  else if (saldoApos < 0) erro = `Saldo insuficiente para a margem de ${abre} ${abre === 1 ? 'contrato' : 'contratos'}.`;
  return {
    quantidade: q, fecha, abre, depositada, devolvida, corretagem, nova, saldoApos, erro,
    // quanto a posição ganha ou perde a cada ponto e a cada variação mínima
    porPonto: r2(Math.abs(nova) * Number(contrato.valor_ponto)),
  };
}

/** Velas do mini índice a partir do Ibovespa (abertura, máxima e mínima arredondadas a 5 pontos) */
export function velasFuturo(indices) {
  const r5 = (v) => (v == null ? null : Math.round(Number(v) / 5) * 5);
  return indices
    .filter((i) => i.serie === 'IBOV')
    .map((i) => ({ data: i.data, preco: r5(i.valor), abertura: r5(i.abertura), maxima: r5(i.maxima), minima: r5(i.minima) }));
}

/** Série de preços do contrato a partir do índice (Ibovespa ou PTAX) */
export function serieFuturo(indices, ativo) {
  const a = ATIVOS[ativo];
  return indices
    .filter((i) => i.serie === a.serie)
    .map((i) => ({
      data: i.data,
      valor: ativo === 'WIN' ? Math.round(Number(i.valor) / 5) * 5 : Math.round(Number(i.valor) * 1000 * 2) / 2,
    }));
}
