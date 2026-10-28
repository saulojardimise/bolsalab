// Dicas curtas da tela Início. Uma por dia, e o aluno pode passar para a próxima.
export const DICAS = [
  {
    titulo: 'Diversificação reduz riscos',
    texto: 'Ao investir em empresas de setores diferentes, você diminui o impacto da queda de uma única ação.',
  },
  {
    titulo: 'A corretagem pesa nas ordens pequenas',
    texto: 'R$ 15 numa ordem de R$ 150 já são 10% de custo. Ordens maiores e menos frequentes custam menos.',
  },
  {
    titulo: 'Preço médio inclui os custos',
    texto: 'Somamos a corretagem ao preço pago. Por isso uma ação comprada a R$ 40 pode ter preço médio de R$ 40,15.',
  },
  {
    titulo: 'Venda a descoberto tem custo diário',
    texto: 'Você paga aluguel de 3% ao mês pelas ações emprestadas. Se o preço demorar a cair, o aluguel come o lucro.',
  },
  {
    titulo: 'Perda e ganho não são simétricos',
    texto: 'Uma ação que cai 50% precisa subir 100% para voltar ao preço inicial.',
  },
  {
    titulo: 'Olhe o setor, não só a empresa',
    texto: 'Bancos, energia e varejo reagem de formas diferentes aos juros e à economia. Compare empresas do mesmo setor.',
  },
  {
    titulo: 'Defina sua tese antes de comprar',
    texto: 'Anote por que está comprando e o que faria você vender. Isso evita decisões no impulso.',
  },
  {
    titulo: 'Volume mostra o interesse do mercado',
    texto: 'Uma alta com volume grande costuma ser mais significativa do que uma alta com poucos negócios.',
  },
];

/** Índice da dica do dia (muda a cada dia do ano). */
export function dicaDoDia(d = new Date()) {
  const inicio = new Date(d.getFullYear(), 0, 0);
  const dia = Math.floor((d - inicio) / 86400000);
  return dia % DICAS.length;
}
