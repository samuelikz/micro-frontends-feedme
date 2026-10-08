/**
 * Servidor estático mínimo, sem dependências.
 * Cada app roda o seu servidor na própria porta. Isso simula deploys
 * independentes, como se cada micro frontend tivesse seu próprio host ou CDN.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

/** Tipos de conteúdo servidos, indexados pela extensão do arquivo. */
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Sobe um servidor HTTP que entrega os arquivos de uma pasta.
 *
 * @param {object} options
 * @param {string} options.name - Nome do app, usado no log.
 * @param {number|string} options.port - Porta em que o servidor escuta.
 * @param {string} options.root - Pasta com os arquivos públicos.
 * @param {boolean} [options.spaFallback=false] - Se true, rotas desconhecidas devolvem o index.html.
 */
module.exports = function serve({ name, port, root, spaFallback = false }) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

    // Impede acesso a arquivos fora da pasta pública (ex.: /../server.js).
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }

    const fileExists = fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory();
    if (!fileExists) {
      if (!spaFallback) {
        res.writeHead(404);
        return res.end('Arquivo não encontrado');
      }
      // Roteamento no cliente: o container decide o que mostrar para qualquer rota.
      filePath = path.join(root, 'index.html');
    }

    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*', // o container busca manifest e scripts de outras origens
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => console.log(`[${name}] http://localhost:${port}`));
  return server;
};
