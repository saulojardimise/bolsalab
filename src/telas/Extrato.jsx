import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/index.js';
import { fluxoDeCaixa, GRUPOS } from '../lib/fluxo.js';
import { dataHora, diaMes, numero, reais, reaisComSinal, tendencia } from '../lib/formato.js';
import Icone from '../componentes/Icone.jsx';

// Extrato: o fluxo de caixa completo do aluno. No topo, quanto entrou e saiu
// por tipo (ações, corretagem, aluguel...); embaixo, cada lançamento com o
// que foi pago pelas ações, a corretagem e o saldo depois dele.
export default function Extrato({ uid, dados, resumo, versao, aoVoltar }) {
  const [mov, setMov] = useState(null);
  const [erro, setErro] = useState('');
  const [grupo, setGrupo] = useState('');

  useEffect(() => {
    let vivo = true;
    Promise.all([api.ordens(uid, 5000), api.cobrancas(uid, 5000), api.ajustes(uid, 5000)])
      .then(([ordens, cobrancas, ajustes]) => vivo && setMov({ ordens, cobrancas, ajustes }))
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [uid, versao]);

  const fluxo = useMemo(() => mov && fluxoDeCaixa({
    ...mov, saldoInicial: Number(dados.config.saldo_inicial), inicio: dados.perfil.criado_em ?? null,
  }), [mov, dados.config.saldo_inicial, dados.perfil.criado_em]);

  const lista = fluxo?.lancamentos.filter((l) => !grupo || l.grupo === grupo || (grupo === 'custos' && l.corretagem));
  const t = fluxo?.totais;
  // se faltar algum lançamento (conta muito antiga), o saldo real é o que vale
  const confere = t && Math.abs(t.final - resumo.saldo) < 0.01;

  return (
    <div className="pilha">
      <header className="barra-acao">
        <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        <h1>Extrato</h1>
        <span style={{ width: 40 }} />
      </header>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!fluxo && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}

      {t && (
        <section className="cartao" aria-labelledby="titulo-fluxo">
          <h2 id="titulo-fluxo">Fluxo de caixa</h2>
          <dl className="fluxo">
            <Linha rotulo="Saldo inicial" valor={t.inicial} sinal={false} />
            <Linha rotulo="Pago na compra de ações" valor={t.compras} />
            <Linha rotulo="Recebido na venda de ações" valor={t.vendas} />
            {t.descoberto !== 0 && <Linha rotulo="Resultado das vendas a descoberto" valor={t.descoberto} />}
            <Linha rotulo={`Corretagens (${numero(t.ordens)} ${t.ordens === 1 ? 'ordem' : 'ordens'})`} valor={t.corretagens} />
            {t.aluguel !== 0 && <Linha rotulo="Aluguel de ações" valor={t.aluguel} />}
            {t.ajustes !== 0 && <Linha rotulo="Ajustes de eventos das ações" valor={t.ajustes} />}
            <div className="fluxo-total">
              <dt>Saldo disponível</dt>
              <dd className="num">{reais(confere ? t.final : resumo.saldo)}</dd>
            </div>
          </dl>
          {resumo.garantias > 0 && (
            <p className="nota">
              Fora do saldo: {reais(resumo.garantias)} bloqueados como garantia das vendas a descoberto.
              Eles voltam ao saldo na recompra.
            </p>
          )}
          {!confere && (
            <p className="nota">O extrato mostra as movimentações registradas; o saldo disponível acima é o da sua conta.</p>
          )}
        </section>
      )}

      {fluxo && (
        <section aria-labelledby="titulo-lancamentos">
          <h2 id="titulo-lancamentos" className="secao-titulo">Lançamentos</h2>
          <div className="chips" role="group" aria-label="Filtrar lançamentos">
            {GRUPOS.map((g) => (
              <button key={g.id} aria-pressed={grupo === g.id} onClick={() => setGrupo(g.id)}>{g.rotulo}</button>
            ))}
          </div>
          {lista.length === 0
            ? <p className="cartao vazio">Nenhum lançamento deste tipo ainda.</p>
            : (
              <ul className="cartao cartao-lista extrato">
                {lista.map((l) => <Lancamento key={l.id} l={l} />)}
              </ul>
            )}
        </section>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, sinal = true }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd className={`num ${sinal ? tendencia(valor) : ''}`}>{sinal ? reaisComSinal(valor) : reais(valor)}</dd>
    </div>
  );
}

function Lancamento({ l }) {
  const classe = l.automatica ? 'extrato-automatica' : l.origem === 'ajuste' ? 'extrato-ajuste' : undefined;
  return (
    <li className={classe}>
      <div className="extrato-linha">
        <span>
          <strong>{l.titulo}</strong> {l.ticker && <span className="suave">{l.ticker}</span>}
        </span>
        <span className={`num ${l.tipo === 'inicial' ? '' : tendencia(l.efeito)}`}>
          {l.tipo === 'inicial' ? reais(l.efeito) : reaisComSinal(l.efeito)}
        </span>
      </div>

      {l.quantidade > 0 && (
        <p className="extrato-detalhe"><span>{numero(l.quantidade)} ações × {reais(l.preco)}</span></p>
      )}
      {l.partes.length > 1 && (
        <dl className="extrato-partes">
          {l.partes.map((p) => (
            <div key={p.rotulo}><dt>{p.rotulo}</dt><dd className="num">{reaisComSinal(p.valor)}</dd></div>
          ))}
        </dl>
      )}
      {l.tipo === 'venda_descoberto' && (
        <p className="extrato-obs">
          Só a corretagem sai do saldo. Os {reais(l.garantia)} da venda ficam bloqueados como garantia até a recompra.
        </p>
      )}
      {l.tipo === 'aluguel' && (
        <p className="extrato-obs">{l.dias} {l.dias === 1 ? 'dia' : 'dias'} sobre {reais(l.base)}, até {diaMes(l.ate)}</p>
      )}
      {l.obs && <p className="extrato-obs">{l.obs}</p>}

      <div className="extrato-detalhe">
        <span>{l.quando ? dataHora(l.quando) : ''}</span>
        <span>Saldo {reais(l.saldo)}</span>
      </div>
    </li>
  );
}
