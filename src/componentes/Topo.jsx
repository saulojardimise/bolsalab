import Icone from './Icone.jsx';
import Marca from './Marca.jsx';

// Cabeçalho: marca, aviso de simulação e botão do perfil
export default function Topo({ aoAbrirPerfil }) {
  return (
    <header className="topo">
      <Marca />
      <span className="chip-simulacao"><Icone nome="capelo" tamanho={18} />SIMULAÇÃO</span>
      <button className="avatar" onClick={aoAbrirPerfil} aria-label="Abrir perfil">
        <Icone nome="usuario" tamanho={22} />
      </button>
    </header>
  );
}
