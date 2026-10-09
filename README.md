# Constellate

**Constellate** is a collaborative brainstorming canvas that helps teams turn individual ideas into shared priorities. Participants add notes, group related ideas into clusters, vote on the most important ideas, and export the results.

The workflow is designed around four steps: **Lobby → Diverge → Cluster → Converge → Results/Export**.

## Features

- **Shared brainstorming canvas** — create, edit, move, and style notes on a zoomable canvas.
- **Real-time collaboration** — room participants can see board updates and other participants' cursors through Socket.IO.
- **Room links and participant names** — create a room and invite others to join it.
- **Session question** — give the brainstorm a central question to guide the discussion.
- **Silent brainstorming** — authors can be hidden during Diverge so ideas can be considered on their own.
- **Clusters** — group related notes and name the themes.
- **Connectors** — draw connections between related notes, including curved arrows.
- **Phases** — organize the session into Diverge, Cluster, and Converge stages.
- **Dot-budget voting** — participants use a limited number of votes to highlight important notes and clusters.
- **Results and Markdown export** — review vote results and export the brainstorm as Markdown.
- **Canvas navigation** — pan and zoom, fit the board to the viewport, and use the minimap.
- **Room persistence** — room state can be saved as JSON files by the backend.

## Tech Stack

- **React** — frontend UI and component structure.
- **Vite** — frontend development server and build tool.
- **Tailwind CSS v4** — styling and design tokens.
- **Konva / React-Konva** — canvas rendering and interactive canvas objects.
- **React Router** — client-side navigation.
- **Axios** — HTTP requests to the backend API.
- **Node.js and Express** — backend API and room management.
- **Socket.IO** — real-time room events, board synchronization, and cursor updates.
- **JSON file persistence** — local room state storage during development.
- **npm** — dependency management.

## Project Structure

```text
Constellate/
├── Backend/
│   ├── src/
│   │   ├── config/       # Environment configuration
│   │   ├── controllers/  # HTTP route controllers
│   │   ├── lib/          # Room logic and persistence
│   │   ├── routes/       # Express routes
│   │   └── sockets/      # Socket.IO event handlers
│   ├── data/             # Local persisted room files (created at runtime)
│   ├── server.js
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── app/           # Router and app setup
│   │   ├── features/      # Feature-specific API and hooks
│   │   ├── components/    # Shared UI and canvas components
│   │   ├── lib/           # API, socket, and identity helpers
│   │   └── styles/        # Global styles and design tokens
│   └── .env.example
└── README.md
```

Folder contents may evolve as the project develops.

## How to Run Locally

### 1. Clone or download the repository

```bash
git clone https://github.com/Naynsi2012/Constellate.git
cd Constellate
```

If you downloaded the source as a ZIP, extract it and open a terminal in the extracted project folder.

### 2. Configure the backend environment

```bash
cd Backend
npm install
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

Open `Backend/.env` and update the values if needed:

```dotenv
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
# Optional: ROOM_DATA_DIR=data/rooms
```

### 3. Start the backend

Run this from the `Backend` directory:

```bash
npm run dev
```

The backend will use the configured port, normally `http://localhost:3000`.

### 4. Configure the frontend environment

Open a second terminal from the project root:

```bash
cd Frontend
npm install
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env`.

The frontend `.env` should contain the backend API URL:

```dotenv
VITE_API_URL=http://localhost:3000
```

### 5. Start the frontend

Run this from the `Frontend` directory:

```bash
npm run dev
```

Vite will print the local URL. It is usually:

```text
http://localhost:5173
```

Keep both the backend and frontend terminals running while developing.

## AI Usage

AI assistance was used during development as a support tool for implementation, debugging, and understanding parts of the codebase. In particular, AI was used to help with:

- **Curved connector and arrow bending** — working through the geometry for curved arrows, control points, arrowheads, and how connector bends are rendered on the canvas.
- **Socket.IO connections** — understanding client/server connection setup, joining rooms, event handling, broadcasting updates, and synchronizing shared room state.
- **Debugging and integration** — investigating errors, reviewing component and backend interactions, and resolving issues found while integrating canvas features with real-time room behavior.
- **Project setup** — clarifying environment configuration and how the frontend API and backend server communicate.

AI suggestions were reviewed and adapted during implementation. The project’s final behavior should be validated through local testing, particularly for multi-user synchronization and phase permissions.