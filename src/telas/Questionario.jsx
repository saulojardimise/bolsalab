import { useState } from 'react';
import { api } from '../api/index.js';
import { PERFIS, PERGUNTAS } from '../lib/perfilInvestidor.js';
import Icone from '../componentes/Icone.jsx';
import Marca from '../componentes/Marca.jsx';

// Questionário de perfil de investidor. Obrigatório na primeira vez (o simulador
// só abre depois dele); depois pode ser refeito pelo perfil.
export default function Questionario({ obrigatorio, perfilAtual, aoConcluir, aoVoltar }) {
  const [etapa, setEtapa] = useState(-1);                  // -1 = apresentação
  const [respostas, setRespostas] = useState(Array(PERGUNTAS.length).fill(null));
  const [resultado, setResultado] = useState(null);       // { perfil, pontos }
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ultima = etapa === PERGUNTAS.length - 1;
  const escolhida = respostas[etapa];

  function escolher(i) {
    setRespostas((r) => r.map((v, k) => (k === etapa ? i + 1 : v)));
  }

  async function avancar() {
    if (!ultima) { setEtapa(etapa + 1); window.scrollTo({ top: 0 }); return; }
    setEnviando(true); setErro('');
    try {
      setResultado(await api.definirPerfilInvestidor(respostas));
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    const p = PERFIS[resultado.perfil];
    const posicao = ((resultado.pontos - 6) / 18) * 100;
    return (
      <main className="questionario">
        <Marca />
        <section className="cartao" aria-labelledby="titulo-resultado">
          <p className="suave">Seu perfil de investidor</p>
          <h1 id="titulo-resultado" className={`perfil-nome perfil-${resultado.perfil}`}>{p.nome}</h1>
          <p className="questionario-resumo">{p.resumo}</p>
          <div className="escala-perfil" aria-label={`${resultado.pontos} pontos, numa escala de 6 a 24`}>
            <div className="escala-faixas" aria-hidden="true">
              <span>Conservador</span><span>Moderado</span><span>Arrojado</span>
            </div>
            <div className="escala-barra" aria-hidden="true">
              <span className="escala-marca" style={{ left: `${posicao}%` }} />
            </div>
            <p className="suave">{resultado.pontos} pontos, numa escala de 6 a 24</p>
          </div>
          <p>{p.texto}</p>
          <p className="nota">
            Lembre-se: o perfil é o que você declarou. Ao longo do semestre, compare com o que você
            realmente faz na carteira.
          </p>
          <button className="botao botao-principal" onClick={aoConcluir}>
            {obrigatorio ? 'Começar a investir' : 'Voltar ao app'}
          </button>
        </section>
      </main>
    );
  }

  if (etapa === -1) {
    return (
      <main className="questionario">
        {!obrigatorio && (
          <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        )}
        {obrigatorio && <Marca />}
        <section className="cartao" aria-labelledby="titulo-questionario">
          <h1 id="titulo-questionario">Qual é o seu perfil de investidor?</h1>
          <p>
            Antes de recomendar um investimento, toda corretora precisa saber o perfil do cliente.
            Esse processo se chama <strong>suitability</strong> (adequação) e é exigido pela CVM.
          </p>
          <p>
            São {PERGUNTAS.length} perguntas rápidas. Não existe resposta certa: responda pensando
            no que você faria com o seu dinheiro de verdade.
          </p>
          {perfilAtual && (
            <p className="nota">Seu perfil atual: {PERFIS[perfilAtual].nome}. Ao refazer, ele é substituído.</p>
          )}
          {obrigatorio && <p className="nota">Você só começa a negociar depois de responder.</p>}
          <button className="botao botao-principal" onClick={() => setEtapa(0)}>Começar</button>
        </section>
      </main>
    );
  }

  const q = PERGUNTAS[etapa];
  return (
    <main className="questionario">
      <div className="questionario-topo">
        <button className="botao-icone" onClick={() => setEtapa(etapa - 1)} aria-label="Pergunta anterior">
          <Icone nome="voltar" />
        </button>
        <span className="suave">Pergunta {etapa + 1} de {PERGUNTAS.length}</span>
        <span style={{ width: 40 }} />
      </div>
      <div className="progresso" role="progressbar" aria-valuemin={0} aria-valuemax={PERGUNTAS.length}
           aria-valuenow={etapa + 1} aria-label="Andamento do questionário">
        <span style={{ width: `${((etapa + 1) / PERGUNTAS.length) * 100}%` }} />
      </div>

      <fieldset className="cartao pergunta" key={etapa}>
        <legend><h1>{q.titulo}</h1></legend>
        {q.opcoes.map((texto, i) => (
          <label key={i} className={`opcao-resposta ${escolhida === i + 1 ? 'escolhida' : ''}`}>
            <input type="radio" name={`pergunta-${etapa}`} checked={escolhida === i + 1} onChange={() => escolher(i)} />
            <span>{texto}</span>
          </label>
        ))}
      </fieldset>

      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
      <button className="botao botao-principal" onClick={avancar} disabled={!escolhida || enviando}>
        {enviando ? 'Calculando…' : ultima ? 'Ver meu perfil' : 'Próxima'}
      </button>
    </main>
  );
}
