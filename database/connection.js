const mongoose = require("mongoose");

async function connection() {
  try {
    await mongoose.connect("mongodb://localhost:27017/my_social_network")
    console.log("Connected successfully to my_social_network database");
  } catch (error) {
    console.error(error);
    throw new Error("Couldn't connect to database")
  }
}

module.exports = connection;
