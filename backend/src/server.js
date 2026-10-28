import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookRoutes from "./routes/bookRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api", bookRoutes);

// Root greeting
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Blockchain Library Book Tracking System API",
    healthCheck: "/api/health",
    catalogue: "/api/books",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Backend API server running on port: ${PORT}`);
  console.log(` Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(` Books endpoint:  http://localhost:${PORT}/api/books`);
  console.log(`=================================================`);
});

export default app;
