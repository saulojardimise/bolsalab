import { useRef, useState } from 'react';
import { api } from '../api/index.js';
import { reduzirFoto } from '../lib/imagem.js';
import Avatar from '../componentes/Avatar.jsx';
import Icone from '../componentes/Icone.jsx';
import Marca from '../componentes/Marca.jsx';

const CHAVE = (uid) => `bolsalab:foto-depois:${uid}`;
const SEMANA = 7 * 86400e3;

/** O aluno pediu para colocar a foto depois há menos de uma semana? */
export function fotoAdiada(uid) {
  try { return Date.now() - Number(localStorage.getItem(CHAVE(uid)) || 0) < SEMANA; } catch { return false; }
}
function adiarFoto(uid) {
  try { localStorage.setItem(CHAVE(uid), String(Date.now())); } catch { /* sem armazenamento: pergunta de novo */ }
}

// Depois do questionário: convida o aluno a pôr uma foto de perfil.
// Não é obrigatório: "Fazer depois" volta a perguntar em uma semana.
export default function CompletarFoto({ perfil, aoMudarFoto, aoConcluir }) {
  const seletor = useRef(null);
  const [foto, setFoto] = useState(perfil.foto_url);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro(''); setEnviando(true);
    try {
      const url = await api.enviarFoto(perfil.user_id, await reduzirFoto(arquivo));
      setFoto(url);
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  function depois() {
    adiarFoto(perfil.user_id);
    aoConcluir();
  }

  return (
    <main className="questionario">
      <Marca />
      <section className="cartao completar-foto" aria-labelledby="titulo-foto">
        <p className="suave">Último passo</p>
        <h1 id="titulo-foto">Complete seu cadastro</h1>
        <p>
          Coloque uma foto de perfil. Ela aparece no ranking da turma e ajuda o professor a reconhecer você.
        </p>

        <div className="perfil-foto completar-foto-avatar">
          <Avatar foto={foto} tamanho={120} className={enviando ? 'avatar-enviando' : ''} />
          <button type="button" className="botao-camera" onClick={() => seletor.current.click()}
                  aria-label={foto ? 'Trocar foto' : 'Colocar foto'} disabled={enviando}>
            <Icone nome="camera" tamanho={20} />
          </button>
        </div>
        <input ref={seletor} type="file" accept="image/*" hidden onChange={aoEscolher} />

        {enviando && <p className="suave" role="status">Salvando a foto…</p>}
        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

        {foto ? (
          <button className="botao botao-principal" onClick={() => { aoMudarFoto(foto); aoConcluir(); }}>Continuar</button>
        ) : (
          <>
            <button className="botao botao-principal" onClick={() => seletor.current.click()} disabled={enviando}>
              <Icone nome="camera" tamanho={20} />Colocar foto
            </button>
            <button className="link" onClick={depois} disabled={enviando}>Fazer depois</button>
          </>
        )}
        <p className="nota">Você pode trocar ou tirar a foto quando quiser, tocando no seu perfil.</p>
      </section>
    </main>
  );
}
