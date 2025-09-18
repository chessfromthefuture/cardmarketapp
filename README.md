<div align="center">

# Cardmarket App (One Piece)

Identify trading cards from images or search by name/code, enrich with Cardmarket metadata, and export a clean CSV for inventory management.

</div>

## Features

- Identify a card from an uploaded photo (client + simple API)
- Search One Piece TCG locally or via API by name, code, set, and rarity
- Quick-pick sample cards for instant demoing
- Edit language, condition, notes; maintain an in-memory inventory
- Export your inventory as CSV
- Admin tools to refresh/import the One Piece dataset

## Tech Stack

- React 18 + Vite 5 (frontend)
- Express (API) with `node-fetch`, `multer`, `cors`
- Optional OCR via `tesseract.js`

## Getting Started

Prerequisites: Node 18+

1. Install dependencies

```bash
npm install
```

2. Run web and API together (recommended)

```bash
npm run dev:all
```

This starts Vite at `http://localhost:5173` and the API on `http://localhost:3000` (proxied as `/api`).

Alternatively, run them separately:

```bash
npm run dev      # Frontend (Vite)
npm run server   # Backend (Express)
```

## Project Structure

```
server/           Express API endpoints (identify, search, import, stats)
src/              React app
  data/           One Piece dataset helpers
public/           Static assets and demo page
```

## Demo Page (no build required)

There is a static demo at `public/demo.html` that showcases the concept and links back to the full app. You can open it directly in a browser or serve it from Vite.

- Open directly: double-click `public/demo.html`
- Or after `npm run dev`, visit: `http://localhost:5173/demo.html`

## Environment

For most local usage you do not need environment variables. If you add private API keys or similar later, create a `.env` file in the project root and never commit it.

## Exported CSV

Exports include: id, game, set_code, card_code, name, language, cm_idProduct, cm_idExpansion, condition, notes, matched_confidence, timestamp.

## Contributing

Issues and PRs are welcome. For larger changes, please open an issue first to discuss what you would like to change.

## License

MIT
