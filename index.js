const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// Middleware to parse JSON data
app.use(express.json());

// Load cars data
const carsData = JSON.parse(fs.readFileSync("cars.json", "utf-8"));

// Routes
// 1. Get all cars
app.get("/api/cars", (req, res) => {
  let { minPrice, maxPrice, minRating, maxRating, date } = req.query;

  let filteredCars = carsData;

  // Filter by price
  if (minPrice || maxPrice) {
    filteredCars = filteredCars.filter(
      (car) =>
        (!minPrice || car.pricePerDay >= parseFloat(minPrice)) &&
        (!maxPrice || car.pricePerDay <= parseFloat(maxPrice))
    );
  }

  // Filter by rating
  if (minRating || maxRating) {
    filteredCars = filteredCars.filter(
      (car) =>
        (!minRating || car.rating >= parseFloat(minRating)) &&
        (!maxRating || car.rating <= parseFloat(maxRating))
    );
  }

  // Filter by availability
  if (date) {
    filteredCars = filteredCars.filter(
      (car) => !car.unavailability.includes(date)
    );
  }

  res.json(filteredCars);
});

// 2. Get car by ID
app.get("/api/cars/:id", (req, res) => {
  const { id } = req.params;
  const car = carsData.find((car) => car.carId === id);

  if (car) {
    res.json(car);
  } else {
    res.status(404).json({ error: "Car not found" });
  }
});

// 3. Get all-star hosts
app.get("/api/cars/all-star-hosts", (req, res) => {
  const allStarCars = carsData.filter((car) => car.allStarHost === true);
  res.json(allStarCars);
});

// 4. Serve car images (Optional: Mock static files)
app.use("/static/images", express.static(path.join(__dirname, "images")));

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Car Rental API!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
