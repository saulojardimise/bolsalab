// Escolha de que e-mails a turma aceita no cadastro.
// valor: '' (qualquer e-mail) ou um domínio, como 'isecensa.edu.br'
const PRONTOS = ['isecensa.edu.br', 'id.uff.br'];

export function textoRegra(dominio) {
  return dominio ? `Só e-mails @${dominio}` : 'Qualquer e-mail';
}

export default function RegraEmail({ valor, aoMudar, nome = 'regra' }) {
  const opcao = !valor ? 'qualquer' : PRONTOS.includes(valor) ? valor : 'outro';
  const outro = opcao === 'outro' ? valor : '';

  return (
    <fieldset className="regra-email">
      <legend>E-mails aceitos no cadastro</legend>
      {PRONTOS.map((d) => (
        <label key={d} className="opcao-radio">
          <input type="radio" name={nome} checked={opcao === d} onChange={() => aoMudar(d)} />
          Só @{d}
        </label>
      ))}
      <label className="opcao-radio">
        <input type="radio" name={nome} checked={opcao === 'outro'} onChange={() => aoMudar(outro || ' ')} />
        Outro domínio
      </label>
      {opcao === 'outro' && (
        <input className="regra-outro" aria-label="Domínio aceito" placeholder="exemplo.edu.br" value={valor.trim()}
               onChange={(e) => aoMudar(e.target.value.replace(/^@/, '').toLowerCase() || ' ')} autoComplete="off" />
      )}
      <label className="opcao-radio">
        <input type="radio" name={nome} checked={opcao === 'qualquer'} onChange={() => aoMudar('')} />
        Qualquer e-mail
      </label>
    </fieldset>
  );
}
