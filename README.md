# Adyber ⚡

Adyber is a premium, real-time anonymous chat platform designed for absolute privacy and ephemeral communication. It follows a "Ghost" philosophy: no data is ever stored on the server, and all traces of communication vanish once a session ends.

Developed and maintained by **[NaitikGrover](https://github.com/NaitikGrover)** (<naitik@adyber.com>).

---

## Core Features

- **Anonymous Identity**: Initialize sessions with a temporary alias.
- **Ephemeral Rooms**: Dynamic rooms with unique 6-character codes that dissolve when participants leave.
- **Zero Persistence**: No database, no logs, no chat history.
- **Real-Time Communication**: Peer-to-peer style real-time messaging using Socket.io.
- **Ultra-Premium Design**: Built with a "Hacker-Chic" dark mode aesthetic, a stunning 360° moving universe background, smooth glassmorphism effects, and highly refined animations.
- **Fully Responsive & Tailored Mobile View**: Redesigned layouts custom-made for mobile devices—featuring a circular profile avatar, scrollable settings, custom slide-up notification popups, and collapsible/responsive menu grids.

---

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS v4, Framer Motion, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io.

---

## Getting Started

The project is split into two main directories: `client` (Frontend) and `server` (Backend).

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Running Locally

To run the application locally, you will need to start both the server and the client.

#### 1. Start the Server

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Node/Express server:
   ```bash
   npm start
   ```

#### 2. Start the Client

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

*(Note: The client may require the `NEXT_PUBLIC_SERVER_URL` environment variable to be set if the server runs on a non-default port or address.)*

---

## Deployment

Because Adyber is split into a frontend and a backend, you will deploy them separately:

1. **Backend (`server`)**: Can be deployed to any Node.js hosting provider such as Render, Railway, Heroku, or a VPS (AWS/DigitalOcean). Ensure that WebSockets are fully supported by your provider.
2. **Frontend (`client`)**: Can be easily deployed to Vercel, Netlify, or similar platforms. Make sure to set the environment variable pointing to your deployed backend URL.

---

## Philosophy

Adyber is built to allow true transient communication. Once you close the tab, the client-side session state is wiped, and the chat tunnel is gone forever. Zero logs, zero history, absolute privacy.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
