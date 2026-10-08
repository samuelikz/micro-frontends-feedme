# Padrões do projeto

Este guia reúne as convenções que todos os apps do **Feed me** seguem.
O objetivo é que qualquer pessoa do time abra qualquer micro frontend e se sinta em casa.

---

## 1. Idioma

| O quê | Idioma | Exemplo |
|---|---|---|
| Nomes no código (variáveis, funções, classes CSS) | Inglês | `renderBrowse`, `formatBRL`, `.browse_card` |
| Comentários e JSDoc | Português do Brasil | `/** Formata um número como moeda brasileira. */` |
| Textos exibidos ao usuário | Português do Brasil | `"Seu carrinho está vazio."` |
| Mensagens de log e de erro | Português do Brasil | `[container] Falha ao carregar "Browse"` |
| Documentação (README, guias) | Português do Brasil | este arquivo |

Os nomes ficam em inglês porque as APIs do navegador e do Node estão em inglês.
Misturar `pedidoAdicionado` com `addEventListener` atrapalha a leitura.

## 2. Estrutura de cada micro frontend

```
<nome-do-app>/
├── package.json        # nome, descrição, engines e script "start"
├── server.js           # sobe o servidor estático na porta do app
└── public/
    ├── manifest.json   # aponta para o JS e o CSS do app
    ├── <nome-do-app>.js
    └── <nome-do-app>.css
```

- A pasta usa **kebab-case**, por exemplo `restaurant-order`.
- O nome usado no contrato usa **PascalCase**, por exemplo `RestaurantOrder`.

## 3. Contrato com o container

Todo micro frontend expõe exatamente duas funções globais:

```js
window.render<Nome>(containerId, history, params);
window.unmount<Nome>(containerId);
```

Regras:

- Todo o resto fica dentro de uma IIFE. Nada além do contrato vaza para o `window`.
- O app renderiza **apenas** dentro do elemento recebido em `containerId`.
- Para navegar, o app usa `history.push(url)`. Nunca importa nem chama outro micro frontend.
- O `unmount` remove tudo o que o `render` criou: HTML, listeners no elemento raiz e timers.

## 4. Comunicação entre apps

- **Navegação:** pela URL, com `history.push`.
- **Avisos:** `CustomEvent` disparado no `window`, sempre com o prefixo `feedme:`.
- **Dados de entrada:** pelo terceiro parâmetro do `render` ("props").
- Guarde o nome do evento numa constante no topo do arquivo, como `ORDER_ADDED_EVENT`.
- Dados recebidos de outro app são tratados como não confiáveis. Escape antes de jogar no HTML.

## 5. JavaScript

- Indentação de 2 espaços, aspas simples, ponto e vírgula e vírgula final em listas de várias linhas.
- `const` por padrão. Use `let` só quando o valor muda.
- Nomes descritivos: `restaurant` em vez de `r`, `event` em vez de `e`.
- Números e textos fixos viram constantes nomeadas no topo, como `FEEDBACK_DURATION_MS`.
- Funções públicas e helpers ganham um comentário JSDoc curto em português.
- Prefira funções pequenas que geram HTML, como `renderCard` e `renderMenuItem`.
- Use delegação de eventos: um listener no elemento pai em vez de um por botão.
- Valores em reais sempre passam por `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.

## 6. CSS

- Classes no formato **`<nome-do-app>_<elemento>`**, com um único underscore separando o app do elemento: `.browse_card`, `.restaurant-order_item`.
- Estados usam o prefixo `is-`: `.is-active`, `.is-done`.
- Cores, sombras, raios e fonte vêm dos tokens `--fm-*` definidos no `container.css`.
- Uma declaração por linha e uma linha em branco entre blocos.
- Nenhum micro frontend estiliza tags soltas como `h1` ou `button` fora do seu próprio prefixo.

## 7. Acessibilidade

- `<html lang="pt-BR">`.
- Todo `<button>` tem `type="button"`.
- Campos sem rótulo visível recebem `aria-label`.
- Emojis decorativos recebem `aria-hidden="true"`.
- Elementos clicáveis que não são links nem botões recebem `tabindex="0"` e respondem à tecla Enter.
- O foco do teclado sempre fica visível. O container define o estilo `:focus-visible`.

## 8. Formatação automática

O arquivo `.editorconfig` na raiz define indentação, charset e fim de linha.
No VS Code, instale a extensão **EditorConfig for VS Code** para aplicar as regras ao salvar.
