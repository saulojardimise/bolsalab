import { useMemo, useState } from 'react';
import { diaMes, pct, tendencia } from '../lib/formato.js';
import { lado, pontos } from '../lib/futuros.js';
import { futuroAgora, horaBR, horarioDoDia, mercadoAgora } from '../lib/intradia.js';
import Icone from '../componentes/Icone.jsx';
import ListaAtivos, { detalheQuantidade } from '../componentes/ListaAtivos.jsx';
import Termo from '../componentes/Termo.jsx';

// As ações do Ibovespa com o último fechamento
export default function Mercado({ dados, linhas, aoEscolher, aoAbrirFuturo }) {
  const { mercado, carteira } = dados;
  const [busca, setBusca] = useState('');
  const [setor, setSetor] = useState('');

  const setores = useMemo(() => [...new Set(mercado.map((e) => e.setor))].sort(), [mercado]);
  const tenho = Object.fromEntries(carteira.map((p) => [p.ticker, p.quantidade]));

  const termo = busca.trim().toLowerCase();
  const comHoje = mercadoAgora(mercado, dados.intradia);
  const horaHoje = horarioDoDia(mercado, dados.intradia);
  const lista = comHoje
    .filter((e) => (!setor || e.setor === setor) &&
      (!termo || e.ticker.toLowerCase().includes(termo) || e.nome.toLowerCase().includes(termo)))
    .map((e) => ({ ...e, detalhe: tenho[e.ticker] ? `${e.nome}, você tem ${detalheQuantidade(tenho[e.ticker])}` : e.nome }));

  const dataRef = mercado.map((e) => e.data).filter(Boolean).sort().at(-1);

  return (
    <div className="pilha">
      <div className="secao-topo">
        <h1>Mercado</h1>
        {horaHoje
          ? <p className="suave"><span className="ponto-vivo" aria-hidden="true" /> Cotação das {horaBR(horaHoje)} <Termo id="cotacao_do_dia" /></p>
          : dataRef && <p className="suave"><Termo id="fechamento">Fechamento</Termo> de {diaMes(dataRef)}</p>}
      </div>
      {horaHoje && (
        <p className="nota nota-hoje">Preços do pregão de hoje, com cerca de 30 min de atraso, só para acompanhar. As ordens usam o fechamento de {diaMes(dataRef)}.</p>
      )}

      {dados.futurosMercado?.some((f) => f.preco != null) && (
        <section aria-labelledby="titulo-mini">
          <h2 id="titulo-mini" className="secao-titulo"><Termo id="minicontrato">Minicontratos</Termo></h2>
          <div className="cartao cartao-lista"><ul className="ativos">
            {dados.futurosMercado.filter((f) => f.preco != null).map((f0) => {
              const ag = futuroAgora(dados.intradia, f0);
              const f = ag ? { ...f0, preco: ag.preco, variacao_pct: ag.variacao_pct } : f0;
              const pos = dados.futuros?.find((x) => x.ativo === f.ativo);
              return (
                <li key={f.ativo}>
                  <button className="ativo" onClick={() => aoAbrirFuturo(f.ativo)}>
                    <span className={`selo-futuro selo-${f.ativo.toLowerCase()}`} aria-hidden="true">{f.ativo}</span>
                    <span className="ativo-id ativo-id-futuro">
                      <strong>{f.contrato}</strong>
                      <span>{f.nome}</span>
                      <span>{pos ? lado(pos.quantidade).texto : `vence ${diaMes(f.vencimento)}`}</span>
                    </span>
                    <span className="ativo-preco">
                      <strong className="num">{pontos(f.preco, f.ativo)} pt</strong>
                      {f.variacao_pct != null && <span className={`num ${tendencia(f.variacao_pct)}`}>{pct(f.variacao_pct)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul></div>
        </section>
      )}

      <h2 className="secao-titulo">Ações do Ibovespa</h2>
      <div className="filtros">
        <label className="busca">
          <Icone nome="busca" tamanho={20} />
          <input type="search" placeholder="Buscar empresa ou código" aria-label="Buscar empresa ou código"
                 value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por setor">
          <button aria-pressed={!setor} onClick={() => setSetor('')}>Todos</button>
          {setores.map((s) => (
            <button key={s} aria-pressed={setor === s} onClick={() => setSetor(setor === s ? '' : s)}>{s}</button>
          ))}
        </div>
      </div>

      {lista.length === 0
        ? <p className="vazio">Nenhuma empresa encontrada para “{busca}”.</p>
        : <div className="cartao cartao-lista"><ListaAtivos itens={lista} linhas={linhas} aoEscolher={aoEscolher} /></div>}
    </div>
  );
}
