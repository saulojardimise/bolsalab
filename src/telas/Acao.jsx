import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { noPeriodo } from '../lib/periodos.js';
import { diaMes, diaSemanaMes, numero, pct, reais, reaisComSinal, tendencia, volume } from '../lib/formato.js';
import Grafico from '../componentes/Grafico.jsx';
import Periodos from '../componentes/Periodos.jsx';
import Icone from '../componentes/Icone.jsx';
import Logo from '../componentes/Logo.jsx';
import Boleta from './Boleta.jsx';

// Página de uma ação: preço, gráfico, informações do dia, últimos fechamentos e boleta.
export default function Acao({ ticker, operacaoInicial, dados, aoVoltar, aoExecutar }) {
  const empresa = dados.mercado.find((e) => e.ticker === ticker);
  const comprada = dados.carteira.find((p) => p.ticker === ticker);
  const vendida = dados.vendidas.find((v) => v.ticker === ticker);

  const [historico, setHistorico] = useState(null);
  const [periodo, setPeriodo] = useState('1M');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    api.historico(ticker).then((h) => vivo && setHistorico(h)).catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [ticker, dados.mercado]);

  const pontos = useMemo(() => historico &&
    noPeriodo(historico.map((h) => ({ data: h.data, valor: Number(h.preco) })), periodo), [historico, periodo]);

  // últimos 10 fechamentos, do mais recente para o mais antigo, com a variação de cada dia
  const fechamentos = useMemo(() => {
    if (!historico) return [];
    return historico.slice(-11).map((h, i, arr) => ({
      ...h,
      variacao: i ? (Number(h.preco) / Number(arr[i - 1].preco) - 1) * 100 : null,
    })).slice(historico.length > 10 ? 1 : 0).reverse();
  }, [historico]);

  if (!empresa) return null;
  const mudanca = empresa.preco_anterior ? Number(empresa.preco) - Number(empresa.preco_anterior) : null;

  return (
    <div className="pilha">
      <header className="barra-acao">
        <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        <h1>{ticker}</h1>
        <span style={{ width: 40 }} />
      </header>

      <section className="cartao">
        <div className="acao-cabeca">
          <Logo ticker={ticker} url={empresa.logo_url} tamanho={56} />
          <div>
            <h2 className="acao-ticker">{ticker}</h2>
            <p className="suave">{empresa.nome}</p>
          </div>
          {empresa.situacao === 'suspensa'
            ? <span className="etiqueta-info etiqueta-alerta">Negociação suspensa</span>
            : <span className="etiqueta-info">Fechamento de {diaMes(empresa.data)}</span>}
        </div>

        <p className="valor-grande num">{reais(empresa.preco)}</p>
        {mudanca !== null && (
          <p className={`variacao-periodo ${tendencia(mudanca)}`}>
            <strong className="num">
              {mudanca >= 0 ? '+' : '−'}{Math.abs(mudanca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({pct(empresa.variacao_pct).replace(/^[+−]/, '')})
            </strong>
            <span className="suave">no último pregão</span>
          </p>
        )}

        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
        {pontos ? <Grafico pontos={pontos} altura={200} rotulo={`Fechamentos de ${ticker}`} />
                : <div className="grafico" style={{ height: 200 }} aria-busy="true" />}
        <Periodos valor={periodo} aoTrocar={setPeriodo} />

        <dl className="estatisticas">
          <div><dt>Abertura</dt><dd className="num">{empresa.abertura ? reais(empresa.abertura) : '–'}</dd></div>
          <div><dt>Máxima</dt><dd className="num">{empresa.maxima ? reais(empresa.maxima) : '–'}</dd></div>
          <div><dt>Mínima</dt><dd className="num">{empresa.minima ? reais(empresa.minima) : '–'}</dd></div>
          <div><dt>Fechamento</dt><dd className="num">{reais(empresa.preco)}</dd></div>
          <div><dt>Variação</dt><dd className={`num ${tendencia(empresa.variacao_pct)}`}>{empresa.variacao_pct != null ? pct(empresa.variacao_pct) : '–'}</dd></div>
          <div><dt>Volume</dt><dd className="num">{empresa.volume ? volume(empresa.volume) : '–'}</dd></div>
        </dl>
      </section>

      {(comprada || vendida) && (
        <section className="cartao posicao-resumo" aria-label="Sua posição">
          {comprada && (
            <p>
              Você tem <strong>{numero(comprada.quantidade)}</strong> ações, preço médio {reais(comprada.preco_medio)}.{' '}
              <span className={tendencia(comprada.resultado)}>{reaisComSinal(comprada.resultado)} ({pct(comprada.resultado_pct)})</span>
            </p>
          )}
          {vendida && (
            <p>
              Você está vendido em <strong>{numero(vendida.quantidade)}</strong> ações a {reais(vendida.preco_venda)}.{' '}
              <span className={tendencia(vendida.resultado_acumulado)}>Resultado acumulado {reaisComSinal(vendida.resultado_acumulado)}</span>
            </p>
          )}
        </section>
      )}

      <Boleta ticker={ticker} empresa={empresa} comprada={comprada} vendida={vendida}
              operacaoInicial={operacaoInicial} dados={dados} aoExecutar={aoExecutar} />

      {fechamentos.length > 0 && (
        <section className="cartao" aria-labelledby="titulo-fechamentos">
          <h2 id="titulo-fechamentos">Últimos fechamentos</h2>
          <table className="tabela-fechamentos">
            <thead>
              <tr><th scope="col">Dia</th><th scope="col">Fechamento</th><th scope="col">Variação</th></tr>
            </thead>
            <tbody>
              {fechamentos.map((f) => (
                <tr key={f.data}>
                  <td>{diaSemanaMes(f.data)}</td>
                  <td className="num">{reais(f.preco)}</td>
                  <td className={`num ${tendencia(f.variacao)}`}>{f.variacao == null ? '–' : pct(f.variacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
