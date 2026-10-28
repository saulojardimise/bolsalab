import { useEffect, useRef, useState } from 'react';
import { api } from '../api/index.js';
import { reduzirFoto } from '../lib/imagem.js';
import Icone from './Icone.jsx';
import Avatar from './Avatar.jsx';

// Folha do perfil: foto, dados do aluno e sair.
// O botão de câmera abre o seletor do próprio celular (fototeca, câmera ou arquivo).
export default function MenuPerfil({ perfil, aoFechar, aoSair, aoMudarFoto }) {
  const dialogo = useRef(null);
  const seletor = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';           // permite escolher a mesma foto de novo
    if (!arquivo) return;
    setErro(''); setEnviando(true);
    try {
      const foto = await reduzirFoto(arquivo);
      aoMudarFoto(await api.enviarFoto(perfil.user_id, foto));
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setErro(''); setEnviando(true);
    try {
      await api.removerFoto(perfil.user_id);
      aoMudarFoto(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="folha" aria-labelledby="perfil-nome"
            onCancel={(e) => { e.preventDefault(); aoFechar(); }}
            onClick={(e) => e.target === dialogo.current && aoFechar()}>
      <div className="perfil">
        <div className="perfil-foto">
          <Avatar foto={perfil.foto_url} tamanho={96} className={enviando ? 'avatar-enviando' : ''} />
          <button type="button" className="botao-camera" onClick={() => seletor.current.click()}
                  aria-label={perfil.foto_url ? 'Trocar foto' : 'Colocar foto'} disabled={enviando}>
            <Icone nome="camera" tamanho={18} />
          </button>
        </div>

        <input ref={seletor} type="file" accept="image/*" hidden onChange={aoEscolher} />
        {perfil.foto_url && !enviando && (
          <button type="button" className="link link-perigo" onClick={remover}>Remover foto</button>
        )}
        {enviando && <p className="suave" role="status">Salvando a foto…</p>}
        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

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
