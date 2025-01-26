require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../service/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Access Firestore with admin.firestore()

async function updateCarLocations() {
  const carsRef = db.collection("cars");
  const carsSnapshot = await carsRef.get();

  carsSnapshot.forEach(async (doc) => {
    const carData = doc.data();
    const { latitude, longitude } = carData.location;

    const geopoint = new admin.firestore.GeoPoint(latitude, longitude);
    await carsRef.doc(doc.id).update({ location: geopoint });

    // Print the car data using the data() method
    console.log("Car data:");
    console.log(carData);
  });
}

updateCarLocations();
