// Fluxo de caixa do aluno: tudo o que entrou e saiu do saldo, em ordem,
// com o saldo depois de cada lançamento e os totais por tipo.

const r2 = (v) => Math.round(v * 100) / 100;

export const GRUPOS = [
  { id: '', rotulo: 'Tudo' },
  { id: 'compra', rotulo: 'Compras' },
  { id: 'venda', rotulo: 'Vendas' },
  { id: 'descoberto', rotulo: 'A descoberto' },
  { id: 'custos', rotulo: 'Taxas e aluguel' },
];

const TITULO_AJUSTE = {
  troca_codigo: 'Troca de código',
  desdobramento: 'Desdobramento',
  grupamento: 'Grupamento',
  conversao: 'Conversão de ações',
  encerramento: 'Saída da bolsa',
};

// ordem dentro do mesmo instante: o aluguel cobrado numa recompra vem antes dela
const PESO = { inicial: 0, aluguel: 1, ajuste: 2, ordem: 3 };

function deOrdem(o) {
  const c = Number(o.corretagem);
  const v = Number(o.valor_total);
  const q = Number(o.quantidade);
  const preco = Number(o.preco);
  const base = { id: 'o' + o.id, origem: 'ordem', ticker: o.ticker, quando: o.criado_em, quantidade: q, preco,
                 corretagem: c, automatica: !!o.automatica, obs: o.automatica ? o.observacao : null };
  switch (o.tipo) {
    case 'compra': {
      const acoes = r2(v - c);
      return { ...base, tipo: 'compra', grupo: 'compra', titulo: 'Compra', efeito: -v,
               partes: [{ rotulo: 'Ações', valor: -acoes }, { rotulo: 'Corretagem', valor: -c }],
               totais: { compras: -acoes, corretagens: -c } };
    }
    case 'venda': {
      const acoes = r2(v + c);
      return { ...base, tipo: 'venda', grupo: 'venda', titulo: 'Venda', efeito: v,
               partes: [{ rotulo: 'Ações', valor: acoes }, { rotulo: 'Corretagem', valor: -c }],
               totais: { vendas: acoes, corretagens: -c } };
    }
    case 'venda_descoberto':
      return { ...base, tipo: 'venda_descoberto', grupo: 'descoberto', titulo: 'Venda a descoberto', efeito: -c,
               partes: [{ rotulo: 'Corretagem', valor: -c }], garantia: v,
               totais: { corretagens: -c } };
    case 'recompra': {
      const recompra = r2(q * preco);
      const liberada = r2(v + c + recompra);
      return { ...base, tipo: 'recompra', grupo: 'descoberto', titulo: o.automatica ? 'Recompra automática' : 'Recompra',
               efeito: v,
               partes: [{ rotulo: 'Garantia liberada', valor: liberada }, { rotulo: 'Recompra das ações', valor: -recompra },
                        { rotulo: 'Corretagem', valor: -c }],
               totais: { descoberto: r2(liberada - recompra), corretagens: -c } };
    }
    default:
      return { ...base, tipo: o.tipo, grupo: '', titulo: o.tipo, efeito: 0, partes: [], totais: {} };
  }
}

/**
 * @param {object} p
 * @param {object[]} p.ordens     tabela ordens
 * @param {object[]} p.cobrancas  tabela cobrancas_aluguel
 * @param {object[]} p.ajustes    tabela ajustes (eventos das ações)
 * @param {number}   p.saldoInicial
 * @param {string}   [p.inicio]   quando a conta foi criada
 * @returns {{ lancamentos: object[], totais: object }} lançamentos do mais recente para o mais antigo
 */
export function fluxoDeCaixa({ ordens = [], cobrancas = [], ajustes = [], saldoInicial, inicio = null }) {
  const lista = [
    ...ordens.map(deOrdem),
    ...cobrancas.map((c) => ({
      id: 'a' + c.id, origem: 'aluguel', tipo: 'aluguel', grupo: 'custos', titulo: 'Aluguel', ticker: c.ticker,
      quando: c.criado_em, efeito: -Number(c.valor), dias: c.dias, base: Number(c.base), ate: c.data,
      partes: [], totais: { aluguel: -Number(c.valor) },
    })),
    ...ajustes.map((a) => ({
      id: 'j' + a.id, origem: 'ajuste', tipo: 'ajuste', grupo: '', titulo: TITULO_AJUSTE[a.tipo] ?? 'Ajuste',
      ticker: a.ticker, quando: a.criado_em, efeito: Number(a.valor_saldo), obs: a.descricao,
      partes: [], totais: { ajustes: Number(a.valor_saldo) },
    })),
  ].sort((a, b) => (new Date(a.quando) - new Date(b.quando)) || (PESO[a.origem] - PESO[b.origem]));

  const totais = { inicial: Number(saldoInicial), compras: 0, vendas: 0, descoberto: 0, corretagens: 0,
                   aluguel: 0, ajustes: 0, ordens: ordens.length };
  let saldo = Number(saldoInicial);
  for (const l of lista) {
    saldo = r2(saldo + l.efeito);
    l.saldo = saldo;
    for (const [k, v] of Object.entries(l.totais)) totais[k] = r2(totais[k] + v);
  }
  totais.final = saldo;

  const inicial = { id: 'inicial', origem: 'inicial', tipo: 'inicial', grupo: '', titulo: 'Saldo inicial',
                    quando: inicio, efeito: Number(saldoInicial), saldo: Number(saldoInicial), partes: [] };
  return { lancamentos: [inicial, ...lista].reverse(), totais };
}
