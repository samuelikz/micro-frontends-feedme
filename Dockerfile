# Versão fixa do Node (falhas de segurança de out/2026 corrigidas na 24.22.1).
# Cada app no Dokploy troca o CMD por `node <app>/server.js`.
FROM node:24.22.1-alpine
WORKDIR /app
COPY . .
USER node
CMD ["node", "start-all.js"]
