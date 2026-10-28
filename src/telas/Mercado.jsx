import { useMemo, useState } from 'react';
import { diaMes } from '../lib/formato.js';
import Icone from '../componentes/Icone.jsx';
import ListaAtivos, { detalheQuantidade } from '../componentes/ListaAtivos.jsx';

// As ações do Ibovespa com o último fechamento
export default function Mercado({ dados, linhas, aoEscolher }) {
  const { mercado, carteira } = dados;
  const [busca, setBusca] = useState('');
  const [setor, setSetor] = useState('');

  const setores = useMemo(() => [...new Set(mercado.map((e) => e.setor))].sort(), [mercado]);
  const tenho = Object.fromEntries(carteira.map((p) => [p.ticker, p.quantidade]));

  const termo = busca.trim().toLowerCase();
  const lista = mercado
    .filter((e) => (!setor || e.setor === setor) &&
      (!termo || e.ticker.toLowerCase().includes(termo) || e.nome.toLowerCase().includes(termo)))
    .map((e) => ({ ...e, detalhe: tenho[e.ticker] ? `${e.nome}, você tem ${detalheQuantidade(tenho[e.ticker])}` : e.nome }));

  const dataRef = mercado.map((e) => e.data).filter(Boolean).sort().at(-1);

  return (
    <div className="pilha">
      <div className="secao-topo">
        <h1>Mercado</h1>
        {dataRef && <p className="suave">Fechamento de {diaMes(dataRef)}</p>}
      </div>

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
