import { useEffect, useRef, useState } from 'react';
import { api } from '../api/index.js';
import { reduzirFoto } from '../lib/imagem.js';
import { numero, pct, reais, tendencia } from '../lib/formato.js';
import { PERFIS } from '../lib/perfilInvestidor.js';
import Icone from './Icone.jsx';
import Avatar from './Avatar.jsx';
import TrocarSenha from './TrocarSenha.jsx';

const dataBR = (ts) => new Date(ts).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/** Ação mais negociada (mais ordens; empate: maior volume). */
export function acaoFavorita(ordens) {
  const conta = {};
  for (const o of ordens) {
    if (o.automatica) continue;
    const c = (conta[o.ticker] ??= { ticker: o.ticker, ordens: 0, volume: 0 });
    c.ordens += 1;
    c.volume += Number(o.quantidade) * Number(o.preco);
  }
  return Object.values(conta).sort((a, b) => b.ordens - a.ordens || b.volume - a.volume)[0] ?? null;
}

// Folha do perfil: foto, desempenho, perfil de investidor, senha e sair.
// O botão de câmera abre o seletor do próprio celular (fototeca, câmera ou arquivo).
export default function MenuPerfil({ perfil, resumo, aoFechar, aoSair, aoMudarFoto, aoRefazerPerfil, avisar }) {
  const dialogo = useRef(null);
  const seletor = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [numeros, setNumeros] = useState(null);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    return () => d.close();
  }, []);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      api.ordens(perfil.user_id, 5000),
      perfil.turma_id ? api.ranking(perfil.turma_id) : Promise.resolve(null),
    ]).then(([ordens, ranking]) => {
      if (!vivo) return;
      const eu = ranking?.find((r) => r.eu);
      setNumeros({
        ordens: ordens.filter((o) => !o.automatica).length,
        corretagens: ordens.reduce((s, o) => s + Number(o.corretagem), 0),
        favorita: acaoFavorita(ordens),
        posicao: eu ? { lugar: eu.posicao, de: ranking.length } : null,
      });
    }).catch(() => {});
    return () => { vivo = false; };
  }, [perfil.user_id, perfil.turma_id]);

  async function aoEscolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';           // permite escolher a mesma foto de novo
    if (!arquivo) return;
    setErro(''); setEnviando(true);
    try {
      const foto = await reduzirFoto(arquivo);
      aoMudarFoto(await api.enviarFoto(perfil.user_id, foto));
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setErro(''); setEnviando(true);
    try {
      await api.removerFoto(perfil.user_id);
      aoMudarFoto(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const tipo = PERFIS[perfil.perfil_investidor];

  return (
    <dialog ref={dialogo} className="folha" aria-labelledby="perfil-nome"
            onCancel={(e) => { e.preventDefault(); aoFechar(); }}
            onClick={(e) => e.target === dialogo.current && aoFechar()}>
      <div className="perfil">
        <div className="perfil-cabeca">
          <div className="perfil-foto">
            <Avatar foto={perfil.foto_url} tamanho={96} className={enviando ? 'avatar-enviando' : ''} />
            <button type="button" className="botao-camera" onClick={() => seletor.current.click()}
                    aria-label={perfil.foto_url ? 'Trocar foto' : 'Colocar foto'} disabled={enviando}>
              <Icone nome="camera" tamanho={18} />
            </button>
          </div>
          <div className="perfil-id">
            <h2 id="perfil-nome">{perfil.nome || 'Sem nome'}</h2>
            <p className="suave">{perfil.email}</p>
            {perfil.turma && <p className="suave">Turma {perfil.turma}</p>}
            {perfil.criado_em && <p className="suave">Membro desde {dataBR(perfil.criado_em)}</p>}
          </div>
        </div>

        <input ref={seletor} type="file" accept="image/*" hidden onChange={aoEscolher} />
        {perfil.foto_url && !enviando && (
          <button type="button" className="link link-perigo" onClick={remover}>Remover foto</button>
        )}
        {enviando && <p className="suave" role="status">Salvando a foto…</p>}
        {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}

        <section className="perfil-bloco" aria-labelledby="perfil-desempenho">
          <h3 id="perfil-desempenho">Desempenho</h3>
          <dl className="perfil-numeros">
            {numeros?.posicao && (
              <div className="perfil-destaque">
                <dt>Posição na turma</dt>
                <dd><span className="num">{numeros.posicao.lugar}º</span> <small>de {numeros.posicao.de}</small></dd>
              </div>
            )}
            <div><dt>Patrimônio</dt><dd className="num">{reais(resumo.patrimonio)}</dd></div>
            <div>
              <dt>Rentabilidade desde o início</dt>
              <dd className={`num ${tendencia(resumo.rentabilidade)}`}>{pct(resumo.rentabilidade)}</dd>
            </div>
            <div><dt>Ordens</dt><dd className="num">{numeros ? numero(numeros.ordens) : '…'}</dd></div>
            <div><dt>Corretagens pagas</dt><dd className="num">{numeros ? reais(numeros.corretagens) : '…'}</dd></div>
            <div>
              <dt>Ação favorita</dt>
              <dd>
                {numeros?.favorita
                  ? <>{numeros.favorita.ticker} <small>{numeros.favorita.ordens} {numeros.favorita.ordens === 1 ? 'ordem' : 'ordens'}</small></>
                  : numeros ? '—' : '…'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="perfil-bloco" aria-labelledby="perfil-investidor">
          <h3 id="perfil-investidor">Perfil de investidor</h3>
          {tipo ? (
            <div className="perfil-investidor">
              <span className={`chip-perfil perfil-${perfil.perfil_investidor}`}>{tipo.nome}</span>
              <p className="suave">{tipo.resumo}</p>
              {perfil.perfil_em && <p className="nota">Respondido em {dataBR(perfil.perfil_em)}.</p>}
            </div>
          ) : <p className="suave">Ainda não respondido.</p>}
          <button className="link" onClick={aoRefazerPerfil}>{tipo ? 'Refazer o questionário' : 'Responder o questionário'}</button>
        </section>

        <div className="perfil-acoes">
          {trocandoSenha ? (
            <TrocarSenha email={perfil.email} aoCancelar={() => setTrocandoSenha(false)}
                         aoConcluir={() => { setTrocandoSenha(false); avisar?.('Senha alterada.'); }} />
          ) : (
            <button className="botao" onClick={() => setTrocandoSenha(true)}><Icone nome="chave" />Trocar senha</button>
          )}
          <button className="botao" onClick={aoSair}><Icone nome="sair" />Sair da conta</button>
          <button className="link" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </dialog>
  );
}
