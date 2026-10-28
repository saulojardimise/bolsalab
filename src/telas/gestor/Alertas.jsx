import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { dataHora } from '../../lib/formato.js';

const TITULO = {
  sem_cotacao: 'Ação sem cotação',
  variacao_brusca: 'Salto de preço',
  codigo_alterado: 'Código novo na brapi',
};

// Ações sugeridas para cada tipo de alerta (abrem o formulário de Eventos já preenchido)
function sugestoes(a) {
  if (a.tipo === 'variacao_brusca') {
    const de = a.detalhes?.de ?? 1, para = a.detalhes?.para ?? 2;
    return [{ rotulo: de < para ? 'Registrar desdobramento' : 'Registrar grupamento', evento: { tipo: 'desdobramento', ticker: a.ticker, de, para } }];
  }
  if (a.tipo === 'codigo_alterado') {
    return [{ rotulo: 'Trocar código', evento: { tipo: 'troca', ticker: a.ticker, novo: a.detalhes?.novo_codigo ?? '' } }];
  }
  return [
    { rotulo: 'Suspender', evento: { tipo: 'suspensao', ticker: a.ticker } },
    { rotulo: 'Trocar código', evento: { tipo: 'troca', ticker: a.ticker } },
    { rotulo: 'Saída da bolsa', evento: { tipo: 'encerramento', ticker: a.ticker } },
  ];
}

// Alertas abertos gerados pela coleta diária
export default function Alertas({ aoAgir, avisar }) {
  const [alertas, setAlertas] = useState(null);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    api.alertas().then(setAlertas).catch((e) => setErro(e.message));
  }, [versao]);

  async function resolver(id) {
    try {
      await api.resolverAlerta(id);
      setVersao((v) => v + 1);
      avisar('Alerta marcado como resolvido.');
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="pilha">
      <div>
        <h1>Alertas</h1>
        <p className="suave">A coleta das 18h35 confere as ações todo dia útil e avisa aqui quando algo foge do normal.</p>
      </div>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!alertas && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}
      {alertas?.length === 0 && (
        <p className="cartao vazio">Nenhum alerta aberto. As ações estão com cotação em dia e sem saltos de preço.</p>
      )}

      {alertas?.map((a) => (
        <article key={a.id} className="cartao alerta">
          <div className="turma-cabeca">
            <h2>{TITULO[a.tipo]} <span className="suave">{a.ticker}</span></h2>
            <span className="suave alerta-data">{dataHora(a.criado_em)}</span>
          </div>
          <p>{a.mensagem}</p>
          <p className={Number(a.alunos) > 0 ? 'alerta-afetados' : 'suave'}>
            {Number(a.alunos) === 0 ? 'Nenhum aluno tem esta ação.'
              : `${a.alunos} ${Number(a.alunos) === 1 ? 'aluno tem' : 'alunos têm'} esta ação na carteira.`}
          </p>
          <div className="botoes-linha botoes-quebram">
            {sugestoes(a).map((s) => (
              <button key={s.rotulo} className="botao botao-compacto" onClick={() => aoAgir(s.evento)}>{s.rotulo}</button>
            ))}
            <button className="link" onClick={() => resolver(a.id)}>Marcar como resolvido</button>
          </div>
        </article>
      ))}
    </div>
  );
}
