const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");

// database
connection();

// app
const app = express();
const port = 3900;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true})); // formUrlEncoded

// routes
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");
app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);

// server
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
