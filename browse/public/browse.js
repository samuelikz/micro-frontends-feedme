/**
 * MICRO FRONTEND "Browse": busca e filtro de restaurantes.
 *
 * Time e deploy independentes. Expõe apenas duas funções globais,
 * que formam o "contrato" com o container:
 *   - window.renderBrowse(containerId, history)
 *   - window.unmountBrowse(containerId)
 */
(function () {
  /** Filtro que mostra todas as culinárias. */
  const ALL_CUISINES = 'Todas';

  /** Num cenário real, estes dados viriam do backend deste time (Backend For Frontend). */
  const RESTAURANTS = [
    { id: 1, name: 'Burger Palace', cuisine: 'Hambúrguer', emoji: '🍔', color: '#ffe2c6', rating: 4.7, time: '25-35' },
    { id: 2, name: 'Sushi Zen', cuisine: 'Japonesa', emoji: '🍣', color: '#ffd9df', rating: 4.9, time: '35-45' },
    { id: 3, name: 'Cantina da Nonna', cuisine: 'Italiana', emoji: '🍝', color: '#fff0b8', rating: 4.6, time: '30-40' },
    { id: 4, name: 'Taco Loco', cuisine: 'Mexicana', emoji: '🌮', color: '#d7f2d0', rating: 4.5, time: '20-30' },
  ];

  const CUISINES = [ALL_CUISINES, ...new Set(RESTAURANTS.map((restaurant) => restaurant.cuisine))];

  /** Gera o HTML do card de um restaurante. */
  function renderCard(restaurant) {
    return `
      <article class="browse_card" data-id="${restaurant.id}" tabindex="0" role="link"
        aria-label="Abrir cardápio de ${restaurant.name}">
        <div class="browse_cover" style="background: ${restaurant.color}">${restaurant.emoji}</div>
        <div class="browse_body">
          <h3>${restaurant.name}</h3>
          <div class="browse_meta">
            <span class="browse_rating">★ ${restaurant.rating}</span>
            <span>${restaurant.cuisine}</span>
            <span>${restaurant.time} min</span>
          </div>
        </div>
      </article>`;
  }

  /**
   * Monta a tela de busca dentro do elemento informado.
   *
   * @param {string} containerId - Id do elemento onde o app será montado.
   * @param {{ push: (path: string) => void }} history - Navegação compartilhada do container.
   */
  window.renderBrowse = (containerId, history) => {
    const element = document.getElementById(containerId);

    // Estado local deste micro frontend.
    let searchTerm = '';
    let selectedCuisine = ALL_CUISINES;

    element.innerHTML = `
      <section class="browse_hero">
        <h1>Com fome de quê hoje?</h1>
        <p>Os melhores restaurantes da cidade, entregues na sua porta.</p>
        <input class="browse_filter" type="search" aria-label="Buscar restaurante ou culinária"
          placeholder="🔍  Buscar restaurante ou culinária…" />
      </section>
      <div class="browse_chips" role="group" aria-label="Filtrar por culinária">
        ${CUISINES.map((cuisine) => `
          <button type="button" class="browse_chip" data-cuisine="${cuisine}">${cuisine}</button>`).join('')}
      </div>
      <div class="browse_list"></div>`;

    const list = element.querySelector('.browse_list');

    /** Redesenha a lista aplicando a busca e o filtro de culinária. */
    const draw = () => {
      element.querySelectorAll('.browse_chip').forEach((chip) => {
        const isActive = chip.dataset.cuisine === selectedCuisine;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });

      const term = searchTerm.toLowerCase();
      const filtered = RESTAURANTS.filter((restaurant) => {
        const matchesCuisine = selectedCuisine === ALL_CUISINES || restaurant.cuisine === selectedCuisine;
        const matchesSearch = `${restaurant.name} ${restaurant.cuisine}`.toLowerCase().includes(term);
        return matchesCuisine && matchesSearch;
      });

      list.innerHTML = filtered.length
        ? filtered.map(renderCard).join('')
        : '<p class="browse_empty">Nenhum restaurante encontrado 😕</p>';
    };

    element.querySelector('.browse_filter').addEventListener('input', (event) => {
      searchTerm = event.target.value;
      draw();
    });

    element.querySelector('.browse_chips').addEventListener('click', (event) => {
      const chip = event.target.closest('.browse_chip');
      if (!chip) return;
      selectedCuisine = chip.dataset.cuisine;
      draw();
    });

    // Navegação entre micro frontends: pela URL, usando o history recebido do container.
    const openRestaurant = (event) => {
      const card = event.target.closest('.browse_card');
      if (card) history.push(`/restaurant/${card.dataset.id}`);
    };
    list.addEventListener('click', openRestaurant);
    list.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') openRestaurant(event);
    });

    draw();
  };

  /**
   * Desmonta o app. Limpar o HTML também descarta os listeners dos elementos internos.
   *
   * @param {string} containerId - Id do elemento onde o app está montado.
   */
  window.unmountBrowse = (containerId) => {
    document.getElementById(containerId).innerHTML = '';
  };
})();
