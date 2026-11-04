import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { dataHora, pct, reais, tendencia } from '../../lib/formato.js';
import Icone from '../../componentes/Icone.jsx';
import Copiar from '../../componentes/Copiar.jsx';
import Avatar from '../../componentes/Avatar.jsx';
import RegraEmail, { textoRegra } from './RegraEmail.jsx';
import { PERFIS } from '../../lib/perfilInvestidor.js';

// Uma turma: token, regra de e-mail, cadastros abertos/fechados e o ranking dos alunos
export default function TurmaDetalhe({ id, aoVoltar, avisar }) {
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState(null);
  const [editando, setEditando] = useState(false);
  const [confirmarToken, setConfirmarToken] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
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

  async function excluir(apagarAlunos) {
    try {
      const r = await api.excluirTurma(id, apagarAlunos);
      const extra = r.alunos_apagados > 0
        ? ` ${r.alunos_apagados} ${r.alunos_apagados === 1 ? 'conta apagada' : 'contas apagadas'}.`
        : r.alunos_sem_turma > 0 ? ` ${r.alunos_sem_turma} ${r.alunos_sem_turma === 1 ? 'aluno ficou' : 'alunos ficaram'} sem turma.` : '';
      avisar(`Turma ${r.turma} excluída.${extra}`);
      aoVoltar();
    } catch (e) { setErro(e.message); setExcluindo(false); }
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
          {!confirmarToken && !excluindo && (
            <div className="links-linha">
              <button className="link" onClick={() => setConfirmarToken(true)}>Gerar token novo</button>
              <button className="link link-perigo" onClick={() => setExcluindo(true)}>Excluir turma</button>
            </div>
          )}
          {excluindo && (
            <ExcluirTurma turma={turma} aoCancelar={() => setExcluindo(false)} aoExcluir={excluir} />
          )}
          {confirmarToken && (
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
                  <Avatar foto={a.foto_url} tamanho={40} />
                  <span className="ranking-nome">
                    <strong>{a.nome || 'Sem nome'}</strong>
                    <small>{a.email}</small>
                    <small>
                      {a.ordens} {Number(a.ordens) === 1 ? 'ordem' : 'ordens'}
                      {a.ultima_ordem ? `, a última em ${dataHora(a.ultima_ordem)}` : ''}
                    </small>
                    <PerfilAluno a={a} />
                  </span>
                  <span className="ranking-valor">
                    <strong className={`num ${tendencia(a.rentabilidade_pct)}`}>{pct(a.rentabilidade_pct)}</strong>
                    <small className="num">{reais(a.patrimonio)}</small>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {alunos.length > 0 && (
            <p className="nota">
              Perfil na prática: arrojado se fez venda a descoberto ou tem mais de 80% do patrimônio em ações;
              moderado acima de 40%; conservador no resto. A faixa amarela marca quem age diferente do que declarou.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// Perfil declarado no questionário x perfil pelo que o aluno faz na carteira
function PerfilAluno({ a }) {
  if (!a.perfil_investidor) return <span className="perfis-aluno"><span className="chip-perfil">Sem questionário</span></span>;
  const diverge = a.perfil_pratica && a.perfil_pratica !== a.perfil_investidor;
  const motivo = Number(a.vendas_descoberto) > 0
    ? `${a.vendas_descoberto} ${Number(a.vendas_descoberto) === 1 ? 'venda' : 'vendas'} a descoberto`
    : `${String(a.acoes_pct).replace('.', ',')}% em ações`;
  return (
    <span className={`perfis-aluno ${diverge ? 'perfis-divergem' : ''}`}>
      <span className={`chip-perfil perfil-${a.perfil_investidor}`}>Declarado: {PERFIS[a.perfil_investidor].nome}</span>
      {a.perfil_pratica && (
        <span className={`chip-perfil perfil-${a.perfil_pratica}`} title={motivo}>
          Na prática: {PERFIS[a.perfil_pratica].nome}
        </span>
      )}
      {a.perfil_pratica && <small>{motivo}</small>}
    </span>
  );
}

// Confirmação da exclusão. Com alunos, o gestor escolhe se as contas ficam
// (sem turma) ou são apagadas; apagar exige digitar o nome da turma.
function ExcluirTurma({ turma, aoCancelar, aoExcluir }) {
  const n = Number(turma.alunos);
  const [apagar, setApagar] = useState(false);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const liberado = !apagar || nome.trim().toLowerCase() === turma.nome.trim().toLowerCase();
  const alunos = n === 1 ? '1 aluno' : `${n} alunos`;

  async function confirmar() {
    setEnviando(true);
    await aoExcluir(apagar);
    setEnviando(false);
  }

  return (
    <div className="confirmacao confirmacao-perigo" role="alert">
      <p><strong>Excluir a turma {turma.nome}?</strong> O token {turma.token} deixa de funcionar.</p>
      {n > 0 && (
        <fieldset className="regra-email">
          <legend>O que fazer com {n === 1 ? 'a conta do aluno' : `as contas dos ${alunos}`}?</legend>
          <label className="opcao-radio">
            <input type="radio" name="excluir-alunos" checked={!apagar} onChange={() => setApagar(false)} />
            <span>Manter. {n === 1 ? 'Ele continua' : 'Eles continuam'} jogando, com carteira e histórico, mas sem turma.</span>
          </label>
          <label className="opcao-radio">
            <input type="radio" name="excluir-alunos" checked={apagar} onChange={() => setApagar(true)} />
            <span>Apagar também. Some tudo: carteira, ordens e histórico. Não tem volta.</span>
          </label>
        </fieldset>
      )}
      {apagar && (
        <label className="campo">
          <span>Para confirmar, digite o nome da turma</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={turma.nome} autoComplete="off" />
        </label>
      )}
      <div className="botoes-linha">
        <button className="botao" onClick={aoCancelar} disabled={enviando}>Cancelar</button>
        <button className="botao botao-perigo" onClick={confirmar} disabled={!liberado || enviando}>
          {enviando ? 'Excluindo…' : apagar ? `Excluir e apagar ${alunos}` : 'Excluir turma'}
        </button>
      </div>
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
