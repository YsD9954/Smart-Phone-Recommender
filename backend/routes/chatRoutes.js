import express from "express";
import { chatHandler } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", chatHandler);
router.get("/", (req, res) => {
  res.send("✅ Chat API is live. Use POST to send queries.");
});


export default router;
