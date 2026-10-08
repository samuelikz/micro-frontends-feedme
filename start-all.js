/**
 * Sobe os quatro apps de uma vez para desenvolvimento local.
 * Em produção, cada app tem pipeline e deploy próprios.
 */
const APPS = ['container', 'browse', 'restaurant-order', 'user-profile'];

APPS.forEach((app) => require(`./${app}/server.js`));
