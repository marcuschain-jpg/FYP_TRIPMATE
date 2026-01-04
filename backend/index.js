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
const timelineRouter = require("./routes/Timeline");
const mediaRouter = require("./routes/Media");
const RequireAuths = require('./middlewares/RequireAuths.js');
const usersRoute = require("./routes/users");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: "http://localhost:3000"}})

// Middleware
app.use( cors({ origin: "http://localhost:3000", credentials: true}));
app.use(express.json());
app.use(cookieParser());

// Use route
app.use("/Landing", landingRouter); // Marketing page/Landing
app.use("/Itinerary", itineraryRouter); // Itinerary related pages
app.use("/AuthService", authServiceRouter); // Login & create account
app.use("/Timeline", timelineRouter); // Timeline page
app.use("/Media", mediaRouter); // Media page

// Admin routes
//Realtime Update for User in Admin Page
app.use("/api/users", usersRoute);

// Basic Auth function for pages that dont need get any information
app.post("/GetRoleForUser", RequireAuths(["registered", "premium"]), (req, res) => {
  return res.status(200).send({authenticated:true, role:req.role});
});

// Add access images with backend path
app.use("/images", express.static(path.join(__dirname, "../storage")));

// Realtime stuff for itinerary page
app.set("io", io);
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinTrip", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  socket.on("disconnect", () => console.log(`Client disconencted: ${socket.id}`));
  });





// Set backend port
server.listen(8080, () => {
    console.log('server listening on port 8080');
})