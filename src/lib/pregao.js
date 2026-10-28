import { agoraEmSaoPaulo } from './formato.js';

// Texto da faixa de status: se o aluno pode negociar agora e até quando.
// Quem decide de verdade é o banco (negociacao_liberada); aqui só explicamos.
export function textoStatus({ liberada, pausada, demo = false, agora = new Date() }) {
  if (pausada) return { aberto: false, titulo: 'Negociação pausada', detalhe: 'O professor pausou as ordens por enquanto.' };
  if (demo && liberada) return { aberto: true, titulo: 'Negociação aberta', detalhe: 'Na demonstração, as ordens funcionam a qualquer hora.' };

  const { diaSemana, hora } = agoraEmSaoPaulo(agora);
  const fimDeSemana = diaSemana >= 6;

  if (liberada) {
    let detalhe;
    if (fimDeSemana || (diaSemana === 5 && hora >= 19)) detalhe = 'Aberta até segunda, às 9h.';
    else if (hora >= 19) detalhe = 'Aberta até amanhã, às 9h.';
    else if (hora < 9) detalhe = 'Aberta até as 9h.';
    else detalhe = 'Hoje é feriado na B3: aberta o dia todo.';
    return { aberto: true, titulo: 'Negociação aberta', detalhe };
  }
  return {
    aberto: false,
    titulo: 'Negociação fechada',
    detalhe: 'A bolsa está funcionando. Abre às 19h, com os preços de fechamento de hoje.',
  };
}
