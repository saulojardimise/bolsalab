import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { usoDoStop } from '../lib/regras.js';
import { lado, pontos } from '../lib/futuros.js';
import { numero, pct, reais, reaisComSinal, tendencia } from '../lib/formato.js';
import Logo from '../componentes/Logo.jsx';
import Icone from '../componentes/Icone.jsx';
import Termo from '../componentes/Termo.jsx';

// Cores das fatias por setor (na ordem do maior para o menor)
const CORES_SETOR = ['var(--verde)', 'var(--azul)', 'var(--ambar)', 'var(--verde-claro-forte)', 'var(--azul-claro)', 'var(--suave)'];

// Patrimônio, distribuição por setor, posições e atalho para o extrato
export default function Carteira({ uid, dados, resumo, versao, aoEscolher, irPara, aoAbrirExtrato, aoAbrirFuturo }) {
  const { carteira, vendidas, config } = dados;
  const [corretagens, setCorretagens] = useState(null);

  useEffect(() => {
    let vivo = true;
    api.ordens(uid, 5000)
      .then((o) => vivo && setCorretagens(o.reduce((s, x) => s + Number(x.corretagem), 0)))
      .catch(() => {});
    return () => { vivo = false; };
  }, [uid, versao]);
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
        <p className="suave"><Termo id="patrimonio">Patrimônio virtual</Termo></p>
        <p className="valor-grande num">{reais(resumo.patrimonio)}</p>
        <p className={`variacao-periodo ${tendencia(resumo.rentabilidade)}`}>
          <strong className="num">{pct(resumo.rentabilidade)}</strong>
          <span className="suave">desde o início ({reais(config.saldo_inicial)})</span>
          <Termo id="rentabilidade" />
        </p>
        <dl className="resumo-linhas">
          <div><dt><Termo id="saldo">Saldo disponível</Termo></dt><dd className="num">{reais(resumo.saldo)}</dd></div>
          <div><dt>Ações compradas</dt><dd className="num">{reais(resumo.acoes)}</dd></div>
          {vendidas.length > 0 && (
            <div><dt><Termo id="venda_descoberto">Vendas a descoberto</Termo></dt><dd className={`num ${tendencia(resumo.vendido)}`}>{reaisComSinal(resumo.vendido)}</dd></div>
          )}
          {resumo.margemFuturos > 0 && (
            <div><dt><Termo id="margem_garantia">Margem em minicontratos</Termo></dt><dd className="num">{reais(resumo.margemFuturos)}</dd></div>
          )}
          {corretagens > 0 && (
            <div><dt><Termo id="corretagem">Corretagens pagas</Termo></dt><dd className="num">{reais(corretagens)}</dd></div>
          )}
        </dl>
        <button className="atalho" onClick={aoAbrirExtrato}>
          <Icone nome="extrato" />
          <span>
            <strong>Extrato</strong>
            <small>Todo o fluxo de caixa da sua conta</small>
          </span>
          <Icone nome="seta" tamanho={18} />
        </button>
      </section>

      {vazia && (
        <div className="cartao vazio">
          <p>Sua carteira está vazia. Escolha uma empresa no mercado para fazer sua primeira ordem.</p>
          <button className="botao botao-principal" onClick={() => irPara('mercado')}>Ver o mercado</button>
        </div>
      )}

      {porSetor.length > 0 && (
        <section className="cartao" aria-labelledby="titulo-setores">
          <h2 id="titulo-setores"><Termo id="setor">Por setor</Termo></h2>
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
          <h2 id="titulo-compradas" className="secao-titulo">Ações compradas <Termo id="preco_medio" /></h2>
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
          <h2 id="titulo-vendidas" className="secao-titulo"><Termo id="venda_descoberto">Vendas a descoberto</Termo></h2>
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
                      <strong className="num">{reais(v.custo_recompra)}</strong>
                      <span className={`num ${tendencia(v.resultado)}`}>
                        {reaisComSinal(v.resultado)} ({pct(Number(v.garantia) > 0 ? (v.resultado / v.garantia) * 100 : 0)})
                      </span>
                    </span>
                    <span className="stop">
                      <span>
                        Custos pagos: corretagem {reais(v.corretagem_paga)}, aluguel {reais(v.aluguel_pago)}.{' '}
                        {s.prejuizo > 0
                          ? <>Prejuízo com custos de {reais(s.prejuizo)}. Encerra sozinha em {reais(s.limite)}.</>
                          : <>Encerra sozinha se o prejuízo com custos chegar a {reais(s.limite)}.</>}
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
            Resultado = valor da venda − custo para recomprar hoje (sem custos, como nas ações compradas).
            {' '}O <Termo id="resultado_acumulado">prejuízo com custos</Termo> soma também aluguel e corretagem.
            {' '}<Termo id="garantia">Garantia bloqueada</Termo>: {reais(resumo.garantias)}.
            {' '}<Termo id="encerramento">Encerramento automático</Termo> com prejuízo de {Math.round(stop * 100)}% do saldo.
          </p>
        </section>
      )}

      {dados.futuros?.length > 0 && (
        <section aria-labelledby="titulo-futuros">
          <h2 id="titulo-futuros" className="secao-titulo"><Termo id="minicontrato">Minicontratos</Termo></h2>
          <ul className="cartao cartao-lista posicoes">
            {dados.futuros.map((f) => {
              const m = dados.futurosMercado?.find((x) => x.ativo === f.ativo);
              return (
                <li key={f.contrato}>
                  <button className="posicao" onClick={() => aoAbrirFuturo(f.ativo)}>
                    <span className={`selo-futuro selo-${f.ativo.toLowerCase()}`} aria-hidden="true">{f.ativo}</span>
                    <span className="posicao-id">
                      <strong>{f.contrato}</strong>
                      <span>{lado(f.quantidade).texto}, aberto a {pontos(f.preco_medio, f.ativo)} pt{m ? `, hoje ${pontos(m.preco, f.ativo)} pt` : ''}</span>
                    </span>
                    <span className="posicao-valor">
                      <strong className={`num ${tendencia(f.resultado)}`}>{reaisComSinal(f.resultado)}</strong>
                      <span className="suave">margem {reais(f.garantia)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="nota">
            O valor em destaque é a soma dos <Termo id="ajuste_diario">ajustes diários</Termo> desde a abertura: já entrou (ou saiu) do seu saldo.
            A <Termo id="margem_garantia">margem</Termo> volta ao saldo quando você zera a posição ou no vencimento.
          </p>
        </section>
      )}
    </div>
  );
}
