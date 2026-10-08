/**
 * MICRO FRONTEND "RestaurantOrder": cardápio e pedido de um restaurante.
 *
 * Recebe o id do restaurante pela URL (via params do container) e avisa
 * os outros apps via Custom Event quando um item é adicionado.
 *
 * Contrato com o container:
 *   - window.renderRestaurantOrder(containerId, history, { restaurantId })
 *   - window.unmountRestaurantOrder(containerId)
 */
(function () {
  /** Evento publicado ao adicionar um item. O container escuta para atualizar o carrinho. */
  const ORDER_ADDED_EVENT = 'feedme:order-added';

  /** Tempo, em milissegundos, que o botão mostra "Adicionado". */
  const FEEDBACK_DURATION_MS = 1200;

  /** Num cenário real, estes dados viriam do backend deste time. */
  const MENUS = {
    1: {
      name: 'Burger Palace',
      emoji: '🍔',
      color: '#ffe2c6',
      tagline: 'Hambúrguer artesanal · ★ 4.7',
      items: [
        { name: 'X-Burger', price: 28, description: 'Pão brioche, blend 160g, queijo' },
        { name: 'X-Bacon', price: 32, description: 'Bacon crocante e cheddar' },
        { name: 'Batata frita', price: 15, description: 'Porção média com páprica' },
      ],
    },
    2: {
      name: 'Sushi Zen',
      emoji: '🍣',
      color: '#ffd9df',
      tagline: 'Culinária japonesa · ★ 4.9',
      items: [
        { name: 'Combo 20 peças', price: 79, description: 'Sashimi, niguiri e uramaki' },
        { name: 'Temaki salmão', price: 34, description: 'Salmão fresco e cebolinha' },
        { name: 'Missoshiru', price: 12, description: 'Sopa de missô tradicional' },
      ],
    },
    3: {
      name: 'Cantina da Nonna',
      emoji: '🍝',
      color: '#fff0b8',
      tagline: 'Cozinha italiana · ★ 4.6',
      items: [
        { name: 'Lasanha', price: 52, description: 'Bolonhesa, bechamel e parmesão' },
        { name: 'Spaghetti', price: 45, description: 'Ao sugo com manjericão' },
        { name: 'Tiramisù', price: 22, description: 'Receita da nonna' },
      ],
    },
    4: {
      name: 'Taco Loco',
      emoji: '🌮',
      color: '#d7f2d0',
      tagline: 'Comida mexicana · ★ 4.5',
      items: [
        { name: 'Tacos (3)', price: 36, description: 'Carne, pico de gallo e guacamole' },
        { name: 'Burrito', price: 39, description: 'Frango, feijão e arroz' },
        { name: 'Nachos', price: 27, description: 'Com cheddar e jalapeño' },
      ],
    },
  };

  /** Formata um número como moeda brasileira. Ex.: 28 vira "R$ 28,00". */
  const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /** Gera o HTML de um item do cardápio. */
  function renderMenuItem(item, index) {
    return `
      <div class="restaurant-order_item">
        <div>
          <div class="restaurant-order_name">${item.name}</div>
          <div class="restaurant-order_desc">${item.description}</div>
          <div class="restaurant-order_price">${formatBRL(item.price)}</div>
        </div>
        <button type="button" class="restaurant-order_add" data-index="${index}"
          aria-label="Adicionar ${item.name} ao carrinho">+ Adicionar</button>
      </div>`;
  }

  /** Mostra por alguns instantes que o item foi adicionado. */
  function showAddedFeedback(button) {
    button.textContent = '✓ Adicionado';
    button.classList.add('is-done');
    setTimeout(() => {
      button.textContent = '+ Adicionar';
      button.classList.remove('is-done');
    }, FEEDBACK_DURATION_MS);
  }

  /**
   * Monta o cardápio do restaurante dentro do elemento informado.
   *
   * @param {string} containerId - Id do elemento onde o app será montado.
   * @param {{ push: (path: string) => void }} history - Navegação compartilhada do container.
   * @param {{ restaurantId: string }} params - Id do restaurante vindo da URL.
   */
  window.renderRestaurantOrder = (containerId, history, { restaurantId }) => {
    const element = document.getElementById(containerId);
    const menu = MENUS[restaurantId];

    if (!menu) {
      element.innerHTML = '<p>Restaurante não encontrado.</p>';
      return;
    }

    element.innerHTML = `
      <button type="button" class="restaurant-order_back">← Voltar</button>
      <section class="restaurant-order_hero" style="background: ${menu.color}">
        <div class="restaurant-order_emoji" aria-hidden="true">${menu.emoji}</div>
        <div>
          <h2>${menu.name}</h2>
          <p>${menu.tagline}</p>
        </div>
      </section>
      <h3 class="restaurant-order_title">Cardápio</h3>
      <div class="restaurant-order_menu">
        ${menu.items.map(renderMenuItem).join('')}
      </div>`;

    element.querySelector('.restaurant-order_back').onclick = () => history.push('/');

    // Delegação de eventos: um único listener para todos os botões "Adicionar".
    element.onclick = (event) => {
      const button = event.target.closest('.restaurant-order_add');
      if (!button) return;

      const item = menu.items[button.dataset.index];
      showAddedFeedback(button);

      // Comunicação desacoplada: este app não sabe quem escuta (container, perfil...).
      window.dispatchEvent(new CustomEvent(ORDER_ADDED_EVENT, {
        detail: { restaurant: menu.name, item: item.name, price: item.price, quantity: 1 },
      }));
    };
  };

  /**
   * Desmonta o app e remove o listener colocado no elemento raiz,
   * que é compartilhado com os outros micro frontends.
   *
   * @param {string} containerId - Id do elemento onde o app está montado.
   */
  window.unmountRestaurantOrder = (containerId) => {
    const element = document.getElementById(containerId);
    element.onclick = null;
    element.innerHTML = '';
  };
})();
