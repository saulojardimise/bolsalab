import { useRef, useState } from 'react';
import Icone from './Icone.jsx';

// Botão que copia um texto. Se o navegador recusar, seleciona o texto para copiar à mão.
export default function Copiar({ texto, rotulo = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false);
  const alvo = useRef(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(alvo.current);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  return (
    <>
      <span ref={alvo} className="sr-only">{texto}</span>
      <button type="button" className="botao-copiar" onClick={copiar} aria-live="polite">
        <Icone nome="copiar" tamanho={18} />{copiado ? 'Copiado' : rotulo}
      </button>
    </>
  );
}
