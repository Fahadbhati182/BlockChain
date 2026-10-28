# LibTrack: Blockchain-Based Library Book Tracking System

A full-stack, decentralized web application for college library management. LibTrack leverages **Solidity smart contracts** on an Ethereum-compatible EVM (local Hardhat network) for immutable book registration, issuance, and return tracking, paired with a modern **React + Vite** frontend, **Ethers.js v6**, an **Express.js** metadata backend, and **PostgreSQL / Prisma** off-chain database integration.

---

## 1. Project Overview

In traditional college libraries, centralized databases can suffer from data tampering, lost records, discrepancy between borrower logs, and lack of transparency. **LibTrack** introduces blockchain technology to establish a verifiable, tamper-evident ledger for library books.

Key operations—**Book Registration**, **Book Issuance to a Student Borrower**, and **Book Return**—are executed as genuine on-chain transactions via Solidity smart contracts. Historical transactions and state transitions are permanently stored in Ethereum block logs, giving librarians, auditors, and students an immutable record of custody.

---

## 2. Problem Statement

Traditional university library information systems face notable operational challenges:
1. **Single Point of Failure & Tampering:** Centralized database records can be manually edited, overridden, or accidentally deleted without an immutable audit trail.
2. **Custody Disputes:** Disagreements regarding whether a student returned a high-value textbook or reference book cannot be resolved with cryptographic proof.
3. **Siloed & Non-Verifiable Tracking:** Physical cataloging often lacks transparent public verification where students can independently confirm real-time availability and historical borrower transitions.
4. **Lack of Cryptographic Identity:** Physical library cards or usernames can easily be impersonated, whereas blockchain wallet signatures provide cryptographic accountability.

---

## 3. Objectives

- **Cryptographic State Transitions:** Ensure that every change in book status (`Available` ↔ `Issued`) occurs strictly through verified on-chain transactions.
- **On-Chain Access Control:** Enforce administrative privileges with a Solidity modifier (`onlyLibrarian`), guaranteeing that unauthorized users cannot issue or return books even if they bypass the frontend UI.
- **Historical Event Audit:** Harness EVM event logs (`BookRegistered`, `BookIssued`, `BookReturned`) to reconstruct an immutable chronological timeline of book movements.
- **Hybrid Architecture:** Store core tracking state and custody on-chain while keeping rich metadata (descriptions, cover art, physical shelf coordinates) in PostgreSQL for efficient search.
- **Native Web3 User Experience:** Provide a seamless, responsive college library dashboard featuring MetaMask wallet integration, live block height monitoring, and an interactive Smart Contracts Explorer.

---

## 4. Technology Stack

### Blockchain & Smart Contracts
- **Solidity `^0.8.24`**: Smart contract programming language for Ethereum.
- **Hardhat `^2.22`**: Ethereum development environment for compiling, testing, and deploying contracts.
- **Local Hardhat Blockchain**: Local EVM test network with instant block mining and pre-funded test accounts.
- **Ethers.js `v6`**: Library for interacting with EVM nodes, contract ABIs, signers, and event filters.

### Frontend
- **React 18**: Component-based UI library.
- **Vite 5**: High-performance frontend build tool.
- **Tailwind CSS 3**: Utility-first CSS framework adhering to a clean, modern design system.
- **React Router DOM 6**: Client-side routing.
- **Lucide React**: Clean, modern iconography.

### Backend
- **Node.js & Express.js**: RESTful API server for off-chain catalogue enrichment and student profiles.
- **Prisma ORM 5**: Type-safe database client and schema migration tool.
- **PostgreSQL / Neon / Supabase**: Relational database for enriched metadata, book covers, and student profiles.
- **Graceful Fallback Mode:** If PostgreSQL is not yet configured, the backend automatically operates in local cache mode so the blockchain application remains 100% operational.

### Testing & Verification
- **Hardhat Toolbox & Chai Matchers**: Automated unit testing covering 23 comprehensive assertions (reverts, access control, event arguments, and state cycles).

---

## 5. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 USER / LIBRARIAN                                  |
|                 (Browser with MetaMask Extension on Chain ID 31337)               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           REACT + VITE FRONTEND (PORT 5173)                       |
|  - Dashboard: Live metrics, recent books, latest transactions                     |
|  - Book Catalogue: Search, availability filters, table/grid views                 |
|  - Librarian Panel: Register, Issue, and Return with MetaMask / Direct Signer     |
|  - Blockchain Explorer: Block logs, event decoding, and transaction modals        |
|  - Smart Contracts Explorer: Interactive Read/Write UI, ABI, and Solidity source  |
|  - Book Details: Custody records and chronological blockchain timeline            |
+-----------------------------------------------------------------------------------+
           |                                                      |
    (Ethers.js v6)                                       (HTTP REST Fetch)
           |                                                      |
           v                                                      v
+-------------------------------+                     +-----------------------------+
|    LOCAL HARDHAT BLOCKCHAIN   |                     |     EXPRESS BACKEND (5000)  |
|       (PORT 8545 - EVM)       |                     |  - GET /api/health          |
|                               |                     |  - GET /api/books           |
| LibraryBookRegistry.sol       |                     |  - GET /api/books/:id       |
|  - registerBook()             |                     |  - GET /api/students/:addr  |
|  - issueBook()                |                     +-----------------------------+
|  - returnBook()               |                                    |
|  - getBook()                  |                             (Prisma Client)
|  - Events: Registered/Issued  |                                    |
+-------------------------------+                                    v
                                                      +-----------------------------+
                                                      |   POSTGRESQL / SUPABASE DB  |
                                                      |  - BookMetadata Table       |
                                                      |  - StudentProfile Table     |
                                                      +-----------------------------+
```

---

## 6. Folder Structure

```
BlockChain/
├── contracts/
│   └── LibraryBookRegistry.sol          # Solidity smart contract
├── scripts/
│   ├── deploy.js                        # Hardhat deployment script (exports ABI/addresses)
│   └── seed.js                          # Blockchain seeding script with sample operations
├── test/
│   └── LibraryBookRegistry.test.js      # Automated unit test suite (23 tests passing)
├── hardhat.config.js                    # Hardhat EVM configuration (Solidity 0.8.24)
├── package.json                         # Root orchestration and scripts
├── README.md                            # Comprehensive documentation
├── .env.example                         # Root environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, StatCard, TransactionModal, etc.
│   │   ├── context/                     # Web3Context with MetaMask & Direct Signer
│   │   ├── contracts/                   # Deployed address & LibraryBookRegistry.json ABI
│   │   ├── pages/                       # 6 required responsive pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BookCatalogue.jsx
│   │   │   ├── LibrarianPanel.jsx
│   │   │   ├── BlockchainExplorer.jsx
│   │   │   ├── SmartContractsExplorer.jsx
│   │   │   └── BookDetails.jsx
│   │   ├── utils/                       # Ethers contract wrappers, formatters, and API client
│   │   ├── App.jsx                      # Router & layout
│   │   ├── main.jsx                     # Entry point
│   │   └── index.css                    # Tailwind CSS & design tokens
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
└── backend/
    ├── prisma/
    │   ├── schema.prisma                # Prisma schema (BookMetadata, StudentProfile)
    │   └── seed.js                      # Database seed script
    ├── src/
    │   ├── config/                      # Database connection and status checking
    │   ├── controllers/                 # Express controller logic
    │   ├── routes/                      # REST API endpoints
    │   ├── services/                    # Business logic with safe database fallback
    │   └── server.js                    # Express app listening on port 5000
    ├── package.json
    └── .env
```

---

## 7. Smart Contract Design

The `LibraryBookRegistry.sol` contract manages library books using an on-chain registry pattern.

### Data Structures
```solidity
enum BookStatus {
    Available,
    Issued
}

struct Book {
    string bookId;
    string title;
    string author;
    string isbn;
    BookStatus status;
    address currentBorrower;
    uint256 registrationTimestamp;
}
```

### Access Control & Security
- **Deployer initialization:** In the constructor, `librarian = msg.sender`.
- **Modifier `onlyLibrarian`:** Restricts state mutations (`registerBook`, `issueBook`, `returnBook`, `transferLibrarian`) to the authorized librarian.
- **Input Validation:** Empty strings for `bookId`, `title`, `author`, and `isbn` are rejected with descriptive require statements.
- **Anti-Duplication:** Book IDs cannot be registered more than once.
- **Borrower Validation:** The zero address (`address(0)`) is strictly rejected for issuance.
- **State Transition Guards:** Reverts if attempting to issue an already-issued book or returning an already-available book.

---

## 8. Contract Functions and Events

### Write Functions
1. `registerBook(string _bookId, string _title, string _author, string _isbn)`: Registers a new book in `Available` status.
2. `issueBook(string _bookId, address _borrower)`: Changes status to `Issued` and sets borrower wallet address.
3. `returnBook(string _bookId)`: Resets status to `Available` and clears borrower.
4. `transferLibrarian(address _newLibrarian)`: Transfers administrator privileges to a new address.

### View (Read) Functions
1. `getBook(string _bookId)`: Returns the complete `Book` struct.
2. `isBookAvailable(string _bookId)`: Returns `true` if available for borrowing, `false` otherwise.
3. `getBookHistory(string _bookId)`: Returns current status tuple for the given book.
4. `totalBooks()`: Returns total count of registered books.
5. `getAllBookIds()`: Returns string array of all registered book IDs.
6. `getAllBooks()`: Returns array of all `Book` structs for efficient frontend loading.
7. `exists(string _bookId)`: Checks if a book exists in the registry.
8. `librarian()`: Returns the address of the current authorized librarian.

### Emitted Events
```solidity
event BookRegistered(string bookId, string title, string author, string isbn, uint256 timestamp);
event BookIssued(string bookId, address indexed borrower, uint256 timestamp);
event BookReturned(string bookId, address indexed borrower, uint256 timestamp);
event LibrarianTransferred(address indexed previousLibrarian, address indexed newLibrarian);
```

---

## 9. Database Design

Off-chain metadata is modeled using **Prisma ORM** targeting **PostgreSQL**:

### Model: `BookMetadata`
- `id`: UUID Primary Key
- `bookId`: String, Unique, Indexed (links directly to on-chain `bookId`)
- `category`: String (e.g., "Artificial Intelligence", "Database Systems")
- `description`: Text (In-depth summary)
- `coverImage`: String (URL)
- `publisher`: String
- `publishYear`: Integer
- `shelfLocation`: String (e.g., "Floor 2 - Shelf B4")
- `language`: String (Default: "English")
- `pageCount`: Integer

### Model: `StudentProfile`
- `id`: UUID Primary Key
- `walletAddress`: String, Unique, Indexed (Lowercase Ethereum address)
- `studentId`: String, Unique (e.g., "STU-CS-2023-014")
- `fullName`: String (e.g., "Alex Rivera")
- `email`: String, Unique
- `department`: String (e.g., "Computer Science & Engineering")
- `yearOfStudy`: Integer

---

## 10. How to Run the Project

### Step 1: Start the Local Blockchain Node
Open a terminal in the project directory:
```bash
npm run node
```
*Starts local Ethereum JSON-RPC node at `http://127.0.0.1:8545` (Chain ID: `31337`).*

### Step 2: Deploy and Seed the Smart Contract
In a second terminal:
```bash
# 1. Deploy the Solidity contract
npm run deploy

# 2. Seed initial books, an active borrow, and event logs
npm run seed:contract
```

### Step 3: Start the Backend Server
In a third terminal:
```bash
npm run backend:dev
```
*API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.*

### Step 4: Start the Frontend Application
In a fourth terminal:
```bash
npm run frontend:dev
```
Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 11. Testing Without MetaMask (Direct Signer Mode)

You can run and demonstrate the entire application **without installing MetaMask**:
1. Open [http://localhost:5173](http://localhost:5173).
2. Click **`⚡ Use Local Signer (No MetaMask)`** in the top navbar.
3. You are instantly authenticated as the Librarian (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) and can register, issue, and return books directly to the blockchain!

---

## 12. Testing With MetaMask

1. Add custom network in MetaMask:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
2. Import the Librarian Account (Account #0):
   - Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Optional: Import a Student Account (Alex Rivera):
   - Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## 13. Automated Unit Testing

Run the Hardhat test suite:
```bash
npm test
```
**Status:** `23 passing (1s)`

---

## License

This project is licensed under the MIT License.
