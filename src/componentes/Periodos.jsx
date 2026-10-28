import { PERIODOS } from '../lib/periodos.js';

// Seletor de período dos gráficos
export default function Periodos({ valor, aoTrocar }) {
  return (
    <div className="periodos" role="group" aria-label="Período do gráfico">
      {PERIODOS.map((p) => (
        <button key={p.id} type="button" aria-pressed={valor === p.id} onClick={() => aoTrocar(p.id)}>
          {p.rotulo}
        </button>
      ))}
    </div>
  );
}
