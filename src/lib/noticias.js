// Capa e filtros da página de notícias (sem servidor, para dar para testar)

const HORA = 3600e3;

const sem = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Manchetes que não interessam ao investidor: vagas de emprego, promoções para
// o consumidor, atendimento, golpes etc. Ficam de fora da página.
const FORA = new RegExp([
  '\\bvagas?\\b', 'emprego', 'cadastro para', 'abre cadastro', 'curriculo', 'salario', 'quanto ganha', 'requisitos',
  'trabalhe', 'estagio', 'jovem aprendiz', 'concurso', 'processo seletivo', 'contrata\\b', 'contratando',
  'black friday', 'cupo(m|ns)', 'descontos?\\b', 'promocao', 'promocoes', 'ofertas?\\b(?! (de acoes|publica|primaria|secundaria|subsequente|de recompra|vinculante|hostil|pela|por|de compra))', 'liquidacao', 'frete gratis',
  'cashback', 'sorteio', 'horario de funcionamento', 'abre no feriado', 'funciona no feriado', 'como cancelar',
  '\\bgolpe', 'receita de\\b', 'horoscopo',
].join('|'));
export const relevante = (n) => !FORA.test(sem(n.titulo));

// Veículos de economia e grandes jornais: só eles disputam a manchete e as chamadas.
// Notícias de outros sites continuam em "Mais notícias" e nos filtros.
const CONFIAVEIS = [
  'infomoney', 'valor', 'money times', 'exame', 'estadao', 'e-investidor', 'folha', 'o globo', 'g1', 'cnn',
  'bloomberg', 'brazil journal', 'seu dinheiro', 'suno', 'investing', 'reuters', 'investnews', 'times brasil',
  'neofeed', 'poder360', 'uol', 'veja', 'istoe dinheiro', 'forbes', 'bp money', 'mais retorno', 'monitor do mercado',
  'advfn', 'trademap', 'eu quero investir', 'status invest', 'cvm', 'agencia brasil', 'cnn brasil', 'band',
  'correio braziliense', 'estado de minas', 'gazeta do povo', 'xp investimentos', 'btg pactual', 'genial investimentos',
  'jornal de exemplo',   // manchetes da demonstração
];
export const confiavel = (n) => n.tipo === 'fato_relevante' || CONFIAVEIS.some((c) => sem(n.fonte ?? '').includes(c));

/** "há 5 min", "há 3 h", "ontem", "02/11" */
export function quando(iso, agora = new Date()) {
  const d = new Date(iso);
  const min = Math.max(0, Math.round((agora - d) / 60000));
  if (min < 60) return `há ${Math.max(1, min)} min`;
  if (min < 24 * 60) return `há ${Math.round(min / 60)} h`;
  const fmt = (x) => x.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const ontem = new Date(agora.getTime() - 86400e3);
  if (fmt(d) === fmt(ontem)) return 'ontem';
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}

/**
 * Nota de destaque de uma notícia de empresa: quanto a ação mexeu no dia,
 * quantas notícias a empresa teve (assunto quente) e se é recente.
 */
export function nota(n, porTicker, variacao, agora = new Date()) {
  const horas = (agora - new Date(n.publicada_em)) / HORA;
  const recencia = Math.max(0, 1 - horas / 48);                        // 1 agora, 0 em 48 h
  const mexeu = Math.max(0, ...n.tickers.map((t) => Math.abs(Number(variacao[t]) || 0)));
  const quente = Math.max(0, ...n.tickers.map((t) => Math.min(porTicker[t] ?? 0, 6)));
  const oficial = n.tipo === 'fato_relevante' ? 1.5 : 0;
  return mexeu * 1.2 + quente * 0.35 + recencia * 2 + oficial;
}

/**
 * Monta a capa: manchete, principais chamadas (uma por empresa), mercado e fatos relevantes.
 * @param {object[]} noticias  da tabela noticias (mais recentes primeiro)
 * @param {object[]} mercado   visão mercado (ticker, variacao_pct...)
 */
export function montarCapa(todas, mercado, agora = new Date()) {
  const noticias = todas.filter(relevante);
  const variacao = Object.fromEntries(mercado.map((e) => [e.ticker, e.variacao_pct]));
  const porTicker = {};
  for (const n of noticias) {
    if (agora - new Date(n.publicada_em) > 48 * HORA) continue;
    for (const t of n.tickers) porTicker[t] = (porTicker[t] ?? 0) + 1;
  }

  const empresas = noticias
    .filter((n) => n.tipo !== 'mercado' && n.tickers.length > 0 && confiavel(n))
    .map((n) => ({ n, nota: nota(n, porTicker, variacao, agora) }))
    .sort((a, b) => b.nota - a.nota);

  // uma chamada por empresa, para a capa não ficar só com a mesma ação
  const usados = new Set();
  const chamadas = [];
  for (const { n } of empresas) {
    if (n.tickers.some((t) => usados.has(t))) continue;
    n.tickers.forEach((t) => usados.add(t));
    chamadas.push(n);
    if (chamadas.length === 7) break;
  }

  const naCapa = new Set(chamadas.map((n) => n.id));
  const mercadoGeral = noticias.filter((n) => n.tipo === 'mercado' && confiavel(n)).slice(0, 4);
  mercadoGeral.forEach((n) => naCapa.add(n.id));
  const fatos = noticias.filter((n) => n.tipo === 'fato_relevante' && !naCapa.has(n.id)).slice(0, 4);
  fatos.forEach((n) => naCapa.add(n.id));

  return {
    manchete: chamadas[0] ?? mercadoGeral[0] ?? null,
    chamadas: chamadas.slice(1),
    mercado: chamadas[0] ? mercadoGeral : mercadoGeral.slice(1),
    fatos,
    resto: noticias.filter((n) => !naCapa.has(n.id)),
  };
}

/** Filtros: 'minhas' | 'mercado' | 'fatos' | '' ; setor; busca (empresa ou código) */
export function filtrar(noticias, { filtro = '', setor = '', busca = '', minhas = [], empresas = [] }) {
  const setorDe = Object.fromEntries(empresas.map((e) => [e.ticker, e.setor]));
  const termo = busca.trim().toLowerCase();
  const casam = termo
    ? new Set(empresas.filter((e) => e.ticker.toLowerCase().includes(termo) || e.nome.toLowerCase().includes(termo)).map((e) => e.ticker))
    : null;
  const meus = new Set(minhas);
  return noticias.filter((n) => {
    if (!relevante(n)) return false;
    if (filtro === 'minhas' && !n.tickers.some((t) => meus.has(t))) return false;
    if (filtro === 'mercado' && n.tipo !== 'mercado') return false;
    if (filtro === 'fatos' && n.tipo !== 'fato_relevante') return false;
    if (setor && !n.tickers.some((t) => setorDe[t] === setor)) return false;
    if (casam && !n.tickers.some((t) => casam.has(t)) && !n.titulo.toLowerCase().includes(termo)) return false;
    return true;
  });
}
