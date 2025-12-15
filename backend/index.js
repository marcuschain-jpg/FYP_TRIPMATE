const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
//Import routes
const landingRouter = require("./routes/Landing")
const itineraryRouter = require("./routes/Itinerary");
const authServiceRouter = require("./routes/AuthService");


const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: "http://localhost:3000"}})

//Middleware
app.use( cors({ origin: "http://localhost:3000",}));
app.use(express.json());

//Use route
app.use("/Landing", landingRouter);
app.use("/Itinerary", itineraryRouter);
app.use("/AuthService", authServiceRouter);

//Realtime stuff for itinerary page
app.set("io", io);
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinTrip", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  });
});


server.listen(8080, () => {
    console.log('server listening on port 8080');
})