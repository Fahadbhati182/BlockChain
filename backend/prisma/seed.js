import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const sampleMetadata = [
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

const sampleStudents = [
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

async function main() {
  console.log("Seeding database with library metadata and student profiles...");

  for (const book of sampleMetadata) {
    await prisma.bookMetadata.upsert({
      where: { bookId: book.bookId },
      update: book,
      create: book,
    });
  }
  console.log(` Seeded ${sampleMetadata.length} book metadata records.`);

  for (const student of sampleStudents) {
    await prisma.studentProfile.upsert({
      where: { walletAddress: student.walletAddress },
      update: student,
      create: student,
    });
  }
  console.log(` Seeded ${sampleStudents.length} student profile records.`);
}

main()
  .catch((e) => {
    console.error("Database seeding note: Could not connect to PostgreSQL database.");
    console.error("To use the database, configure DATABASE_URL in backend/.env.");
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
