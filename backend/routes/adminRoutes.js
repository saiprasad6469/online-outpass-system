const express = require("express");
const router = express.Router();

const { registerAdmin, loginAdmin, getMeAdmin } = require("../controllers/adminController");
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");


// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);


module.exports = router;
