import express from "express";
import expressWs from "express-ws";
import { nanoid, customAlphabet } from "nanoid";
import path from "path";

import game from "./games/common.js";

const rooms = {};

const generateRoomId = customAlphabet("ABCDEFGHJKLMNOPQRSTUVWXYZ", 6);

function broadcast(room, message) {
  for (const playerId in room.playerSockets) {
    for (const socket of room.playerSockets[playerId]) {
      socket.send(message);
    }
  }
}

function handleMessage(roomId, playerId, message) {
  if (message.type === "HEARTBEAT") {
    return;
  }

  const room = rooms[roomId];
  if (!room) {
    return;
  }
  const originalGame = room.game;
  room.game = game(room.game, { playerId, ...message });
  if (room.game !== originalGame) {
    broadcast(
      room,
      JSON.stringify({ type: "GAME_STATE", gameState: room.game })
    );
  }
}

function broadcastConnectedPlayersUpdate(room) {
  broadcast(
    room,
    JSON.stringify({
      type: "CONNECTED_PLAYERS",
      playerIds: Object.keys(room.playerSockets).filter(
        (id) => room.playerSockets[id].length
      ),
    })
  );
}

const app = express();
expressWs(app);
app.use(express.json());

// Force clients onto https in production
app.use((req, res, next) => {
  if (
    !req.secure &&
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV &&
    process.env.NODE_ENV !== "development"
  ) {
    return res.redirect(`https://${req.get("host")}${req.url}`);
  }
  next();
});

// Start a new room.
app.post("/api/rooms", (req, res) => {
  const roomId = generateRoomId();
  rooms[roomId] = {
    playerSockets: {},
  };
  res.send({ roomId });
});

// Establish a websocket connection to send and receive game state updates in real time
app.ws("/api/rooms/:id", async (ws, req) => {
  const roomId = req.params.id ?? nanoid();
  const playerId = req.query.playerId;

  // Ensure this room exists
  if (!rooms[roomId]) {
    ws.send('{"type":"ERROR","message":"Room does not exist"}');
    ws.close();
    return;
  }
  const room = rooms[roomId];

  // Register this websocket
  if (!room.playerSockets[playerId]) {
    room.playerSockets[playerId] = [];
  }
  room.playerSockets[playerId].push(ws);
  broadcastConnectedPlayersUpdate(room);

  // Handle incoming messages
  ws.on("message", async (e) => {
    try {
      handleMessage(roomId, playerId, JSON.parse(e));
    } catch (err) {
      console.warn("Error handling message", e);
      console.trace(err.stack);
    }
  });

  // A player closes their tab or loses connection
  ws.on("close", async () => {
    // Unregister this websocket
    room.playerSockets[playerId] = room.playerSockets[playerId].filter(
      (s) => s !== ws
    );
    broadcastConnectedPlayersUpdate(room);
  });

  // Send the initial game state
  ws.send(JSON.stringify({ type: "GAME_STATE", gameState: room.game }));
});

// Serve the client web app
app.use(express.static("client"));
app.get("/*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "client", "index.html"));
});

const port = 8080;
app.listen(port, (err) => {
  if (err) {
    return console.error("something bad happened", err);
  }
  console.info(`server is listening on ${port}`);
});
