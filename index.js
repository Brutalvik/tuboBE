// index.js
const express = require("express");
const app = express();

// Import the route from the "public/fetchCarsByLocation.js" file
const fetchCarsByLocation = require("./src/routes/public/fetchCarsBylocation");

// Use the route
app.use("/cars", fetchCarsByLocation); // This will prefix your route with '/cars'

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Car Rental API!");
});

// Start the server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
