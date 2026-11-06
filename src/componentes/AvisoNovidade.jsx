import { useEffect, useRef } from 'react';
import { reais } from '../lib/formato.js';
import { pontos } from '../lib/futuros.js';
import Icone from './Icone.jsx';

export const AVISO_MINICONTRATOS = 'minicontratos-2026-11';
const ATE = '2026-12-05';   // último dia em que o aviso aparece

const hojeBR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const chaveLocal = (uid) => `bolsalab:aviso:${AVISO_MINICONTRATOS}:${uid}`;

/** Mostrar o aviso? Só até 05/12/2026 e só para quem ainda não fechou. */
export function deveMostrarAviso(perfil) {
  if (hojeBR() > ATE) return false;
  if (perfil.avisos_vistos?.includes(AVISO_MINICONTRATOS)) return false;
  try { if (localStorage.getItem(chaveLocal(perfil.user_id))) return false; } catch { /* sem armazenamento */ }
  return true;
}
export function lembrarAvisoLocal(uid) {
  try { localStorage.setItem(chaveLocal(uid), '1'); } catch { /* sem armazenamento */ }
}

// Aviso de novidade: o que são os minicontratos, como funcionam e dois exemplos
// com os preços de hoje. Aparece uma vez; fechado, não volta.
export default function AvisoNovidade({ futuros, aoFechar, aoConhecer }) {
  const dialogo = useRef(null);
  const titulo = useRef(null);
  useEffect(() => {
    const d = dialogo.current;
    d.showModal();
    // o navegador põe o foco no primeiro botão (lá embaixo) e rola até ele:
    // volta ao topo e põe o foco no título
    titulo.current?.focus({ preventScroll: true });
    d.scrollTop = 0;
    d.querySelector('.aviso-conteudo')?.scrollTo?.(0, 0);
    return () => d.close();
  }, []);

  const win = futuros?.find((f) => f.ativo === 'WIN' && f.preco != null);
  const wdo = futuros?.find((f) => f.ativo === 'WDO' && f.preco != null);
  // exemplos com os números de hoje (ou valores redondos, se ainda não houver preço)
  const w = win ?? { contrato: 'WINZ26', preco: 166000, margem: 900, valor_contrato: 33200 };
  const d = wdo ?? { contrato: 'WDOZ26', preco: 5460, margem: 1500, valor_contrato: 54600 };
  const winAlta = 1000;                                   // pontos
  const ganhoWin = winAlta * 0.2;                         // 1 contrato
  const wdoSobe = 50;                                     // pontos
  const perdaWdo = wdoSobe * 10;
  const daMargem = (valor, margem) => `${Math.round((valor / Number(margem)) * 100)}% da margem`;
  const umPorCento = Math.round(Number(w.preco) * 0.01 * 0.2);           // 1% do Ibovespa em 1 contrato

  return (
    <dialog ref={dialogo} className="folha aviso-novidade" aria-labelledby="aviso-titulo"
            onCancel={(e) => { e.preventDefault(); aoFechar(); }}>
      <div className="aviso-conteudo">
        <p className="aviso-chapeu"><span className="chip-novo">Novidade</span> no BolsaLab</p>
        <h2 id="aviso-titulo" ref={titulo} tabIndex={-1}>Agora você pode negociar minicontratos futuros</h2>
        <p>
          Além das ações do Ibovespa, o simulador ganhou dois ativos do <strong>mercado futuro</strong> da B3, os mais
          negociados por pessoas físicas no Brasil:
        </p>
        <div className="aviso-ativos">
          <div>
            <span className="selo-futuro selo-win" aria-hidden="true">WIN</span>
            <p><strong>Mini índice</strong><br />aposta na alta ou na queda do <strong>Ibovespa</strong>. Cada ponto vale R$ 0,20.</p>
          </div>
          <div>
            <span className="selo-futuro selo-wdo" aria-hidden="true">WDO</span>
            <p><strong>Mini dólar</strong><br />aposta na alta ou na queda do <strong>dólar</strong>. Cada ponto vale R$ 10,00.</p>
          </div>
        </div>

        <h3>O que é um contrato futuro?</h3>
        <p>
          É um acordo de comprar ou vender algo numa data futura, por um preço combinado hoje. Você não paga o valor
          inteiro do contrato: só deixa uma <strong>margem de garantia</strong> parada no saldo. Por isso ele é
          <strong> alavancado</strong>: com pouco dinheiro, você ganha ou perde como se tivesse muito.
        </p>

        <h3>Como funciona no BolsaLab</h3>
        <ol className="aviso-passos">
          <li><strong>Comprar</strong> ganha se o preço subir. <strong>Vender</strong> ganha se o preço cair. Não precisa ter o contrato para vender.</li>
          <li>Ao abrir a posição, sai do saldo a <strong>margem</strong> de cada contrato (hoje {reais(w.margem)} no mini índice e {reais(d.margem)} no mini dólar). Ela volta quando você zera a posição.</li>
          <li>Todo dia, depois do fechamento, vem o <strong>ajuste diário</strong>: o ganho ou a perda do dia entra ou sai do seu saldo, sem esperar você vender.</li>
          <li>Cada contrato tem <strong>vencimento</strong>, indicado no código: {w.contrato} vence em dezembro (Z) de 2026. Na data, a posição é encerrada sozinha.</li>
          <li>A corretagem é de <strong>R$ 10 por ordem</strong>. Os horários são os mesmos das ações: dias úteis das 19h às 9h e fins de semana.</li>
          <li>Se as perdas deixarem seu saldo negativo, vem a <strong>chamada de margem</strong>: seus minicontratos são zerados automaticamente.</li>
        </ol>

        <h3>Exemplo 1: comprado em mini índice</h3>
        <p className="aviso-exemplo">
          Você compra 1 {w.contrato} a {pontos(w.preco, 'WIN')} pontos. O contrato vale {reais(w.valor_contrato)}, mas você
          só deposita {reais(w.margem)} de margem (+ R$ 10 de corretagem). No dia seguinte o Ibovespa sobe {pontos(winAlta, 'WIN')} pontos:
          o ajuste diário põe <strong className="alta">+{reais(ganhoWin)}</strong> no seu saldo
          ({pontos(winAlta, 'WIN')} × R$ 0,20), {daMargem(ganhoWin, w.margem)} depositada. Se tivesse caído os mesmos pontos,
          sairiam {reais(ganhoWin)}.
        </p>

        <h3>Exemplo 2: vendido em mini dólar</h3>
        <p className="aviso-exemplo">
          Você acha que o dólar vai cair e vende 1 {d.contrato} a {pontos(d.preco, 'WDO')} pontos (R$ {(d.preco / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 4 })} por dólar).
          Mas o dólar sobe para {pontos(d.preco + wdoSobe, 'WDO')}: são {wdoSobe} pontos contra você, e o ajuste tira
          <strong className="baixa"> −{reais(perdaWdo)}</strong> do seu saldo ({wdoSobe} × R$ 10). Uma variação de menos de 1% no dólar
          levou {daMargem(perdaWdo, d.margem)}.
        </p>

        <p className="aviso-alerta">
          <Icone nome="alerta" tamanho={18} />
          <span>
            Alavancagem funciona nos dois sentidos. Com margem baixa, dá para abrir muitos contratos: 10 mini índices exigem só
            {' '}{reais(10 * Number(w.margem))}, mas cada 1% do Ibovespa passa a valer {reais(10 * umPorCento)} de ganho ou de perda.
            Comece com 1 contrato e acompanhe o extrato.
          </span>
        </p>

        <div className="aviso-botoes">
          <button className="botao botao-principal" onClick={aoConhecer}>Conhecer os minicontratos</button>
          <button className="botao" onClick={aoFechar}>Fechar</button>
        </div>
        <p className="nota">Toque no "?" ao lado de cada termo, no app, para rever as explicações.</p>
      </div>
    </dialog>
  );
}
