const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { uploadFiles } = require("../controllers/uploadController");

router.post(
    "/",
    upload.fields([
        { name: "resume", maxCount: 1 },
        { name: "csv", maxCount: 1 }
    ]),
    uploadFiles
);

module.exports = router;