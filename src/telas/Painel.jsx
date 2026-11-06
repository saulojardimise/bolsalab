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
import Extrato from './Extrato.jsx';
import Questionario from './Questionario.jsx';
import Noticias from './Noticias.jsx';
import Futuro from './Futuro.jsx';
import AvisoNovidade, { AVISO_MINICONTRATOS, deveMostrarAviso, lembrarAvisoLocal } from '../componentes/AvisoNovidade.jsx';
import CompletarFoto, { fotoAdiada } from './CompletarFoto.jsx';

// Área logada: carrega os dados da conta e controla a navegação.
// Abrir uma ação ou a área do professor empilha no histórico do navegador,
// então o botão "voltar" do celular volta para a lista.
export default function Painel({ uid }) {
  // a aba fica guardada na sessão: se o app recarregar sozinho (versão nova
  // publicada), o aluno continua onde estava em vez de voltar ao início
  const [aba, setAbaEstado] = useState(() => {
    try { return sessionStorage.getItem('bolsalab:aba') || 'inicio'; } catch { return 'inicio'; }
  });
  const setAba = (id) => {
    setAbaEstado(id);
    try { sessionStorage.setItem('bolsalab:aba', id); } catch { /* sem armazenamento */ }
  };
  const [sobreposta, setSobreposta] = useState(null);   // { tipo: 'acao', ticker, operacao }
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [dados, setDados] = useState(null);
  const [linhas, setLinhas] = useState({});              // ticker -> fechamentos do último mês
  const [erro, setErro] = useState('');
  const [recado, setRecado] = useState('');
  const [versao, setVersao] = useState(0);
  const [fotoVista, setFotoVista] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);   // já mostrou o convite da foto nesta visita

  const carregar = useCallback(async () => {
    try {
      const [perfil, config, mercado, carteira, vendidas, liberada, futurosMercado, futuros] = await Promise.all([
        api.perfil(uid), api.config(), api.mercado(), api.carteira(uid), api.vendidas(uid),
        api.negociacaoLiberada(),
        // minicontratos: se o banco ainda não tiver o SQL 014, o app segue sem eles
        api.futurosMercado().catch(() => []), api.futurosPosicoes(uid).catch(() => []),
      ]);
      setDados({ perfil, config, mercado, carteira, vendidas, liberada, futurosMercado, futuros });
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
    saldo: dados.perfil.saldo, carteira: dados.carteira, vendidas: dados.vendidas, futuros: dados.futuros,
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

  // Sem perfil de investidor: o questionário vem antes de tudo
  // (undefined = banco ainda sem o SQL 010; aí o app segue sem exigir)
  if (dados.perfil.perfil_investidor === null) {
    return (
      <div className="painel">
        {api.modoDemo && <p className="faixa-demo">Demonstração com preços fictícios</p>}
        <Questionario obrigatorio aoConcluir={carregar} />
      </div>
    );
  }

  const mudarFoto = (foto_url) => setDados((d) => ({ ...d, perfil: { ...d.perfil, foto_url } }));

  // Depois do questionário: convite para pôr a foto (pode deixar para depois)
  if (!fotoVista && !dados.perfil.foto_url && !fotoAdiada(uid)) {
    return (
      <div className="painel">
        {api.modoDemo && <p className="faixa-demo">Demonstração com preços fictícios</p>}
        <CompletarFoto perfil={dados.perfil} aoMudarFoto={mudarFoto} aoConcluir={() => setFotoVista(true)} />
      </div>
    );
  }

  const abrir = (s) => {
    window.history.pushState({ sobreposta: s }, '');
    setSobreposta(s);
    window.scrollTo({ top: 0 });
  };
  const fechar = () => window.history.back();
  const abrirAcao = (ticker, operacao) => abrir({ tipo: 'acao', ticker, operacao });
  const abrirExtrato = () => abrir({ tipo: 'extrato' });
  const abrirFuturo = (ativo) => abrir({ tipo: 'futuro', ativo });
  const trocarAba = (id) => {
    if (sobreposta) window.history.back();
    setAba(id);
    window.scrollTo({ top: 0 });
  };

  // Aviso de novidade (uma vez por aluno; some depois de fechado)
  const mostrarAviso = !avisoFechado && !sobreposta && !perfilAberto && deveMostrarAviso(dados.perfil);
  const fecharAviso = () => {
    setAvisoFechado(true);
    lembrarAvisoLocal(uid);
    api.marcarAvisoVisto(AVISO_MINICONTRATOS).catch(() => {});
    setDados((d) => ({ ...d, perfil: { ...d.perfil, avisos_vistos: [...(d.perfil.avisos_vistos ?? []), AVISO_MINICONTRATOS] } }));
  };
  const conhecerMinicontratos = () => {
    fecharAviso();
    if (dados.futurosMercado?.some((f) => f.ativo === 'WIN' && f.preco != null)) abrirFuturo('WIN');
    else trocarAba('mercado');
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
  } else if (sobreposta?.tipo === 'futuro') {
    conteudo = <Futuro key={sobreposta.ativo} ativo={sobreposta.ativo} dados={dados} aoVoltar={fechar} aoExecutar={aoExecutar} />;
  } else if (sobreposta?.tipo === 'questionario') {
    conteudo = <Questionario perfilAtual={dados.perfil.perfil_investidor} aoVoltar={fechar}
                             aoConcluir={async () => { await carregar(); fechar(); setRecado('Perfil de investidor atualizado.'); }} />;
  } else if (sobreposta?.tipo === 'extrato') {
    conteudo = <Extrato uid={uid} dados={dados} resumo={resumo} versao={versao} aoVoltar={fechar} />;
  } else if (aba === 'inicio') {
    conteudo = <Inicio uid={uid} dados={dados} resumo={resumo} linhas={linhas} versao={versao}
                       aoEscolher={abrirAcao} irPara={trocarAba} aoAbrirExtrato={abrirExtrato} />;
  } else if (aba === 'mercado') {
    conteudo = <Mercado dados={dados} linhas={linhas} aoEscolher={abrirAcao} aoAbrirFuturo={abrirFuturo} />;
  } else if (aba === 'noticias') {
    conteudo = <Noticias dados={dados} aoEscolher={abrirAcao} />;
  } else if (aba === 'carteira') {
    conteudo = <Carteira uid={uid} dados={dados} resumo={resumo} versao={versao}
                         aoEscolher={abrirAcao} irPara={trocarAba} aoAbrirExtrato={abrirExtrato} aoAbrirFuturo={abrirFuturo} />;
  } else {
    conteudo = <Turma turmaId={dados.perfil.turma_id} turmaNome={dados.perfil.turma} versao={versao} />;
  }

  return (
    <div className="painel">
      {!sobreposta && <Topo foto={dados.perfil.foto_url} aoAbrirPerfil={() => setPerfilAberto(true)} />}
      {api.modoDemo && <p className="faixa-demo">Demonstração com preços fictícios</p>}
      {erro && <p className="aviso aviso-erro conteudo" role="alert">{erro}</p>}
      <main className="conteudo">{conteudo}</main>
      <Navegacao aba={sobreposta?.tipo === 'acao' || sobreposta?.tipo === 'futuro' ? 'mercado' : aba} aoTrocar={trocarAba} />

      {perfilAberto && (
        <MenuPerfil
          perfil={dados.perfil}
          resumo={resumo}
          avisar={setRecado}
          aoRefazerPerfil={() => { setPerfilAberto(false); abrir({ tipo: 'questionario' }); }}
          aoFechar={() => setPerfilAberto(false)}
          aoSair={() => api.sair()}
          aoMudarFoto={mudarFoto}
        />
      )}
      {mostrarAviso && (
        <AvisoNovidade futuros={dados.futurosMercado} aoFechar={fecharAviso} aoConhecer={conhecerMinicontratos} />
      )}
      {recado && <p className="recado" role="status">{recado}</p>}
    </div>
  );
}
