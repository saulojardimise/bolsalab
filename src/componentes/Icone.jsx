// Ícones de traço (24×24). Cor = currentColor.
const DESENHOS = {
  inicio: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  mercado: <path d="M6 20v-6M12 20V8M18 20V4" />,
  carteira: <><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>,
  turma: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.6c2.4-.3 4.2 1.2 4.6 4.4" /></>,
  voltar: <path d="M15 5l-7 7 7 7" />,
  seta: <path d="M9 5l7 7-7 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></>,
  saldo: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></>,
  lampada: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />,
  capelo: <path d="M2 9.5 12 5l10 4.5L12 14zM6 11.5V16c3.3 2.4 8.7 2.4 12 0v-4.5M22 9.5V14" />,
  usuario: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6" /></>,
  sair: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4" />,
  busca: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  subida: <path d="M7 17 17 7M9 7h8v8" />,
  descida: <path d="M7 7l10 10M17 9v8H9" />,
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  alerta: <><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
  eventos: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  sistema: <><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /></>,
  copiar: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  pausa: <path d="M9 5v14M15 5v14" />,
  play: <path d="M7 4.5v15L19 12z" />,
};

export default function Icone({ nome, tamanho = 22, className = '', titulo }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} className={`icone ${className}`}
         aria-hidden={titulo ? undefined : 'true'} role={titulo ? 'img' : undefined} aria-label={titulo}
         fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {DESENHOS[nome]}
    </svg>
  );
}
