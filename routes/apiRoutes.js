const express = require("express");
const property = require('../controllers/apiControllers')

const router = express.Router();

router.get("/properties", property.getAllProperties);
router.get("/reservations", property.getAllReservations);
router.post("/properties", property.addProperty);

module.exports = router;
