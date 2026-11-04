// Questionário de perfil de investidor (suitability).
// Cada pergunta tem 4 respostas, da mais conservadora (vale 1) à mais arrojada (vale 4).
// Total de 6 a 24 pontos. A conta oficial é feita no banco (definir_perfil_investidor).

export const PERGUNTAS = [
  {
    titulo: 'Qual é o seu principal objetivo ao investir?',
    opcoes: [
      'Preservar o dinheiro, sem correr riscos',
      'Ter uma renda extra, com pouco risco',
      'Fazer o patrimônio crescer, aceitando algumas oscilações',
      'Buscar o maior ganho possível, mesmo com risco alto',
    ],
  },
  {
    titulo: 'Por quanto tempo você deixaria esse dinheiro investido?',
    opcoes: ['Menos de 1 ano', 'De 1 a 3 anos', 'De 3 a 5 anos', 'Mais de 5 anos'],
  },
  {
    titulo: 'Seus investimentos caem 20% em um mês. O que você faz?',
    opcoes: [
      'Vendo tudo para não perder mais',
      'Vendo uma parte',
      'Mantenho e espero recuperar',
      'Aproveito para comprar mais',
    ],
  },
  {
    titulo: 'Quanto você conhece do mercado de ações?',
    opcoes: [
      'Nada',
      'Pouco: sei o que é uma ação',
      'Razoável: acompanho o mercado e entendo os riscos',
      'Bastante: já investi ou estudo o assunto a fundo',
    ],
  },
  {
    titulo: 'Em que você já investiu com dinheiro de verdade?',
    opcoes: [
      'Nunca investi, ou só na poupança',
      'Renda fixa, como CDB e Tesouro Direto',
      'Fundos de investimento ou ações',
      'Ações, opções, derivativos ou criptomoedas',
    ],
  },
  {
    titulo: 'Qual destes cenários para o próximo ano você escolheria?',
    opcoes: [
      'Ganhar 8%, sem nenhuma chance de perda',
      'Ganhar 12% em média, podendo perder até 3%',
      'Ganhar 18% em média, podendo perder até 12%',
      'Ganhar 30% em média, podendo perder até 30%',
    ],
  },
];

export const PERFIS = {
  conservador: {
    nome: 'Conservador',
    resumo: 'Prioriza a segurança e não gosta de ver o dinheiro oscilar.',
    texto: 'No mercado real, a maior parte da carteira ficaria em renda fixa. No simulador, '
      + 'repare como as ações de empresas grandes e estáveis se comportam e evite concentrar tudo numa só.',
  },
  moderado: {
    nome: 'Moderado',
    resumo: 'Aceita algum risco em troca de um ganho maior, sem exageros.',
    texto: 'No mercado real, a carteira misturaria renda fixa e ações. No simulador, '
      + 'diversifique entre setores e acompanhe como cada um reage às notícias.',
  },
  arrojado: {
    nome: 'Arrojado',
    resumo: 'Tolera quedas fortes em busca de ganhos maiores no longo prazo.',
    texto: 'No mercado real, as ações teriam peso grande na carteira. No simulador, '
      + 'você pode testar estratégias como a venda a descoberto, mas fique de olho no risco e no aluguel.',
  },
};

export function classificar(pontos) {
  if (pontos <= 11) return 'conservador';
  if (pontos <= 18) return 'moderado';
  return 'arrojado';
}
