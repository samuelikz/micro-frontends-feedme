/**
 * Servidor de desenvolvimento do app "user-profile".
 * Porta padrão: 3003. Pode ser trocada pela variável de ambiente PORT.
 */
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'user-profile',
  port: process.env.PORT || 3003,
  root: path.join(__dirname, 'public'),
  spaFallback: false,
});
