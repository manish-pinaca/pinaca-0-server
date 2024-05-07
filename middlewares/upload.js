const multer = require("multer");

// Multer middleware configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 20, // Limit file size to 20MB
  },
});

// Multer middleware function
const uploadMiddleware = upload.single("file");

module.exports = uploadMiddleware;
