const express = require('express');
const cors = require('cors');
const http = require("http");
const path = require("path");
const { Server } = require("socket.io"); // real time websocket
const cookieParser = require("cookie-parser"); // store cookies on website
//Import routes
const landingRouter = require("./routes/Landing")
const itineraryRouter = require("./routes/Itinerary");
const authServiceRouter = require("./routes/AuthService");
const RequireAuths = require('./middlewares/RequireAuths.js');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: "http://localhost:3000"}})

//Middleware
app.use( cors({ origin: "http://localhost:3000", credentials: true}));
app.use(express.json());
app.use(cookieParser());

// Use route
app.use("/Landing", landingRouter);
app.use("/Itinerary", itineraryRouter);
app.use("/AuthService", authServiceRouter);

// Basic Auth function
app.post("/AuthCheck", RequireAuths, (req, res) => {
  return res.status(200).send({authenticated:true, role:req.role});
});

//add access images with backend path
app.use("/images", express.static(path.join(__dirname, "../storage")));

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