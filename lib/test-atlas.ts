import mongoose from "mongoose";

// Replace with your actual connection string from .env.local
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://enochagbloe16:EjrtHTS6eY1TyAUl@c3-erp.ixoatmy.mongodb.net/";

console.log("🔍 Testing connection...");
console.log("🔍 URI preview:", MONGODB_URI.substring(0, 40) + "...");

mongoose
  .connect(MONGODB_URI, {
    dbName: "C3-ERP",
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ Connection successful!");
    console.log("✅ Host:", mongoose.connection.host);
    console.log("✅ Database:", mongoose.connection.db?.databaseName);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed!");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    if (err.reason) {
      console.error("Reason:", err.reason);
    }
    process.exit(1);
  });
