const express = require('express');
const app = express();
const cors = require('cors');

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get('/', (req, res) => {
    res.send('welcome to backend');
})

app.listen(8080, () => {
    console.log('server listening on port 8080');
})