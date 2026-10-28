import { Router } from "express";
import { BookController } from "../controllers/bookController.js";

const router = Router();

// Health check
router.get("/health", BookController.getHealth);

// Book metadata search & catalogue
router.get("/books/search", BookController.searchBooks);
router.get("/books", BookController.getAllBooks);
router.get("/books/:id", BookController.getBookById);
router.post("/books/metadata", BookController.upsertBookMetadata);

// Student profile by wallet
router.get("/students/:walletAddress", BookController.getStudentByWallet);

export default router;
