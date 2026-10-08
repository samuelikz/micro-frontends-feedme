/**
 * Endereço de publicação de cada micro frontend.
 * Em produção seriam URLs de CDN distintas, configuradas por ambiente,
 * sem precisar gerar um novo build do container.
 */
window.MICRO_FRONTENDS = {
  Browse: { host: 'http://localhost:3001' },
  RestaurantOrder: { host: 'http://localhost:3002' },
  UserProfile: { host: 'http://localhost:3003' },
};
