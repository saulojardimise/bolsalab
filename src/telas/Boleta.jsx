import { useState } from 'react';
import { api } from '../api/index.js';
import { previa, TIPOS } from '../lib/regras.js';
import { numero, reais, reaisComSinal } from '../lib/formato.js';
import Icone from '../componentes/Icone.jsx';

// Boleta da página da ação.
// Duas abas (Comprar / Vender) e, dentro delas, a forma da operação:
//   Comprar -> comprar ações | recomprar uma venda a descoberto
//   Vender  -> das minhas ações | a descoberto
export default function Boleta({ ticker, empresa, comprada, vendida, operacaoInicial, dados, aoExecutar }) {
  const qtdComprada = comprada?.quantidade ?? 0;
  const inicial = operacaoInicial ?? (vendida ? 'recompra' : 'compra');
  const [lado, setLado] = useState(inicial === 'compra' || inicial === 'recompra' ? 'comprar' : 'vender');
  const [tipo, setTipo] = useState(inicial);
  const [qtd, setQtd] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState('');

  const exposicao = dados.vendidas.reduce((s, v) => s + Number(v.custo_recompra), 0);
  const quantidade = Math.floor(Number(qtd) || 0);
  const p = previa({
    tipo, quantidade, preco: Number(empresa.preco), saldo: Number(dados.perfil.saldo), config: dados.config,
    qtdComprada, vendida, exposicao,
  });

  const suspensa = empresa.situacao === 'suspensa';
  const fechada = !dados.liberada || dados.config.negociacao_pausada || suspensa;
  const podeEnviar = !fechada && quantidade > 0 && !p.erro && !enviando;

  function trocarLado(novo) {
    setLado(novo);
    setErroServidor('');
    if (novo === 'comprar') setTipo('compra');
    else setTipo(qtdComprada > 0 ? 'venda' : 'venda_descoberto');
  }

  async function confirmar(e) {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true); setErroServidor('');
    try {
      await api.executarOrdem(ticker, tipo, quantidade);
      setQtd('');
      await aoExecutar(`${TIPOS[tipo].feito} de ${numero(quantidade)} ${ticker} executada.`);
    } catch (err) {
      setErroServidor(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const ajustar = (delta) => setQtd(String(Math.max(0, quantidade + delta)));
  const opcoes = lado === 'comprar'
    ? (vendida ? [['compra', 'Comprar ações'], ['recompra', `Recomprar vendidas (${numero(vendida.quantidade)})`]] : null)
    : [['venda', `Das minhas ações (${numero(qtdComprada)})`, qtdComprada === 0], ['venda_descoberto', 'A descoberto']];
  const total = p.linhas.find((l) => l.destaque);
  const vende = tipo === 'venda' || tipo === 'venda_descoberto';
  const verbo = { compra: 'Comprar', recompra: 'Recomprar', venda: 'Vender', venda_descoberto: 'Vender a descoberto' }[tipo];

  return (
    <form className="cartao boleta" onSubmit={confirmar} aria-labelledby="boleta-titulo">
      <h2 id="boleta-titulo" className="sr-only">Ordem de {ticker}</h2>
      <div className="abas-boleta" role="tablist" aria-label="Operação">
        <button type="button" role="tab" aria-selected={lado === 'comprar'} onClick={() => trocarLado('comprar')}>Comprar</button>
        <button type="button" role="tab" aria-selected={lado === 'vender'} onClick={() => trocarLado('vender')}>Vender</button>
      </div>

      {opcoes && (
        <fieldset className="formas">
          <legend className="sr-only">Forma da operação</legend>
          {opcoes.map(([id, rotulo, desativada]) => (
            <label key={id} className={`forma ${tipo === id ? 'ativa' : ''} ${desativada ? 'desativada' : ''}`}>
              <input type="radio" name="forma" value={id} checked={tipo === id} disabled={desativada}
                     onChange={() => { setTipo(id); setErroServidor(''); }} />
              {rotulo}
            </label>
          ))}
        </fieldset>
      )}

      <div className="campo-quantidade">
        <label htmlFor="boleta-qtd">Quantidade de ações</label>
        <button type="button" className="link" onClick={() => setQtd(String(p.maximo))} disabled={!p.maximo}>
          Máximo: {numero(p.maximo)}
        </button>
        <input id="boleta-qtd" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder="0"
               value={qtd} onChange={(e) => setQtd(e.target.value.replace(/\D/g, ''))} />
        <button type="button" className="botao-passo" onClick={() => ajustar(-1)} aria-label="Diminuir">−</button>
        <button type="button" className="botao-passo" onClick={() => ajustar(1)} aria-label="Aumentar">+</button>
      </div>

      <div className="boleta-totais">
        <div>
          <span className="suave">Preço por ação (fechamento)</span>
          <strong className="num">{reais(empresa.preco)}</strong>
        </div>
        <div className="boleta-total">
          <span className="suave">{total.rotulo}</span>
          <strong className="num">{total.rotulo.startsWith('Resultado') ? reaisComSinal(total.valor) : reais(total.valor)}</strong>
        </div>
      </div>

      <dl className="boleta-detalhes">
        {p.linhas.filter((l) => !l.destaque).map((l) => (
          <div key={l.rotulo}><dt>{l.rotulo}</dt><dd className="num">{reais(l.valor)}</dd></div>
        ))}
      </dl>

      {tipo === 'venda_descoberto' && (
        <p className="nota">
          Você ganha se o preço cair. O valor da venda fica bloqueado como garantia, o aluguel é cobrado todo dia
          e a posição é encerrada sozinha se o prejuízo acumulado chegar a 80% do seu saldo disponível.
        </p>
      )}

      {(p.erro || erroServidor) && quantidade > 0 && (
        <p className="aviso aviso-erro" role="alert">{erroServidor || p.erro}</p>
      )}
      {fechada && (
        <p className="aviso" role="status">
          {suspensa
            ? `A negociação de ${ticker} está suspensa. Você continua com a posição, pelo último preço.`
            : dados.config.negociacao_pausada
            ? 'O professor pausou as ordens por enquanto.'
            : 'Negociação fechada agora. Você pode simular a ordem e enviá-la a partir das 19h.'}
        </p>
      )}

      <button className={`botao botao-principal ${vende ? 'botao-venda' : ''}`} disabled={!podeEnviar}>
        {enviando ? 'Enviando…' : `${verbo} ${quantidade > 0 ? numero(quantidade) + ' ' : ''}${ticker}`}
      </button>

      <p className="aviso-virtual">
        <Icone nome="info" tamanho={16} />
        <span>
          <strong>Operação com dinheiro virtual.</strong> Preço de fechamento da B3, corretagem de {reais(dados.config.corretagem)} por ordem.
        </span>
      </p>
    </form>
  );
}
