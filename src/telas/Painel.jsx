import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { resumoCarteira } from '../lib/regras.js';
import { diasAtras } from '../lib/formato.js';
import Topo from '../componentes/Topo.jsx';
import Navegacao from '../componentes/Navegacao.jsx';
import MenuPerfil from '../componentes/MenuPerfil.jsx';
import Inicio from './Inicio.jsx';
import Mercado from './Mercado.jsx';
import Acao from './Acao.jsx';
import Carteira from './Carteira.jsx';
import Turma from './Turma.jsx';

// Área logada: carrega os dados da conta e controla a navegação.
// Abrir uma ação ou a área do professor empilha no histórico do navegador,
// então o botão "voltar" do celular volta para a lista.
export default function Painel({ uid }) {
  const [aba, setAba] = useState('inicio');
  const [sobreposta, setSobreposta] = useState(null);   // { tipo: 'acao', ticker, operacao }
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [linhas, setLinhas] = useState({});              // ticker -> fechamentos do último mês
  const [erro, setErro] = useState('');
  const [recado, setRecado] = useState('');
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(async () => {
    try {
      const [perfil, config, mercado, carteira, vendidas, liberada] = await Promise.all([
        api.perfil(uid), api.config(), api.mercado(), api.carteira(uid), api.vendidas(uid),
        api.negociacaoLiberada(),
      ]);
      setDados({ perfil, config, mercado, carteira, vendidas, liberada });
      setErro('');
      return mercado;
    } catch (e) {
      setErro(e.message);
      return null;
    }
  }, [uid]);

  // minigráficos: um mês de fechamentos de todas as ações, numa consulta só (função linhas_mercado)
  const carregarLinhas = useCallback(async () => {
    try {
      setLinhas(await api.linhasMercado(diasAtras(31)));
    } catch { /* minigráfico é opcional */ }
  }, []);

  useEffect(() => {
    carregar().then((m) => m && carregarLinhas());
    const aoVoltar = () => document.visibilityState === 'visible' && carregar();
    document.addEventListener('visibilitychange', aoVoltar);
    const relogio = setInterval(carregar, 5 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', aoVoltar); clearInterval(relogio); };
  }, [carregar, carregarLinhas]);

  // botão voltar do aparelho
  useEffect(() => {
    const aoVoltarHistorico = (e) => setSobreposta(e.state?.sobreposta ?? null);
    window.addEventListener('popstate', aoVoltarHistorico);
    return () => window.removeEventListener('popstate', aoVoltarHistorico);
  }, []);

  useEffect(() => {
    if (!recado) return;
    const t = setTimeout(() => setRecado(''), 4500);
    return () => clearTimeout(t);
  }, [recado]);

  const resumo = useMemo(() => dados && resumoCarteira({
    saldo: dados.perfil.saldo, carteira: dados.carteira, vendidas: dados.vendidas,
    saldoInicial: Number(dados.config.saldo_inicial),
  }), [dados]);

  if (!dados) {
    return (
      <main className="carregando-tela" aria-busy={!erro}>
        {erro && (
          <div className="erro-geral" role="alert">
            <p>{erro}</p>
            <button className="botao" onClick={carregar}>Tentar de novo</button>
          </div>
        )}
      </main>
    );
  }

  const abrir = (s) => {
    window.history.pushState({ sobreposta: s }, '');
    setSobreposta(s);
    window.scrollTo({ top: 0 });
  };
  const fechar = () => window.history.back();
  const abrirAcao = (ticker, operacao) => abrir({ tipo: 'acao', ticker, operacao });
  const trocarAba = (id) => {
    if (sobreposta) window.history.back();
    setAba(id);
    window.scrollTo({ top: 0 });
  };

  const aoExecutar = async (mensagem) => {
    setRecado(mensagem);
    await carregar();
    setVersao((v) => v + 1);
  };

  let conteudo;
  if (sobreposta?.tipo === 'acao') {
    conteudo = (
      <Acao key={sobreposta.ticker} ticker={sobreposta.ticker} operacaoInicial={sobreposta.operacao}
            dados={dados} aoVoltar={fechar} aoExecutar={aoExecutar} />
    );
  } else if (aba === 'inicio') {
    conteudo = <Inicio uid={uid} dados={dados} resumo={resumo} linhas={linhas} versao={versao}
                       aoEscolher={abrirAcao} irPara={trocarAba} />;
  } else if (aba === 'mercado') {
    conteudo = <Mercado dados={dados} linhas={linhas} aoEscolher={abrirAcao} />;
  } else if (aba === 'carteira') {
    conteudo = <Carteira uid={uid} dados={dados} resumo={resumo} versao={versao}
                         aoEscolher={abrirAcao} irPara={trocarAba} />;
  } else {
    conteudo = <Turma turmaId={dados.perfil.turma_id} turmaNome={dados.perfil.turma} versao={versao} />;
  }

  return (
    <div className="painel">
      {!sobreposta && <Topo foto={dados.perfil.foto_url} aoAbrirPerfil={() => setPerfilAberto(true)} />}
      {api.modoDemo && <p className="faixa-demo">Demonstração com preços fictícios</p>}
      {erro && <p className="aviso aviso-erro conteudo" role="alert">{erro}</p>}
      <main className="conteudo">{conteudo}</main>
      <Navegacao aba={sobreposta?.tipo === 'acao' ? 'mercado' : aba} aoTrocar={trocarAba} />

      {perfilAberto && (
        <MenuPerfil
          perfil={dados.perfil}
          aoFechar={() => setPerfilAberto(false)}
          aoSair={() => api.sair()}
          aoMudarFoto={(foto_url) => setDados((d) => ({ ...d, perfil: { ...d.perfil, foto_url } }))}
        />
      )}
      {recado && <p className="recado" role="status">{recado}</p>}
    </div>
  );
}
