/**
 * Servidor de desenvolvimento do app "container".
 * Porta padrão: 3000. Pode ser trocada pela variável de ambiente PORT.
 */
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'container',
  port: process.env.PORT || 3000,
  root: path.join(__dirname, 'public'),
  spaFallback: true, // o container faz roteamento no cliente
});
