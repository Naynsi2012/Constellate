# Constellate
A personal brainstorming canvas project for sharing ideas and collaborating with friends.

## Note:
Please test this project on google chrome and safari. Due to some reason the project does not open on Brave and other browsers sometimes.

## Theme
I chose collaboration theme

### Reason to choose this Theme

The main reason to select this theme was to create a collaborative platform to ensure efficient working without the distraction of online projects and just cause I wanted to basically.

**How to use Constellate**

PHASES:
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

**Features**

Shared brainstorming canvas — create, edit, move, and style notes on a zoomable canvas.
Real-time collaboration — room participants can see board updates and other participants' cursors through Socket.IO.
Silent brainstorming — authors can be hidden during Diverge so ideas can be considered on their own.
Clusters — group related notes and name the themes.
Connectors — draw connections between related notes, including curved arrows.
Phases — organize the session into Diverge, Cluster, and Converge stages.
Dot-budget voting — participants use a limited number of votes to highlight important notes and clusters.
Results and Markdown export — review vote results and export the brainstorm as Markdown.
Canvas navigation — pan and zoom, fit the board to the viewport, and use the minimap.
Room persistence — room state can be saved as JSON files by the backend.

**Tech Stack**

React — frontend UI and component structure.
Vite — frontend development server and build tool.
Tailwind CSS v4 — styling and design tokens.
Konva / React-Konva — canvas rendering and interactive canvas objects.
React Router — client-side navigation.
Axios — HTTP requests to the backend API.
Node.js and Express — backend API and room management.
Socket.IO — real-time room events, board synchronization, and cursor updates.

**AI Usage**

AI was used to help with:
Curved connector and arrow bending — working through the geometry for curved arrows, control points, arrowheads, and how connector bends are rendered on the canvas.
Socket.IO connections — understanding client/server connection setup, joining rooms, event handling, broadcasting updates, and synchronizing shared room state.
Debugging and integration — investigating errors, reviewing component and backend interactions, and resolving issues found while integrating canvas features with real-time room behavior.
Project setup — clarifying environment configuration and how the frontend API and backend server communicate.

**PROJECT SCREENSHOTS:**
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 07 31 AM" src="https://github.com/user-attachments/assets/8dc2e312-38ef-4c18-8ecc-19cce9686453" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 07 24 AM" src="https://github.com/user-attachments/assets/82c1da79-1728-40c2-ac08-911ca62346e3" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 10 33 AM" src="https://github.com/user-attachments/assets/60821963-8cf1-4b4f-b426-cb12d7af344e" />
<img width="1456" height="763" alt="Screenshot 2026-10-30 at 3 10 11 AM" src="https://github.com/user-attachments/assets/6e0a6dfb-7c1d-47a7-a0dd-0d9f85431d50" />

