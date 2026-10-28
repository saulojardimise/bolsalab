// Acesso ao Supabase. Todas as telas falam com o banco só por aqui.
// criarApi recebe o cliente pronto (assim os testes usam um cliente próprio).

const MENSAGENS_AUTH = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail: abra o link que enviamos para a sua caixa de entrada.'],
  [/already registered|already been registered|user_already_exists/i, 'Este e-mail já tem conta. Use "Entrar" ou recupere a senha.'],
  // o Supabase esconde o motivo quando o banco recusa o cadastro
  [/database error saving new user/i, 'Não foi possível criar a conta. Confira o token da turma e se o seu e-mail é do tipo aceito por ela.'],
  [/password should be at least|weak_password|weak password/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'],
  [/same as the old|same_password/i, 'A nova senha precisa ser diferente da anterior.'],
  [/failed to fetch|network/i, 'Sem conexão com o servidor. Verifique sua internet.'],
];

function traduzir(erro) {
  const msg = erro?.message ?? String(erro);
  for (const [padrao, texto] of MENSAGENS_AUTH) {
    if (padrao.test(msg) || padrao.test(erro?.code ?? '')) return new Error(texto);
  }
  return new Error(msg);
}

// Erros das funções do banco já vêm em português (raise exception).
function checar({ data, error }) {
  if (error) throw new Error(error.message || 'Erro ao falar com o servidor.');
  return data;
}

/** O e-mail é aceito pela turma? (dominio null = qualquer e-mail) */
export function emailAceito(email, dominio) {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return false;
  return !dominio || e.split('@')[1] === dominio;
}

export function criarApi(supabase, { urlRetorno } = {}) {
  return {
    modoDemo: false,

    // ---------------- conta ----------------
    async sessao() {
      const { data } = await supabase.auth.getSession();
      return data.session ? { id: data.session.user.id, email: data.session.user.email } : null;
    },

    aoMudarSessao(cb) {
      const { data } = supabase.auth.onAuthStateChange((evento, s) => {
        cb(evento, s ? { id: s.user.id, email: s.user.email } : null);
      });
      return () => data.subscription.unsubscribe();
    },

    async entrar(email, senha) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) throw traduzir(error);
    },

    // Confere o token da turma antes do cadastro: { turma, dominio_email } ou null
    async verificarToken(token) {
      const linhas = checar(await supabase.rpc('verificar_token', { p_token: token }));
      return linhas[0] ?? null;
    },

    async cadastrar({ email, senha, nome, token }) {
      const turma = await this.verificarToken(token);
      if (!turma) throw new Error('Token de turma inválido ou turma fechada. Peça o token ao professor.');
      if (!emailAceito(email, turma.dominio_email)) {
        throw new Error(turma.dominio_email
          ? `A turma ${turma.turma} só aceita e-mails @${turma.dominio_email}.`
          : 'Digite um e-mail válido.');
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { data: { nome: nome.trim(), token: token.trim() }, emailRedirectTo: urlRetorno },
      });
      if (error) throw traduzir(error);
      // Supabase devolve usuário sem identidades quando o e-mail já existe
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('Este e-mail já tem conta. Use "Entrar" ou recupere a senha.');
      }
      return { precisaConfirmar: !data.session, turma: turma.turma };
    },

    async sair() {
      await supabase.auth.signOut();
    },

    async recuperarSenha(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: urlRetorno });
      if (error) throw traduzir(error);
    },

    async definirNovaSenha(senha) {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw traduzir(error);
    },

    // ---------------- dados do aluno ----------------
    // Atenção: o gestor (admin) enxerga as linhas de todos;
    // por isso toda consulta da conta filtra pelo próprio user_id.

    async perfil(uid) {
      return checar(await supabase.from('perfis').select('*').eq('user_id', uid).single());
    },

    async config() {
      return checar(await supabase.from('config').select('*').single());
    },

    async mercado() {
      return checar(await supabase.from('mercado').select('*').order('ticker'));
    },

    async carteira(uid) {
      return checar(await supabase.from('minha_carteira').select('*').eq('user_id', uid).order('ticker'));
    },

    async vendidas(uid) {
      return checar(await supabase.from('minhas_vendidas').select('*').eq('user_id', uid).order('ticker'));
    },

    async ordens(uid, limite = 100) {
      return checar(await supabase.from('ordens').select('*').eq('user_id', uid)
        .order('criado_em', { ascending: false }).limit(limite));
    },

    async cobrancas(uid, limite = 100) {
      return checar(await supabase.from('cobrancas_aluguel').select('*').eq('user_id', uid)
        .order('criado_em', { ascending: false }).limit(limite));
    },

    // Ajustes por eventos das ações (desdobramento, troca de código...)
    async ajustes(uid, limite = 100) {
      return checar(await supabase.from('ajustes').select('*').eq('user_id', uid)
        .order('criado_em', { ascending: false }).limit(limite));
    },

    async ranking(turmaId = null) {
      return checar(await supabase.rpc('ranking', { p_turma_id: turmaId }));
    },

    async negociacaoLiberada() {
      return checar(await supabase.rpc('negociacao_liberada'));
    },

    async souAdmin() {
      return checar(await supabase.rpc('is_admin'));
    },

    // Histórico diário de uma ação (desde = 'AAAA-MM-DD' ou null para tudo)
    async historico(ticker, desde = null) {
      let q = supabase.from('cotacoes').select('data, preco, abertura, maxima, minima, volume')
        .eq('ticker', ticker).order('data');
      if (desde) q = q.gte('data', desde);
      return checar(await q);
    },

    // Minigráficos das listas: { PETR4: [31.2, 31.5, ...], ... } desde a data
    async linhasMercado(desde) {
      const linhas = checar(await supabase.rpc('linhas_mercado', { p_desde: desde }));
      return Object.fromEntries(linhas.map((l) => [l.ticker, l.precos.map(Number)]));
    },

    // Patrimônio do aluno dia a dia (gráfico da tela Início)
    async patrimonioDiario(uid) {
      return checar(await supabase.from('patrimonio_diario').select('data, patrimonio')
        .eq('user_id', uid).order('data'));
    },

    // Foto de perfil: vai para o Storage (avatares/<id>/foto.jpg) e o endereço fica no perfil
    async enviarFoto(uid, blob) {
      const caminho = `${uid}/foto.jpg`;
      const { error } = await supabase.storage.from('avatares')
        .upload(caminho, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
      if (error) throw new Error('Não foi possível enviar a foto. Tente de novo.');
      const { data } = supabase.storage.from('avatares').getPublicUrl(caminho);
      const url = `${data.publicUrl}?v=${Date.now()}`;   // muda a cada envio, para não mostrar a antiga
      return checar(await supabase.rpc('definir_foto', { p_url: url }));
    },

    async removerFoto(uid) {
      await supabase.storage.from('avatares').remove([`${uid}/foto.jpg`]);
      checar(await supabase.rpc('definir_foto', { p_url: null }));
    },

    async executarOrdem(ticker, tipo, quantidade) {
      return checar(await supabase.rpc('executar_ordem', {
        p_ticker: ticker, p_tipo: tipo, p_quantidade: quantidade,
      }));
    },

    // ---------------- área do gestor ----------------
    async turmas() {
      return checar(await supabase.rpc('turmas_painel'));
    },
    async criarTurma(nome, dominio) {
      return checar(await supabase.rpc('criar_turma', { p_nome: nome, p_dominio_email: dominio || null }));
    },
    async atualizarTurma(id, { nome, dominio, ativa }) {
      return checar(await supabase.rpc('atualizar_turma', {
        p_id: id, p_nome: nome, p_dominio_email: dominio || null, p_ativa: ativa,
      }));
    },
    async novoToken(id) {
      return checar(await supabase.rpc('novo_token_turma', { p_id: id }));
    },
    async alunosTurma(id) {
      return checar(await supabase.rpc('alunos_turma', { p_turma_id: id }));
    },
    async definirPausa(pausada) {
      return checar(await supabase.rpc('definir_pausa', { p_pausada: pausada }));
    },
    async coletas(limite = 10) {
      return checar(await supabase.from('coletas').select('*')
        .order('executada_em', { ascending: false }).limit(limite));
    },
    async alertas() {
      return checar(await supabase.rpc('alertas_abertos'));
    },
    async resolverAlerta(id) {
      return checar(await supabase.rpc('resolver_alerta', { p_id: id }));
    },
    async eventos(limite = 30) {
      return checar(await supabase.from('eventos_corporativos').select('*')
        .order('executado_em', { ascending: false }).limit(limite));
    },
    async impactoAcao(ticker) {
      const linhas = checar(await supabase.rpc('impacto_acao', { p_ticker: ticker }));
      return linhas[0];
    },
    async trocarCodigo(antigo, novo, nome) {
      return checar(await supabase.rpc('renomear_acao', { p_antigo: antigo, p_novo: novo, p_nome: nome || null }));
    },
    async desdobrar(ticker, de, para, dataEx) {
      return checar(await supabase.rpc('ajustar_desdobramento', {
        p_ticker: ticker, p_de: de, p_para: para, p_data_ex: dataEx || null,
      }));
    },
    async converter(antiga, nova, de, para, nomeNova) {
      return checar(await supabase.rpc('converter_acao', {
        p_antiga: antiga, p_nova: nova, p_de: de, p_para: para, p_nome_nova: nomeNova || null,
      }));
    },
    async encerrar(ticker, preco, motivo) {
      return checar(await supabase.rpc('encerrar_acao', { p_ticker: ticker, p_preco: preco, p_motivo: motivo || null }));
    },
    async suspender(ticker, suspensa) {
      return checar(await supabase.rpc('suspender_acao', { p_ticker: ticker, p_suspensa: suspensa }));
    },
  };
}
