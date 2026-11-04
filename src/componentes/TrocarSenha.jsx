import { useState } from 'react';
import { api } from '../api/index.js';

// Troca de senha dentro do app: confere a senha atual antes de gravar a nova.
export default function TrocarSenha({ email, aoConcluir, aoCancelar }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!atual) { setErro('Digite a senha atual.'); return; }
    if (nova.length < 6) { setErro('A nova senha precisa ter pelo menos 6 caracteres.'); return; }
    if (nova !== repetir) { setErro('As duas senhas novas não são iguais.'); return; }
    if (nova === atual) { setErro('A nova senha é igual à atual.'); return; }
    setEnviando(true); setErro('');
    try {
      await api.trocarSenha(email, atual, nova);
      aoConcluir();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="trocar-senha" onSubmit={enviar} noValidate aria-label="Trocar senha">
      <label className="campo">
        <span>Senha atual</span>
        <input type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} />
      </label>
      <label className="campo">
        <span>Nova senha</span>
        <input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
        <small>Pelo menos 6 caracteres.</small>
      </label>
      <label className="campo">
        <span>Repita a nova senha</span>
        <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
      </label>
      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      <div className="botoes-linha">
        <button type="button" className="botao" onClick={aoCancelar} disabled={enviando}>Cancelar</button>
        <button className="botao botao-principal" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar senha'}</button>
      </div>
    </form>
  );
}
