const express = require('express');
const app = express();
const cors = require('cors');

//Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

//Import routes
const landingRouter = require("./routes/Landing")
const itineraryRouter = require("./routes/Itinerary")

//Use route
app.use("/Landing", landingRouter);
app.use("/Itinerary", itineraryRouter);


app.listen(8080, () => {
    console.log('server listening on port 8080');
})