import { useEffect, useRef } from 'react';
import Icone from './Icone.jsx';

// Folha do perfil: dados do aluno e sair
export default function MenuPerfil({ perfil, aoFechar, aoSair }) {
  const dialogo = useRef(null);
  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  return (
    <dialog ref={dialogo} className="folha" aria-labelledby="perfil-nome"
            onCancel={(e) => { e.preventDefault(); aoFechar(); }}
            onClick={(e) => e.target === dialogo.current && aoFechar()}>
      <div className="perfil">
        <span className="avatar avatar-grande"><Icone nome="usuario" tamanho={30} /></span>
        <div>
          <h2 id="perfil-nome">{perfil.nome || 'Sem nome'}</h2>
          <p className="suave">{perfil.email}</p>
          {perfil.turma && <p className="suave">Turma {perfil.turma}</p>}
        </div>
        <div className="perfil-acoes">
          <button className="botao" onClick={aoSair}><Icone nome="sair" />Sair da conta</button>
          <button className="link" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </dialog>
  );
}
