import React, { useState } from "react";
import {
  Code2,
  FileText,
  Play,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  Send,
  Eye,
  Terminal,
  ExternalLink,
  Cpu,
  BookOpen,
} from "lucide-react";
import contractArtifact from "../contracts/LibraryBookRegistry.json";
import deploymentConfig from "../contracts/contractAddress.json";
import {
  CONTRACT_ADDRESS,
  getReadOnlyContract,
  getSignerContract,
  parseContractError,
} from "../utils/contract";
import { formatAddress } from "../utils/formatters";
import { useWeb3 } from "../context/Web3Context";

export default function SmartContractsExplorer() {
  const {
    account,
    connectWallet,
    connectDemoLibrarian,
    isDemoMode,
    isWrongNetwork,
    switchNetwork,
    refreshData,
    getSignerContract,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState("overview");
  const [copiedItem, setCopiedItem] = useState(null);

  // Interactive Read state
  const [readInputs, setReadInputs] = useState({});
  const [readResults, setReadResults] = useState({});
  const [readingFunction, setReadingFunction] = useState(null);

  // Interactive Write state
  const [writeInputs, setWriteInputs] = useState({});
  const [writeResults, setWriteResults] = useState({});
  const [writingFunction, setWritingFunction] = useState(null);

  const copyToClipboard = (text, name) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(name);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleReadInput = (fnName, field, value) => {
    setReadInputs((prev) => ({
      ...prev,
      [fnName]: {
        ...(prev[fnName] || {}),
        [field]: value,
      },
    }));
  };

  const handleWriteInput = (fnName, field, value) => {
    setWriteInputs((prev) => ({
      ...prev,
      [fnName]: {
        ...(prev[fnName] || {}),
        [field]: value,
      },
    }));
  };

  /**
   * Execute an interactive read function
   */
  const executeRead = async (fnName) => {
    try {
      setReadingFunction(fnName);
      setReadResults((prev) => ({ ...prev, [fnName]: { loading: true } }));
      const contract = getReadOnlyContract();
      let result;

      if (fnName === "librarian") {
        result = await contract.librarian();
      } else if (fnName === "totalBooks") {
        const total = await contract.totalBooks();
        result = total.toString();
      } else if (fnName === "getAllBookIds") {
        const ids = await contract.getAllBookIds();
        result = JSON.stringify(ids, null, 2);
      } else if (fnName === "getBook") {
        const bookId = readInputs.getBook?.bookId;
        if (!bookId) throw new Error("Please enter a bookId parameter");
        const b = await contract.getBook(bookId);
        result = JSON.stringify(
          {
            bookId: b.bookId,
            title: b.title,
            author: b.author,
            isbn: b.isbn,
            status: Number(b.status) === 0 ? "0 (Available)" : "1 (Issued)",
            currentBorrower: b.currentBorrower,
            registrationTimestamp: new Date(Number(b.registrationTimestamp) * 1000).toISOString(),
          },
          null,
          2
        );
      } else if (fnName === "isBookAvailable") {
        const bookId = readInputs.isBookAvailable?.bookId;
        if (!bookId) throw new Error("Please enter a bookId parameter");
        const avail = await contract.isBookAvailable(bookId);
        result = avail ? "true (Available)" : "false (Issued / Not Available)";
      } else if (fnName === "getBookHistory") {
        const bookId = readInputs.getBookHistory?.bookId;
        if (!bookId) throw new Error("Please enter a bookId parameter");
        const hist = await contract.getBookHistory(bookId);
        result = JSON.stringify(
          {
            bookId: hist[0],
            status: Number(hist[1]) === 0 ? "Available" : "Issued",
            currentBorrower: hist[2],
            registrationTimestamp: new Date(Number(hist[3]) * 1000).toISOString(),
          },
          null,
          2
        );
      } else if (fnName === "exists") {
        const bookId = readInputs.exists?.bookId;
        if (!bookId) throw new Error("Please enter a bookId parameter");
        const ex = await contract.exists(bookId);
        result = ex ? "true (Registered)" : "false (Does not exist)";
      }

      setReadResults((prev) => ({ ...prev, [fnName]: { success: true, data: result } }));
    } catch (err) {
      setReadResults((prev) => ({
        ...prev,
        [fnName]: { success: false, error: parseContractError(err) },
      }));
    } finally {
      setReadingFunction(null);
    }
  };

  /**
   * Execute an interactive write function
   */
  const executeWrite = async (fnName) => {
    if (!account) {
      connectDemoLibrarian();
    }
    try {
      setWritingFunction(fnName);
      setWriteResults((prev) => ({ ...prev, [fnName]: { loading: true } }));
      const contract = await getSignerContract();
      let tx;

      if (fnName === "registerBook") {
        const { bookId, title, author, isbn } = writeInputs.registerBook || {};
        if (!bookId || !title || !author || !isbn) {
          throw new Error("All fields (bookId, title, author, isbn) are required.");
        }
        tx = await contract.registerBook(bookId, title, author, isbn);
      } else if (fnName === "issueBook") {
        const { bookId, borrower } = writeInputs.issueBook || {};
        if (!bookId || !borrower) throw new Error("bookId and borrower address are required.");
        tx = await contract.issueBook(bookId, borrower);
      } else if (fnName === "returnBook") {
        const { bookId } = writeInputs.returnBook || {};
        if (!bookId) throw new Error("bookId is required.");
        tx = await contract.returnBook(bookId);
      } else if (fnName === "transferLibrarian") {
        const { newLibrarian } = writeInputs.transferLibrarian || {};
        if (!newLibrarian) throw new Error("newLibrarian address is required.");
        tx = await contract.transferLibrarian(newLibrarian);
      }

      const receipt = await tx.wait();
      setWriteResults((prev) => ({
        ...prev,
        [fnName]: {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
        },
      }));
      await refreshData();
    } catch (err) {
      setWriteResults((prev) => ({
        ...prev,
        [fnName]: { success: false, error: parseContractError(err) },
      }));
    } finally {
      setWritingFunction(null);
    }
  };

  // Specification of functions for display
  const functionSpecs = [
    {
      name: "registerBook",
      type: "write",
      inputs: [
        { name: "_bookId", type: "string", desc: "Unique identifier for the book" },
        { name: "_title", type: "string", desc: "Title of the textbook" },
        { name: "_author", type: "string", desc: "Author name(s)" },
        { name: "_isbn", type: "string", desc: "ISBN number" },
      ],
      outputs: [],
      desc: "Registers a new book in the library registry with initial Available status. Restricted to librarian.",
    },
    {
      name: "issueBook",
      type: "write",
      inputs: [
        { name: "_bookId", type: "string", desc: "Unique identifier of book to issue" },
        { name: "_borrower", type: "address", desc: "Student borrower wallet address" },
      ],
      outputs: [],
      desc: "Changes status to Issued and records the student's Ethereum address. Restricted to librarian.",
    },
    {
      name: "returnBook",
      type: "write",
      inputs: [{ name: "_bookId", type: "string", desc: "Unique identifier of book to return" }],
      outputs: [],
      desc: "Resets status to Available and clears borrower. Restricted to librarian.",
    },
    {
      name: "getBook",
      type: "read",
      inputs: [{ name: "_bookId", type: "string", desc: "Unique identifier of the book" }],
      outputs: [{ name: "Book", type: "tuple (struct)" }],
      desc: "Returns full Book record (ID, title, author, ISBN, status enum, borrower, timestamp).",
    },
    {
      name: "isBookAvailable",
      type: "read",
      inputs: [{ name: "_bookId", type: "string", desc: "Unique identifier of the book" }],
      outputs: [{ name: "available", type: "bool" }],
      desc: "Checks if a book is currently available for borrowing.",
    },
    {
      name: "getBookHistory",
      type: "read",
      inputs: [{ name: "_bookId", type: "string", desc: "Unique identifier of the book" }],
      outputs: [
        { name: "bookId", type: "string" },
        { name: "status", type: "uint8" },
        { name: "currentBorrower", type: "address" },
        { name: "registrationTimestamp", type: "uint256" },
      ],
      desc: "Returns current tracking state snapshot.",
    },
    {
      name: "totalBooks",
      type: "read",
      inputs: [],
      outputs: [{ name: "count", type: "uint256" }],
      desc: "Returns the total count of registered books in the registry.",
    },
    {
      name: "getAllBookIds",
      type: "read",
      inputs: [],
      outputs: [{ name: "ids", type: "string[]" }],
      desc: "Returns array of all registered book IDs.",
    },
    {
      name: "exists",
      type: "read",
      inputs: [{ name: "_bookId", type: "string", desc: "Book ID to check" }],
      outputs: [{ name: "registered", type: "bool" }],
      desc: "Checks if a book ID is already registered.",
    },
    {
      name: "librarian",
      type: "read",
      inputs: [],
      outputs: [{ name: "address", type: "address" }],
      desc: "Returns the authorized librarian administrator address.",
    },
    {
      name: "transferLibrarian",
      type: "write",
      inputs: [{ name: "_newLibrarian", type: "address", desc: "New librarian address" }],
      outputs: [],
      desc: "Transfers the librarian administrative role to a new wallet address.",
    },
  ];

  const eventSpecs = [
    {
      name: "BookRegistered",
      params: [
        { name: "bookId", type: "string", indexed: false },
        { name: "title", type: "string", indexed: false },
        { name: "author", type: "string", indexed: false },
        { name: "isbn", type: "string", indexed: false },
        { name: "timestamp", type: "uint256", indexed: false },
      ],
      desc: "Emitted when a new book is registered on-chain by the librarian.",
    },
    {
      name: "BookIssued",
      params: [
        { name: "bookId", type: "string", indexed: false },
        { name: "borrower", type: "address", indexed: true },
        { name: "timestamp", type: "uint256", indexed: false },
      ],
      desc: "Emitted when a book is issued to a student borrower. Borrower is indexed for fast historical filtering.",
    },
    {
      name: "BookReturned",
      params: [
        { name: "bookId", type: "string", indexed: false },
        { name: "borrower", type: "address", indexed: true },
        { name: "timestamp", type: "uint256", indexed: false },
      ],
      desc: "Emitted when an issued book is returned to the library. Borrower is indexed.",
    },
    {
      name: "LibrarianTransferred",
      params: [
        { name: "previousLibrarian", type: "address", indexed: true },
        { name: "newLibrarian", type: "address", indexed: true },
      ],
      desc: "Emitted when the administrative librarian role is transferred.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Smart Contracts Explorer
          </h1>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
            Artifact Inspection
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Direct inspection of the compiled Solidity smart contract, deployment addresses, callable
          functions, events, ABI, and source code.
        </p>
      </div>

      {/* Contract Metadata Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-mono font-bold text-lg">
              {"{ }"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {contractArtifact.contractName || "LibraryBookRegistry"}
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Deployed on Local Node
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Solidity v{contractArtifact.solidityVersion || "0.8.24"} • Hardhat EVM (Paris)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(CONTRACT_ADDRESS, "contractAddress")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              {copiedItem === "contractAddress" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy Address
            </button>
          </div>
        </div>

        {/* Key Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Contract Address</span>
            <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
              {CONTRACT_ADDRESS}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Deployer Address</span>
            <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
              {deploymentConfig.deployer || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Deployment Tx Hash</span>
            <span className="font-mono text-slate-800 text-[11px] break-all">
              {deploymentConfig.transactionHash || "N/A"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Target Network</span>
            <span className="font-bold text-slate-800">
              {deploymentConfig.networkName || "Hardhat"} (Chain ID:{" "}
              {deploymentConfig.chainId || 31337})
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: "overview", label: "1. Overview", icon: FileText },
          { id: "read", label: "2. Read Functions", icon: Eye },
          { id: "write", label: "3. Write Functions", icon: Send },
          { id: "events", label: "4. Events", icon: Layers },
          { id: "abi", label: "5. Contract ABI", icon: Terminal },
          { id: "source", label: "6. Solidity Source Code", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6 text-xs text-slate-700">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Contract Architecture & Role</h3>
            <p className="leading-relaxed">
              <strong>LibraryBookRegistry</strong> is the core smart contract of this decentralized
              college library system. It acts as an authoritative, tamper-proof state machine
              recording book ownership and tracking availability across the institution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Access Control & Modifiers
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Uses the <code className="font-mono text-blue-600 font-semibold">onlyLibrarian</code>{" "}
                modifier to restrict state-changing transactions (book registration, issuance, and
                returns) strictly to the authorized librarian account. Non-librarian attempts revert
                on-chain.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Operational Status Enum
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Book status is modeled via <code className="font-mono text-blue-600">enum BookStatus &#123; Available, Issued &#125;</code>.
                State transitions follow strict rules: only available books can be issued, and only
                issued books can be returned.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900">Summary of Functions & Events</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
                <span className="font-bold text-blue-700 block mb-1">State Writes (4)</span>
                <ul className="space-y-0.5 text-slate-700">
                  <li>• registerBook()</li>
                  <li>• issueBook()</li>
                  <li>• returnBook()</li>
                  <li>• transferLibrarian()</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">View Functions (7)</span>
                <ul className="space-y-0.5 text-slate-600">
                  <li>• getBook()</li>
                  <li>• isBookAvailable()</li>
                  <li>• getBookHistory()</li>
                  <li>• totalBooks()</li>
                  <li>• getAllBookIds()</li>
                  <li>• getAllBooks()</li>
                  <li>• librarian()</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <span className="font-bold text-amber-800 block mb-1">Emitted Events (4)</span>
                <ul className="space-y-0.5 text-slate-700">
                  <li>• BookRegistered</li>
                  <li>• BookIssued</li>
                  <li>• BookReturned</li>
                  <li>• LibrarianTransferred</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: READ FUNCTIONS (INTERACTIVE) */}
      {activeTab === "read" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
            <span>
              <strong>Interactive Read:</strong> Query real on-chain view functions directly without gas fees or wallet signatures.
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. librarian() */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">librarian()</span>
                  <span className="ml-2 text-slate-400">returns (address)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Returns the authorized librarian administrator address.
                  </p>
                </div>
                <button
                  onClick={() => executeRead("librarian")}
                  disabled={readingFunction === "librarian"}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {readingFunction === "librarian" ? "Calling..." : "Query"}
                </button>
              </div>
              {readResults.librarian && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {readResults.librarian.success ? (
                    <span className="text-emerald-700 font-bold">{readResults.librarian.data}</span>
                  ) : (
                    <span className="text-rose-600">{readResults.librarian.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* 2. totalBooks() */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">totalBooks()</span>
                  <span className="ml-2 text-slate-400">returns (uint256)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Returns total registered books count in the contract.
                  </p>
                </div>
                <button
                  onClick={() => executeRead("totalBooks")}
                  disabled={readingFunction === "totalBooks"}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {readingFunction === "totalBooks" ? "Calling..." : "Query"}
                </button>
              </div>
              {readResults.totalBooks && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {readResults.totalBooks.success ? (
                    <span className="text-emerald-700 font-bold">{readResults.totalBooks.data} books</span>
                  ) : (
                    <span className="text-rose-600">{readResults.totalBooks.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* 3. getBook(bookId) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">getBook(string _bookId)</span>
                <span className="ml-2 text-slate-400">returns (Book struct)</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Returns all on-chain fields for a registered book.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter bookId (e.g. CS-AI-101)"
                  value={readInputs.getBook?.bookId || ""}
                  onChange={(e) => handleReadInput("getBook", "bookId", e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  onClick={() => executeRead("getBook")}
                  disabled={readingFunction === "getBook"}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {readingFunction === "getBook" ? "Calling..." : "Query"}
                </button>
              </div>
              {readResults.getBook && (
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto">
                  {readResults.getBook.success
                    ? readResults.getBook.data
                    : `Error: ${readResults.getBook.error}`}
                </pre>
              )}
            </div>

            {/* 4. isBookAvailable(bookId) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">isBookAvailable(string _bookId)</span>
                <span className="ml-2 text-slate-400">returns (bool)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter bookId (e.g. CS-AI-101)"
                  value={readInputs.isBookAvailable?.bookId || ""}
                  onChange={(e) => handleReadInput("isBookAvailable", "bookId", e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <button
                  onClick={() => executeRead("isBookAvailable")}
                  disabled={readingFunction === "isBookAvailable"}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {readingFunction === "isBookAvailable" ? "Calling..." : "Query"}
                </button>
              </div>
              {readResults.isBookAvailable && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {readResults.isBookAvailable.success ? (
                    <span className="text-emerald-700 font-bold">{readResults.isBookAvailable.data}</span>
                  ) : (
                    <span className="text-rose-600">{readResults.isBookAvailable.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* 5. getAllBookIds() */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">getAllBookIds()</span>
                  <span className="ml-2 text-slate-400">returns (string[])</span>
                </div>
                <button
                  onClick={() => executeRead("getAllBookIds")}
                  disabled={readingFunction === "getAllBookIds"}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {readingFunction === "getAllBookIds" ? "Calling..." : "Query"}
                </button>
              </div>
              {readResults.getAllBookIds && (
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto">
                  {readResults.getAllBookIds.success
                    ? readResults.getAllBookIds.data
                    : `Error: ${readResults.getAllBookIds.error}`}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WRITE FUNCTIONS (INTERACTIVE) */}
      {activeTab === "write" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>
              <strong>Interactive Write Operations:</strong> State transitions are signed and broadcast to the Hardhat node.
              {isDemoMode && <strong className="text-emerald-700 ml-1.5">(⚡ Direct Node Signer Active)</strong>}
            </span>
            {!account && (
              <div className="flex items-center gap-2">
                <button
                  onClick={connectDemoLibrarian}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-semibold text-xs whitespace-nowrap"
                >
                  ⚡ Direct Signer (No MetaMask)
                </button>
                <button
                  onClick={connectWallet}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold text-xs whitespace-nowrap"
                >
                  Connect MetaMask
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* 1. registerBook */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  1. registerBook(string _bookId, string _title, string _author, string _isbn)
                </span>
                <span className="ml-2 text-amber-700 font-semibold">[onlyLibrarian]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                <input
                  type="text"
                  placeholder="_bookId (e.g. CS-NET-101)"
                  value={writeInputs.registerBook?.bookId || ""}
                  onChange={(e) => handleWriteInput("registerBook", "bookId", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="_isbn"
                  value={writeInputs.registerBook?.isbn || ""}
                  onChange={(e) => handleWriteInput("registerBook", "isbn", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="_title"
                  value={writeInputs.registerBook?.title || ""}
                  onChange={(e) => handleWriteInput("registerBook", "title", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="_author"
                  value={writeInputs.registerBook?.author || ""}
                  onChange={(e) => handleWriteInput("registerBook", "author", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => executeWrite("registerBook")}
                  disabled={writingFunction === "registerBook"}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {writingFunction === "registerBook" ? "Broadcasting..." : "Write Transaction"}
                </button>
              </div>
              {writeResults.registerBook && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {writeResults.registerBook.success ? (
                    <span className="text-emerald-700 font-bold">
                      Confirmed in block #{writeResults.registerBook.blockNumber} (Tx:{" "}
                      {writeResults.registerBook.txHash})
                    </span>
                  ) : (
                    <span className="text-rose-600">{writeResults.registerBook.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* 2. issueBook */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  2. issueBook(string _bookId, address _borrower)
                </span>
                <span className="ml-2 text-amber-700 font-semibold">[onlyLibrarian]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                <input
                  type="text"
                  placeholder="_bookId"
                  value={writeInputs.issueBook?.bookId || ""}
                  onChange={(e) => handleWriteInput("issueBook", "bookId", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="_borrower (0x...)"
                  value={writeInputs.issueBook?.borrower || ""}
                  onChange={(e) => handleWriteInput("issueBook", "borrower", e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => executeWrite("issueBook")}
                  disabled={writingFunction === "issueBook"}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {writingFunction === "issueBook" ? "Broadcasting..." : "Write Transaction"}
                </button>
              </div>
              {writeResults.issueBook && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {writeResults.issueBook.success ? (
                    <span className="text-emerald-700 font-bold">
                      Confirmed in block #{writeResults.issueBook.blockNumber} (Tx:{" "}
                      {writeResults.issueBook.txHash})
                    </span>
                  ) : (
                    <span className="text-rose-600">{writeResults.issueBook.error}</span>
                  )}
                </div>
              )}
            </div>

            {/* 3. returnBook */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  3. returnBook(string _bookId)
                </span>
                <span className="ml-2 text-amber-700 font-semibold">[onlyLibrarian]</span>
              </div>
              <div className="font-mono">
                <input
                  type="text"
                  placeholder="_bookId to return"
                  value={writeInputs.returnBook?.bookId || ""}
                  onChange={(e) => handleWriteInput("returnBook", "bookId", e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => executeWrite("returnBook")}
                  disabled={writingFunction === "returnBook"}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {writingFunction === "returnBook" ? "Broadcasting..." : "Write Transaction"}
                </button>
              </div>
              {writeResults.returnBook && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {writeResults.returnBook.success ? (
                    <span className="text-emerald-700 font-bold">
                      Confirmed in block #{writeResults.returnBook.blockNumber} (Tx:{" "}
                      {writeResults.returnBook.txHash})
                    </span>
                  ) : (
                    <span className="text-rose-600">{writeResults.returnBook.error}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EVENTS */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Emitted Blockchain Events</h3>
            <p className="text-xs text-slate-500">
              Events are stored as logs in transaction receipts. Indexed fields allow fast querying
              via EVM bloom filters.
            </p>

            <div className="space-y-4">
              {eventSpecs.map((ev) => (
                <div
                  key={ev.name}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-sm">{ev.name}</span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {ev.params.length} parameters
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{ev.desc}</p>
                  <div className="pt-2 font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg space-y-1">
                    {ev.params.map((p) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <span className="text-blue-400">{p.type}</span>
                        {p.indexed && (
                          <span className="text-amber-400 text-[10px] font-bold">[indexed]</span>
                        )}
                        <span className="text-slate-300">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ABI */}
      {activeTab === "abi" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Binary Interface (ABI)</h3>
              <p className="text-xs text-slate-500">
                JSON interface standard used by Ethers.js to encode and decode EVM transactions
              </p>
            </div>
            <button
              onClick={() =>
                copyToClipboard(JSON.stringify(contractArtifact.abi, null, 2), "abiJson")
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              {copiedItem === "abiJson" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy ABI JSON
            </button>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
            {JSON.stringify(contractArtifact.abi, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB 6: SOURCE CODE */}
      {activeTab === "source" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">LibraryBookRegistry.sol</h3>
              <p className="text-xs text-slate-500">
                Solidity ^0.8.24 source code compiled and deployed to Hardhat network
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(contractArtifact.sourceCode || "", "sourceCode")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              {copiedItem === "sourceCode" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy Source Code
            </button>
          </div>

          <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[600px] border border-slate-900">
            <pre>{contractArtifact.sourceCode || "// Source code loaded from contracts/LibraryBookRegistry.sol"}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
