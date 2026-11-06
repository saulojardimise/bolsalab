import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { noPeriodo } from '../lib/periodos.js';
import { diaMes, diasAtras, pct, reais, reaisComSinal, tendencia } from '../lib/formato.js';
import { ATIVOS, lado, pontos, previaFuturo, serieFuturo } from '../lib/futuros.js';
import Grafico from '../componentes/Grafico.jsx';
import Periodos from '../componentes/Periodos.jsx';
import Icone from '../componentes/Icone.jsx';
import Termo from '../componentes/Termo.jsx';

const dataBR = (iso) => iso && new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');

// Página de um minicontrato (WIN ou WDO): preço em pontos, gráfico,
// especificações do contrato, posição do aluno e boleta.
export default function Futuro({ ativo, dados, aoVoltar, aoExecutar }) {
  const contrato = dados.futurosMercado.find((f) => f.ativo === ativo);
  const posicao = dados.futuros.find((f) => f.ativo === ativo && f.contrato === contrato?.contrato)
    ?? dados.futuros.find((f) => f.ativo === ativo);
  const info = ATIVOS[ativo];

  const [indices, setIndices] = useState(null);
  const [periodo, setPeriodo] = useState('1M');
  const [operacao, setOperacao] = useState('compra');
  const [qtd, setQtd] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    api.indices(diasAtras(400)).then((i) => vivo && setIndices(i)).catch(() => vivo && setIndices([]));
    return () => { vivo = false; };
  }, [dados.futurosMercado]);

  const pontosGrafico = useMemo(() => indices && noPeriodo(serieFuturo(indices, ativo), periodo), [indices, ativo, periodo]);

  if (!contrato || contrato.preco == null) {
    return (
      <div className="pilha">
        <header className="barra-acao">
          <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
          <h1>{ativo}</h1><span style={{ width: 40 }} />
        </header>
        <p className="cartao vazio">Ainda não há preço para o {info.nome}. Ele chega com a coleta das 18h35.</p>
      </div>
    );
  }

  const p = previaFuturo({ operacao, quantidade: qtd, contrato, posicao, saldo: dados.perfil.saldo });
  const fechada = !dados.liberada || dados.config.negociacao_pausada;
  const podeEnviar = !fechada && !p.erro && !enviando;
  const pos = posicao ? lado(posicao.quantidade) : null;

  async function confirmar(e) {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true); setErro('');
    try {
      await api.executarFuturo(ativo, operacao, p.quantidade);
      setQtd('');
      await aoExecutar(`${operacao === 'compra' ? 'Compra' : 'Venda'} de ${p.quantidade} ${contrato.contrato} executada.`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function zerar() {
    setOperacao(posicao.quantidade > 0 ? 'venda' : 'compra');
    setQtd(String(Math.abs(posicao.quantidade)));
    document.getElementById('boleta-futuro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="pilha">
      <header className="barra-acao">
        <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        <h1>{contrato.contrato}</h1>
        <span style={{ width: 40 }} />
      </header>

      <section className="cartao">
        <div className="acao-cabeca">
          <span className={`selo-futuro selo-${ativo.toLowerCase()}`} aria-hidden="true">{ativo}</span>
          <div>
            <h2 className="acao-ticker">{contrato.contrato}</h2>
            <p className="suave"><Termo id={ativo === 'WIN' ? 'mini_indice' : 'mini_dolar'}>{info.nome}</Termo></p>
          </div>
          <span className="etiqueta-info">Ajuste de {diaMes(contrato.data)}</span>
        </div>
        <p className="valor-grande num">{pontos(contrato.preco, ativo)} <small className="suave">pontos</small></p>
        {contrato.variacao_pct != null && (
          <p className={`variacao-periodo ${tendencia(contrato.variacao_pct)}`}>
            <strong className="num">{pct(contrato.variacao_pct)}</strong> <span className="suave">no último pregão</span>
          </p>
        )}
        {pontosGrafico?.length > 1
          ? <Grafico pontos={pontosGrafico} altura={170} rotulo={contrato.contrato} formatar={(v) => `${pontos(v, ativo)} pt`} casasEixo={0} />
          : <div className="grafico" style={{ height: 170 }} />}
        <Periodos valor={periodo} aoTrocar={setPeriodo} />
        <p className="nota">
          Preço do simulador: {ativo === 'WIN'
            ? 'fechamento do Ibovespa, arredondado para 5 pontos'
            : <>dólar <Termo id="ptax">PTAX</Termo> de venda × 1.000, arredondado para 0,5 ponto</>}.
          No mercado real o futuro costuma ficar um pouco acima, por causa dos juros até o vencimento.
        </p>
      </section>

      <section className="cartao" aria-labelledby="titulo-contrato">
        <h2 id="titulo-contrato">O contrato</h2>
        <dl className="estatisticas">
          <div><dt><Termo id="valor_ponto">Valor do ponto</Termo></dt><dd className="num">{reais(contrato.valor_ponto)}</dd></div>
          <div><dt><Termo id="tick">Variação mínima</Termo></dt>
            <dd className="num">{pontos(contrato.tick, ativo)} pt = {reais(contrato.tick * contrato.valor_ponto)}</dd></div>
          <div><dt>Valor do contrato</dt><dd className="num">{reais(contrato.valor_contrato)}</dd></div>
          <div><dt><Termo id="margem_garantia">Margem</Termo></dt><dd className="num">{reais(contrato.margem)}</dd></div>
          <div><dt><Termo id="vencimento_futuro">Vencimento</Termo></dt><dd>{dataBR(contrato.vencimento)}</dd></div>
          <div><dt>Último dia</dt><dd>{dataBR(contrato.ultimo_dia)}</dd></div>
        </dl>
        <p className="nota">
          {ativo === 'WIN'
            ? 'Lote de 1 contrato = Ibovespa × R$ 0,20. Vence nos meses pares, na quarta-feira mais próxima do dia 15.'
            : 'Lote de 1 contrato = US$ 10.000, cotado em R$ por US$ 1.000. Vence todo mês no 1º dia útil; negocia até o dia útil anterior.'}
          {' '}Corretagem de {reais(contrato.corretagem)} por ordem.
        </p>
      </section>

      {posicao && (
        <section className="cartao posicao-futuro" aria-labelledby="titulo-posicao-futuro">
          <h2 id="titulo-posicao-futuro">Sua posição</h2>
          <p className="posicao-lado">
            <strong className={pos.sinal > 0 ? 'alta' : 'baixa'}>{pos.texto}</strong> {posicao.contrato !== contrato.contrato && `(${posicao.contrato})`}
          </p>
          <dl className="resumo-linhas">
            <div><dt>Preço de abertura</dt><dd className="num">{pontos(posicao.preco_medio, ativo)} pt</dd></div>
            <div><dt>Último ajuste</dt><dd className="num">{pontos(posicao.preco_ajuste, ativo)} pt em {diaMes(posicao.data_ajuste)}</dd></div>
            <div><dt><Termo id="ajuste_diario">Ajustes recebidos/pagos</Termo></dt>
              <dd className={`num ${tendencia(posicao.resultado)}`}>{reaisComSinal(posicao.resultado)}</dd></div>
            <div><dt><Termo id="margem_garantia">Margem depositada</Termo></dt><dd className="num">{reais(posicao.garantia)}</dd></div>
          </dl>
          <p className="nota">
            A cada ponto que o {info.base} {pos.sinal > 0 ? 'sobe' : 'cai'}, você ganha{' '}
            {reais(Math.abs(posicao.quantidade) * contrato.valor_ponto)}; no sentido contrário, perde o mesmo.
          </p>
          <button className="botao" onClick={zerar}>Zerar posição</button>
        </section>
      )}

      <form id="boleta-futuro" className="cartao boleta" onSubmit={confirmar} aria-labelledby="boleta-futuro-titulo">
        <h2 id="boleta-futuro-titulo" className="sr-only">Ordem de {contrato.contrato}</h2>
        <div className="abas-boleta" role="tablist" aria-label="Operação">
          <button type="button" role="tab" aria-selected={operacao === 'compra'} onClick={() => { setOperacao('compra'); setErro(''); }}>Comprar</button>
          <button type="button" role="tab" aria-selected={operacao === 'venda'} onClick={() => { setOperacao('venda'); setErro(''); }}>Vender</button>
        </div>
        <p className="suave">
          {operacao === 'compra'
            ? `Comprar ganha se o ${info.base} subir.`
            : `Vender ganha se o ${info.base} cair. No mercado futuro não há aluguel: comprar e vender são igualmente normais.`}
        </p>

        <div className="campo-quantidade">
          <label htmlFor="qtd-futuro">Contratos</label>
          <input id="qtd-futuro" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="0"
                 value={qtd} onChange={(e) => setQtd(e.target.value.replace(/\D/g, ''))} />
          <button type="button" className="botao-passo" onClick={() => setQtd(String(Math.max(0, p.quantidade - 1)))} aria-label="Diminuir">−</button>
          <button type="button" className="botao-passo" onClick={() => setQtd(String(p.quantidade + 1))} aria-label="Aumentar">+</button>
        </div>

        <div className="boleta-totais">
          <div>
            <span className="suave">Preço (<Termo id="ajuste_diario">último ajuste</Termo>)</span>
            <strong className="num">{pontos(contrato.preco, ativo)} pt</strong>
          </div>
          <div className="boleta-total">
            <span className="suave">Saldo depois</span>
            <strong className="num">{reais(p.saldoApos)}</strong>
          </div>
        </div>

        {p.quantidade > 0 && (
          <dl className="boleta-detalhes">
            {p.devolvida > 0 && <div><dt><Termo id="margem_garantia">Margem devolvida</Termo> ({p.fecha})</dt><dd className="num">+{reais(p.devolvida)}</dd></div>}
            {p.depositada > 0 && <div><dt><Termo id="margem_garantia">Margem depositada</Termo> ({p.abre})</dt><dd className="num">−{reais(p.depositada)}</dd></div>}
            <div><dt><Termo id="corretagem">Corretagem</Termo></dt><dd className="num">−{reais(p.corretagem)}</dd></div>
            <div><dt>Posição depois</dt><dd>{lado(p.nova).texto}</dd></div>
            {p.nova !== 0 && <div><dt><Termo id="valor_ponto">Cada ponto vale</Termo></dt><dd className="num">{reais(p.porPonto)}</dd></div>}
          </dl>
        )}

        {p.quantidade > 0 && p.erro && <p className="aviso aviso-erro" role="alert">{p.erro}</p>}
        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
        {fechada && (
          <p className="aviso" role="status">
            {dados.config.negociacao_pausada
              ? 'O professor pausou as ordens por enquanto.'
              : 'Negociação fechada agora. Você pode simular a ordem e enviá-la a partir das 19h.'}
          </p>
        )}
        <button className={`botao botao-principal ${operacao === 'venda' ? 'botao-venda' : ''}`} disabled={!podeEnviar}>
          {enviando ? 'Enviando…' : `${operacao === 'compra' ? 'Comprar' : 'Vender'} ${p.quantidade || ''} ${contrato.contrato}`}
        </button>
        <p className="nota">
          Todo dia, depois do fechamento, o <Termo id="ajuste_diario">ajuste diário</Termo> põe ou tira do seu saldo o ganho ou a
          perda do dia. Se o saldo ficar negativo, os seus minicontratos são zerados (<Termo id="chamada_margem">chamada de margem</Termo>).
        </p>
      </form>
    </div>
  );
}
