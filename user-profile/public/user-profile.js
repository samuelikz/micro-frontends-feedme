/**
 * MICRO FRONTEND "UserProfile": dados do usuário e itens do carrinho.
 *
 * Recebe o carrinho como parâmetro do container (comunicação via "props").
 *
 * Contrato com o container:
 *   - window.renderUserProfile(containerId, history, { cart })
 *   - window.unmountUserProfile(containerId)
 */
(function () {
  /** Formata um número como moeda brasileira. Ex.: 28 vira "R$ 28,00". */
  const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /**
   * Escapa caracteres especiais de HTML.
   * Os itens do carrinho vêm de eventos de outros apps, então não confiamos no conteúdo.
   */
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  /** Texto no singular ou plural conforme a quantidade. Ex.: "1 item", "3 itens". */
  const pluralizeItems = (count) => `${count} ${count === 1 ? 'item' : 'itens'}`;

  /** Gera o HTML de uma linha do carrinho. */
  function renderCartRow(order) {
    return `
      <div class="user-profile_row">
        <div>
          <strong>${escapeHtml(order.item)}</strong>
          <p class="user-profile_muted">${escapeHtml(order.restaurant)}</p>
        </div>
        <span>${formatBRL(order.price)}</span>
      </div>`;
  }

  /** Gera o HTML do conteúdo do carrinho, ou a mensagem de carrinho vazio. */
  function renderCart(cart) {
    if (!cart.length) {
      return '<div class="user-profile_empty"><div aria-hidden="true">🛒</div>Seu carrinho está vazio.</div>';
    }

    const total = cart.reduce((sum, order) => sum + order.price * order.quantity, 0);
    return `
      ${cart.map(renderCartRow).join('')}
      <div class="user-profile_total">
        <span>Total</span>
        <span>${formatBRL(total)}</span>
      </div>`;
  }

  /**
   * Monta a tela de perfil dentro do elemento informado.
   *
   * @param {string} containerId - Id do elemento onde o app será montado.
   * @param {{ push: (path: string) => void }} history - Navegação compartilhada do container.
   * @param {{ cart?: Array<{ item: string, restaurant: string, price: number, quantity: number }> }} params
   */
  window.renderUserProfile = (containerId, history, { cart = [] } = {}) => {
    document.getElementById(containerId).innerHTML = `
      <div class="user-profile_grid">
        <aside class="user-profile_card">
          <div class="user-profile_avatar" aria-hidden="true">😋</div>
          <h2>Olá, cliente!</h2>
          <p class="user-profile_muted">Membro desde 2024</p>
          <p class="user-profile_muted">${pluralizeItems(cart.length)} no carrinho</p>
        </aside>
        <section class="user-profile_card">
          <h3>Seu carrinho</h3>
          ${renderCart(cart)}
        </section>
      </div>`;
  };

  /**
   * Desmonta o app.
   *
   * @param {string} containerId - Id do elemento onde o app está montado.
   */
  window.unmountUserProfile = (containerId) => {
    document.getElementById(containerId).innerHTML = '';
  };
})();
