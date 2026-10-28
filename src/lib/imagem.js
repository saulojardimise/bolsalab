// Reduz uma foto para um quadrado de 320×320 em JPEG (uns 30 KB), cortando pelo centro.
// Fotos de celular têm vários MB; enviar pequena economiza a internet do aluno e o espaço do Supabase.
export async function reduzirFoto(arquivo, lado = 320) {
  if (!arquivo || !arquivo.type?.startsWith('image/')) {
    throw new Error('Escolha uma imagem (foto JPG ou PNG).');
  }
  let imagem;
  try {
    imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    imagem = await carregarComTagImg(arquivo);
  }
  const menor = Math.min(imagem.width, imagem.height);
  const sx = (imagem.width - menor) / 2;
  const sy = (imagem.height - menor) / 2;

  const tela = document.createElement('canvas');
  tela.width = lado;
  tela.height = lado;
  const ctx = tela.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imagem, sx, sy, menor, menor, 0, 0, lado, lado);
  imagem.close?.();

  const blob = await new Promise((ok) => tela.toBlob(ok, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Não foi possível preparar a foto. Tente outra imagem.');
  return blob;
}

function carregarComTagImg(arquivo) {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Este formato de imagem não é aceito. Use JPG ou PNG.')); };
    img.src = url;
  });
}
