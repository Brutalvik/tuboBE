require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const { geohashQueryBounds, distanceBetween } = require("geofire-common");
const router = express();

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
  const radiusInM = parseFloat(radius) * 1000; // Convert radius to meters

  // Create an array with latitude and longitude instead of a GeoPoint
  const center = [parseFloat(latitude), parseFloat(longitude)];

  // Get bounds for the geohash query
  const bounds = geohashQueryBounds(center, radiusInM);
  console.log("Bounds:", bounds);
  const promises = [];

  // Create queries for each bounding box region
  for (const b of bounds) {
    const q = db
      .collection("cars")
      .orderBy("location")
      .startAt(b[0])
      .endAt(b[1])
      .limit(10); // Limit the number of docs fetched per query for performance
    promises.push(q.get());

    const snapshot = await q.get();
    console.log(
      "A : ",
      snapshot.docs.map((doc) => doc.data())
    );
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
        console.log("DISTANCE IN KM ", distanceInKm);
        const distanceInM = distanceInKm * 1000;
        matchingDocs.push(doc);

        // if (distanceInM <= radiusInM) {
        //   matchingDocs.push(doc);
        // }
      }
    }

    // Return cars data after filtering
    const carsData = matchingDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(carsData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting cars");
  }
});

module.exports = router;
