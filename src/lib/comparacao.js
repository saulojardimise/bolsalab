// Compara o patrimônio do aluno com o Ibovespa e o CDI no mesmo período.
// Tudo em % a partir do primeiro dia do período.

/**
 * @param {{data:string, valor:number}[]} aluno  patrimônio por dia (já cortado no período)
 * @param {{serie:'IBOV'|'CDI', data:string, valor:number}[]} indices
 * @returns {{ pontos: {data:string, aluno:number, ibov:number|null, cdi:number|null}[],
 *             final: {aluno:number, ibov:number|null, cdi:number|null} } | null}
 */
export function comparar(aluno, indices) {
  if (!aluno || aluno.length < 2) return null;
  const ibov = indices.filter((i) => i.serie === 'IBOV').sort((a, b) => a.data.localeCompare(b.data));
  const cdi = indices.filter((i) => i.serie === 'CDI').sort((a, b) => a.data.localeCompare(b.data));
  const d0 = aluno[0].data;
  const base = Number(aluno[0].valor);

  // Ibovespa: último fechamento até cada dia; a base é o último fechamento até o primeiro dia
  const ibovAte = (d) => {
    let v = null;
    for (const p of ibov) { if (p.data <= d) v = Number(p.valor); else break; }
    return v;
  };
  const ibov0 = ibovAte(d0) ?? (ibov[0] ? Number(ibov[0].valor) : null);

  // CDI: juros compostos de cada dia útil depois do primeiro dia
  let fator = 1;
  let k = 0;
  while (k < cdi.length && cdi[k].data <= d0) k++;
  const temCdi = cdi.length > 0 && cdi[0].data <= aluno.at(-1).data;

  const pontos = aluno.map((p) => {
    while (k < cdi.length && cdi[k].data <= p.data) { fator *= 1 + Number(cdi[k].valor) / 100; k++; }
    const vi = ibovAte(p.data);
    return {
      data: p.data,
      aluno: base > 0 ? (Number(p.valor) / base - 1) * 100 : 0,
      ibov: ibov0 && vi ? (vi / ibov0 - 1) * 100 : null,
      cdi: temCdi ? (fator - 1) * 100 : null,
    };
  });
  return { pontos, final: { ...pontos.at(-1) } };
}
