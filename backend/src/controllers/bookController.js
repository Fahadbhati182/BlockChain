import { BookService } from "../services/bookService.js";
import { checkDbStatus } from "../config/db.js";

export class BookController {
  /**
   * Health check endpoint
   */
  static async getHealth(req, res) {
    try {
      const dbStatus = await checkDbStatus();
      res.status(200).json({
        success: true,
        service: "Blockchain Library Backend API",
        status: "operational",
        timestamp: new Date().toISOString(),
        database: {
          connected: dbStatus.connected,
          mode: dbStatus.connected ? "PostgreSQL (Prisma)" : "Direct / Local Cache Mode",
          details: dbStatus.reason || "Healthy",
        },
        blockchain: {
          supportedNetworks: ["Hardhat Localhost (31337)"],
          authoritativeState: "Solidity LibraryBookRegistry.sol",
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get all off-chain book metadata
   */
  static async getAllBooks(req, res) {
    try {
      const data = await BookService.getAllMetadata();
      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get book metadata by bookId
   */
  static async getBookById(req, res) {
    try {
      const { id } = req.params;
      const metadata = await BookService.getMetadataById(id);
      if (!metadata) {
        return res.status(404).json({
          success: false,
          message: `Book metadata for '${id}' not found.`,
        });
      }
      res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Search books metadata
   */
  static async searchBooks(req, res) {
    try {
      const { q } = req.query;
      const results = await BookService.searchMetadata(q);
      res.status(200).json({
        success: true,
        query: q || "",
        count: results.length,
        data: results,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get student profile by wallet address
   */
  static async getStudentByWallet(req, res) {
    try {
      const { walletAddress } = req.params;
      if (!walletAddress) {
        return res.status(400).json({ success: false, message: "Wallet address is required" });
      }
      const student = await BookService.getStudentByWallet(walletAddress);
      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Upsert book metadata
   */
  static async upsertBookMetadata(req, res) {
    try {
      const updated = await BookService.upsertMetadata(req.body);
      res.status(200).json({
        success: true,
        message: "Book metadata saved successfully",
        data: updated,
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
