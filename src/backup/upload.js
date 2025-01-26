require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK with service account credentials
const serviceAccount = require("../service/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Read and upload cars.json
const uploadData = async () => {
  const cars = JSON.parse(fs.readFileSync("cars2.json", "utf8"));
  const collectionRef = db.collection("cars");

  for (const [docId, carData] of Object.entries(cars)) {
    await collectionRef.doc(docId).set(carData);
    console.log(`Uploaded: ${docId}`);
  }

  console.log("All data uploaded successfully!");
};

uploadData().catch((error) => console.error("Error uploading data:", error));
