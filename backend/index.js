const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
//Import routes
const landingRouter = require("./routes/Landing")
const itineraryRouter = require("./routes/Itinerary");
const InitRealtime = require("./helper/Realtime")

const app = express();
const server = http.createServer(app);
//const io = new Server(server, {cors: {origin: "http://localhost:3000"}})

//Middleware
app.use( cors({ origin: "http://localhost:3000",}));
app.use(express.json());

//Use route
app.use("/Landing", landingRouter);
app.use("/Itinerary", itineraryRouter);

//Realtime update
//InitRealtime(io);


server.listen(8080, () => {
    console.log('server listening on port 8080');
})