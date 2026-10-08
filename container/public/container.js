/**
 * CONTAINER (app "casca")
 *
 * Responsabilidades:
 *   1. Renderizar os elementos comuns a todas as páginas (header e footer).
 *   2. Fazer o roteamento de alto nível.
 *   3. Carregar e montar o micro frontend certo para cada rota.
 *   4. Cuidar das preocupações transversais, como o carrinho.
 */

/** Id do elemento onde os micro frontends são montados. */
const ROOT_ID = 'micro-frontend-root';

/** Eventos publicados pelos micro frontends. O prefixo "feedme:" evita colisões. */
const EVENTS = {
  ORDER_ADDED: 'feedme:order-added',
};

/** Quantidade de restaurantes disponíveis para o "Surpreenda-me". */
const TOTAL_RESTAURANTS = 4;

const root = document.getElementById(ROOT_ID);

// ---------------------------------------------------------------------------
// Navegação compartilhada
// Faz o papel do objeto "history" do react-router citado no artigo.
// ---------------------------------------------------------------------------

const history = {
  /** Troca a URL sem recarregar a página e renderiza a nova rota. */
  push(path) {
    window.history.pushState({}, '', path);
    route();
  },
  get location() {
    return { pathname: window.location.pathname };
  },
};

window.addEventListener('popstate', route);

// Links com o atributo data-link navegam sem recarregar a página.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  event.preventDefault();
  history.push(link.getAttribute('href'));
});

// ---------------------------------------------------------------------------
// Integração em tempo de execução via JavaScript
// Cada micro frontend publica um manifest.json apontando para seus arquivos.
// O container baixa o manifest e injeta o CSS e o <script>. Ao carregar,
// o script registra window.render<Nome> e window.unmount<Nome>.
// ---------------------------------------------------------------------------

/** Carregamentos em andamento, para não baixar o mesmo app duas vezes. */
const loading = {};

/** Injeta uma folha de estilo. Falha no CSS não impede o app de funcionar. */
function loadStylesheet(href) {
  return new Promise((resolve) => {
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href,
      onload: resolve,
      onerror: resolve,
    });
    document.head.appendChild(link);
  });
}

/** Injeta um script e resolve quando ele terminar de executar. */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement('script'), {
      src,
      onload: resolve,
      onerror: reject,
    });
    document.head.appendChild(script);
  });
}

/**
 * Baixa o manifest de um micro frontend e carrega seus arquivos.
 *
 * @param {string} name - Nome do micro frontend, como em window.MICRO_FRONTENDS.
 * @returns {Promise<void>}
 */
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

/** Nome do micro frontend montado no momento. */
let mounted = null;

/**
 * Desmonta o micro frontend atual e monta outro no lugar.
 *
 * @param {string} name - Nome do micro frontend.
 * @param {object} [params] - Dados repassados ao micro frontend ("props").
 */
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
    root.innerHTML = `
      <p class="container-error" role="alert">
        Não foi possível carregar o micro frontend "${name}". Ele está rodando?
      </p>`;
  }
}

// ---------------------------------------------------------------------------
// Roteamento de alto nível: cada rota pertence a UM micro frontend.
// ---------------------------------------------------------------------------

/** Destaca no menu o link da rota atual. */
function updateActiveLink(path) {
  document.querySelectorAll('.container-header_nav a').forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === path || (href === '/' && path.startsWith('/restaurant'));
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** Lê a URL atual e decide qual micro frontend montar. */
function route() {
  const path = window.location.pathname;
  updateActiveLink(path);
  window.scrollTo(0, 0);

  if (path === '/') return mount('Browse');

  if (path === '/random') {
    // "Surpreenda-me": o container sorteia um restaurante e delega ao RestaurantOrder.
    const restaurantId = 1 + Math.floor(Math.random() * TOTAL_RESTAURANTS);
    return history.push(`/restaurant/${restaurantId}`);
  }

  const restaurantMatch = path.match(/^\/restaurant\/(\d+)$/);
  if (restaurantMatch) return mount('RestaurantOrder', { restaurantId: restaurantMatch[1] });

  if (path === '/user-profile') return mount('UserProfile', { cart: [...cart] }); // dados via "props"

  root.innerHTML = '<p>Página não encontrada.</p>';
}

// ---------------------------------------------------------------------------
// Comunicação entre micro frontends via Custom Events
// Os micro frontends não se conhecem: publicam eventos no window e quem quiser escuta.
// ---------------------------------------------------------------------------

/** Itens do carrinho. O estado fica no container, que vive durante toda a sessão. */
const cart = [];

window.addEventListener(EVENTS.ORDER_ADDED, (event) => {
  cart.push(event.detail);
  document.getElementById('cart-count').textContent = cart.length;

  // Reinicia a animação de "pulo" do botão do carrinho.
  const cartButton = document.getElementById('cart');
  cartButton.classList.remove('is-bump');
  void cartButton.offsetWidth; // força o navegador a recalcular o layout
  cartButton.classList.add('is-bump');
});

route();
