// Minigráfico de linha das listas (sem eixos). Verde se subiu no período, vermelho se caiu.
export default function Sparkline({ valores, largura = 96, altura = 32 }) {
  if (!valores || valores.length < 2) return <span className="sparkline" style={{ width: largura, height: altura }} />;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const pts = valores.map((v, i) => [
    (i / (valores.length - 1)) * (largura - 2) + 1,
    altura - 3 - ((v - min) / faixa) * (altura - 6),
  ]);
  const linha = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const subiu = valores.at(-1) >= valores[0];
  return (
    <svg className={`sparkline ${subiu ? 'alta' : 'baixa'}`} width={largura} height={altura}
         viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true">
      <path d={`${linha}L${largura - 1},${altura}L1,${altura}Z`} className="sparkline-area" />
      <path d={linha} className="sparkline-linha" />
    </svg>
  );
}
