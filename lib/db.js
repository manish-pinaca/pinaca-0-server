require("dotenv").config();
const { connect } = require("mongoose");

const connection = connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = connection;
