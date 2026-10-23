# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

No dependencies, no build, no tests, no linter. Node 18+ only.

- `npm start` (root): runs `start-all.js`, which boots all four servers. Open http://localhost:3000.
- `cd <app> && npm start`: runs one app alone. Override the port with `PORT=4001 npm start`.

## Architecture

Micro-frontends tutorial (based on Cam Jackson's martinfowler.com article) using **runtime JavaScript integration**, written in vanilla JS on purpose. The README is the tutorial itself and PADROES.md holds the conventions. Keep both in sync when you change behavior they describe.

| App | Port | Contract name |
|---|---|---|
| `container` | 3000 | shell: header, routing, cart |
| `browse` | 3001 | `Browse` |
| `restaurant-order` | 3002 | `RestaurantOrder` |
| `user-profile` | 3003 | `UserProfile` |

- Each app is a static server (`<app>/server.js` → `shared/static-server.js`, with CORS `*`, `no-cache`, and path-traversal guard). Only the container uses `spaFallback`.
- `container/public/config.js` maps contract names to hosts: `localhost:<port>` locally, `https://feed-<app>.aioher.com` in production. A new app or a port change must be updated here.
- `container/public/container.js`: `route()` maps URL to app, `mount()` unmounts the previous app and guards against navigation races, and `loadMicroFrontend()` fetches `<host>/manifest.json` then injects its `css` and `main`.
- **Contract:** each app exposes only `window.render<Name>(containerId, history, params)` and `window.unmount<Name>(containerId)`. Everything else lives in an IIFE. Apps never call each other.
- **Communication:** navigation goes through the URL (`history.push`), notifications through `CustomEvent`s on `window` prefixed `feedme:` (for example `feedme:order-added`, which the container uses to build the cart), and data through `params` (the container passes a copy of the cart to UserProfile). Data from other apps is untrusted and must be HTML-escaped.
- **CSS:** classes use the `<app-name>_<element>` format, states use `is-`, and colors and radii come from `--fm-*` tokens in `container.css` (dark mode included).

Adding an app: new folder in the same shape, register it in `config.js`, `route()`, the header in `index.html`, and `start-all.js` (see README §11).

## Next.js version (`next/`)

Port of the same app to Next.js 16.4 + TypeScript using **Multi-Zones**, as an npm workspace. Run `npm install`, then `npm run dev` (all zones) or `npm run build` inside `next/`.

- `container` renders no pages. Its `next.config.ts` rewrites `/`, `/restaurant/:id`, and `/user-profile` (plus each zone's `/<zone>-static/*` assets) to the zones, with URLs from `BROWSE_URL`, `RESTAURANT_ORDER_URL`, and `USER_PROFILE_URL`. `/random` is a route handler.
- Each zone sets `assetPrefix: '/<zone>-static'` and wraps its layout in `Shell` from `@feedme/shared` (header, footer, `--fm-*` tokens).
- Cross-zone links must be plain `<a>`, not `<Link>`, because navigation between zones is a full reload.
- The cart is a cookie (`feedme_cart`) read on the server (`@feedme/shared/cart`). Cookies are per host, not per port, so every zone sees it. The "Adicionar" button calls the Server Action in `restaurant-order/app/actions.ts`, which takes only the restaurant id and item index. Name and price come from `@feedme/shared/restaurants`, never from the client. Keep Server Actions inside a zone app: a `'use server'` file in the shared package pulled `next/headers` into the browser bundle.
- Restaurant data has one source: `@feedme/shared/restaurants`. Look up by id with `findRestaurant` (a Map), never by object key.
- `npm run test:smoke` checks the container's routes. Requires `npm run dev` running.
- CSS keeps the same `<app>_<element>` prefixed global classes as the vanilla version.

## Conventions (PADROES.md)

- Code identifiers in English. Comments/JSDoc, UI text, logs, and docs in **Brazilian Portuguese**.
- 2 spaces, single quotes, semicolons, trailing commas, LF (`.editorconfig`).
- `const` by default, named constants for magic values, a short JSDoc on functions, small HTML-generating functions, and event delegation.
- Money values are formatted with `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Buttons use `type="button"`, unlabeled inputs get an `aria-label`, and focus stays visible.
