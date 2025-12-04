import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// Load your service account key
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore reference
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// ===========================
// SEND PUSH NOTIFICATION API
// ===========================
app.post("/send-notification", async (req, res) => {
  try {
    const { title, message } = req.body;

    // Get all device tokens from Firestore
    const tokensSnapshot = await db.collection("device_tokens").get();

    if (tokensSnapshot.empty) {
      return res.json({ success: false, message: "No device tokens found" });
    }

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    const payload = {
      notification: {
        title: title,
        body: message,
      },
    };

    const result = await admin.messaging().sendToDevice(tokens, payload);

    return res.json({
      success: true,
      delivered: result.successCount,
      failed: result.failureCount,
    });
  } catch (err) {
    console.error("Error sending notification:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
