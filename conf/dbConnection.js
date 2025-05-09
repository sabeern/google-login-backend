const mongoose = require("mongoose");

async function dbConnection() {
  const connection = mongoose.connection;
  connection.on("connected", () => {
    console.log("connected db");
  });
  connection.on("error", (error) => {
    console.log("failed to connect", error?.message);
  });
  try {
    await mongoose.connect(process.env.DB_URL);
  } catch (err) {
    console.log("failed to connect db", err.message);
  }
}

module.exports = dbConnection;
