// Marca do BolsaLab (kit oficial em docs/identidade-visual).
// Os SVGs entram no HTML para que as cores sigam o tema claro/escuro.
import logo from '../marca/logo.svg?raw';
import monograma from '../marca/monograma.svg?raw';

export default function Marca({ altura = 30, subtitulo = false }) {
  return (
    <span className="marca" role="img" aria-label="BolsaLab">
      <span className="marca-logo" style={{ height: altura }} dangerouslySetInnerHTML={{ __html: logo }} />
      {subtitulo && <span className="marca-subtitulo">Simulador de investimentos</span>}
    </span>
  );
}

export function Monograma({ tamanho = 32 }) {
  return <span className="marca-monograma" style={{ width: tamanho }} aria-hidden="true"
               dangerouslySetInnerHTML={{ __html: monograma }} />;
}
