// Glossário: o que aparece ao tocar no "?" ao lado de um termo.
// Linguagem simples; quando ajuda, um exemplo com números redondos.

export const GLOSSARIO = {
  patrimonio: {
    titulo: 'Patrimônio virtual',
    texto: 'Tudo o que a sua conta vale hoje: o saldo em dinheiro, mais as ações compradas pelo preço de fechamento, '
      + 'mais o resultado das vendas a descoberto. É ele que decide a sua posição no ranking.',
    exemplo: 'Saldo de R$ 4.000 + ações que valem R$ 6.200 = patrimônio de R$ 10.200.',
  },
  saldo: {
    titulo: 'Saldo disponível',
    texto: 'O dinheiro livre na conta, que você pode usar para comprar ações. Compras e corretagens tiram dele; '
      + 'vendas devolvem. O valor bloqueado como garantia não entra no saldo.',
  },
  rentabilidade: {
    titulo: 'Rentabilidade',
    texto: 'Quanto o seu patrimônio cresceu (ou caiu) em relação ao que você tinha no começo, em porcentagem.',
    exemplo: 'Começou com R$ 10.000 e hoje tem R$ 10.500: rentabilidade de +5%.',
  },
  preco_medio: {
    titulo: 'Preço médio',
    texto: 'Quanto você pagou, em média, por cada ação de uma empresa, somando todas as compras. '
      + 'Aqui ele não inclui a corretagem, como no home broker. Vender não muda o preço médio.',
    exemplo: 'Comprou 100 a R$ 10 e depois 100 a R$ 12: preço médio de R$ 11.',
  },
  corretagem: {
    titulo: 'Corretagem',
    texto: 'Taxa que a corretora cobra por cada ordem executada, de compra ou de venda. No simulador é R$ 15 por ordem, '
      + 'qualquer que seja a quantidade. Por isso, muitas ordens pequenas saem caro.',
  },
  venda_descoberto: {
    titulo: 'Venda a descoberto',
    texto: 'Vender ações que você não tem. Você "aluga" as ações de outro investidor, vende pelo preço de hoje '
      + 'e depois precisa comprá-las de volta (recompra) para devolver. Ganha se o preço cair; perde se subir.',
    exemplo: 'Vende 100 a R$ 20 (R$ 2.000) e recompra a R$ 17 (R$ 1.700): lucro de R$ 300, menos aluguel e corretagem.',
  },
  recompra: {
    titulo: 'Recompra',
    texto: 'Comprar de volta as ações vendidas a descoberto, para devolvê-las a quem as emprestou. '
      + 'É o que encerra a operação e define o lucro ou o prejuízo.',
  },
  garantia: {
    titulo: 'Garantia',
    texto: 'O dinheiro da venda a descoberto fica bloqueado: não entra no saldo e não pode ser usado em outras compras. '
      + 'Ele é liberado na recompra, e é dele que sai o pagamento das ações compradas de volta.',
  },
  aluguel: {
    titulo: 'Aluguel de ações',
    texto: 'Quem vende a descoberto paga uma taxa a quem emprestou as ações, enquanto a posição estiver aberta. '
      + 'No simulador é 3% ao mês (0,1% por dia) sobre o valor atual das ações, cobrado todo dia do saldo.',
  },
  limite_descoberto: {
    titulo: 'Limite da venda a descoberto',
    texto: 'Você pode vender a descoberto até 40% do seu saldo disponível, somando todas as posições vendidas. '
      + 'O limite existe porque o prejuízo de uma venda a descoberto não tem teto: o preço pode subir sem parar.',
  },
  resultado_acumulado: {
    titulo: 'Prejuízo com custos',
    texto: 'Na venda a descoberto, o resultado mostrado é só o efeito do preço: valor da venda menos o custo para recomprar hoje. '
      + 'Para o encerramento automático, o simulador soma também o aluguel e a corretagem já pagos, '
      + 'porque eles também saíram do seu saldo.',
    exemplo: 'Vendeu por R$ 2.000, recomprar hoje custa R$ 2.100 (−R$ 100) e já pagou R$ 15 de corretagem e R$ 6 de aluguel: '
      + 'prejuízo com custos de R$ 121.',
  },
  encerramento: {
    titulo: 'Encerramento automático',
    texto: 'Uma proteção (parecida com um "stop loss"): se o prejuízo acumulado de uma venda a descoberto chegar a 80% '
      + 'do seu saldo disponível, o simulador faz a recompra sozinho, para o prejuízo não crescer mais.',
  },
  fechamento: {
    titulo: 'Preço de fechamento',
    texto: 'O preço do último negócio do dia na bolsa. O simulador usa o fechamento de cada pregão: '
      + 'as ordens feitas à noite e no fim de semana usam o fechamento mais recente.',
  },
  abertura: {
    titulo: 'Abertura',
    texto: 'O preço do primeiro negócio do dia na bolsa, quando o pregão começa.',
  },
  maxima: {
    titulo: 'Máxima',
    texto: 'O maior preço pelo qual a ação foi negociada durante o dia.',
  },
  minima: {
    titulo: 'Mínima',
    texto: 'O menor preço pelo qual a ação foi negociada durante o dia.',
  },
  variacao: {
    titulo: 'Variação',
    texto: 'Quanto o preço de fechamento subiu ou caiu em relação ao fechamento do pregão anterior, em porcentagem.',
  },
  volume: {
    titulo: 'Volume',
    texto: 'Quantas ações foram negociadas no dia. Volume alto mostra muito interesse dos investidores e facilita '
      + 'comprar ou vender sem mexer muito no preço (liquidez).',
  },
  setor: {
    titulo: 'Setor e diversificação',
    texto: 'Setor é a área de atuação da empresa (bancos, energia, varejo...). Diversificar é espalhar o dinheiro '
      + 'entre setores diferentes: se um vai mal, os outros podem compensar.',
  },
  fluxo_caixa: {
    titulo: 'Fluxo de caixa',
    texto: 'O registro de todo dinheiro que entrou e saiu do seu saldo: compras, vendas, corretagens, aluguel e ajustes. '
      + 'Somando tudo a partir do saldo inicial, você chega ao saldo disponível de hoje.',
  },
  fato_relevante: {
    titulo: 'Fato relevante',
    texto: 'Comunicado oficial que a empresa é obrigada a divulgar, ao mesmo tempo para todos os investidores, sempre que '
      + 'acontece algo que pode mexer no preço das ações: resultados, fusões, aquisições, dividendos, mudança de comando. '
      + 'É publicado na CVM e é a fonte mais confiável, antes de qualquer jornal.',
  },
  suitability: {
    titulo: 'Suitability',
    texto: 'Em português, "adequação". É a obrigação das corretoras de conhecer o perfil do cliente (objetivos, prazo, '
      + 'tolerância a perdas e experiência) antes de recomendar investimentos. Quem regula é a CVM.',
  },
  perfil_investidor: {
    titulo: 'Perfil de investidor',
    texto: 'Conservador prioriza a segurança; moderado aceita algum risco por um ganho maior; arrojado tolera quedas '
      + 'fortes buscando ganhos maiores no longo prazo. O perfil é declarado no questionário.',
  },
};

// Rótulos da boleta (lib/regras.js) que têm explicação
export const TERMO_DO_ROTULO = {
  Corretagem: 'corretagem',
  'Corretagem (sai do saldo)': 'corretagem',
  'Aluguel estimado por dia': 'aluguel',
  'Limite livre para vender a descoberto': 'limite_descoberto',
  'Fica bloqueado como garantia': 'garantia',
  'Garantia liberada': 'garantia',
  'Custo da recompra': 'recompra',
};
