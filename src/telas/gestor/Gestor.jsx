import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import Marca from '../../componentes/Marca.jsx';
import Icone from '../../componentes/Icone.jsx';
import Turmas from './Turmas.jsx';
import TurmaDetalhe from './TurmaDetalhe.jsx';
import Alertas from './Alertas.jsx';
import Eventos from './Eventos.jsx';
import Sistema from './Sistema.jsx';

const ABAS = [
  ['turmas', 'Turmas', 'turma'],
  ['alertas', 'Alertas', 'alerta'],
  ['eventos', 'Eventos', 'eventos'],
  ['sistema', 'Sistema', 'sistema'],
];

// Área do gestor: turmas e tokens, alertas das ações, eventos e sistema.
export default function Gestor({ email }) {
  const [aba, setAba] = useState('turmas');
  const [turmaAberta, setTurmaAberta] = useState(null);   // id
  const [preenchido, setPreenchido] = useState(null);     // evento sugerido por um alerta
  const [nAlertas, setNAlertas] = useState(0);
  const [recado, setRecado] = useState('');

  const contarAlertas = useCallback(() => {
    api.alertas().then((a) => setNAlertas(a.length)).catch(() => {});
  }, []);
  useEffect(contarAlertas, [contarAlertas]);

  // botão voltar do aparelho fecha a turma aberta
  useEffect(() => {
    const aoVoltar = (e) => setTurmaAberta(e.state?.turma ?? null);
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  useEffect(() => {
    if (!recado) return;
    const t = setTimeout(() => setRecado(''), 4500);
    return () => clearTimeout(t);
  }, [recado]);

  const abrirTurma = (id) => {
    window.history.pushState({ turma: id }, '');
    setTurmaAberta(id);
    window.scrollTo({ top: 0 });
  };
  const trocarAba = (id) => {
    if (turmaAberta) window.history.back();
    setAba(id);
    if (id !== 'eventos') setPreenchido(null);
    window.scrollTo({ top: 0 });
  };
  const resolverComEvento = (sugestao) => {
    setPreenchido(sugestao);
    setAba('eventos');
    window.scrollTo({ top: 0 });
  };
  const avisar = (texto) => { setRecado(texto); contarAlertas(); };

  let conteudo;
  if (turmaAberta) conteudo = <TurmaDetalhe id={turmaAberta} aoVoltar={() => window.history.back()} avisar={avisar} />;
  else if (aba === 'turmas') conteudo = <Turmas aoAbrir={abrirTurma} avisar={avisar} />;
  else if (aba === 'alertas') conteudo = <Alertas aoAgir={resolverComEvento} avisar={avisar} />;
  else if (aba === 'eventos') conteudo = <Eventos key={JSON.stringify(preenchido)} inicial={preenchido} avisar={avisar} />;
  else conteudo = <Sistema email={email} avisar={avisar} />;

  return (
    <div className="painel gestor">
      {!turmaAberta && (
        <header className="topo">
          <Marca />
          <span className="chip-simulacao chip-gestor">GESTOR</span>
          <button className="avatar" onClick={() => trocarAba('sistema')} aria-label="Conta e sistema">
            <Icone nome="usuario" tamanho={22} />
          </button>
        </header>
      )}
      {api.modoDemo && <p className="faixa-demo">Demonstração com dados fictícios</p>}
      <main className="conteudo">{conteudo}</main>

      <nav className="navegacao" aria-label="Seções do gestor">
        {ABAS.map(([id, rotulo, icone]) => (
          <button key={id} className="nav-item" aria-current={!turmaAberta && aba === id ? 'page' : undefined}
                  onClick={() => trocarAba(id)}>
            <span className="nav-icone">
              <Icone nome={icone} tamanho={24} />
              {id === 'alertas' && nAlertas > 0 && <span className="contador" aria-label={`${nAlertas} alertas`}>{nAlertas}</span>}
            </span>
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
      {recado && <p className="recado" role="status">{recado}</p>}
    </div>
  );
}
