// Cálculos da boleta e da carteira. Servem para MOSTRAR a prévia ao aluno;
// quem decide de verdade é o banco (executar_ordem), que aplica as mesmas regras.

export const TIPOS = {
  compra: { rotulo: 'Comprar', verbo: 'Comprar', feito: 'Compra' },
  venda: { rotulo: 'Vender', verbo: 'Vender', feito: 'Venda' },
  venda_descoberto: { rotulo: 'Vender a descoberto', verbo: 'Vender a descoberto', feito: 'Venda a descoberto' },
  recompra: { rotulo: 'Recomprar', verbo: 'Recomprar', feito: 'Recompra' },
};

const r2 = (v) => Math.round(v * 100) / 100;

/**
 * Prévia de uma ordem.
 * @param {object} p
 * @param {'compra'|'venda'|'venda_descoberto'|'recompra'} p.tipo
 * @param {number} p.quantidade
 * @param {number} p.preco         último fechamento
 * @param {number} p.saldo         saldo disponível
 * @param {object} p.config        { corretagem, limite_descoberto, aluguel_mensal }
 * @param {number} p.qtdComprada   ações que o aluno tem desta empresa
 * @param {object|null} p.vendida  posição vendida desta empresa ({ quantidade, garantia })
 * @param {number} p.exposicao     soma das vendas a descoberto abertas, a preço atual
 * @returns {{ linhas: {rotulo:string, valor:number, destaque?:boolean}[], maximo:number, erro:string|null, efeitoSaldo:number }}
 */
export function previa({ tipo, quantidade, preco, saldo, config, qtdComprada = 0, vendida = null, exposicao = 0 }) {
  const q = Math.floor(Number(quantidade) || 0);
  const corretagem = Number(config.corretagem);
  const bruto = r2(q * preco);
  let linhas = [];
  let maximo = 0;
  let erro = null;
  let efeitoSaldo = 0;

  if (tipo === 'compra') {
    maximo = Math.max(0, Math.floor((saldo - corretagem) / preco));
    efeitoSaldo = -(bruto + corretagem);
    linhas = [
      { rotulo: 'Valor das ações', valor: bruto },
      { rotulo: 'Corretagem', valor: corretagem },
      { rotulo: 'Sai do seu saldo', valor: bruto + corretagem, destaque: true },
    ];
    if (q > 0 && bruto + corretagem > saldo) erro = 'Saldo insuficiente para esta quantidade.';
  } else if (tipo === 'venda') {
    maximo = qtdComprada;
    efeitoSaldo = bruto - corretagem;
    linhas = [
      { rotulo: 'Valor das ações', valor: bruto },
      { rotulo: 'Corretagem', valor: -corretagem },
      { rotulo: 'Entra no seu saldo', valor: bruto - corretagem, destaque: true },
    ];
    if (q > qtdComprada) erro = `Você tem ${qtdComprada} ações desta empresa.`;
  } else if (tipo === 'venda_descoberto') {
    const limite = r2(saldo * Number(config.limite_descoberto));
    const livre = Math.max(0, limite - exposicao);
    maximo = saldo >= corretagem ? Math.max(0, Math.floor(livre / preco)) : 0;
    efeitoSaldo = -corretagem;
    const aluguelDia = r2(bruto * Number(config.aluguel_mensal) / 30);
    linhas = [
      { rotulo: 'Corretagem (sai do saldo)', valor: corretagem },
      { rotulo: 'Aluguel estimado por dia', valor: aluguelDia },
      { rotulo: 'Limite livre para vender a descoberto', valor: livre },
      { rotulo: 'Fica bloqueado como garantia', valor: bruto, destaque: true },
    ];
    if (q > 0 && exposicao + bruto > limite) {
      const pctLimite = Math.round(Number(config.limite_descoberto) * 100);
      erro = maximo > 0
        ? `O limite é ${pctLimite}% do saldo. Você pode vender até ${maximo} ações.`
        : `Você já usou todo o limite de vendas a descoberto (${pctLimite}% do saldo).`;
    }
    if (saldo < corretagem) erro = 'Saldo insuficiente para pagar a corretagem.';
  } else if (tipo === 'recompra') {
    const Q = vendida?.quantidade ?? 0;
    maximo = Q;
    const liberada = Q ? r2(vendida.garantia * q / Q) : 0;
    const resultado = r2(liberada - bruto - corretagem);
    efeitoSaldo = resultado;
    linhas = [
      { rotulo: 'Garantia liberada', valor: liberada },
      { rotulo: 'Custo da recompra', valor: -bruto },
      { rotulo: 'Corretagem', valor: -corretagem },
      { rotulo: 'Resultado no saldo', valor: resultado, destaque: true },
    ];
    if (q > Q) erro = `Você está vendido em ${Q} ações desta empresa.`;
  }

  return { linhas, maximo, erro, efeitoSaldo };
}

/** Totais da carteira (mesma conta do ranking no banco). */
export function resumoCarteira({ saldo, carteira, vendidas, saldoInicial = 10000 }) {
  const acoes = carteira.reduce((s, p) => s + Number(p.valor_atual || 0), 0);
  const garantias = vendidas.reduce((s, v) => s + Number(v.garantia || 0), 0);
  const custoRecompra = vendidas.reduce((s, v) => s + Number(v.custo_recompra || 0), 0);
  const vendido = garantias - custoRecompra;     // quanto as vendas a descoberto valem hoje
  const patrimonio = Number(saldo) + acoes + vendido;
  return {
    saldo: Number(saldo),
    acoes,
    garantias,
    vendido,
    patrimonio,
    rentabilidade: (patrimonio / saldoInicial - 1) * 100,
  };
}

/** Quanto do limite de 80% de prejuízo uma posição vendida já consumiu (0 a 1+). */
export function usoDoStop(vendida, saldo, stop = 0.8) {
  const prejuizo = -Number(vendida.resultado_acumulado || 0);
  const limite = Math.max(0, Number(saldo)) * stop;
  if (prejuizo <= 0) return { prejuizo: 0, limite, uso: 0 };
  return { prejuizo, limite, uso: limite > 0 ? prejuizo / limite : 1 };
}

/** Efeito de uma ordem do extrato no saldo do aluno. */
export function efeitoNoSaldo(o) {
  const v = Number(o.valor_total);
  switch (o.tipo) {
    case 'compra': return -v;
    case 'venda': return v;
    case 'venda_descoberto': return -Number(o.corretagem);
    case 'recompra': return v;       // já é líquido (garantia − recompra − corretagem)
    default: return 0;
  }
}
