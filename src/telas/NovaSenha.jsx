import { useState } from 'react';
import { api } from '../api/index.js';

// Aberta pelo link "recuperar senha" enviado por e-mail
export default function NovaSenha({ aoConcluir }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return; }
    setEnviando(true); setErro('');
    try {
      await api.definirNovaSenha(senha);
      aoConcluir();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrada">
      <form className="entrada-form" onSubmit={enviar} noValidate>
        <h1>Crie uma nova senha</h1>
        <label className="campo">
          <span>Nova senha</span>
          <input type="password" autoComplete="new-password" value={senha}
                 onChange={(e) => setSenha(e.target.value)} minLength={6} required autoFocus />
          <small>Pelo menos 6 caracteres.</small>
        </label>
        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
        <button className="botao botao-principal" disabled={enviando}>
          {enviando ? 'Aguarde…' : 'Salvar nova senha'}
        </button>
      </form>
    </main>
  );
}
