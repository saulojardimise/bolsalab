import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { dataHora, pct, reais, tendencia } from '../../lib/formato.js';
import Icone from '../../componentes/Icone.jsx';
import Copiar from '../../componentes/Copiar.jsx';
import RegraEmail, { textoRegra } from './RegraEmail.jsx';

// Uma turma: token, regra de e-mail, cadastros abertos/fechados e o ranking dos alunos
export default function TurmaDetalhe({ id, aoVoltar, avisar }) {
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState(null);
  const [editando, setEditando] = useState(false);
  const [confirmarToken, setConfirmarToken] = useState(false);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    Promise.all([api.turmas(), api.alunosTurma(id)])
      .then(([ts, as]) => { setTurma(ts.find((t) => t.id === id)); setAlunos(as); })
      .catch((e) => setErro(e.message));
  }, [id, versao]);

  async function salvar(campos) {
    try {
      await api.atualizarTurma(id, campos);
      setEditando(false);
      setVersao((v) => v + 1);
      avisar('Turma atualizada.');
    } catch (e) { setErro(e.message); }
  }

  async function trocarToken() {
    try {
      const token = await api.novoToken(id);
      setConfirmarToken(false);
      setVersao((v) => v + 1);
      avisar(`Token novo: ${token}. O antigo não vale mais.`);
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="pilha">
      <header className="barra-acao">
        <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        <h1>{turma?.nome ?? 'Turma'}</h1>
        <span style={{ width: 40 }} />
      </header>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!turma && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}

      {turma && !editando && (
        <section className="cartao" aria-label="Dados da turma">
          <p className="suave">Token para o cadastro</p>
          <div className="token-linha">
            <span className="token token-grande num">{turma.token}</span>
            <Copiar texto={turma.token} />
          </div>
          <dl className="turma-numeros">
            <div><dt>E-mails</dt><dd>{textoRegra(turma.dominio_email)}</dd></div>
            <div><dt>Cadastros</dt><dd>{turma.ativa ? 'Abertos' : 'Fechados'}</dd></div>
            <div><dt>Alunos</dt><dd className="num">{turma.alunos}</dd></div>
          </dl>
          <div className="botoes-linha">
            <button className="botao" onClick={() => setEditando(true)}><Icone nome="editar" tamanho={18} />Editar</button>
            <button className="botao" onClick={() => salvar({ nome: turma.nome, dominio: turma.dominio_email, ativa: !turma.ativa })}>
              {turma.ativa ? 'Fechar cadastros' : 'Abrir cadastros'}
            </button>
          </div>
          {!confirmarToken ? (
            <button className="link" onClick={() => setConfirmarToken(true)}>Gerar token novo</button>
          ) : (
            <div className="confirmacao" role="alert">
              <p>O token atual deixa de funcionar para novos cadastros. Quem já entrou continua na turma.</p>
              <div className="botoes-linha">
                <button className="botao" onClick={() => setConfirmarToken(false)}>Cancelar</button>
                <button className="botao botao-principal" onClick={trocarToken}>Gerar token novo</button>
              </div>
            </div>
          )}
        </section>
      )}

      {turma && editando && <EditarTurma turma={turma} aoCancelar={() => setEditando(false)} aoSalvar={salvar} />}

      {alunos && (
        <section aria-labelledby="titulo-alunos-turma">
          <h2 id="titulo-alunos-turma" className="secao-titulo">
            Alunos <span className="suave">{alunos.length ? 'por patrimônio' : ''}</span>
          </h2>
          {alunos.length === 0 ? (
            <p className="cartao vazio">Nenhum aluno ainda. Passe o token {turma?.token} para a turma.</p>
          ) : (
            <ol className="cartao cartao-lista ranking ranking-gestor">
              {alunos.map((a) => (
                <li key={a.user_id}>
                  <span className="ranking-pos num">{a.posicao}º</span>
                  <span className="ranking-nome">
                    <strong>{a.nome || 'Sem nome'}</strong>
                    <small>{a.email}</small>
                    <small>
                      {a.ordens} {Number(a.ordens) === 1 ? 'ordem' : 'ordens'}
                      {a.ultima_ordem ? `, a última em ${dataHora(a.ultima_ordem)}` : ''}
                    </small>
                  </span>
                  <span className="ranking-valor">
                    <strong className={`num ${tendencia(a.rentabilidade_pct)}`}>{pct(a.rentabilidade_pct)}</strong>
                    <small className="num">{reais(a.patrimonio)}</small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function EditarTurma({ turma, aoCancelar, aoSalvar }) {
  const [nome, setNome] = useState(turma.nome);
  const [dominio, setDominio] = useState(turma.dominio_email ?? '');
  const [ativa, setAtiva] = useState(turma.ativa);
  const [erro, setErro] = useState('');

  function salvar(e) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Dê um nome para a turma.'); return; }
    if (dominio && !dominio.trim()) { setErro('Digite o domínio aceito.'); return; }
    aoSalvar({ nome: nome.trim(), dominio: dominio.trim(), ativa });
  }

  return (
    <form className="cartao" onSubmit={salvar} aria-label="Editar turma">
      <label className="campo">
        <span>Nome da turma</span>
        <input id="editar-turma-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <RegraEmail valor={dominio} aoMudar={setDominio} nome="regra-editar" />
      <p className="nota">A regra vale para novos cadastros e para trocas de e-mail. Quem já está na turma continua.</p>
      <label className="opcao-radio">
        <input type="checkbox" checked={ativa} onChange={(e) => setAtiva(e.target.checked)} />
        Aceitando cadastros
      </label>
      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      <div className="botoes-linha">
        <button type="button" className="botao" onClick={aoCancelar}>Cancelar</button>
        <button className="botao botao-principal">Salvar</button>
      </div>
    </form>
  );
}
