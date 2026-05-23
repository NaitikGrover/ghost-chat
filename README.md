# Ghost Chat 👻

Ghost Chat is a premium, real-time anonymous chat platform designed for absolute privacy and ephemeral communication. It follows a "Ghost" philosophy: no data is ever stored on the server, and all traces of communication vanish once a session ends.

## Features

- **Anonymous Identity**: Initialize sessions with a temporary alias.
- **Ephemeral Rooms**: Dynamic rooms with unique 6-character codes that dissolve when participants leave.
- **Zero Persistence**: No database, no logs, no chat history.
- **Real-Time Communication**: Peer-to-peer style real-time messaging using Socket.io.
- **Premium Design**: Built with a "Hacker-Chic" dark mode aesthetic, smooth glassmorphism effects, and dynamic universe backgrounds.

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io.

## Getting Started

You can easily run Ghost Chat on your local machine or deploy it to a server. The project is split into two directories: `client` (Frontend) and `server` (Backend).

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
3. Start the server (default port is usually 3001 or 4000 depending on the configuration):
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

## Deployment

Because Ghost Chat is split into a frontend and a backend, you will deploy them separately.

1. **Backend (`server`)**: Can be deployed to any Node.js hosting provider such as Render, Railway, Heroku, or an AWS/DigitalOcean VPS. Ensure that WebSockets are supported by your provider.
2. **Frontend (`client`)**: Can be easily deployed to Vercel, Netlify, or similar platforms. Make sure to set the environment variable pointing to your deployed backend URL.

## Philosophy
This platform was built to allow true transient communication. Once you close the tab, the state is wiped, and the chat is gone forever.
