const mongoose = require("mongoose");

const dbURI = "mongodb+srv://NamasteNaresh:Naresh%40143@namastenaresh.qddqpyv.mongodb.net/eLearning";


const dbConnect = async () => {
  try {
    await mongoose.connect(dbURI);
    // console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Error connecting to the database:", error.message);
  }
};

module.exports = dbConnect;
