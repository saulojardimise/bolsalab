import Logo from './Logo.jsx';
import Sparkline from './Sparkline.jsx';
import { numero, pct, reais, tendencia } from '../lib/formato.js';

// Linhas de ações: logo, código e nome, minigráfico do último mês, preço e variação do dia.
// itens: [{ ticker, nome, logo_url, preco, variacao_pct, detalhe? }]
export default function ListaAtivos({ itens, linhas, aoEscolher }) {
  return (
    <ul className="ativos">
      {itens.map((e) => (
        <li key={e.ticker}>
          <button className="ativo" onClick={() => aoEscolher(e.ticker)} disabled={e.preco == null}>
            <Logo ticker={e.ticker} url={e.logo_url} />
            <span className="ativo-id">
              <strong>{e.ticker}</strong>
              <span>{e.situacao === 'suspensa' ? 'Negociação suspensa' : (e.detalhe ?? e.nome)}</span>
            </span>
            <Sparkline valores={linhas?.[e.ticker]} />
            <span className="ativo-preco">
              <strong className="num">{e.preco == null ? 'Sem cotação' : reais(e.preco)}</strong>
              {e.variacao_pct != null && (
                <span className={`num ${tendencia(e.variacao_pct)}`}>{pct(e.variacao_pct)}</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export const detalheQuantidade = (q) => `${numero(q)} ${q === 1 ? 'ação' : 'ações'}`;
