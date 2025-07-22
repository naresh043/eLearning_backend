const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error("❌ Error connecting to the database:", error.message);
  }
};

module.exports = dbConnect;
