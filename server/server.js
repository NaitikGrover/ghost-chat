require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const rooms = require("./rooms/rooms");
const { v4: uuidv4 } = require("uuid");

let randomQueue = [];

const app = express();

app.use(cors());

const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.send("Server running");
});

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("create-room", ({ name, avatar, roomName, maxUsers, duration }) => {

    const roomId = uuidv4().slice(0, 6);
    const parsedDuration = parseInt(duration) || 60;
    const parsedMaxUsers = parseInt(maxUsers) || 2;

    rooms[roomId] = {
      roomId,
      roomName: roomName || "Secure Room",
      maxUsers: parsedMaxUsers,
      duration: parsedDuration,
      createdAt: Date.now(),
      adminName: name,
      bannedUsers: [],
      users: [
        {
          id: socket.id,
          name,
          avatar
        }
      ]
    };

    socket.join(roomId);

    socket.emit("room-created", {
      roomId,
      link: `${CLIENT_URL}/room/${roomId}`
    });
    
    // Set expiration timer
    setTimeout(() => {
      if (rooms[roomId]) {
        io.to(roomId).emit("room-expired", "This room has exceeded its duration and is now dissolved.");
        io.in(roomId).socketsLeave(roomId);
        delete rooms[roomId];
        console.log("Room expired:", roomId);
      }
    }, parsedDuration * 60 * 1000);

    console.log("Room created:", roomId, rooms[roomId].roomName);

  });

  socket.on("join-room", ({ roomId, name, avatar }) => {

    let room = rooms[roomId];

    if (!room) {
      socket.emit("error-message", "Room not found or has already expired.");
      return;
    }

    // Check if user is banned
    if (room.bannedUsers && room.bannedUsers.includes(name)) {
      socket.emit("error-message", "You have been banned from this room.");
      return;
    }

    // Check if user already exists
    const existingUser = room.users.find(u => u.name === name);
    if (!existingUser) {
      // Check if room is full
      if (room.users.length >= room.maxUsers) {
        socket.emit("error-message", "Room is at full capacity.");
        return;
      }
      room.users.push({
        id: socket.id,
        name,
        avatar
      });
      
      socket.to(roomId).emit("receive-message", {
        message: `${name} joined the room.`,
        senderName: "SYSTEM",
        isSystem: true,
        timestamp: Date.now()
      });
    } else {
      existingUser.id = socket.id; // update socket id
      if (avatar) existingUser.avatar = avatar; // update avatar if supplied
    }

    socket.join(roomId);

    io.to(roomId).emit("user-joined", room.users);
    
    socket.emit("room-details", {
      roomName: room.roomName,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      duration: room.duration,
      adminName: room.adminName,
      isRandom: room.isRandom
    });

    console.log(name, "joined", roomId);

  });

  socket.on("send-message", (data) => {
    const { roomId } = data;
    socket.to(roomId).emit("receive-message", {
      ...data,
      timestamp: Date.now()
    });
  });

  socket.on("terminate-room", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // Secure check: verify that the user associated with this socket is the admin
    const user = room.users.find(u => u.id === socket.id);
    if (!user || user.name !== room.adminName) {
      console.log(`Unauthorized room termination attempt for room ${roomId} by socket ${socket.id}`);
      return;
    }

    io.to(roomId).emit("room-expired", "This room has been terminated by the admin and is now dissolved.");
    io.in(roomId).socketsLeave(roomId);
    delete rooms[roomId];
    console.log("Room terminated by admin:", roomId);
  });

  socket.on("make-admin", ({ roomId, adminName, targetUserName }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Secure verification: verify that the user associated with this socket is the current admin
    const adminUser = room.users.find(u => u.id === socket.id);
    if (!adminUser || adminUser.name !== room.adminName || room.adminName !== adminName) {
      console.log(`Unauthorized admin transfer attempt for room ${roomId} by socket ${socket.id}`);
      return;
    }

    // Verify target user is in the room
    const targetUser = room.users.find(u => u.name === targetUserName);
    if (!targetUser) return;

    // Transfer admin
    room.adminName = targetUserName;

    // Send system message
    io.to(roomId).emit("receive-message", {
      message: `${targetUserName} has been made room admin by ${adminName}.`,
      senderName: "SYSTEM",
      isSystem: true,
      timestamp: Date.now()
    });

    // Broadcast updated room details to all clients
    io.to(roomId).emit("room-details", {
      roomName: room.roomName,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt,
      duration: room.duration,
      adminName: room.adminName
    });
  });

  socket.on("kick-user", ({ roomId, adminName, userName }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.adminName !== adminName) return;

    const userIndex = room.users.findIndex(u => u.name === userName);
    if (userIndex !== -1) {
      const user = room.users[userIndex];
      const targetSocketId = user.id;
      
      // Remove from room list
      room.users.splice(userIndex, 1);
      
      // Update room users
      io.to(roomId).emit("user-joined", room.users);
      
      // Send system message
      io.to(roomId).emit("receive-message", {
        message: `${userName} was kicked from the room by the admin.`,
        senderName: "SYSTEM",
        isSystem: true,
        timestamp: Date.now()
      });

      // Target socket leaves room and gets kicked notice
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit("kicked", "You have been kicked from the room by the admin.");
        targetSocket.leave(roomId);
      }
    }
  });

  socket.on("ban-user", ({ roomId, adminName, userName }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.adminName !== adminName) return;

    if (!room.bannedUsers) room.bannedUsers = [];
    if (!room.bannedUsers.includes(userName)) {
      room.bannedUsers.push(userName);
    }

    const userIndex = room.users.findIndex(u => u.name === userName);
    if (userIndex !== -1) {
      const user = room.users[userIndex];
      const targetSocketId = user.id;
      
      // Remove from room list
      room.users.splice(userIndex, 1);
      
      // Update room users
      io.to(roomId).emit("user-joined", room.users);
      
      // Send system message
      io.to(roomId).emit("receive-message", {
        message: `${userName} was banned from the room by the admin.`,
        senderName: "SYSTEM",
        isSystem: true,
        timestamp: Date.now()
      });

      // Target socket leaves room and gets kicked notice
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit("kicked", "You have been banned from this room by the admin.");
        targetSocket.leave(roomId);
      }
    }
  });

  socket.on("leave-room", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) return;

    const userIndex = room.users.findIndex(u => u.name === name);
    if (userIndex !== -1) {
      room.users.splice(userIndex, 1);
      io.to(roomId).emit("user-joined", room.users);
      io.to(roomId).emit("receive-message", {
        message: `${name} left the room.`,
        senderName: "SYSTEM",
        isSystem: true,
        timestamp: Date.now()
      });
      console.log(`${name} explicitly left ${roomId}`);
    }

    socket.leave(roomId);

    // Auto-destroy if empty
    if (room.users.length === 0) {
      setTimeout(() => {
        if (rooms[roomId] && rooms[roomId].users.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} auto-destroyed (empty).`);
        }
      }, 5000);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    randomQueue = randomQueue.filter(u => u.id !== socket.id);
    
    // Clean up disconnected users to free up capacity
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      
      if (userIndex !== -1) {
        const userName = room.users[userIndex].name;
        room.users.splice(userIndex, 1);
        io.to(roomId).emit("user-joined", room.users);
        io.to(roomId).emit("receive-message", {
          message: `${userName} left the room.`,
          senderName: "SYSTEM",
          isSystem: true,
          timestamp: Date.now()
        });
        console.log(`${userName} left ${roomId}`);
        
        // Auto-destroy room if empty (with 5s buffer for page refreshes)
        if (room.users.length === 0) {
          setTimeout(() => {
            if (rooms[roomId] && rooms[roomId].users.length === 0) {
              delete rooms[roomId];
              console.log(`Room ${roomId} auto-destroyed (empty).`);
            }
          }, 5000);
        }
        
        break;
      }
    }
  });

  socket.on("join-random-queue", ({ name, avatar }) => {
    // Prevent duplicate entries
    if (randomQueue.some(u => u.id === socket.id)) return;

    randomQueue.push({ id: socket.id, name, avatar });
    console.log(`User ${name} entered random queue. Queue length: ${randomQueue.length}`);

    // Matchmaking is now handled by the setInterval below
  });

  socket.on("leave-random-queue", () => {
    randomQueue = randomQueue.filter(u => u.id !== socket.id);
    console.log(`User left random queue. Queue length: ${randomQueue.length}`);
  });

  socket.on("skip-peer", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.isRandom) return;

    // Find the current user who clicked Skip
    const skippingUser = room.users.find(u => u.id === socket.id);
    if (!skippingUser) return;

    // Notify the other user (if any) that they were skipped
    const otherUser = room.users.find(u => u.id !== socket.id);
    if (otherUser) {
      io.to(otherUser.id).emit("peer-skipped");
    }

    // Force everyone to leave the socket room
    io.in(roomId).socketsLeave(roomId);

    // Delete the room
    delete rooms[roomId];
    console.log(`Room ${roomId} skipped by ${skippingUser.name} and dissolved.`);
  });

});

// Matchmaking interval: Runs every 5 seconds to match users in the queue
setInterval(() => {
  while (randomQueue.length >= 2) {
    const user1 = randomQueue.shift();
    const user2 = randomQueue.shift();

    const socket1 = io.sockets.sockets.get(user1.id);
    const socket2 = io.sockets.sockets.get(user2.id);

    // If one of the users disconnected while in queue, put the other back and continue
    if (!socket1 || !socket2) {
      if (socket1) randomQueue.unshift(user1);
      if (socket2) randomQueue.unshift(user2);
      continue;
    }

    const roomId = `rand-${uuidv4().slice(0, 6)}`;
    rooms[roomId] = {
      roomId,
      roomName: "Random Tunnel",
      maxUsers: 2,
      duration: 30, // 30 minutes
      createdAt: Date.now(),
      adminName: null, // NO OWNERS OR ADMIN POWERS
      bannedUsers: [],
      isRandom: true,
      users: [
        { id: user1.id, name: user1.name, avatar: user1.avatar },
        { id: user2.id, name: user2.name, avatar: user2.avatar }
      ]
    };

    socket1.join(roomId);
    socket1.emit("random-match", { roomId });
    
    socket2.join(roomId);
    socket2.emit("random-match", { roomId });

    console.log(`Matched ${user1.name} and ${user2.name} in room ${roomId}`);
  }
}, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});