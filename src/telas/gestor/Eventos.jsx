import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { dataHora, diaMes, numero, reais } from '../../lib/formato.js';

const TIPOS = [
  ['troca', 'Trocar código', 'A empresa mudou de código na B3 (ex.: ELET3 virou AXIA3). Nada muda para os alunos.'],
  ['desdobramento', 'Desdobramento ou grupamento', 'As ações foram divididas ou agrupadas. Quantidade, preço médio e histórico são ajustados, e o patrimônio dos alunos não muda.'],
  ['conversao', 'Conversão', 'Fusão ou incorporação: as ações antigas viram ações de outra empresa. Frações são pagas em dinheiro.'],
  ['encerramento', 'Saída da bolsa', 'Fechamento de capital, falência... As posições de todos são encerradas pelo preço informado, sem corretagem.'],
  ['suspensao', 'Suspender ou liberar', 'A ação continua nas carteiras com o último preço, mas não aceita ordens enquanto estiver suspensa.'],
];

// Eventos das ações: formulário com conferência do impacto e histórico do que já foi aplicado
export default function Eventos({ inicial, avisar }) {
  const [tipo, setTipo] = useState(inicial?.tipo ?? 'troca');
  const [f, setF] = useState({
    ticker: inicial?.ticker ?? '', novo: inicial?.novo ?? '', nome: '',
    de: inicial?.de ?? 1, para: inicial?.para ?? 2, dataEx: '', preco: '', motivo: '', suspender: true,
  });
  const [acoes, setAcoes] = useState([]);
  const [impacto, setImpacto] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => { api.mercado().then(setAcoes).catch(() => {}); }, [versao]);
  useEffect(() => { api.eventos().then(setHistorico).catch(() => setHistorico([])); }, [versao]);

  const mudar = (campo) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF({ ...f, [campo]: v });
    setImpacto(null); setErro('');
  };
  const escolherTipo = (t) => { setTipo(t); setImpacto(null); setErro(''); };

  function validar() {
    const t = f.ticker.trim().toUpperCase();
    if (!t) return 'Escolha a ação.';
    if (tipo === 'troca' && !/^[A-Z0-9]{4,6}$/.test(f.novo.trim().toUpperCase())) return 'Digite o código novo, por exemplo AXIA3.';
    if (tipo === 'conversao' && !/^[A-Z0-9]{4,6}$/.test(f.novo.trim().toUpperCase())) return 'Digite o código da ação que fica, por exemplo MBRF3.';
    if ((tipo === 'desdobramento' || tipo === 'conversao') && (!(Number(f.de) > 0) || !(Number(f.para) > 0) ||
        !Number.isInteger(Number(f.de)) || !Number.isInteger(Number(f.para)))) return 'A proporção precisa de números inteiros, como 1 para 2 ou 100 para 85.';
    if (tipo === 'desdobramento' && Number(f.de) === Number(f.para)) return 'A proporção precisa mudar a quantidade.';
    if (tipo === 'encerramento' && !(Number(String(f.preco).replace(',', '.')) > 0)) return 'Informe o preço pago por ação.';
    return '';
  }

  async function conferir(e) {
    e.preventDefault();
    const problema = validar();
    if (problema) { setErro(problema); return; }
    setErro('');
    try {
      setImpacto(await api.impactoAcao(f.ticker.trim().toUpperCase()));
    } catch (err) { setErro(err.message); }
  }

  async function aplicar() {
    const t = f.ticker.trim().toUpperCase();
    setEnviando(true); setErro('');
    try {
      if (tipo === 'troca') await api.trocarCodigo(t, f.novo.trim().toUpperCase(), f.nome.trim());
      else if (tipo === 'desdobramento') await api.desdobrar(t, Number(f.de), Number(f.para), f.dataEx);
      else if (tipo === 'conversao') await api.converter(t, f.novo.trim().toUpperCase(), Number(f.de), Number(f.para), f.nome.trim());
      else if (tipo === 'encerramento') await api.encerrar(t, Number(String(f.preco).replace(',', '.')), f.motivo.trim());
      else await api.suspender(t, f.suspender);
      avisar(resumo());
      setImpacto(null);
      setF({ ...f, ticker: '', novo: '', nome: '', preco: '', motivo: '' });
      setVersao((v) => v + 1);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function resumo() {
    const t = f.ticker.trim().toUpperCase();
    if (tipo === 'troca') return `${t} passou a se chamar ${f.novo.trim().toUpperCase()}.`;
    if (tipo === 'desdobramento') return `${Number(f.para) > Number(f.de) ? 'Desdobramento' : 'Grupamento'} de ${t} aplicado.`;
    if (tipo === 'conversao') return `${t} convertida em ${f.novo.trim().toUpperCase()}.`;
    if (tipo === 'encerramento') return `${t} encerrada. As posições foram liquidadas.`;
    return f.suspender ? `${t} suspensa.` : `${t} liberada.`;
  }

  const descricao = TIPOS.find(([id]) => id === tipo)[2];
  const afetados = impacto ? Number(impacto.alunos_comprados) + Number(impacto.alunos_vendidos) : 0;

  return (
    <div className="pilha">
      <div>
        <h1>Eventos das ações</h1>
        <p className="suave">Use quando uma ação mudar de código, for desdobrada, incorporada, sair da bolsa ou for suspensa.</p>
      </div>

      <form className="cartao" onSubmit={conferir} aria-label="Aplicar evento">
        <div className="chips chips-quebram" role="group" aria-label="Tipo de evento">
          {TIPOS.map(([id, rotulo]) => (
            <button type="button" key={id} aria-pressed={tipo === id} onClick={() => escolherTipo(id)}>{rotulo}</button>
          ))}
        </div>
        <p className="nota">{descricao}</p>

        <label className="campo">
          <span>{tipo === 'conversao' ? 'Ação que deixa de existir' : 'Ação'}</span>
          <input id="evento-ticker" list="lista-acoes" value={f.ticker} onChange={mudar('ticker')}
                 placeholder="Ex.: PETR4" autoCapitalize="characters" autoComplete="off" />
          <datalist id="lista-acoes">
            {acoes.map((a) => <option key={a.ticker} value={a.ticker}>{a.nome}</option>)}
          </datalist>
        </label>

        {(tipo === 'troca' || tipo === 'conversao') && (
          <div className="campos-linha">
            <label className="campo">
              <span>{tipo === 'troca' ? 'Código novo' : 'Ação que fica'}</span>
              <input id="evento-novo" value={f.novo} onChange={mudar('novo')} placeholder={tipo === 'troca' ? 'Ex.: AXIA3' : 'Ex.: MBRF3'}
                     autoCapitalize="characters" autoComplete="off" />
            </label>
            <label className="campo">
              <span>Nome da empresa <small>(opcional)</small></span>
              <input id="evento-nome" value={f.nome} onChange={mudar('nome')} placeholder="Mantém o atual" />
            </label>
          </div>
        )}

        {(tipo === 'desdobramento' || tipo === 'conversao') && (
          <div className="campos-linha proporcao">
            <label className="campo">
              <span>De</span>
              <input id="evento-de" inputMode="numeric" value={f.de} onChange={mudar('de')} />
            </label>
            <span className="proporcao-seta" aria-hidden="true">para</span>
            <label className="campo">
              <span>Para</span>
              <input id="evento-para" inputMode="numeric" value={f.para} onChange={mudar('para')} />
            </label>
          </div>
        )}
        {tipo === 'desdobramento' && (
          <>
            <p className="nota">
              {Number(f.para) > Number(f.de)
                ? `Desdobramento: cada ${f.de} ação vira ${f.para}. O preço cai na mesma proporção.`
                : `Grupamento: cada ${f.de} ações viram ${f.para}. Frações de ação são pagas em dinheiro.`}
            </p>
            <label className="campo">
              <span>Primeiro pregão com o preço novo <small>(opcional)</small></span>
              <input id="evento-data" type="date" value={f.dataEx} onChange={mudar('dataEx')} />
              <small>Deixe em branco se a cotação mais recente já está no preço novo (o caso do alerta).</small>
            </label>
          </>
        )}
        {tipo === 'conversao' && (
          <p className="nota">Ex.: de 100 para 85 quer dizer que cada 100 ações antigas viram 85 da ação que fica.</p>
        )}

        {tipo === 'encerramento' && (
          <div className="campos-linha">
            <label className="campo">
              <span>Preço pago por ação (R$)</span>
              <input id="evento-preco" inputMode="decimal" value={f.preco} onChange={mudar('preco')} placeholder="Ex.: 45,00" />
            </label>
            <label className="campo">
              <span>Motivo <small>(opcional)</small></span>
              <input id="evento-motivo" value={f.motivo} onChange={mudar('motivo')} placeholder="Ex.: OPA de fechamento de capital" />
            </label>
          </div>
        )}

        {tipo === 'suspensao' && (
          <fieldset className="regra-email">
            <legend>O que fazer</legend>
            <label className="opcao-radio">
              <input type="radio" name="suspender" checked={f.suspender} onChange={() => setF({ ...f, suspender: true })} />
              Suspender as ordens
            </label>
            <label className="opcao-radio">
              <input type="radio" name="suspender" checked={!f.suspender} onChange={() => setF({ ...f, suspender: false })} />
              Liberar as ordens de novo
            </label>
          </fieldset>
        )}

        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

        {!impacto ? (
          <button className="botao botao-principal">Conferir antes de aplicar</button>
        ) : (
          <div className="confirmacao" role="alert">
            <p>
              <strong>{impacto.ticker}</strong> ({impacto.nome}).{' '}
              {impacto.ultimo_preco ? `Último preço ${reais(impacto.ultimo_preco)} em ${diaMes(impacto.ultima_data)}.` : 'Sem cotação.'}
            </p>
            <p>
              {afetados === 0 ? 'Nenhum aluno tem esta ação.' : <>
                {Number(impacto.alunos_comprados) > 0 && `${impacto.alunos_comprados} com ${numero(impacto.acoes_compradas)} ações compradas. `}
                {Number(impacto.alunos_vendidos) > 0 && `${impacto.alunos_vendidos} com ${numero(impacto.acoes_vendidas)} ações vendidas a descoberto.`}
              </>}
            </p>
            <p className="nota">Esta operação não pode ser desfeita.</p>
            <div className="botoes-linha">
              <button type="button" className="botao" onClick={() => setImpacto(null)}>Cancelar</button>
              <button type="button" className={`botao botao-principal ${tipo === 'encerramento' ? 'botao-venda' : ''}`}
                      onClick={aplicar} disabled={enviando}>
                {enviando ? 'Aplicando…' : 'Aplicar'}
              </button>
            </div>
          </div>
        )}
      </form>

      <section aria-labelledby="titulo-historico-eventos">
        <h2 id="titulo-historico-eventos" className="secao-titulo">Já aplicados</h2>
        {historico?.length === 0 && <p className="cartao vazio">Nenhum evento aplicado ainda.</p>}
        {historico?.length > 0 && (
          <ul className="cartao cartao-lista extrato">
            {historico.map((h) => (
              <li key={h.id}>
                <div className="extrato-linha"><span>{h.descricao}</span></div>
                <div className="extrato-detalhe">
                  <span>{h.alunos} {h.alunos === 1 ? 'posição ajustada' : 'posições ajustadas'}</span>
                  <span>{dataHora(h.executado_em)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
