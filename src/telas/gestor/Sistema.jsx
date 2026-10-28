import { useEffect, useState } from 'react';
import { api } from '../../api/index.js';
import { dataHora } from '../../lib/formato.js';
import Icone from '../../componentes/Icone.jsx';

// Negociação (pausar/liberar), coletas de cotações e conta do gestor
export default function Sistema({ email, avisar }) {
  const [config, setConfig] = useState(null);
  const [coletas, setColetas] = useState(null);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    Promise.all([api.config(), api.coletas()])
      .then(([c, k]) => { setConfig(c); setColetas(k); })
      .catch((e) => setErro(e.message));
  }, [versao]);

  async function alternarPausa() {
    try {
      const pausada = await api.definirPausa(!config.negociacao_pausada);
      setVersao((v) => v + 1);
      avisar(pausada ? 'Negociações pausadas para todos os alunos.' : 'Negociações liberadas.');
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="pilha">
      <h1>Sistema</h1>
      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

      {config && (
        <section className="cartao" aria-labelledby="titulo-negociacao">
          <h2 id="titulo-negociacao">Negociação</h2>
          <p className={`status ${config.negociacao_pausada ? 'status-fechado' : 'status-aberto'}`}>
            <span className="status-sinal" aria-hidden="true" />
            <span>
              {config.negociacao_pausada
                ? <><strong>Pausada.</strong> Nenhum aluno consegue enviar ordens.</>
                : <><strong>Normal.</strong> Dias úteis das 19h às 9h, fins de semana e feriados o dia todo.</>}
            </span>
          </p>
          <button className={`botao ${config.negociacao_pausada ? 'botao-principal' : ''}`} onClick={alternarPausa}>
            <Icone nome={config.negociacao_pausada ? 'play' : 'pausa'} tamanho={18} />
            {config.negociacao_pausada ? 'Liberar negociações' : 'Pausar negociações'}
          </button>
        </section>
      )}

      <section aria-labelledby="titulo-coletas">
        <h2 id="titulo-coletas" className="secao-titulo">Coletas de cotações</h2>
        {coletas?.length === 0 && <p className="cartao vazio">Nenhuma coleta registrada ainda.</p>}
        {coletas?.length > 0 && (
          <ul className="cartao cartao-lista extrato">
            {coletas.map((c) => (
              <li key={c.id}>
                <div className="extrato-linha">
                  <span>{dataHora(c.executada_em)}</span>
                  <span className={c.com_erro ? 'baixa' : 'alta'}>{c.com_erro ? `${c.com_erro} com erro` : 'Tudo certo'}</span>
                </div>
                <div className="extrato-detalhe">
                  <span>{c.gravadas} de {c.total} cotações gravadas</span>
                  <span>{c.origem}</span>
                </div>
                {c.erros?.length > 0 && (
                  <p className="extrato-obs">{c.erros.map((e) => `${e.ticker}: ${e.erro}`).join('; ')}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao" aria-labelledby="titulo-conta">
        <h2 id="titulo-conta">Conta</h2>
        <p className="suave">{email}</p>
        <button className="botao" onClick={() => api.sair()}><Icone nome="sair" tamanho={18} />Sair da conta</button>
      </section>
    </div>
  );
}
