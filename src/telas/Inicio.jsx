import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { DICAS, dicaDoDia } from '../lib/dicas.js';
import { noPeriodo, variacaoSerie } from '../lib/periodos.js';
import { pct, reais, tendencia } from '../lib/formato.js';
import Grafico from '../componentes/Grafico.jsx';
import Periodos from '../componentes/Periodos.jsx';
import Icone from '../componentes/Icone.jsx';
import StatusPregao from '../componentes/StatusPregao.jsx';
import ListaAtivos, { detalheQuantidade } from '../componentes/ListaAtivos.jsx';
import Termo from '../componentes/Termo.jsx';

// Tela inicial: patrimônio com gráfico, saldo, dica do dia e os ativos do aluno
export default function Inicio({ uid, dados, resumo, linhas, versao, aoEscolher, irPara, aoAbrirExtrato }) {
  const [serie, setSerie] = useState(null);
  const [periodo, setPeriodo] = useState('1M');
  const [dica, setDica] = useState(dicaDoDia);

  useEffect(() => {
    let vivo = true;
    api.patrimonioDiario(uid).then((s) => vivo && setSerie(s)).catch(() => vivo && setSerie([]));
    return () => { vivo = false; };
  }, [uid, versao]);

  // o último ponto é sempre o patrimônio de agora
  const pontos = useMemo(() => {
    if (!serie) return null;
    const base = serie.map((p) => ({ data: p.data, valor: Number(p.patrimonio) }));
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const semHoje = base.filter((p) => p.data !== hoje);
    return noPeriodo([...semHoje, { data: hoje, valor: resumo.patrimonio }], periodo);
  }, [serie, periodo, resumo.patrimonio]);

  const variacao = pontos ? variacaoSerie(pontos) : 0;
  const nome = dados.perfil.nome.split(' ')[0] || 'aluno';
  const meus = dados.carteira.map((p) => {
    const m = dados.mercado.find((e) => e.ticker === p.ticker);
    return { ...m, detalhe: detalheQuantidade(p.quantidade) };
  });
  const d = DICAS[dica];

  return (
    <div className="pilha">
      <section className="saudacao">
        <h1>Olá, {nome}!</h1>
        <StatusPregao liberada={dados.liberada} pausada={dados.config.negociacao_pausada} demo={api.modoDemo} />
      </section>

      <section className="cartao" aria-labelledby="titulo-patrimonio">
        <h2 id="titulo-patrimonio"><Termo id="patrimonio">Patrimônio virtual</Termo></h2>
        <p className="valor-grande num">{reais(resumo.patrimonio)}</p>
        <p className={`variacao-periodo ${tendencia(variacao)}`}>
          <Icone nome={variacao >= 0 ? 'subida' : 'descida'} tamanho={18} />
          <strong className="num">{pct(variacao)}</strong> <span className="suave">no período</span>
        </p>
        {pontos ? <Grafico pontos={pontos} altura={150} eixos={false} rotulo="Patrimônio" /> : <div className="grafico" style={{ height: 150 }} />}
        <Periodos valor={periodo} aoTrocar={setPeriodo} />
        <div className="linha-saldo">
          <Icone nome="saldo" />
          <span><Termo id="saldo">Saldo disponível</Termo></span>
          <strong className="num">{reais(resumo.saldo)}</strong>
        </div>
        <button className="atalho" onClick={aoAbrirExtrato}>
          <Icone nome="extrato" />
          <span>
            <strong>Extrato</strong>
            <small>Compras, vendas, corretagens e aluguel</small>
          </span>
          <Icone nome="seta" tamanho={18} />
        </button>
      </section>

      <section className="cartao dica" aria-labelledby="titulo-dica" aria-live="polite">
        <span className="dica-icone"><Icone nome="lampada" tamanho={26} /></span>
        <div className="dica-texto">
          <p className="dica-rotulo">
            <span>Dica de hoje</span>
            <span className="suave">{dica + 1} de {DICAS.length}</span>
          </p>
          <h2 id="titulo-dica">{d.titulo}</h2>
          <p className="suave">{d.texto}</p>
        </div>
        <button className="botao-icone" onClick={() => setDica((dica + 1) % DICAS.length)} aria-label="Próxima dica">
          <Icone nome="seta" />
        </button>
      </section>

      <section aria-labelledby="titulo-meus">
        <div className="secao-topo">
          <h2 id="titulo-meus">Meus ativos</h2>
          <button className="link-acao" onClick={() => irPara('carteira')}>Ver todos <Icone nome="seta" tamanho={16} /></button>
        </div>
        {meus.length ? (
          <div className="cartao cartao-lista"><ListaAtivos itens={meus} linhas={linhas} aoEscolher={aoEscolher} /></div>
        ) : (
          <div className="cartao vazio">
            <p>Você ainda não tem ações. Escolha uma empresa no mercado para fazer sua primeira compra.</p>
            <button className="botao botao-principal" onClick={() => irPara('mercado')}>Ver o mercado</button>
          </div>
        )}
      </section>
    </div>
  );
}
