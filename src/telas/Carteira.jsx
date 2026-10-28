import { usoDoStop } from '../lib/regras.js';
import { numero, pct, reais, reaisComSinal, tendencia } from '../lib/formato.js';
import Logo from '../componentes/Logo.jsx';
import Extrato from './Extrato.jsx';

// Cores das fatias por setor (na ordem do maior para o menor)
const CORES_SETOR = ['var(--verde)', 'var(--azul)', 'var(--ambar)', 'var(--verde-claro-forte)', 'var(--azul-claro)', 'var(--suave)'];

// Patrimônio, distribuição por setor, posições e movimentações
export default function Carteira({ uid, dados, resumo, versao, aoEscolher, irPara }) {
  const { carteira, vendidas, config } = dados;
  const stop = Number(config.stop_prejuizo ?? 0.8);
  const vazia = carteira.length === 0 && vendidas.length === 0;

  const porSetor = Object.entries(carteira.reduce((s, p) => {
    s[p.setor ?? 'Outros'] = (s[p.setor ?? 'Outros'] ?? 0) + Number(p.valor_atual);
    return s;
  }, {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="pilha">
      <h1>Carteira</h1>

      <section className="cartao" aria-label="Resumo">
        <p className="suave">Patrimônio virtual</p>
        <p className="valor-grande num">{reais(resumo.patrimonio)}</p>
        <p className={`variacao-periodo ${tendencia(resumo.rentabilidade)}`}>
          <strong className="num">{pct(resumo.rentabilidade)}</strong>
          <span className="suave">desde o início ({reais(config.saldo_inicial)})</span>
        </p>
        <dl className="resumo-linhas">
          <div><dt>Saldo disponível</dt><dd className="num">{reais(resumo.saldo)}</dd></div>
          <div><dt>Ações compradas</dt><dd className="num">{reais(resumo.acoes)}</dd></div>
          {vendidas.length > 0 && (
            <div><dt>Vendas a descoberto</dt><dd className={`num ${tendencia(resumo.vendido)}`}>{reaisComSinal(resumo.vendido)}</dd></div>
          )}
        </dl>
      </section>

      {vazia && (
        <div className="cartao vazio">
          <p>Sua carteira está vazia. Escolha uma empresa no mercado para fazer sua primeira ordem.</p>
          <button className="botao botao-principal" onClick={() => irPara('mercado')}>Ver o mercado</button>
        </div>
      )}

      {porSetor.length > 0 && (
        <section className="cartao" aria-labelledby="titulo-setores">
          <h2 id="titulo-setores">Por setor</h2>
          <div className="barra-setores" aria-hidden="true">
            {porSetor.map(([s, v], i) => (
              <span key={s} style={{ flexGrow: v, background: CORES_SETOR[i % CORES_SETOR.length] }} />
            ))}
          </div>
          <ul className="legenda-setores">
            {porSetor.map(([s, v], i) => (
              <li key={s}>
                <span className="legenda-cor" style={{ background: CORES_SETOR[i % CORES_SETOR.length] }} />
                <span>{s}</span>
                <span className="num">{pct((v / resumo.acoes) * 100).replace('+', '')}</span>
              </li>
            ))}
          </ul>
          {porSetor.length === 1 && (
            <p className="nota">Todas as suas ações estão num setor só. Diversificar reduz o risco.</p>
          )}
        </section>
      )}

      {carteira.length > 0 && (
        <section aria-labelledby="titulo-compradas">
          <h2 id="titulo-compradas" className="secao-titulo">Ações compradas</h2>
          <ul className="cartao cartao-lista posicoes">
            {carteira.map((p) => (
              <li key={p.ticker}>
                <button className="posicao" onClick={() => aoEscolher(p.ticker, 'venda')}>
                  <Logo ticker={p.ticker} url={p.logo_url} />
                  <span className="posicao-id">
                    <strong>{p.ticker}</strong>
                    <span>{numero(p.quantidade)} ações, preço médio {reais(p.preco_medio)}</span>
                  </span>
                  <span className="posicao-valor">
                    <strong className="num">{reais(p.valor_atual)}</strong>
                    <span className={`num ${tendencia(p.resultado)}`}>{reaisComSinal(p.resultado)} ({pct(p.resultado_pct)})</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vendidas.length > 0 && (
        <section aria-labelledby="titulo-vendidas">
          <h2 id="titulo-vendidas" className="secao-titulo">Vendas a descoberto</h2>
          <ul className="cartao cartao-lista posicoes">
            {vendidas.map((v) => {
              const s = usoDoStop(v, resumo.saldo, stop);
              return (
                <li key={v.ticker}>
                  <button className="posicao posicao-vendida" onClick={() => aoEscolher(v.ticker, 'recompra')}>
                    <Logo ticker={v.ticker} url={v.logo_url} />
                    <span className="posicao-id">
                      <strong>{v.ticker}</strong>
                      <span>{numero(v.quantidade)} vendidas a {reais(v.preco_venda)}, hoje {reais(v.preco_atual)}</span>
                    </span>
                    <span className="posicao-valor">
                      <strong className={`num ${tendencia(v.resultado_acumulado)}`}>{reaisComSinal(v.resultado_acumulado)}</strong>
                      <span className="suave">aluguel pago {reais(v.aluguel_pago)}</span>
                    </span>
                    <span className="stop">
                      <span>
                        {s.prejuizo > 0
                          ? <>Prejuízo acumulado de {reais(s.prejuizo)}. Encerra sozinha em {reais(s.limite)}.</>
                          : <>Sem prejuízo acumulado. Encerra sozinha se o prejuízo chegar a {reais(s.limite)}.</>}
                      </span>
                      <span className={`stop-barra ${s.uso >= 0.75 ? 'stop-alerta' : ''}`} role="meter"
                            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, s.uso) * 100)}
                            aria-label="Quanto do limite de prejuízo já foi usado">
                        <span style={{ width: `${Math.min(100, s.uso * 100)}%` }} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="nota">
            Resultado acumulado = valor da venda − custo de recompra hoje − aluguel pago − corretagem.
            Garantia bloqueada: {reais(resumo.garantias)}.
          </p>
        </section>
      )}

      <Extrato uid={uid} versao={versao} />
    </div>
  );
}
