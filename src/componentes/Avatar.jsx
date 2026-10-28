import { useState } from 'react';
import Icone from './Icone.jsx';

// Foto do aluno ou, sem foto, o boneco
export default function Avatar({ foto, tamanho = 44, className = '' }) {
  const [falhou, setFalhou] = useState(false);
  const estilo = { width: tamanho, height: tamanho };
  return (
    <span className={`avatar ${className}`} style={estilo}>
      {foto && !falhou
        ? <img src={foto} alt="" onError={() => setFalhou(true)} />
        : <Icone nome="usuario" tamanho={Math.round(tamanho * 0.5)} />}
    </span>
  );
}
