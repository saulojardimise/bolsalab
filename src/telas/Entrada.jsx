import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { emailAceito } from '../api/supabase.js';
import Marca from '../componentes/Marca.jsx';

// Entrar, criar conta (com o token da turma) e recuperar senha
export default function Entrada() {
  const [modo, setModo] = useState('entrar');   // entrar | cadastrar | recuperar
  const [campos, setCampos] = useState({ email: '', senha: '', nome: '', token: '' });
  const [turma, setTurma] = useState(null);     // { turma, dominio_email } | false (inválido) | null (não conferido)
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const mudar = (e) => setCampos({ ...campos, [e.target.name]: e.target.value });
  const trocar = (m) => { setModo(m); setErro(''); setAviso(''); };

  // confere o token assim que ele parece completo (8 letras/números)
  useEffect(() => {
    if (modo !== 'cadastrar') return;
    const limpo = campos.token.replace(/[^A-Za-z0-9]/g, '');
    if (limpo.length < 8) { setTurma(null); return; }
    let vivo = true;
    api.verificarToken(campos.token).then((t) => vivo && setTurma(t || false)).catch(() => vivo && setTurma(null));
    return () => { vivo = false; };
  }, [campos.token, modo]);

  async function enviar(e) {
    e.preventDefault();
    setErro(''); setAviso('');
    if (modo === 'cadastrar') {
      if (!campos.nome.trim()) { setErro('Digite seu nome.'); return; }
      if (turma === false) { setErro('Token de turma inválido ou turma fechada. Peça o token ao professor.'); return; }
      if (turma && !emailAceito(campos.email, turma.dominio_email)) {
        setErro(turma.dominio_email ? `A turma ${turma.turma} só aceita e-mails @${turma.dominio_email}.` : 'Digite um e-mail válido.');
        return;
      }
    }
    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await api.entrar(campos.email, campos.senha);
      } else if (modo === 'cadastrar') {
        const r = await api.cadastrar(campos);
        if (r.precisaConfirmar) {
          setAviso(`Conta criada na turma ${r.turma}. Enviamos um link para ${campos.email.trim()}: abra-o para ativar e depois entre aqui.`);
          setModo('entrar');
        }
      } else {
        await api.recuperarSenha(campos.email);
        setAviso('Se este e-mail tiver conta, você vai receber um link para criar uma nova senha.');
        setModo('entrar');
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const titulos = { entrar: 'Entre na sua conta', cadastrar: 'Crie sua conta', recuperar: 'Recuperar senha' };
  const botoes = { entrar: 'Entrar', cadastrar: 'Criar conta', recuperar: 'Enviar link' };
  const exemploEmail = turma?.dominio_email ? `seu.nome@${turma.dominio_email}` : 'seu.nome@email.com';

  return (
    <main className="entrada">
      <div className="entrada-marca">
        <Marca altura={52} subtitulo />
        <p className="entrada-texto">
          Você começa com R$ 10.000 virtuais e investe nas ações do Ibovespa, com os preços reais de fechamento.
        </p>
      </div>

      <form className="entrada-form" onSubmit={enviar} noValidate>
        <h1>{titulos[modo]}</h1>

        {aviso && <p className="aviso aviso-ok" role="status">{aviso}</p>}

        {modo === 'cadastrar' && (
          <>
            <label className="campo">
              <span>Token da turma</span>
              <input name="token" value={campos.token} onChange={mudar} placeholder="Ex.: K7QM-P2XA"
                     autoCapitalize="characters" autoComplete="off" spellCheck="false" required />
              {turma && (
                <small className="token-ok">
                  Turma {turma.turma}. {turma.dominio_email ? `Aceita só e-mails @${turma.dominio_email}.` : 'Aceita qualquer e-mail.'}
                </small>
              )}
              {turma === false && <small className="token-erro">Token não encontrado ou turma fechada.</small>}
              {turma === null && <small>O professor passa este código para a turma.</small>}
            </label>
            <label className="campo">
              <span>Nome</span>
              <input name="nome" value={campos.nome} onChange={mudar} autoComplete="name" required />
            </label>
          </>
        )}

        <label className="campo">
          <span>E-mail</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" required
                 value={campos.email} onChange={mudar} placeholder={exemploEmail} />
        </label>

        {modo !== 'recuperar' && (
          <label className="campo">
            <span>Senha</span>
            <input name="senha" type="password" required minLength={6}
                   autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
                   value={campos.senha} onChange={mudar} />
            {modo === 'cadastrar' && <small>Pelo menos 6 caracteres.</small>}
          </label>
        )}

        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

        <button className="botao botao-principal" disabled={enviando}>
          {enviando ? 'Aguarde…' : botoes[modo]}
        </button>

        <div className="entrada-links">
          {modo === 'entrar' ? (
            <>
              <button type="button" className="link" onClick={() => trocar('cadastrar')}>Criar conta</button>
              <button type="button" className="link" onClick={() => trocar('recuperar')}>Esqueci a senha</button>
            </>
          ) : (
            <button type="button" className="link" onClick={() => trocar('entrar')}>Já tenho conta</button>
          )}
        </div>

        {api.modoDemo && (
          <p className="nota">
            Demonstração: entre com qualquer e-mail e senha de 6 caracteres. Para ver a área do gestor,
            entre com saulojardim@id.uff.br. Token de exemplo para o cadastro: ADM3-2026.
          </p>
        )}
      </form>
    </main>
  );
}
