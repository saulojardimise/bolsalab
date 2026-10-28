import { useState } from 'react';

// Logo da empresa (vem da brapi). Sem logo, ou se a imagem falhar, mostra a sigla.
export default function Logo({ ticker, url, tamanho = 40 }) {
  const [falhou, setFalhou] = useState(false);
  const estilo = { width: tamanho, height: tamanho };
  if (url && !falhou) {
    return (
      <span className="logo" style={estilo}>
        <img src={url} alt="" loading="lazy" onError={() => setFalhou(true)} />
      </span>
    );
  }
  return (
    <span className="logo logo-sigla" style={{ ...estilo, fontSize: tamanho * 0.32 }} aria-hidden="true">
      {ticker.slice(0, 2)}
    </span>
  );
}
