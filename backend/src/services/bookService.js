import { prisma } from "../config/db.js";

// Rich fallback metadata for college library catalogue
const fallbackCatalogue = [
  {
    bookId: "CS-AI-101",
    category: "Artificial Intelligence",
    description: "The authoritative, most widely used introduction to the field of AI, covering modern neural architectures, probabilistic reasoning, and robotics.",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
    publisher: "Pearson Education",
    publishYear: 2020,
    shelfLocation: "Section A, Shelf 3, Tier 2",
    language: "English",
    pageCount: 1152,
  },
  {
    bookId: "CS-DB-202",
    category: "Database Systems",
    description: "Comprehensive fundamentals of database concepts, SQL internals, indexing, query optimization, concurrency control, and distributed storage systems.",
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    publisher: "McGraw-Hill",
    publishYear: 2019,
    shelfLocation: "Section B, Shelf 1, Tier 4",
    language: "English",
    pageCount: 1376,
  },
  {
    bookId: "CS-OS-303",
    category: "Operating Systems",
    description: "In-depth treatment of modern operating system concepts including virtual memory, CPU scheduling, thread management, and security primitives.",
    coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80",
    publisher: "Wiley",
    publishYear: 2021,
    shelfLocation: "Section B, Shelf 2, Tier 1",
    language: "English",
    pageCount: 1024,
  },
  {
    bookId: "CS-NET-404",
    category: "Computer Networks",
    description: "A top-down approach focusing on the Internet and fundamental networking protocols, socket programming, and cryptographic transport layers.",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    publisher: "Pearson",
    publishYear: 2022,
    shelfLocation: "Section C, Shelf 4, Tier 3",
    language: "English",
    pageCount: 880,
  },
];

const fallbackStudents = [
  {
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".toLowerCase(),
    studentId: "STU-CS-2023-014",
    fullName: "Alex Rivera",
    email: "alex.rivera@college.edu",
    department: "Computer Science & Engineering",
    yearOfStudy: 3,
  },
  {
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".toLowerCase(),
    studentId: "STU-IT-2023-089",
    fullName: "Priya Sharma",
    email: "priya.sharma@college.edu",
    department: "Information Technology",
    yearOfStudy: 2,
  },
  {
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906".toLowerCase(),
    studentId: "STU-AI-2024-005",
    fullName: "Jordan Lee",
    email: "jordan.lee@college.edu",
    department: "Artificial Intelligence & Data Science",
    yearOfStudy: 1,
  },
];

export class BookService {
  /**
   * Returns all book off-chain metadata records
   */
  static async getAllMetadata() {
    if (prisma) {
      try {
        const records = await prisma.bookMetadata.findMany();
        if (records && records.length > 0) return records;
      } catch (err) {
        // Database query failed, fallback
      }
    }
    return fallbackCatalogue;
  }

  /**
   * Retrieves metadata for a single book by its unique ID
   */
  static async getMetadataById(bookId) {
    if (!bookId) return null;
    const normalized = bookId.trim();

    if (prisma) {
      try {
        const record = await prisma.bookMetadata.findUnique({
          where: { bookId: normalized },
        });
        if (record) return record;
      } catch (err) {
        // Fallback
      }
    }

    const match = fallbackCatalogue.find(
      (b) => b.bookId.toLowerCase() === normalized.toLowerCase()
    );
    return match || {
      bookId: normalized,
      category: "General Collection",
      description: "College library textbook registered on the blockchain.",
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      publisher: "Academic Press",
      publishYear: new Date().getFullYear(),
      shelfLocation: "Main Stacks, General Collection",
      language: "English",
      pageCount: 450,
    };
  }

  /**
   * Search books across title/category/shelf
   */
  static async searchMetadata(query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return this.getAllMetadata();

    if (prisma) {
      try {
        const records = await prisma.bookMetadata.findMany({
          where: {
            OR: [
              { bookId: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { publisher: { contains: q, mode: "insensitive" } },
            ],
          },
        });
        if (records && records.length > 0) return records;
      } catch (err) {
        // Fallback
      }
    }

    return fallbackCatalogue.filter(
      (b) =>
        b.bookId.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }

  /**
   * Retrieves student profile by wallet address
   */
  static async getStudentByWallet(walletAddress) {
    if (!walletAddress) return null;
    const normalized = walletAddress.toLowerCase().trim();

    if (prisma) {
      try {
        const student = await prisma.studentProfile.findUnique({
          where: { walletAddress: normalized },
        });
        if (student) return student;
      } catch (err) {
        // Fallback
      }
    }

    const match = fallbackStudents.find(
      (s) => s.walletAddress.toLowerCase() === normalized
    );

    if (match) return match;

    // Return a dynamically formatted profile for any college student address
    return {
      walletAddress: normalized,
      studentId: `STU-GEN-${normalized.substring(2, 6).toUpperCase()}`,
      fullName: `Student (${normalized.substring(0, 6)}...${normalized.substring(38)})`,
      email: `student.${normalized.substring(2, 6)}@college.edu`,
      department: "Engineering & Applied Sciences",
      yearOfStudy: 2,
    };
  }

  /**
   * Upserts book metadata (off-chain enrichment)
   */
  static async upsertMetadata(data) {
    if (!data.bookId) throw new Error("bookId is required");
    const normalized = data.bookId.trim();

    if (prisma) {
      return await prisma.bookMetadata.upsert({
        where: { bookId: normalized },
        update: {
          category: data.category,
          description: data.description,
          coverImage: data.coverImage,
          publisher: data.publisher,
          publishYear: data.publishYear ? parseInt(data.publishYear) : null,
          shelfLocation: data.shelfLocation,
          language: data.language || "English",
          pageCount: data.pageCount ? parseInt(data.pageCount) : null,
        },
        create: {
          bookId: normalized,
          category: data.category || "General",
          description: data.description,
          coverImage: data.coverImage,
          publisher: data.publisher,
          publishYear: data.publishYear ? parseInt(data.publishYear) : null,
          shelfLocation: data.shelfLocation,
          language: data.language || "English",
          pageCount: data.pageCount ? parseInt(data.pageCount) : null,
        },
      });
    }

    // In-memory fallback
    const existingIndex = fallbackCatalogue.findIndex((b) => b.bookId === normalized);
    const item = { ...data, bookId: normalized };
    if (existingIndex >= 0) {
      fallbackCatalogue[existingIndex] = { ...fallbackCatalogue[existingIndex], ...item };
    } else {
      fallbackCatalogue.push(item);
    }
    return item;
  }
}
