import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import './estilos.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Versão nova publicada: o app se atualiza sozinho ao abrir, sem precisar recarregar duas vezes
registerSW({ immediate: true });
// (quando há versão nova, a página recarrega uma vez; a aba aberta é mantida — ver Painel)

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
