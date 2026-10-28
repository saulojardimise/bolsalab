import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { pct, tendencia } from '../../lib/formato.js';
import Icone from '../../componentes/Icone.jsx';
import Copiar from '../../componentes/Copiar.jsx';
import RegraEmail, { textoRegra } from './RegraEmail.jsx';

// Lista de turmas, com o token de cada uma, e criação de turma nova
export default function Turmas({ aoAbrir, avisar }) {
  const [turmas, setTurmas] = useState(null);
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    api.turmas().then(setTurmas).catch((e) => setErro(e.message));
  }, [versao]);

  return (
    <div className="pilha">
      <div className="secao-topo">
        <div>
          <h1>Turmas</h1>
          <p className="suave">Cada turma tem um token. O aluno digita o token ao criar a conta.</p>
        </div>
        {!criando && (
          <button className="botao botao-compacto" onClick={() => setCriando(true)}>
            <Icone nome="mais" tamanho={18} />Nova turma
          </button>
        )}
      </div>

      {criando && (
        <NovaTurma
          aoCancelar={() => setCriando(false)}
          aoCriar={(t) => { setCriando(false); setVersao((v) => v + 1); avisar(`Turma ${t.nome} criada. Token: ${t.token}`); }}
        />
      )}

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!turmas && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}
      {turmas?.length === 0 && !criando && (
        <div className="cartao vazio">
          <p>Nenhuma turma ainda. Crie a primeira e passe o token para os alunos.</p>
          <button className="botao botao-principal" onClick={() => setCriando(true)}>Criar turma</button>
        </div>
      )}

      {turmas?.map((t) => (
        <article key={t.id} className={`cartao turma ${t.ativa ? '' : 'turma-fechada'}`}>
          <div className="turma-cabeca">
            <h2>{t.nome}</h2>
            <span className={`estado ${t.ativa ? 'estado-ok' : 'estado-off'}`}>
              {t.ativa ? 'Aceitando cadastros' : 'Cadastros fechados'}
            </span>
          </div>
          <div className="token-linha">
            <span className="token num" aria-label={`Token ${t.token}`}>{t.token}</span>
            <Copiar texto={t.token} />
          </div>
          <dl className="turma-numeros">
            <div><dt>E-mails</dt><dd>{textoRegra(t.dominio_email)}</dd></div>
            <div><dt>Alunos</dt><dd className="num">{t.alunos}</dd></div>
            <div>
              <dt>Rentabilidade média</dt>
              <dd className={`num ${tendencia(t.rentabilidade_media)}`}>
                {t.rentabilidade_media == null ? '–' : pct(t.rentabilidade_media)}
              </dd>
            </div>
          </dl>
          <button className="link-acao" onClick={() => aoAbrir(t.id)}>
            Ver alunos e editar <Icone nome="seta" tamanho={16} />
          </button>
        </article>
      ))}
    </div>
  );
}

function NovaTurma({ aoCancelar, aoCriar }) {
  const [nome, setNome] = useState('');
  const [dominio, setDominio] = useState('isecensa.edu.br');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Dê um nome para a turma.'); return; }
    if (dominio && !dominio.trim()) { setErro('Digite o domínio aceito, por exemplo exemplo.edu.br.'); return; }
    setEnviando(true); setErro('');
    try {
      aoCriar(await api.criarTurma(nome.trim(), dominio.trim()));
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <form className="cartao" onSubmit={criar} aria-labelledby="titulo-nova-turma">
      <h2 id="titulo-nova-turma">Nova turma</h2>
      <label className="campo">
        <span>Nome da turma</span>
        <input id="nova-turma-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: ADM 3º período 2026.2" autoFocus />
      </label>
      <RegraEmail valor={dominio} aoMudar={setDominio} nome="regra-nova" />
      <p className="nota">O token é criado automaticamente.</p>
      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      <div className="botoes-linha">
        <button type="button" className="botao" onClick={aoCancelar}>Cancelar</button>
        <button className="botao botao-principal" disabled={enviando}>{enviando ? 'Criando…' : 'Criar turma'}</button>
      </div>
    </form>
  );
}
