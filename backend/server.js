import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api/chat", chatRoutes);

// ✅ Health Route
app.get("/", (req, res) => {
  res.send("🟢 Backend server is running 🚀");
});

// ✅ Info route
app.get("/api/chat", (req, res) => {
  res.json({
    message: "✅ Chat API is live!",
    usage: {
      method: "POST",
      endpoint: "/api/chat",
      body_example: {
        message: "Best camera phone under 30000",
      },
    },
    note: "Send a POST request to get intelligent phone suggestions 📱",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
