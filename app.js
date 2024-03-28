const express = require("express");
const cors = require("cors");

const connectionToDatabase = require("./lib/db");
const authRouter = require("./routes/auth");
const customerRouter = require("./routes/customer");
const serviceRouter = require("./routes/services");

const port = process.env.PORT || 5000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

/**
 * A simple function that responds with "Hello World!" to the client.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", authRouter);

app.use("/api/customer", customerRouter);

app.use("/api/services", serviceRouter);

app.listen(port, async () => {
  try {
    // Establishes a connection to the database
    await connectionToDatabase;
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database", error);
  }
  console.log(`Server running on port ${port}`);
});
