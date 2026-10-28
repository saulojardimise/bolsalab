import { useEffect, useState } from 'react';
import { api } from './api/index.js';
import Entrada from './telas/Entrada.jsx';
import NovaSenha from './telas/NovaSenha.jsx';
import Painel from './telas/Painel.jsx';
import Gestor from './telas/gestor/Gestor.jsx';

export default function App() {
  const [sessao, setSessao] = useState(undefined);   // undefined = carregando
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    api.sessao().then(setSessao);
    return api.aoMudarSessao((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
      setSessao(s);
    });
  }, []);

  if (sessao === undefined) return <div className="carregando-tela" aria-busy="true" />;
  if (recuperando) return <NovaSenha aoConcluir={() => setRecuperando(false)} />;
  if (!sessao) return <Entrada />;
  return <Conta key={sessao.id} sessao={sessao} />;
}

// O gestor vê a área de gestão; o aluno, o simulador.
function Conta({ sessao }) {
  const [gestor, setGestor] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.souAdmin().then(setGestor).catch((e) => setErro(e.message));
  }, []);

  if (erro) {
    return (
      <main className="carregando-tela">
        <div className="erro-geral" role="alert">
          <p>{erro}</p>
          <button className="botao" onClick={() => location.reload()}>Tentar de novo</button>
        </div>
      </main>
    );
  }
  if (gestor === null) return <div className="carregando-tela" aria-busy="true" />;
  return gestor ? <Gestor email={sessao.email} /> : <Painel uid={sessao.id} />;
}
