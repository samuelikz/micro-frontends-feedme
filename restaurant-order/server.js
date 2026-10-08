/**
 * Servidor de desenvolvimento do app "restaurant-order".
 * Porta padrão: 3002. Pode ser trocada pela variável de ambiente PORT.
 */
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'restaurant-order',
  port: process.env.PORT || 3002,
  root: path.join(__dirname, 'public'),
  spaFallback: false,
});
