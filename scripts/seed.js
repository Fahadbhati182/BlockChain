import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=================================================");
  console.log(" Seeding LibraryBookRegistry with Initial State  ");
  console.log("=================================================");

  const configPath = path.join(__dirname, "../frontend/src/contracts/contractAddress.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("contractAddress.json not found. Please deploy contract first: npm run deploy:local");
  }

  const { address } = JSON.parse(fs.readFileSync(configPath, "utf8"));
  console.log(`Connecting to deployed contract at: ${address}`);

  const [librarian, student1, student2] = await hre.ethers.getSigners();
  console.log(`Librarian Account: ${librarian.address}`);

  const LibraryBookRegistry = await hre.ethers.getContractFactory("LibraryBookRegistry");
  const contract = LibraryBookRegistry.attach(address);

  const sampleBooks = [
    {
      id: "CS-AI-101",
      title: "Artificial Intelligence: A Modern Approach",
      author: "Stuart Russell, Peter Norvig",
      isbn: "978-0134610993",
    },
    {
      id: "CS-DB-202",
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      isbn: "978-0078022159",
    },
    {
      id: "CS-OS-303",
      title: "Operating System Concepts",
      author: "Abraham Silberschatz, Peter B. Galvin",
      isbn: "978-1119800361",
    },
    {
      id: "CS-NET-404",
      title: "Computer Networking: A Top-Down Approach",
      author: "James Kurose, Keith Ross",
      isbn: "978-0136681557",
    },
  ];

  console.log("\n1. Registering Initial Books on Blockchain...");
  for (const book of sampleBooks) {
    const exists = await contract.exists(book.id);
    if (!exists) {
      console.log(` -> Registering ${book.id}: "${book.title}"`);
      const tx = await contract.connect(librarian).registerBook(book.id, book.title, book.author, book.isbn);
      await tx.wait();
    } else {
      console.log(` -> ${book.id} is already registered on-chain.`);
    }
  }

  // Issue one book to student1 (Alex Rivera)
  console.log("\n2. Issuing CS-AI-101 to Student Alex Rivera (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)...");
  const isAvailable = await contract.isBookAvailable("CS-AI-101");
  if (isAvailable) {
    const issueTx = await contract.connect(librarian).issueBook("CS-AI-101", student1.address);
    const receipt = await issueTx.wait();
    console.log(` -> Book issued successfully! Block #${receipt.blockNumber}, Tx: ${issueTx.hash}`);
  } else {
    console.log(" -> CS-AI-101 is already issued.");
  }

  // Issue and return another book to create a return history log
  console.log("\n3. Simulating Issue and Return cycle for CS-DB-202 to generate verifiable event history...");
  const dbAvail = await contract.isBookAvailable("CS-DB-202");
  if (dbAvail) {
    const tx1 = await contract.connect(librarian).issueBook("CS-DB-202", student2.address);
    await tx1.wait();
    console.log(` -> CS-DB-202 issued to ${student2.address}`);

    const tx2 = await contract.connect(librarian).returnBook("CS-DB-202");
    await tx2.wait();
    console.log(` -> CS-DB-202 returned to library!`);
  }

  const total = await contract.totalBooks();
  console.log("\n=================================================");
  console.log(` Seeding Complete! Total books registered: ${total}`);
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
