import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { pct, reais, tendencia } from '../lib/formato.js';

// Ranking por patrimônio: da turma do aluno ou de todas as turmas
export default function Turma({ turmaId, turmaNome, versao }) {
  const [soTurma, setSoTurma] = useState(Boolean(turmaId));
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    setLista(null);
    api.ranking(soTurma ? turmaId : null)
      .then((r) => vivo && setLista(r))
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [soTurma, turmaId, versao]);

  const eu = lista?.find((r) => r.eu);

  return (
    <div className="pilha">
      <div className="secao-topo">
        <div>
          <h1>Turma</h1>
          {turmaNome && <p className="suave">{turmaNome}</p>}
        </div>
        {turmaId && (
          <div className="alternar" role="group" aria-label="Quem aparece no ranking">
            <button aria-pressed={soTurma} onClick={() => setSoTurma(true)}>Minha turma</button>
            <button aria-pressed={!soTurma} onClick={() => setSoTurma(false)}>Todas</button>
          </div>
        )}
      </div>

      {eu && lista.length > 1 && (
        <p className="cartao destaque-posicao">
          Você está em <strong>{eu.posicao}º lugar</strong> entre {lista.length} {soTurma ? 'colegas da turma' : 'alunos'},
          com <strong className={tendencia(eu.rentabilidade_pct)}>{pct(eu.rentabilidade_pct)}</strong>.
        </p>
      )}

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!lista && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}
      {lista?.length === 0 && <p className="cartao vazio">Ninguém no ranking ainda.</p>}

      {lista?.length > 0 && (
        <ol className="cartao cartao-lista ranking">
          {lista.map((r, i) => (
            <li key={i} className={r.eu ? 'eu' : undefined}>
              <span className="ranking-pos num">{r.posicao}º</span>
              <span className="ranking-nome">
                <strong>{r.nome || 'Sem nome'}</strong>
                {!soTurma && r.turma && <small>{r.turma}</small>}
              </span>
              <span className="ranking-valor">
                <strong className={`num ${tendencia(r.rentabilidade_pct)}`}>{pct(r.rentabilidade_pct)}</strong>
                <small className="num">{reais(r.patrimonio)}</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
