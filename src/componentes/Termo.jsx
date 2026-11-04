import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARIO } from '../lib/glossario.js';

// Um termo com o "?" ao lado. Tocar no "?" abre a explicação do glossário.
// Uso: <Termo id="venda_descoberto">Vendas a descoberto</Termo>
//      <Termo id="corretagem" />   (só o "?", para pôr ao lado de um texto já existente)
export default function Termo({ id, children }) {
  const [aberto, setAberto] = useState(false);
  const g = GLOSSARIO[id];
  if (!g) return children ?? null;

  function abrir(e) {
    e.preventDefault();      // dentro de um <label>, não marca a opção
    e.stopPropagation();
    setAberto(true);
  }

  return (
    <>
      {children}
      <button type="button" className="botao-termo" onClick={abrir} aria-label={`O que é ${g.titulo.toLowerCase()}?`}>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
          <circle cx="10" cy="10" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.6 7.7a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="10" cy="14.6" r="1" fill="currentColor" />
        </svg>
      </button>
      {aberto && createPortal(<Explicacao g={g} aoFechar={() => setAberto(false)} />, document.body)}
    </>
  );
}

function Explicacao({ g, aoFechar }) {
  const dialogo = useRef(null);
  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  return (
    <dialog ref={dialogo} className="folha glossario" aria-labelledby="glossario-titulo"
            onCancel={(e) => { e.preventDefault(); aoFechar(); }}
            onClick={(e) => e.target === dialogo.current && aoFechar()}>
      <div className="glossario-conteudo">
        <p className="glossario-rotulo">O que é</p>
        <h2 id="glossario-titulo">{g.titulo}</h2>
        <p>{g.texto}</p>
        {g.exemplo && <p className="glossario-exemplo"><strong>Exemplo:</strong> {g.exemplo}</p>}
        <button className="botao botao-principal" onClick={aoFechar} autoFocus>Entendi</button>
      </div>
    </dialog>
  );
}
