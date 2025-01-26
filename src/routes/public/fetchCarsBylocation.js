require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const { geohashQueryBounds, distanceBetween } = require("geofire-common");
const router = express();
const { sortCarsByDistance } = require("../../helpers/helpers");

// Initialize Firebase Admin
const serviceAccount = require(process.env
  .FIREBASE_CREDENTIALS_FETCH_CARS_BY_LAT_LNG_RADIUS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Your route
router.get("/nearby", async (req, res) => {
  const { latitude, longitude, radius = 100 } = req.query; // Default radius 100 km
  if (isNaN(latitude) || isNaN(longitude) || radius === "") {
    return res.send("Bad Request").status(400);
  }
  const radiusInM = parseFloat(radius) * 1000; // Convert radius to meters

  // Create an array with latitude and longitude instead of a GeoPoint
  const center = [parseFloat(latitude), parseFloat(longitude)];

  // Get bounds for the geohash query
  const bounds = geohashQueryBounds(center, radiusInM);
  const promises = [];

  // Create queries for each bounding box region
  for (const b of bounds) {
    const q = db.collection("cars").orderBy("location").startAt(b[0]).limit(20); // Limit the number of docs fetched per query for performance
    const results = await q.get();
    promises.push(results);
  }

  try {
    const snapshots = await Promise.all(promises);
    const matchingDocs = [];

    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const lat = doc.get("location").latitude;
        const lng = doc.get("location").longitude;

        // Filter out false positives due to GeoHash accuracy
        const distanceInKm = distanceBetween([lat, lng], center);

        const distanceInM = distanceInKm * 1000;

        // Only add the car if it is within the specified radius
        if (distanceInM <= radiusInM) {
          if (!matchingDocs.some((existingDoc) => existingDoc.id === doc.id))
            matchingDocs.push({
              id: doc.id,
              ...doc.data(),
              location: {
                latitude: lat, // Ensure latitude is a plain number
                longitude: lng, // Ensure longitude is a plain number
              },
              distanceInKm, // Add distanceInKm to the document data
            });
        }
      }
    }

    // Sort the carsData by distanceInKm (nearest first)
    const sortedCars = sortCarsByDistance(matchingDocs);

    // Return the sorted cars with distanceInKm
    res.status(200).json(sortedCars);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting cars");
  }
});

module.exports = router;
