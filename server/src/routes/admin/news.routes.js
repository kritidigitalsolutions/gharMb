const express = require("express");
const {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  publishNews,
  unpublishNews,
} = require("../../controllers/admin/news.controller");

const router = express.Router();

// Create News
router.post("/", createNews);

// Get All News
router.get("/", getAllNews);

// Get Single News
router.get("/:id", getNewsById);

// Update News
router.put("/:id", updateNews);

// Delete News
router.delete("/:id", deleteNews);

// Publish News
router.patch("/:id/publish", publishNews);

// Unpublish News
router.patch("/:id/unpublish", unpublishNews);

module.exports = router;