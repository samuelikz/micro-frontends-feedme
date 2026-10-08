# 🍔 Feed me: tutorial de Micro Frontends

Este repositório é um tutorial prático e completo de **micro frontends**.
Ele implementa uma aplicação de delivery de comida dividida em quatro aplicações independentes que, juntas, formam uma única experiência para o usuário.

O exemplo é baseado no artigo [Micro Frontends](https://martinfowler.com/articles/micro-frontends.html), de Cam Jackson, publicado em martinfowler.com.
O código foi escrito **sem framework e sem nenhuma dependência externa**, de propósito.
Assim sobram só os conceitos: você enxerga cada peça da arquitetura sem a "mágica" de bibliotecas.

---

## Sumário

1. [O que são micro frontends](#1-o-que-são-micro-frontends)
2. [Como rodar](#2-como-rodar)
3. [Visão geral da arquitetura](#3-visão-geral-da-arquitetura)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Passo a passo da construção](#5-passo-a-passo-da-construção)
6. [O contrato entre container e micro frontends](#6-o-contrato-entre-container-e-micro-frontends)
7. [Comunicação entre micro frontends](#7-comunicação-entre-micro-frontends)
8. [Estilos e isolamento de CSS](#8-estilos-e-isolamento-de-css)
9. [Ciclo de vida de uma navegação](#9-ciclo-de-vida-de-uma-navegação)
10. [Resiliência e tratamento de erros](#10-resiliência-e-tratamento-de-erros)
11. [Exercício: adicionar um novo micro frontend](#11-exercício-adicionar-um-novo-micro-frontend)
12. [Do tutorial para produção](#12-do-tutorial-para-produção)
13. [Trade-offs da abordagem](#13-trade-offs-da-abordagem)
14. [Padrões de código](#14-padrões-de-código)
15. [Referências](#15-referências)

---

## 1. O que são micro frontends

Micro frontends levam a ideia de microsserviços para o frontend.
Em vez de um único app gigante mantido por todos, a interface é dividida em **fatias verticais de negócio**.
Cada fatia pertence a um time, que desenvolve, testa e publica de forma independente.

> "Um estilo arquitetural em que aplicações frontend entregáveis de forma independente são compostas em um todo maior." (Cam Jackson)

Benefícios esperados:

- **Bases de código menores.** Cada app cuida de um único domínio.
- **Times autônomos.** Cada time é dono do seu app de ponta a ponta.
- **Deploy independente.** Publicar o cardápio não exige publicar o perfil.
- **Upgrades incrementais.** Dá para reescrever ou trocar a tecnologia de uma parte sem mexer no resto.

Neste tutorial, a aplicação **Feed me** é dividida assim:

| App | Porta | Responsabilidade | Time hipotético |
|---|---|---|---|
| `container` | 3000 | Header, roteamento de alto nível, carrinho e carregamento dos micro frontends | Plataforma |
| `browse` | 3001 | Busca e filtro de restaurantes | Descoberta |
| `restaurant-order` | 3002 | Cardápio e pedido de um restaurante | Pedidos |
| `user-profile` | 3003 | Dados do usuário e itens do carrinho | Conta |

---

## 2. Como rodar

**Pré-requisito:** apenas [Node.js](https://nodejs.org/) 18 ou mais recente. Não há `npm install`.

Para subir os quatro apps de uma vez:

```bash
npm start
```

Depois abra http://localhost:3000.

Cada app também roda sozinho, simulando o desenvolvimento isolado de cada time:

```bash
cd browse
npm start          # sobe só o browse em http://localhost:3001
```

Para mudar a porta, use a variável de ambiente `PORT`:

```bash
PORT=4001 npm start
```

> Se mudar a porta de um micro frontend, atualize também `container/public/config.js`.

### Experimente

1. Busque "sushi" ou filtre por culinária na página inicial.
2. Clique num restaurante e adicione itens. O contador do carrinho no header sobe.
3. Abra **Perfil** para ver o carrinho com o total.
4. Clique em **Surpreenda-me** para ir a um restaurante aleatório.
5. Encerre só o servidor do `user-profile` e navegue até **Perfil**. O resto do site continua funcionando.

---

## 3. Visão geral da arquitetura

```
                       Navegador (http://localhost:3000)
 ┌───────────────────────────────────────────────────────────────────┐
 │  CONTAINER  (index.html + container.js + container.css)           │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ Header: logo · Restaurantes · Surpreenda-me · Perfil · 🛒 3  │  │
 │  └─────────────────────────────────────────────────────────────┘  │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ <main id="micro-frontend-root">                              │  │
 │  │     um micro frontend por vez é montado aqui                 │  │
 │  └─────────────────────────────────────────────────────────────┘  │
 └───────────────────────────────────────────────────────────────────┘
          │  fetch manifest.json + injeta <script> e <link> em runtime
          ▼
 ┌────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
 │ browse  :3001  │  │ restaurant-order     │  │ user-profile :3003 │
 │ manifest.json  │  │ :3002  manifest.json │  │ manifest.json      │
 │ browse.js/.css │  │ restaurant-order.*   │  │ user-profile.*     │
 └────────────────┘  └──────────────────────┘  └────────────────────┘
```

A técnica usada é a **integração em tempo de execução via JavaScript**, a recomendada pelo artigo.
O container não conhece o código dos micro frontends no build.
Ele só sabe **onde** cada um está publicado e qual **contrato** cada um respeita.

### Por que essa técnica?

O artigo descreve várias formas de integração:

| Técnica | Como funciona | Limitação |
|---|---|---|
| Server-side includes | O servidor monta o HTML com pedaços de cada app | Pouca interatividade no cliente |
| Integração em build time | Cada micro frontend vira um pacote npm do container | Exige rebuild e redeploy do container a cada mudança |
| iframes | Cada app roda num iframe | Roteamento, deep links e responsividade ficam difíceis |
| **JavaScript em runtime** | **O container baixa o script e chama uma função global** | **É a usada aqui: flexível e com deploy independente** |
| Web Components | Cada app registra um custom element | Variação da anterior, com `<feedme-browse>` no lugar de `renderBrowse()` |

---

## 4. Estrutura de pastas

```
micro-frontends-feedme/
├── package.json              # "npm start" roda start-all.js
├── PADROES.md                # convenções de código seguidas por todos os apps
├── .editorconfig             # formatação comum (indentação, charset, fim de linha)
├── .gitignore
├── start-all.js              # sobe os 4 servidores (só para dev local)
├── shared/
│   └── static-server.js      # servidor HTTP estático mínimo, sem dependências
├── container/
│   ├── server.js             # porta 3000, com fallback de SPA
│   └── public/
│       ├── index.html        # casca da página: header, <main>, footer
│       ├── config.js         # onde cada micro frontend está publicado
│       ├── container.js      # roteamento, carregamento e carrinho
│       └── container.css     # design tokens (--fm-*) e estilos do header
├── browse/
│   ├── package.json
│   ├── server.js             # porta 3001
│   └── public/
│       ├── manifest.json     # aponta para browse.js e browse.css
│       ├── browse.js         # registra renderBrowse e unmountBrowse
│       └── browse.css        # classes prefixadas com .browse_
├── restaurant-order/         # mesma estrutura, porta 3002
└── user-profile/             # mesma estrutura, porta 3003
```

Cada micro frontend é uma **pasta autocontida**, com servidor e `package.json` próprios.
Num projeto real, cada pasta poderia ser um repositório separado.

---

## 5. Passo a passo da construção

Esta seção reconstrói o projeto na ordem em que ele foi pensado.

### Passo 1: um servidor estático por app

Arquivo: `shared/static-server.js`.

Cada micro frontend precisa ser publicado num lugar diferente, como se tivesse uma CDN própria.
Para simular isso sem dependências, há um servidor de poucas linhas que usa só o módulo `http` do Node:

```js
module.exports = function serve({ name, port, root, spaFallback = false }) {
  const server = http.createServer((req, res) => {
    // Resolve o arquivo dentro de "root" e bloqueia path traversal (403).
    // Arquivo inexistente: 404, ou index.html quando spaFallback é true.
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*', // o container busca de outras origens
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => console.log(`[${name}] http://localhost:${port}`));
  return server;
};
```

Três detalhes importam:

- **CORS liberado.** O container roda na porta 3000 e busca o manifest na 3001. Sem esse cabeçalho, o navegador bloquearia o `fetch`.
- **Fallback de SPA.** Só o container usa. Uma rota como `/restaurant/2` devolve o `index.html`, e o roteamento acontece no navegador.
- **Proteção contra path traversal.** O servidor recusa caminhos que saem da pasta `public`.

Cada app tem um `server.js` curto, que só informa nome, porta e pasta:

```js
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'browse',
  port: process.env.PORT || 3001,
  root: path.join(__dirname, 'public'),
  spaFallback: false,
});
```

O `start-all.js` só faz `require` dos quatro, para facilitar o desenvolvimento local.

### Passo 2: a casca do container

Arquivo: `container/public/index.html`.

O container renderiza **só o que é comum a todas as páginas**: header, navegação, carrinho e footer.
No meio fica um único ponto de montagem:

```html
<main id="micro-frontend-root"></main>
```

Os links internos têm o atributo `data-link`. O container intercepta esses cliques para navegar sem recarregar a página.

### Passo 3: configuração por ambiente

Arquivo: `container/public/config.js`.

```js
window.MICRO_FRONTENDS = {
  Browse: { host: 'http://localhost:3001' },
  RestaurantOrder: { host: 'http://localhost:3002' },
  UserProfile: { host: 'http://localhost:3003' },
};
```

É o único lugar onde o container sabe onde estão os micro frontends.
Como é carregado em runtime, as URLs mudam por ambiente sem rebuild.

### Passo 4: o manifest de cada micro frontend

Arquivo: `browse/public/manifest.json`.

```json
{
  "main": "/browse.js",
  "css": ["/browse.css"]
}
```

O manifest é uma camada de indireção.
Num build real, os arquivos teriam hash no nome, como `browse.3f9a1c.js`, para ficar em cache na CDN.
O container não precisa saber esse nome, porque sempre lê o manifest, que aponta para a versão atual.
É assim que cada time publica uma versão nova **sem avisar o container**.

### Passo 5: o carregador de micro frontends

Arquivo: `container/public/container.js`, função `loadMicroFrontend`.

```js
function loadMicroFrontend(name) {
  if (window[`render${name}`]) return Promise.resolve(); // já carregado
  if (loading[name]) return loading[name]; // carregamento em andamento

  const { host } = window.MICRO_FRONTENDS[name];

  loading[name] = fetch(`${host}/manifest.json`)
    .then((response) => response.json())
    .then((manifest) => Promise.all([
      ...(manifest.css || []).map((href) => loadStylesheet(host + href)),
      loadScript(host + manifest.main),
    ]))
    .catch((error) => {
      delete loading[name]; // permite tentar de novo na próxima navegação
      throw error;
    });

  return loading[name];
}
```

As funções auxiliares `loadStylesheet` e `loadScript` criam as tags `<link>` e `<script>` e devolvem uma Promise.
A de CSS sempre resolve, mesmo com erro, porque um estilo faltando não deve impedir o app de funcionar.

O fluxo é:

1. Se `render<Nome>` já existe no `window`, o app já foi carregado e nada é baixado de novo.
2. Se há um carregamento em andamento, a mesma Promise é reaproveitada. Isso evita baixar o script duas vezes.
3. Busca o `manifest.json` no host do app.
4. Injeta o CSS e o JS listados. Espera o CSS para evitar conteúdo piscando sem estilo.
5. Em caso de erro, limpa o cache para que a próxima navegação tente de novo.

### Passo 6: montar e desmontar

Função `mount` no `container.js`:

```js
const ROOT_ID = 'micro-frontend-root';

async function mount(name, params = {}) {
  if (mounted && window[`unmount${mounted}`]) {
    window[`unmount${mounted}`](ROOT_ID);
  }
  mounted = name;
  root.innerHTML = '<div class="container-loading">Carregando…</div>';

  try {
    await loadMicroFrontend(name);
    if (mounted !== name) return; // o usuário navegou durante o carregamento
    root.innerHTML = '';
    window[`render${name}`](ROOT_ID, history, params);
  } catch (error) {
    console.error(`[container] Falha ao carregar "${name}":`, error);
    root.innerHTML = '<p class="container-error" role="alert">Não foi possível carregar…</p>';
  }
}
```

- **Sempre desmonta o anterior.** O micro frontend tem a chance de remover listeners e timers.
- **Proteção contra corrida.** Se o usuário trocar de rota durante o download, o resultado antigo é descartado.
- **Erro isolado.** Uma falha aparece só dentro do `<main>`. Header e carrinho continuam funcionando.

### Passo 7: roteamento de alto nível

Função `route` no `container.js`:

```js
if (path === '/') return mount('Browse');

if (path === '/random') {
  const restaurantId = 1 + Math.floor(Math.random() * TOTAL_RESTAURANTS);
  return history.push(`/restaurant/${restaurantId}`);
}

const restaurantMatch = path.match(/^\/restaurant\/(\d+)$/);
if (restaurantMatch) return mount('RestaurantOrder', { restaurantId: restaurantMatch[1] });

if (path === '/user-profile') return mount('UserProfile', { cart: [...cart] });
```

Antes de decidir a rota, a função `updateActiveLink` destaca o item atual do menu e marca o link com `aria-current="page"` para leitores de tela.

A regra é: **cada rota pertence a um único micro frontend.**
O container decide *qual* app mostrar. O que acontece *dentro* da página é responsabilidade do app.

O objeto `history` compartilhado faz o papel do `history` do react-router citado no artigo:

```js
const history = {
  push(path) {
    window.history.pushState({}, '', path);
    route();
  },
  get location() {
    return { pathname: window.location.pathname };
  },
};

window.addEventListener('popstate', route); // botões voltar e avançar do navegador
```

### Passo 8: escrever um micro frontend

Arquivo: `browse/public/browse.js`.

Todo micro frontend segue o mesmo esqueleto:

```js
/**
 * MICRO FRONTEND "Browse": busca e filtro de restaurantes.
 * Todo arquivo abre com um cabeçalho em português explicando o papel do app e o contrato.
 */
(function () { // IIFE: nada vaza para o escopo global...
  const RESTAURANTS = [/* ... */]; // ...exceto o que for exposto de propósito

  /** Funções pequenas geram cada pedaço do HTML. */
  function renderCard(restaurant) {
    return `<article class="browse_card">...</article>`;
  }

  window.renderBrowse = (containerId, history) => {
    const element = document.getElementById(containerId);
    element.innerHTML = `...`; // renderiza só dentro do elemento recebido
    // registra eventos e usa history.push() para navegar
  };

  window.unmountBrowse = (containerId) => {
    document.getElementById(containerId).innerHTML = '';
  };
})();
```

- **`browse`** guarda o próprio estado de busca e filtro. Ao clicar num card, chama `history.push('/restaurant/2')`. Ele não sabe que existe um app de pedidos, só conhece a URL.
- **`restaurant-order`** recebe `{ restaurantId }` nos parâmetros e dispara um evento ao adicionar um item.
- **`user-profile`** recebe `{ cart }` nos parâmetros e apenas exibe os dados.

### Passos 9 e 10: comunicação e estilos

Estão detalhados nas seções [7](#7-comunicação-entre-micro-frontends) e [8](#8-estilos-e-isolamento-de-css).

---

## 6. O contrato entre container e micro frontends

O contrato é tudo o que os times precisam combinar. Ele é pequeno de propósito:

| Item | Formato | Exemplo |
|---|---|---|
| Manifest | `GET <host>/manifest.json` retorna `{ main, css? }` | `{ "main": "/browse.js", "css": ["/browse.css"] }` |
| Montagem | `window.render<Nome>(containerId, history, params)` | `window.renderBrowse` |
| Desmontagem | `window.unmount<Nome>(containerId)` | `window.unmountBrowse` |
| `history` | Objeto com `push(path)` e `location.pathname` | `history.push('/user-profile')` |
| `params` | Dados que o container passa ao montar | `{ restaurantId: '2' }` |
| Eventos | `CustomEvent` no `window` com prefixo `feedme:` | `feedme:order-added` |
| CSS | Classes prefixadas com o nome do app | `.browse_card` |

Respeitado o contrato, cada time muda à vontade o que está por dentro.
Poderia até trocar o JavaScript puro por React, Vue ou Svelte sem o container perceber.

---

## 7. Comunicação entre micro frontends

O artigo recomenda **reduzir ao mínimo** a comunicação entre apps.
Quando ela for necessária, deve usar mecanismos desacoplados. Este projeto usa três.

### 7.1 Pela URL

É a forma mais simples e mais desacoplada.
O `browse` navega para `/restaurant/3`. O container interpreta a rota e passa `restaurantId: '3'` ao `restaurant-order`.
De quebra, a URL vira um link que pode ser compartilhado.

### 7.2 Por Custom Events

Quando um item é adicionado, o `restaurant-order` anuncia isso para quem quiser ouvir:

```js
window.dispatchEvent(new CustomEvent('feedme:order-added', {
  detail: { restaurant: menu.name, item: item.name, price: item.price, quantity: 1 },
}));
```

O container escuta e atualiza o carrinho:

```js
const EVENTS = {
  ORDER_ADDED: 'feedme:order-added',
};

window.addEventListener(EVENTS.ORDER_ADDED, (event) => {
  cart.push(event.detail);
  document.getElementById('cart-count').textContent = cart.length;
});
```

Cada app guarda o nome do evento numa constante no topo do arquivo. Assim um erro de digitação aparece num só lugar.

Quem publica **não sabe quem escuta**.
Amanhã outro app pode ouvir o mesmo evento, por exemplo para analytics, sem mudar nada no `restaurant-order`.
O prefixo `feedme:` evita colisão de nomes.

### 7.3 Por parâmetros

O container guarda o carrinho, que é uma preocupação transversal, e o entrega ao `user-profile` na montagem:

```js
mount('UserProfile', { cart: [...cart] });
```

É passada uma **cópia** do array, para que o micro frontend não altere o estado do container por acidente.

### O que evitar

- **Estado global compartilhado**, como um único Redux para todos os apps. Isso recria o acoplamento do monolito.
- **Um app importar código de outro.** Código comum vira uma biblioteca versionada ou fica no container.
- **Confiar cegamente em dados de outro app.** O `user-profile` escapa o HTML dos itens do carrinho antes de exibi-los, porque eles chegam por eventos de outros apps.

---

## 8. Estilos e isolamento de CSS

CSS é global por natureza, e sem cuidado um app quebra o visual de outro.
A solução aqui é prefixar toda classe com o nome do app, no formato **`<nome-do-app>_<elemento>`**:

```css
.browse_card { }
.restaurant-order_item { }
.user-profile_avatar { }
.container-header_nav { }
```

Para manter a identidade visual, o container define **design tokens** como variáveis CSS, e os micro frontends as consomem:

```css
/* container.css */
:root {
  --fm-brand: #ff5a36;
  --fm-surface: #ffffff;
  --fm-radius: 16px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --fm-surface: #1c1c1f;
  }
}

/* browse.css */
.browse_card {
  background: var(--fm-surface);
  border-radius: var(--fm-radius);
}
```

Com isso, o modo escuro funciona em todos os apps sem que nenhum precise implementá-lo.
O mesmo vale para o contorno de foco: o container define `:focus-visible` uma vez e todos os apps herdam.
Outras alternativas citadas no artigo são CSS Modules, CSS-in-JS e Shadow DOM.

---

## 9. Ciclo de vida de uma navegação

Exemplo: o usuário está na home e clica em "Sushi Zen".

```
browse.js            clique no card → history.push('/restaurant/2')
container.js         pushState('/restaurant/2') → route()
container.js         rota casa com /restaurant/(\d+) → mount('RestaurantOrder', { restaurantId: '2' })
container.js         window.unmountBrowse('micro-frontend-root')
container.js         mostra "Carregando…"
container.js         fetch http://localhost:3002/manifest.json   (só na primeira vez)
container.js         injeta restaurant-order.css e restaurant-order.js
restaurant-order.js  ao executar, define window.renderRestaurantOrder
container.js         window.renderRestaurantOrder('micro-frontend-root', history, { restaurantId: '2' })
restaurant-order.js  desenha o cardápio
```

Quando o usuário adiciona um item:

```
restaurant-order.js  dispatchEvent('feedme:order-added', { item, price, ... })
container.js         ouve o evento → cart.push() → contador 🛒 atualiza
```

---

## 10. Resiliência e tratamento de erros

Como cada app é carregado separadamente, a falha de um não derruba os outros:

- Se o servidor de um micro frontend cair, só o `<main>` mostra uma mensagem de erro.
- Header, navegação e carrinho continuam funcionando.
- Na próxima navegação para a mesma rota, o container tenta carregar de novo.

---

## 11. Exercício: adicionar um novo micro frontend

Vamos criar um app **Orders**, com o histórico de pedidos, na porta 3004.

**1. Crie a pasta e o servidor.**

```
orders/
├── package.json
├── server.js
└── public/
    ├── manifest.json
    ├── orders.js
    └── orders.css
```

```json
{
  "name": "orders",
  "version": "1.0.0",
  "description": "Micro frontend de histórico de pedidos.",
  "private": true,
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

```js
// orders/server.js
const path = require('path');
const serve = require('../shared/static-server');

serve({
  name: 'orders',
  port: process.env.PORT || 3004,
  root: path.join(__dirname, 'public'),
  spaFallback: false,
});
```

**2. Escreva o manifest.**

```json
{
  "main": "/orders.js",
  "css": ["/orders.css"]
}
```

**3. Implemente o contrato.**

```js
/**
 * MICRO FRONTEND "Orders": histórico de pedidos.
 *
 * Contrato com o container:
 *   - window.renderOrders(containerId, history, params)
 *   - window.unmountOrders(containerId)
 */
(function () {
  window.renderOrders = (containerId, history, params) => {
    document.getElementById(containerId).innerHTML = '<h2 class="orders_title">Meus pedidos</h2>';
  };

  window.unmountOrders = (containerId) => {
    document.getElementById(containerId).innerHTML = '';
  };
})();
```

Siga as regras do [PADROES.md](PADROES.md): classes com o prefixo `orders_`, comentários em português e botões com `type="button"`.

**4. Registre no container.**

Em `container/public/config.js`:

```js
Orders: { host: 'http://localhost:3004' },
```

Na função `route()` de `container/public/container.js`:

```js
if (path === '/orders') return mount('Orders');
```

No header de `container/public/index.html`:

```html
<a href="/orders" data-link>Pedidos</a>
```

**5. Adicione `'orders'` à lista do `start-all.js`** e rode `npm start`.

### Desafios extras

- Faça o `orders` ouvir `feedme:order-added` e guardar o histórico no `localStorage`.
- Reescreva o `user-profile` em React mantendo o mesmo contrato. O container não deve mudar.
- Transforme um micro frontend num Web Component, como `<feedme-browse>`, e adapte o `mount`.
- Crie um evento `feedme:cart-cleared` e um botão "Limpar carrinho" no perfil.

---

## 12. Do tutorial para produção

Este projeto simplifica de propósito. Num sistema real, considere:

| Neste tutorial | Em produção |
|---|---|
| Uma pasta por app, num só repositório | Um repositório ou pipeline de CI/CD por app |
| `start-all.js` sobe tudo | Cada app é publicado na própria CDN ou bucket |
| `config.js` com `localhost` | URLs por ambiente, injetadas no deploy |
| Arquivos sem hash e `no-cache` | Bundles com hash e cache longo. Só o `manifest.json` sem cache |
| CORS com `*` | CORS restrito ao domínio do container |
| Dados fixos no JS | Um Backend For Frontend (BFF) por time |
| Sem testes | Testes unitários em cada app e testes de ponta a ponta no container |
| Funções globais no `window` | Module Federation, import maps ou Web Components |
| Estilos repetidos | Biblioteca de componentes compartilhada e versionada |

Ferramentas que implementam essas ideias: **Webpack ou Rspack Module Federation**, **single-spa**, **import maps** e **Web Components**.

---

## 13. Trade-offs da abordagem

Micro frontends resolvem problemas de **escala organizacional**, não técnicos. Avalie antes de adotar:

- **Tamanho do download.** Dois apps com React baixam React duas vezes, a menos que a dependência seja compartilhada.
- **Complexidade operacional.** Mais repositórios, pipelines e servidores para manter.
- **Consistência visual.** Exige design tokens e biblioteca de componentes.
- **Diferenças entre ambientes.** Um app que funciona isolado pode falhar dentro do container. Teste a integração.

Para um time pequeno com um único produto, um monolito bem modularizado costuma ser a melhor escolha.

---

## 14. Padrões de código

Todos os apps seguem as mesmas convenções, descritas em detalhe no [PADROES.md](PADROES.md). Em resumo:

| Tema | Regra |
|---|---|
| Idioma | Nomes no código em inglês. Comentários, textos de tela, logs e documentação em português do Brasil |
| Formatação | 2 espaços, UTF-8 e fim de linha LF, definidos no `.editorconfig` |
| JavaScript | `const` por padrão, nomes descritivos, constantes nomeadas e JSDoc nas funções |
| Contrato | Só `render<Nome>` e `unmount<Nome>` ficam no `window`. O resto fica dentro de uma IIFE |
| Eventos | Prefixo `feedme:` e nome guardado numa constante |
| CSS | Classes no formato `<nome-do-app>_<elemento>`, estados com `is-` e cores vindas dos tokens `--fm-*` |
| Acessibilidade | `type="button"`, `aria-label` em campos sem rótulo e foco sempre visível |
| Segurança | Dados vindos de outro app são escapados antes de entrar no HTML |

No VS Code, instale a extensão **EditorConfig for VS Code** para aplicar a formatação ao salvar.

---

## 15. Referências

- Cam Jackson, [Micro Frontends](https://martinfowler.com/articles/micro-frontends.html), martinfowler.com.
- [micro-frontends.org](https://micro-frontends.org/), de Michael Geers.
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/).
- [single-spa](https://single-spa.js.org/).
- [MDN: CustomEvent](https://developer.mozilla.org/pt-BR/docs/Web/API/CustomEvent).
- [MDN: History API](https://developer.mozilla.org/pt-BR/docs/Web/API/History_API).
