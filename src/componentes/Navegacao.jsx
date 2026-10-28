import Icone from './Icone.jsx';

// Barra inferior com as abas do app
const ABAS = [
  ['inicio', 'Início'],
  ['mercado', 'Mercado'],
  ['carteira', 'Carteira'],
  ['turma', 'Turma'],
];

export default function Navegacao({ aba, aoTrocar }) {
  return (
    <nav className="navegacao" aria-label="Seções">
      {ABAS.map(([id, rotulo]) => (
        <button key={id} className="nav-item" aria-current={aba === id ? 'page' : undefined}
                onClick={() => aoTrocar(id)}>
          <Icone nome={id} tamanho={24} />
          <span>{rotulo}</span>
        </button>
      ))}
    </nav>
  );
}
