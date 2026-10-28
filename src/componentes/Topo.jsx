import Icone from './Icone.jsx';
import Marca from './Marca.jsx';
import Avatar from './Avatar.jsx';

// Cabeçalho: marca, aviso de simulação e botão do perfil (com a foto do aluno)
export default function Topo({ foto, aoAbrirPerfil }) {
  return (
    <header className="topo">
      <Marca />
      <span className="chip-simulacao"><Icone nome="capelo" tamanho={18} />SIMULAÇÃO</span>
      <button className="avatar-botao" onClick={aoAbrirPerfil} aria-label="Abrir perfil">
        <Avatar foto={foto} />
      </button>
    </header>
  );
}
