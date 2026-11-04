import { useEffect, useRef, useState } from 'react';
import { pct, tendencia } from '../lib/formato.js';
import Termo from './Termo.jsx';

const SERIES = [
  { id: 'aluno', rotulo: 'Você', classe: 'serie-aluno' },
  { id: 'ibov', rotulo: 'Ibovespa', classe: 'serie-ibov', termo: 'ibovespa' },
  { id: 'cdi', rotulo: 'CDI', classe: 'serie-cdi', termo: 'cdi' },
];

// Linhas do aluno, do Ibovespa e do CDI, em % desde o início do período
export default function Comparativo({ comparacao, altura = 150 }) {
  const caixa = useRef(null);
  const [largura, setLargura] = useState(320);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return undefined;
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(200, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { pontos, final } = comparacao;
  const visiveis = SERIES.filter((s) => final[s.id] != null);
  const valores = pontos.flatMap((p) => visiveis.map((s) => p[s.id]).filter((v) => v != null));
  let min = Math.min(0, ...valores);
  let max = Math.max(0, ...valores);
  if (max - min < 0.5) { max += 0.25; min -= 0.25; }
  const folga = (max - min) * 0.1;
  min -= folga; max += folga;

  const margem = 6;
  const w = largura - margem * 2;
  const h = altura - margem * 2;
  const x = (i) => margem + (i / Math.max(1, pontos.length - 1)) * w;
  const y = (v) => margem + h - ((v - min) / (max - min)) * h;
  const caminho = (id) => pontos
    .map((p, i) => (p[id] == null ? null : `${x(i).toFixed(1)},${y(p[id]).toFixed(1)}`))
    .filter(Boolean).map((c, i) => `${i ? 'L' : 'M'}${c}`).join('');

  const resumo = visiveis.map((s) => `${s.rotulo} ${pct(final[s.id])}`).join(', ');

  return (
    <div className="comparativo">
      <div ref={caixa} className="comparativo-grafico">
        <svg width={largura} height={altura} role="img" aria-label={`Comparação no período: ${resumo}`}>
          <line x1={margem} x2={largura - margem} y1={y(0)} y2={y(0)} className="linha-zero" />
          {[...visiveis].reverse().map((s) => (
            <path key={s.id} d={caminho(s.id)} className={`serie ${s.classe}`} />
          ))}
        </svg>
      </div>
      <ul className="comparativo-legenda">
        {visiveis.map((s) => (
          <li key={s.id}>
            <span className={`legenda-traco ${s.classe}`} aria-hidden="true" />
            <span>{s.termo ? <Termo id={s.termo}>{s.rotulo}</Termo> : s.rotulo}</span>
            <strong className={`num ${tendencia(final[s.id])}`}>{pct(final[s.id])}</strong>
          </li>
        ))}
      </ul>
      {visiveis.length > 1 && <p className="comparativo-frase">{frase(visiveis, final)}</p>}
    </div>
  );
}

// "Você ficou à frente do CDI, mas atrás do Ibovespa." etc.
function frase(visiveis, final) {
  const outros = visiveis.filter((s) => s.id !== 'aluno');
  const atras = outros.filter((s) => final[s.id] > final.aluno).map((s) => s.rotulo);
  const frente = outros.filter((s) => final[s.id] <= final.aluno).map((s) => s.rotulo);
  const e = (l) => l.join(' e do ');
  if (!atras.length) return `Você está à frente do ${e(frente)} no período.`;
  if (!frente.length) return `Você está atrás do ${e(atras)} no período.`;
  return `Você está à frente do ${e(frente)}, mas atrás do ${e(atras)}.`;
}
