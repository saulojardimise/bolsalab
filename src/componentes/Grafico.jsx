import { useEffect, useId, useRef, useState } from 'react';
import { diaMes, reais } from '../lib/formato.js';

// Gráfico de área com eixo de preços à direita e datas embaixo.
// Toque/arraste para ver o valor de cada dia.
// pontos: [{ data: 'AAAA-MM-DD', valor: number }]
export default function Grafico({ pontos, altura = 180, eixos = true, rotulo = 'Gráfico' }) {
  const caixa = useRef(null);
  const [largura, setLargura] = useState(320);
  const [foco, setFoco] = useState(null);   // índice do ponto em destaque
  const idGradiente = useId().replace(/:/g, '');

  useEffect(() => {
    const el = caixa.current;
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(200, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => setFoco(null), [pontos]);

  if (!pontos || pontos.length < 2) {
    return (
      <div ref={caixa} className="grafico grafico-vazio" style={{ height: altura }}>
        <p>O gráfico aparece a partir do segundo dia de dados.</p>
      </div>
    );
  }

  const margemDireita = eixos ? 52 : 6;
  const margemBaixo = eixos ? 22 : 4;
  const margemTopo = 10;
  const w = largura - margemDireita;
  const h = altura - margemBaixo - margemTopo;

  const valores = pontos.map((p) => Number(p.valor));
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max === min) { max += 1; min -= 1; }
  const folga = (max - min) * 0.08;
  min -= folga; max += folga;

  const x = (i) => (i / (pontos.length - 1)) * (w - 8) + 4;
  const y = (v) => margemTopo + h - ((v - min) / (max - min)) * h;

  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join('');
  const area = `${linha}L${x(pontos.length - 1).toFixed(1)},${margemTopo + h}L${x(0).toFixed(1)},${margemTopo + h}Z`;

  // 4 marcas no eixo de preços, em valores "redondos"
  const passo = degrau((max - min) / 4);
  const marcas = [];
  for (let v = Math.ceil(min / passo) * passo; v <= max; v += passo) marcas.push(v);

  // até 5 datas embaixo
  const nDatas = Math.min(5, pontos.length);
  const idxDatas = [...new Set(Array.from({ length: nDatas }, (_, k) => Math.round((k / (nDatas - 1)) * (pontos.length - 1))))];

  const subiu = valores.at(-1) >= valores[0];
  const iFoco = foco ?? pontos.length - 1;
  const pFoco = pontos[iFoco];

  function aoMover(e) {
    const r = caixa.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((px - 4) / (w - 8)) * (pontos.length - 1));
    setFoco(Math.max(0, Math.min(pontos.length - 1, i)));
  }

  return (
    <div ref={caixa} className={`grafico ${subiu ? 'alta' : 'baixa'}`}
         onPointerMove={aoMover} onPointerDown={aoMover} onPointerLeave={() => setFoco(null)}>
      {foco !== null && (
        <p className="grafico-leitura" style={{ left: Math.min(Math.max(x(iFoco) - 60, 0), w - 120) }}>
          <strong className="num">{reais(pFoco.valor)}</strong> <span>{diaMes(pFoco.data)}</span>
        </p>
      )}
      <svg width={largura} height={altura} role="img"
           aria-label={`${rotulo}: de ${reais(valores[0])} em ${diaMes(pontos[0].data)} a ${reais(valores.at(-1))} em ${diaMes(pontos.at(-1).data)}`}>
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="grafico-grad-topo" />
            <stop offset="100%" className="grafico-grad-base" />
          </linearGradient>
        </defs>
        {eixos && marcas.map((v) => (
          <g key={v}>
            <line x1="0" x2={w} y1={y(v)} y2={y(v)} className="grafico-grade" />
            <text x={largura - 4} y={y(v) + 4} textAnchor="end" className="grafico-texto num">
              {v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${idGradiente})`} />
        <path d={linha} className="grafico-linha" />
        {foco !== null && <line x1={x(iFoco)} x2={x(iFoco)} y1={margemTopo} y2={margemTopo + h} className="grafico-cursor" />}
        <circle cx={x(iFoco)} cy={y(pFoco.valor)} r="5" className="grafico-ponto" />
        {eixos && idxDatas.map((i, k) => (
          <text key={i} x={x(i)} y={altura - 4} className="grafico-texto"
                textAnchor={k === 0 ? 'start' : k === idxDatas.length - 1 ? 'end' : 'middle'}>
            {diaMes(pontos[i].data)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// 0,1 / 0,2 / 0,5 / 1 / 2 / 5 / 10 ...
function degrau(bruto) {
  const p = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
