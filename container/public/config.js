/**
 * Endereço de publicação de cada micro frontend.
 * Rodando local (npm start), aponta para as portas de desenvolvimento;
 * em produção, cada micro frontend tem seu próprio domínio.
 */
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const host = (app, port) => (isLocal ? `http://localhost:${port}` : `https://feed-${app}.aioher.com`);

window.MICRO_FRONTENDS = {
  Browse: { host: host('browse', 3001) },
  RestaurantOrder: { host: host('restaurant-order', 3002) },
  UserProfile: { host: host('user-profile', 3003) },
};
