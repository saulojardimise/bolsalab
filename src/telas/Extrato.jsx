import { useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { efeitoNoSaldo, TIPOS } from '../lib/regras.js';
import { dataHora, diaMes, numero, reais, reaisComSinal, tendencia } from '../lib/formato.js';

const TITULO_AJUSTE = {
  troca_codigo: 'Troca de código',
  desdobramento: 'Desdobramento',
  grupamento: 'Grupamento',
  conversao: 'Conversão de ações',
};

// Movimentações (extrato): ordens, aluguel cobrado e ajustes por eventos das ações
// (troca de código, desdobramento...), do mais recente para o mais antigo
export default function Extrato({ uid, versao }) {
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    Promise.all([api.ordens(uid), api.cobrancas(uid), api.ajustes(uid)])
      .then(([ordens, cobrancas, ajustes]) => {
        if (!vivo) return;
        const lista = [
          ...ordens.map((o) => ({ ...o, tipoItem: 'ordem', quando: o.criado_em })),
          ...cobrancas.map((c) => ({ ...c, tipoItem: 'aluguel', quando: c.criado_em })),
          ...ajustes.map((a) => ({ ...a, tipoItem: 'ajuste', quando: a.criado_em })),
        ].sort((a, b) => new Date(b.quando) - new Date(a.quando));
        setItens(lista);
      })
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [uid, versao]);

  return (
    <section aria-labelledby="titulo-extrato">
      <h2 id="titulo-extrato" className="secao-titulo">Movimentações</h2>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      {!itens && !erro && <p className="carregando" aria-busy="true">Carregando…</p>}
      {itens?.length === 0 && <p className="cartao vazio">Nenhuma movimentação ainda. Suas ordens vão aparecer aqui.</p>}

      {itens?.length > 0 && <ul className="cartao cartao-lista extrato">
        {itens?.map((i) => i.tipoItem === 'ordem' ? (
          <li key={'o' + i.id} className={i.automatica ? 'extrato-automatica' : undefined}>
            <div className="extrato-linha">
              <span>
                <strong>{TIPOS[i.tipo].feito}</strong> <span className="suave">{i.ticker}</span>
              </span>
              <span className={`num ${tendencia(efeitoNoSaldo(i))}`}>{reaisComSinal(efeitoNoSaldo(i))}</span>
            </div>
            <div className="extrato-detalhe">
              <span>{numero(i.quantidade)} × {reais(i.preco)}, corretagem {reais(i.corretagem)}</span>
              <span>{dataHora(i.criado_em)}</span>
            </div>
            {i.automatica && <p className="extrato-obs">{i.observacao}</p>}
            {i.tipo === 'venda_descoberto' && (
              <p className="extrato-obs">{reais(i.valor_total)} ficaram bloqueados como garantia.</p>
            )}
          </li>
        ) : i.tipoItem === 'ajuste' ? (
          <li key={'j' + i.id} className="extrato-ajuste">
            <div className="extrato-linha">
              <span><strong>{TITULO_AJUSTE[i.tipo] ?? 'Ajuste'}</strong> <span className="suave">{i.ticker}</span></span>
              {Number(i.valor_saldo) !== 0 && (
                <span className={`num ${tendencia(i.valor_saldo)}`}>{reaisComSinal(i.valor_saldo)}</span>
              )}
            </div>
            <p className="extrato-obs">{i.descricao}</p>
            <div className="extrato-detalhe"><span>{dataHora(i.criado_em)}</span></div>
          </li>
        ) : (
          <li key={'a' + i.id}>
            <div className="extrato-linha">
              <span><strong>Aluguel</strong> <span className="suave">{i.ticker}</span></span>
              <span className="num baixa">{reaisComSinal(-i.valor)}</span>
            </div>
            <div className="extrato-detalhe">
              <span>{i.dias} {i.dias === 1 ? 'dia' : 'dias'} sobre {reais(i.base)}, até {diaMes(i.data)}</span>
              <span>{dataHora(i.criado_em)}</span>
            </div>
          </li>
        ))}
      </ul>}
    </section>
  );
}
