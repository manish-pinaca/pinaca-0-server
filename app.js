const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectionToDatabase = require("./lib/db");
const authRouter = require("./routes/auth");
const customerRouter = require("./routes/customer");
const serviceRouter = require("./routes/services");
const feedbackRouter = require("./routes/feedback");
const {
  addPendingService,
  removePendingService,
  addActiveService,
  removeRequestedService,
  addRejectedService,
} = require("./controllers/auth.controller");

const port = process.env.PORT || 5000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

/**
 * A simple function that responds with "Hello World!" to the client.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRouter);

app.use("/api/customer", customerRouter);

app.use("/api/services", serviceRouter);

app.use("/api/feedback", feedbackRouter);

server.listen(port, async () => {
  try {
    // Establishes a connection to the database
    await connectionToDatabase;
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database", error);
  }
  console.log(`Server running on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on(
    "addServiceRequest",
    ({ customerId, serviceId, adminId }, callback) => {
      console.log(`Add service request for ${serviceId} by ${customerId}`);
      io.emit("addServiceRequest", { customerId, serviceId });
      addPendingService(customerId, serviceId, adminId)
        .then(() => {
          sendResponse(
            { message: "Moved service status to pending." },
            callback
          );
        })
        .catch((error) => {
          sendReject({ message: error.message }, callback);
        });
    }
  );

  socket.on(
    "accept-request",
    async ({ customerId, serviceId, adminId }, callback) => {
      console.log(`Accept service request for ${serviceId} by ${customerId}`);
      try {
        await removePendingService(customerId, serviceId);
        await addActiveService(customerId, serviceId);
        await removeRequestedService(customerId, serviceId, adminId);

        io.emit("accepted-request", { customerId, serviceId });
        sendResponse({ message: "Accepted service request." }, callback);
      } catch (error) {
        // Handle error
        console.error("Error occurred while processing request:", error);
        sendReject({ message: error.message }, callback);
      }
    }
  );

  socket.on(
    "reject-request",
    async ({ customerId, serviceId, adminId }, callback) => {
      console.log(`Accept service request for ${serviceId} by ${customerId}`);
      try {
        await removePendingService(customerId, serviceId);
        await addRejectedService(customerId, serviceId);
        await removeRequestedService(customerId, serviceId, adminId);

        io.emit("rejected-request", { customerId, serviceId });
        sendResponse({ message: "Rejected service request." }, callback);
      } catch (error) {
        // Handle error
        console.error("Error occurred while processing request:", error);
        sendReject({ message: error.message }, callback);
      }
    }
  );
});

function sendResponse(response, callback) {
  callback(null, response);
}

// --- send error to client ---
function sendReject(error, callback) {
  callback(JSON.stringify(error), null);
}
