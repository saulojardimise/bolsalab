import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { filtrar, montarCapa, quando } from '../lib/noticias.js';
import { pct, tendencia } from '../lib/formato.js';
import Icone from '../componentes/Icone.jsx';
import Logo from '../componentes/Logo.jsx';
import Termo from '../componentes/Termo.jsx';

const FILTROS = [
  ['', 'Capa'],
  ['minhas', 'Minhas ações'],
  ['mercado', 'Mercado'],
  ['fatos', 'Fatos relevantes'],
];

// Página de notícias: capa com as principais chamadas e filtros por
// empresa, setor, minhas ações, mercado e fatos relevantes.
export default function Noticias({ dados, aoEscolher }) {
  const [noticias, setNoticias] = useState(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [setor, setSetor] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    let vivo = true;
    api.noticias().then((n) => vivo && setNoticias(n)).catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, []);

  const empresas = dados.mercado;
  const porTicker = useMemo(() => Object.fromEntries(empresas.map((e) => [e.ticker, e])), [empresas]);
  const setores = useMemo(() => [...new Set(empresas.map((e) => e.setor))].sort(), [empresas]);
  const minhas = [...dados.carteira.map((p) => p.ticker), ...dados.vendidas.map((v) => v.ticker)];

  const filtrando = filtro || setor || busca.trim();
  const lista = useMemo(() => noticias && filtrar(noticias, { filtro, setor, busca, minhas, empresas }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noticias, filtro, setor, busca, empresas, minhas.join()]);
  const capa = useMemo(() => noticias && !filtrando && montarCapa(noticias, empresas), [noticias, filtrando, empresas]);
  const atualizado = noticias?.length ? noticias.reduce((m, n) => (n.coletada_em > m ? n.coletada_em : m), '') : null;

  const item = (n, grande = false) => (
    <Noticia key={n.id} n={n} porTicker={porTicker} aoEscolher={aoEscolher} grande={grande} />
  );

  return (
    <div className="pilha pilha-larga">
      <div className="secao-topo">
        <h1>Notícias</h1>
        {atualizado && <p className="suave">Atualizado {quando(atualizado)}</p>}
      </div>

      <div className="filtros">
        <div className="chips" role="group" aria-label="Mostrar">
          {FILTROS.map(([id, rotulo]) => (
            <button key={id} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{rotulo}</button>
          ))}
        </div>
        <div className="filtros-linha">
          <label className="seletor">
            <span className="sr-only">Setor</span>
            <select value={setor} onChange={(e) => setSetor(e.target.value)}>
              <option value="">Setores</option>
              {setores.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="busca">
            <Icone nome="busca" tamanho={20} />
            <input type="search" placeholder="Empresa ou código" aria-label="Buscar empresa ou código"
                   value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
        </div>
      </div>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!noticias && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}
      {noticias?.length === 0 && (
        <p className="cartao vazio">As notícias chegam todo dia às 19h, depois do fechamento da bolsa. Volte mais tarde.</p>
      )}

      {capa && noticias.length > 0 && (
        <>
          {capa.manchete && (
            <section aria-label="Manchete" className="cartao manchete">
              <p className="noticia-chapeu">Manchete</p>
              {item(capa.manchete, true)}
            </section>
          )}
          {capa.chamadas.length > 0 && (
            <section aria-labelledby="titulo-chamadas">
              <h2 id="titulo-chamadas" className="secao-titulo">Principais chamadas</h2>
              <div className="cartao cartao-lista noticias">{capa.chamadas.map((n) => item(n))}</div>
            </section>
          )}
          {capa.mercado.length > 0 && (
            <section aria-labelledby="titulo-mercado-noticias">
              <h2 id="titulo-mercado-noticias" className="secao-titulo">Mercado</h2>
              <div className="cartao cartao-lista noticias">{capa.mercado.map((n) => item(n))}</div>
            </section>
          )}
          {capa.fatos.length > 0 && (
            <section aria-labelledby="titulo-fatos">
              <h2 id="titulo-fatos" className="secao-titulo"><Termo id="fato_relevante">Fatos relevantes</Termo></h2>
              <div className="cartao cartao-lista noticias">{capa.fatos.map((n) => item(n))}</div>
            </section>
          )}
          {capa.resto.length > 0 && (
            <section aria-labelledby="titulo-mais">
              <h2 id="titulo-mais" className="secao-titulo">Mais notícias</h2>
              <div className="cartao cartao-lista noticias">{capa.resto.slice(0, 30).map((n) => item(n))}</div>
            </section>
          )}
        </>
      )}

      {filtrando && lista && (
        lista.length === 0
          ? <p className="cartao vazio">Nenhuma notícia com esses filtros nos últimos dias.</p>
          : <div className="cartao cartao-lista noticias">{lista.slice(0, 60).map((n) => item(n))}</div>
      )}

      {noticias?.length > 0 && (
        <p className="nota">
          Manchetes do Google Notícias e fatos relevantes da CVM, atualizadas todo dia às 19h.
          Toque na manchete para ler no site de origem, ou no código da ação para ver o preço e negociar.
        </p>
      )}
    </div>
  );
}

function Noticia({ n, porTicker, aoEscolher, grande }) {
  const empresas = n.tickers.map((t) => porTicker[t]).filter(Boolean).slice(0, 3);
  return (
    <article className={`noticia ${grande ? 'noticia-grande' : ''}`}>
      {grande && empresas[0] && <Logo ticker={empresas[0].ticker} url={empresas[0].logo_url} tamanho={48} />}
      <div className="noticia-corpo">
        <a className="noticia-titulo" href={n.link} target="_blank" rel="noopener noreferrer">
          <h3>{n.titulo}</h3>
        </a>
        <p className="noticia-meta">
          {n.tipo === 'fato_relevante' && <span className="chip-oficial">Oficial</span>}
          <span>{n.fonte}</span>
          <span aria-hidden="true">·</span>
          <span>{quando(n.publicada_em)}</span>
        </p>
        {empresas.length > 0 && (
          <div className="noticia-empresas">
            {empresas.map((e) => (
              <button key={e.ticker} className="chip-acao" onClick={() => aoEscolher(e.ticker)}
                      aria-label={`Ver ${e.ticker}`}>
                {!grande && <Logo ticker={e.ticker} url={e.logo_url} tamanho={20} />}
                <strong>{e.ticker}</strong>
                {e.variacao_pct != null && <span className={`num ${tendencia(e.variacao_pct)}`}>{pct(e.variacao_pct)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
