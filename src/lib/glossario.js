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
  candlestick: {
    titulo: 'Candlestick (candle)',
    texto: 'Gráfico em que cada dia vira uma "vela". O corpo vai do preço de abertura ao de fechamento: verde se a ação '
      + 'fechou acima de onde abriu, vermelho se fechou abaixo. Os traços finos (pavios) mostram a máxima e a mínima do dia. '
      + 'Num olhar, dá para ver se o dia foi de alta ou de queda e o quanto o preço oscilou.',
    exemplo: 'Abriu a R$ 30, foi até R$ 31,50, caiu até R$ 29,80 e fechou a R$ 31: vela verde de 30 a 31, pavio de 29,80 a 31,50.',
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
  ibovespa: {
    titulo: 'Ibovespa',
    texto: 'O principal índice da bolsa brasileira: uma carteira teórica com as ações mais negociadas da B3 (as mesmas '
      + '76 do simulador). Se a sua carteira rendeu menos que o Ibovespa, teria sido melhor comprar "o mercado inteiro".',
  },
  cdi: {
    titulo: 'CDI',
    texto: 'A taxa dos empréstimos de um dia entre bancos, quase igual à Selic. É a referência da renda fixa: um CDB que '
      + 'rende "100% do CDI" acompanha essa taxa sem o sobe e desce das ações. Render menos que o CDI significa que '
      + 'o risco da bolsa não compensou no período.',
  },
  minicontrato: {
    titulo: 'Minicontrato futuro',
    texto: 'Um acordo de comprar ou vender um ativo numa data futura, por um preço combinado hoje. Você não paga o valor '
      + 'inteiro: deposita só uma margem de garantia, e o ganho ou a perda entra no saldo todo dia (ajuste diário). '
      + 'Por isso o minicontrato é alavancado: com pouco dinheiro, você fica exposto a um valor bem maior.',
    exemplo: 'Um mini índice com o Ibovespa em 166.000 pontos vale R$ 33.200, mas exige só R$ 900 de margem. '
      + 'Se o Ibovespa subir 1%, você ganha R$ 332, mais de um terço da margem. Se cair 1%, perde o mesmo.',
  },
  mini_indice: {
    titulo: 'Mini índice (WIN)',
    texto: 'Contrato futuro sobre o Ibovespa. Cada ponto vale R$ 0,20 por contrato, e o preço anda de 5 em 5 pontos. '
      + 'Comprado, você ganha se o Ibovespa subir; vendido, ganha se cair. Vence nos meses pares.',
  },
  mini_dolar: {
    titulo: 'Mini dólar (WDO)',
    texto: 'Contrato futuro de US$ 10.000, cotado em reais por mil dólares (5.500 pontos = R$ 5,50 por dólar). '
      + 'Cada ponto vale R$ 10 por contrato e o preço anda de 0,5 em 0,5 ponto. Usado para se proteger da alta do dólar '
      + 'ou para apostar nela. Vence todo mês.',
  },
  ptax: {
    titulo: 'PTAX',
    texto: 'A taxa oficial do dólar, calculada pelo Banco Central todo dia útil a partir das negociações do mercado de câmbio. '
      + 'É ela que liquida os contratos futuros de dólar no vencimento.',
  },
  valor_ponto: {
    titulo: 'Valor do ponto',
    texto: 'Quanto você ganha ou perde, por contrato, a cada ponto que o preço anda. No mini índice é R$ 0,20; '
      + 'no mini dólar, R$ 10,00.',
    exemplo: 'Comprado em 3 mini índices, o Ibovespa sobe 500 pontos: 500 × R$ 0,20 × 3 = R$ 300 de ganho.',
  },
  tick: {
    titulo: 'Variação mínima (tick)',
    texto: 'O menor passo que o preço pode dar. No mini índice o preço anda de 5 em 5 pontos (R$ 1,00 por contrato); '
      + 'no mini dólar, de 0,5 em 0,5 ponto (R$ 5,00 por contrato).',
  },
  margem_garantia: {
    titulo: 'Margem de garantia',
    texto: 'Dinheiro que sai do saldo e fica depositado enquanto a posição está aberta, para garantir que você consiga '
      + 'pagar as perdas. Continua sendo seu: volta ao saldo quando você zera a posição. No simulador é R$ 900 por contrato '
      + 'no mini índice e R$ 1.500 por contrato no mini dólar.',
  },
  ajuste_diario: {
    titulo: 'Ajuste diário',
    texto: 'No mercado futuro, o ganho ou a perda não espera você vender: todo dia, depois do fechamento, a diferença entre '
      + 'o preço de hoje e o de ontem entra ou sai do seu saldo. É assim que a B3 evita que as perdas se acumulem.',
    exemplo: 'Vendido em 1 mini dólar, o preço vai de 5.400 para 5.450 pontos: −50 × R$ 10 = −R$ 500 no saldo.',
  },
  chamada_margem: {
    titulo: 'Chamada de margem',
    texto: 'Quando as perdas consomem o seu dinheiro, a corretora pede mais garantia. Se você não deposita, ela zera a '
      + 'posição. No simulador: se o saldo ficar negativo depois do ajuste diário, os seus minicontratos são zerados e '
      + 'a margem cobre o que faltar.',
  },
  vencimento_futuro: {
    titulo: 'Vencimento e rolagem',
    texto: 'Todo contrato futuro tem data para acabar. O código mostra qual é: WIN + letra do mês + ano (WINZ26 = dezembro '
      + 'de 2026). No último dia de negociação a posição é liquidada pelo preço do dia e a margem volta ao saldo. Quem quer '
      + 'continuar abre o contrato seguinte: isso se chama rolagem.',
    exemplo: 'Letras: F jan, G fev, H mar, J abr, K mai, M jun, N jul, Q ago, U set, V out, X nov, Z dez.',
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
