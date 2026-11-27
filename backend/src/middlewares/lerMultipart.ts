// O formulário "Adicionar" do app envia os dados como multipart/form-data
// (um FormData), e o express.json() NÃO entende esse formato: sem este
// middleware, req.body chegaria vazio.
//
// O "multer" lê os campos de texto para dentro de req.body.
// Se vier um arquivo (a foto), ele é lido para a memória e simplesmente
// descartado: o recurso de fotos ainda não existe, mas o app não dá erro.
//
// FOTOS (futuro): trocar memoryStorage por diskStorage (salvar em uploads/).
import multer from 'multer';

export const lerMultipart = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // foto de até 5 MB
    files: 1,                  // no máximo 1 arquivo
    fields: 20,                // no máximo 20 campos de texto
  },
}).any();
