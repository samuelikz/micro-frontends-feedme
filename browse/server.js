/**
 * Servidor de desenvolvimento do app "browse".
 * Porta padrão: 3001. Pode ser trocada pela variável de ambiente PORT.
 */
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'browse',
  port: process.env.PORT || 3001,
  root: path.join(__dirname, 'public'),
  spaFallback: false,
});
