// Escolhe a fonte de dados: Supabase de verdade ou modo demonstração.
import { createClient } from '@supabase/supabase-js';
import { criarApi } from './supabase.js';
import { criarApiDemo } from './demo.js';

const env = import.meta.env;
const urlRetorno = window.location.origin + env.BASE_URL;

function montar() {
  if (env.VITE_DEMO === 'true') return criarApiDemo();
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja app/.env.example).');
  }
  const cliente = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  return criarApi(cliente, { urlRetorno });
}

export const api = montar();
