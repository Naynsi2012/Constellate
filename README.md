# Constellate
A personal brainstorming canvas project for sharing ideas and collaborating with friends.

## Note:
Please test this project on google chrome and safari. Due to some reason the project does not open on Brave and other browsers sometimes.

## Theme
I chose collaboration theme

### Reason to choose this Theme

The main reason to select this theme was to create a collaborative platform to ensure efficient working without the distraction of online projects and just cause I wanted to basically.

## How to use Constellate

**PHASES:** Lobby → Diverge → Cluster → Converge → Results/Export.

1. Create/Join a Room

2. Diverge
In this phase, participants can contribute ideas to shared canvas.
Create sticky notes to write your ideas.
Authors are hidden during this phase so participants can focus on ideas rather than who suggested them.

3. Cluster
Group the notes into clusters with special name.
Use connectors to show relationships between ideas.

4. Converge
Review the notes and clusters on the board and use your available vote dots to support important ideas.
Distribute votes according to priorities.
Observe the voting indicators to see which ideas receive the most support.

5. Results
Review the ranked ideas and clusters and see for the best one.
We can use the export option to download the results as a Markdown (.md) file.

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
git clone https://github.com/Naynsi2012/Constellate.git
cd Constellate

### 2. Configure the backend 
cd Backend
npm install
cp .env.example .env

Open Backend/.env and update the values:

FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
DATA_DIR=./data/rooms
ROOM_TTL=3d
ROOM_CLEANUP_INTERVAL=1h

### 3. Start the backend
Run this from the Backend directory:
npm run dev

### 4. Configure the frontend
Open a second terminal from the project root:

cd Frontend
npm install
cp .env.example .env

The frontend `.env` should contain the backend API URL:
VITE_API_URL=http://localhost:3000

### 5. Start the frontend
Run this from the Frontend directory:
npm run dev

Keep both the backend and frontend terminals running

## AI Usage

AI assistance was used during development as a support tool for implementation, debugging, and understanding parts of the codebase. In particular, AI was used to help with:

- **Curved connector and arrow bending** — working through the geometry for curved arrows, control points, arrowheads, and how connector bends are rendered on the canvas.
- **Socket.IO connections** — understanding client/server connection setup, joining rooms, event handling, broadcasting updates, and synchronizing shared room state.
- **Debugging and integration** — investigating errors, reviewing component and backend interactions, and resolving issues found while integrating canvas features with real-time room behavior.
- **Project setup** — clarifying environment configuration and how the frontend API and backend server communicate.

AI suggestions were reviewed and adapted during implementation. The project’s final behavior should be validated through local testing, particularly for multi-user synchronization and phase permissions.

## PROJECT SCREENSHOTS:
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 07 31 AM" src="https://github.com/user-attachments/assets/8dc2e312-38ef-4c18-8ecc-19cce9686453" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 07 24 AM" src="https://github.com/user-attachments/assets/82c1da79-1728-40c2-ac08-911ca62346e3" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 10 33 AM" src="https://github.com/user-attachments/assets/60821963-8cf1-4b4f-b426-cb12d7af344e" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 10 11 AM" src="https://github.com/user-attachments/assets/6e0a6dfb-7c1d-47a7-a0dd-0d9f85431d50" />

