import { useEffect, useRef, useState } from 'react';
import { diaMes, reais } from '../lib/formato.js';
import { degrau } from './Grafico.jsx';

// Gráfico de candles (velas): cada dia mostra abertura, máxima, mínima e fechamento.
// Corpo verde = fechou acima da abertura; vermelho = abaixo. O "pavio" vai da mínima à máxima.
// Toque/arraste para ler os quatro preços do dia.
// velas: [{ data, abertura, maxima, minima, preco }] (sem abertura/máxima/mínima, usa o fechamento)
export default function Candles({ velas, altura = 200, rotulo = 'Candles', formatar = reais }) {
  const caixa = useRef(null);
  const [largura, setLargura] = useState(320);
  const [foco, setFoco] = useState(null);

  useEffect(() => {
    const el = caixa.current;
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(200, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => setFoco(null), [velas]);

  if (!velas || velas.length < 2) {
    return (
      <div ref={caixa} className="grafico grafico-vazio" style={{ height: altura }}>
        <p>O gráfico aparece a partir do segundo dia de dados.</p>
      </div>
    );
  }

  const v = velas.map((d) => {
    const f = Number(d.preco);
    const a = Number(d.abertura) || f;
    return { data: d.data, a, f, max: Math.max(Number(d.maxima) || f, a, f), min: Math.min(Number(d.minima) || f, a, f) };
  });

  const margemDireita = 52;
  const margemBaixo = 22;
  const margemTopo = 10;
  const w = largura - margemDireita;
  const h = altura - margemBaixo - margemTopo;
  let min = Math.min(...v.map((d) => d.min));
  let max = Math.max(...v.map((d) => d.max));
  if (max === min) { max += 1; min -= 1; }
  const folga = (max - min) * 0.06;
  min -= folga; max += folga;

  const fatia = w / v.length;
  const corpo = Math.max(1.5, Math.min(14, fatia * 0.62));
  const x = (i) => fatia * i + fatia / 2;
  const y = (p) => margemTopo + h - ((p - min) / (max - min)) * h;

  const passo = degrau((max - min) / 4);
  const marcas = [];
  for (let m = Math.ceil(min / passo) * passo; m <= max; m += passo) marcas.push(m);
  const casas = passo >= 1 ? 0 : 2;
  const nDatas = Math.min(5, v.length);
  const idxDatas = [...new Set(Array.from({ length: nDatas }, (_, k) => Math.round((k / (nDatas - 1)) * (v.length - 1))))];

  const iFoco = foco ?? v.length - 1;
  const d = v[iFoco];

  function aoMover(e) {
    const r = caixa.current.getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left) / fatia);
    setFoco(Math.max(0, Math.min(v.length - 1, i)));
  }

  return (
    <div ref={caixa} className="grafico candles"
         onPointerMove={aoMover} onPointerDown={aoMover} onPointerLeave={() => setFoco(null)}>
      <p className="candles-leitura num" aria-live="polite">
        <span>{diaMes(d.data)}</span>
        <span>A {formatar(d.a)}</span>
        <span>Máx {formatar(d.max)}</span>
        <span>Mín {formatar(d.min)}</span>
        <strong className={d.f >= d.a ? 'alta' : 'baixa'}>F {formatar(d.f)}</strong>
      </p>
      <svg width={largura} height={altura} role="img"
           aria-label={`${rotulo}: ${v.length} dias, de ${diaMes(v[0].data)} a ${diaMes(v.at(-1).data)}; último fechamento ${formatar(v.at(-1).f)}`}>
        {marcas.map((m) => (
          <g key={m}>
            <line x1="0" x2={w} y1={y(m)} y2={y(m)} className="grafico-grade" />
            <text x={largura - 4} y={y(m) + 4} textAnchor="end" className="grafico-texto num">
              {m.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}
            </text>
          </g>
        ))}
        {foco !== null && <rect x={x(iFoco) - fatia / 2} y={margemTopo} width={fatia} height={h} className="candle-foco" />}
        {v.map((c, i) => {
          const sobe = c.f >= c.a;
          const topo = y(Math.max(c.a, c.f));
          const alt = Math.max(1, Math.abs(y(c.a) - y(c.f)));
          return (
            <g key={c.data} className={sobe ? 'candle-alta' : 'candle-baixa'}>
              <line x1={x(i)} x2={x(i)} y1={y(c.max)} y2={y(c.min)} className="candle-pavio" />
              <rect x={x(i) - corpo / 2} y={topo} width={corpo} height={alt} rx={corpo > 6 ? 1.5 : 0} className="candle-corpo" />
            </g>
          );
        })}
        {idxDatas.map((i, k) => (
          <text key={i} x={x(i)} y={altura - 4} className="grafico-texto"
                textAnchor={k === 0 ? 'start' : k === idxDatas.length - 1 ? 'end' : 'middle'}>
            {diaMes(v[i].data)}
          </text>
        ))}
      </svg>
    </div>
  );
}
