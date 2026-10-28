import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wallet,
  Sparkles,
  Info,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  getSignerContract,
  parseContractError,
  switchOrAddHardhatNetwork,
} from "../utils/contract";
import { formatAddress } from "../utils/formatters";

// Pre-configured test student accounts from Hardhat for effortless college demonstration
const sampleStudents = [
  {
    name: "Alex Rivera (CS - Year 3)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    name: "Priya Sharma (IT - Year 2)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
  {
    name: "Jordan Lee (AI & DS - Year 1)",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  },
];

export default function LibrarianPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "register";
  const [activeTab, setActiveTab] = useState(initialTab);

  const {
    account,
    connectWallet,
    isLibrarian,
    librarianAddress,
    isWrongNetwork,
    switchNetwork,
    books,
    refreshData,
    isDemoMode,
    connectDemoLibrarian,
  } = useWeb3();

  // Tab 1: Register Book state
  const [regBookId, setRegBookId] = useState("");
  const [regTitle, setRegTitle] = useState("");
  const [regAuthor, setRegAuthor] = useState("");
  const [regIsbn, setRegIsbn] = useState("");

  // Tab 2: Issue Book state
  const [issueBookId, setIssueBookId] = useState("");
  const [issueBorrower, setIssueBorrower] = useState("");

  // Tab 3: Return Book state
  const [returnBookId, setReturnBookId] = useState("");

  // Transaction execution status
  const [isPending, setIsPending] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["register", "issue", "return"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setActionError(null);
    setSuccessResult(null);
  };

  // Filter available and issued books for effortless quick selection
  const availableBooks = books.filter((b) => b.status === 0);
  const issuedBooks = books.filter((b) => b.status === 1);

  // Helper to load a sample book template for quick demonstration
  const handleLoadSampleBook = () => {
    const samples = [
      {
        id: `CS-SYS-${Math.floor(100 + Math.random() * 900)}`,
        title: "Distributed Systems: Principles and Paradigms",
        author: "Andrew S. Tanenbaum",
        isbn: "978-1530281756",
      },
      {
        id: `CS-SEC-${Math.floor(100 + Math.random() * 900)}`,
        title: "Cryptography and Network Security",
        author: "William Stallings",
        isbn: "978-0134444284",
      },
      {
        id: `CS-ALG-${Math.floor(100 + Math.random() * 900)}`,
        title: "Introduction to Algorithms (CLRS)",
        author: "Thomas H. Cormen",
        isbn: "978-0262046305",
      },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setRegBookId(pick.id);
    setRegTitle(pick.title);
    setRegAuthor(pick.author);
    setRegIsbn(pick.isbn);
  };

  /**
   * Action 1: Register Book on Blockchain
   */
  const handleRegisterBook = async (e) => {
    e.preventDefault();
    setActionError(null);
    setSuccessResult(null);

    if (!regBookId.trim() || !regTitle.trim() || !regAuthor.trim() || !regIsbn.trim()) {
      setActionError("All fields (Book ID, Title, Author, ISBN) are required.");
      return;
    }

    try {
      setIsPending(true);
      const contract = await getSignerContract();

      console.log(`Submitting registerBook(${regBookId}, ${regTitle}, ${regAuthor}, ${regIsbn})...`);
      const tx = await contract.registerBook(
        regBookId.trim(),
        regTitle.trim(),
        regAuthor.trim(),
        regIsbn.trim()
      );

      setPendingTxHash(tx.hash);
      console.log("Transaction submitted:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setSuccessResult({
        type: "register",
        title: "Book Registered Successfully!",
        bookId: regBookId.trim(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      // Clear form
      setRegBookId("");
      setRegTitle("");
      setRegAuthor("");
      setRegIsbn("");

      // Refresh contract state
      await refreshData();
    } catch (err) {
      console.error("Register book error:", err);
      setActionError(parseContractError(err));
    } finally {
      setIsPending(false);
      setPendingTxHash(null);
    }
  };

  /**
   * Action 2: Issue Book to Student
   */
  const handleIssueBook = async (e) => {
    e.preventDefault();
    setActionError(null);
    setSuccessResult(null);

    if (!issueBookId.trim()) {
      setActionError("Please select or enter a Book ID.");
      return;
    }
    if (!issueBorrower.trim()) {
      setActionError("Student borrower wallet address is required.");
      return;
    }

    try {
      setIsPending(true);
      const contract = await getSignerContract();

      console.log(`Submitting issueBook(${issueBookId}, ${issueBorrower})...`);
      const tx = await contract.issueBook(issueBookId.trim(), issueBorrower.trim());

      setPendingTxHash(tx.hash);
      const receipt = await tx.wait();

      setSuccessResult({
        type: "issue",
        title: "Book Issued Successfully!",
        bookId: issueBookId.trim(),
        borrower: issueBorrower.trim(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      setIssueBookId("");
      setIssueBorrower("");
      await refreshData();
    } catch (err) {
      console.error("Issue book error:", err);
      setActionError(parseContractError(err));
    } finally {
      setIsPending(false);
      setPendingTxHash(null);
    }
  };

  /**
   * Action 3: Return Book
   */
  const handleReturnBook = async (e) => {
    e.preventDefault();
    setActionError(null);
    setSuccessResult(null);

    if (!returnBookId.trim()) {
      setActionError("Please select or enter the Book ID being returned.");
      return;
    }

    try {
      setIsPending(true);
      const contract = await getSignerContract();

      console.log(`Submitting returnBook(${returnBookId})...`);
      const tx = await contract.returnBook(returnBookId.trim());

      setPendingTxHash(tx.hash);
      const receipt = await tx.wait();

      setSuccessResult({
        type: "return",
        title: "Book Return Recorded Successfully!",
        bookId: returnBookId.trim(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      setReturnBookId("");
      await refreshData();
    } catch (err) {
      console.error("Return book error:", err);
      setActionError(parseContractError(err));
    } finally {
      setIsPending(false);
      setPendingTxHash(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Librarian Administrative Portal
          </h1>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
            Smart Contract Writes
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Authorized operations write state transitions directly to the Solidity contract and emit
          verifiable blockchain events.
        </p>
      </div>

      {/* Access Control & Wallet Status Bar */}
      {!account ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="font-bold">Librarian Wallet Authorization</p>
              <p className="text-amber-700">
                You can connect MetaMask OR use the local node's direct signer to test transactions without any browser extension.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={connectDemoLibrarian}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            >
              ⚡ Use Local Signer (No MetaMask)
            </button>
            <button
              onClick={connectWallet}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            >
              Connect MetaMask
            </button>
          </div>
        </div>
      ) : isWrongNetwork ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Wrong Network Selected</p>
              <p className="text-rose-700">
                You must be connected to Hardhat Localhost (Chain ID: 31337) to submit transactions.
              </p>
            </div>
          </div>
          <button
            onClick={switchNetwork}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm transition"
          >
            Switch Network
          </button>
        </div>
      ) : !isLibrarian ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Unauthorized Account Warning</span>
          </div>
          <p className="leading-relaxed">
            Connected Wallet: <strong className="font-mono">{formatAddress(account, 6)}</strong>
            <br />
            Authorized Librarian:{" "}
            <strong className="font-mono">{librarianAddress ? formatAddress(librarianAddress, 6) : "Checking..."}</strong>
          </p>
          <p className="text-[11px] text-amber-700 bg-amber-100/60 p-2 rounded">
            <strong>Demonstration Tip:</strong> Import Hardhat's default test private key (Account #0:{" "}
            <code className="font-mono">0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code>
            ) into MetaMask to act as the authorized librarian. Transactions executed from non-librarian accounts will revert on-chain.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Connected as Authorized Librarian:{" "}
              <strong className="font-mono">{formatAddress(account, 6)}</strong>
            </span>
          </div>
          <span className="font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded text-[11px]">
            {isDemoMode ? "⚡ Direct Node Signer Active" : "Write Access Verified"}
          </span>
        </div>
      )}

      {/* Operation Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => handleTabChange("register")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "register"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Register Book
        </button>
        <button
          onClick={() => handleTabChange("issue")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "issue"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Issue Book
        </button>
        <button
          onClick={() => handleTabChange("return")}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "return"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Record Return
        </button>
      </div>

      {/* Success Banner */}
      {successResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successResult.title}</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] bg-emerald-100/60 p-3 rounded-lg text-emerald-950">
            <div>Book ID: {successResult.bookId}</div>
            {successResult.borrower && <div>Borrower: {successResult.borrower}</div>}
            <div className="break-all">Tx Hash: {successResult.txHash}</div>
            <div>Confirmed in Block #{successResult.blockNumber}</div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Transaction Failed</p>
            <p className="mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Pending State Banner */}
      {isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Transaction Pending on Hardhat Blockchain...</span>
          </div>
          <p className="text-[11px] text-blue-700">
            Please approve the transaction in MetaMask and wait for block mining.
          </p>
          {pendingTxHash && (
            <p className="font-mono text-[10px] break-all bg-blue-100/60 p-2 rounded">
              Tx: {pendingTxHash}
            </p>
          )}
        </div>
      )}

      {/* TAB 1: REGISTER BOOK */}
      {activeTab === "register" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Register New Book On-Chain</h3>
              <p className="text-xs text-slate-500">
                Calls <code className="font-mono text-blue-600">registerBook(bookId, title, author, isbn)</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleBook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Fill Sample Data
            </button>
          </div>

          <form onSubmit={handleRegisterBook} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Unique Book ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS-AI-101"
                  value={regBookId}
                  onChange={(e) => setRegBookId(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  ISBN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 978-0134610993"
                  value={regIsbn}
                  onChange={(e) => setRegIsbn(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Book Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Artificial Intelligence: A Modern Approach"
                value={regTitle}
                onChange={(e) => setRegTitle(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Author(s) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Stuart Russell, Peter Norvig"
                value={regAuthor}
                onChange={(e) => setRegAuthor(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending || !account}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isPending ? "Submitting to Blockchain..." : "Register on Blockchain"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ISSUE BOOK */}
      {activeTab === "issue" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Issue Book to Student</h3>
            <p className="text-xs text-slate-500">
              Calls <code className="font-mono text-blue-600">issueBook(bookId, borrower)</code>
            </p>
          </div>

          <form onSubmit={handleIssueBook} className="space-y-4 text-xs">
            {/* Book ID Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Select Available Book <span className="text-rose-500">*</span>
                </label>
                <span className="text-slate-400 text-[11px]">
                  {availableBooks.length} available to borrow
                </span>
              </div>

              {availableBooks.length > 0 ? (
                <select
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose an Available Book --</option>
                  {availableBooks.map((b) => (
                    <option key={b.bookId} value={b.bookId}>
                      [{b.bookId}] {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                  No books are currently in Available status. Register a new book or wait for returns.
                </div>
              )}
            </div>

            {/* Custom Book ID override */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[11px]">Or Enter Book ID manually:</label>
              <input
                type="text"
                placeholder="e.g. CS-AI-101"
                value={issueBookId}
                onChange={(e) => setIssueBookId(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Student Wallet Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Student Borrower Wallet Address <span className="text-rose-500">*</span>
                </label>
                <span className="text-slate-400 text-[11px]">Ethereum Address</span>
              </div>

              <input
                type="text"
                placeholder="0x..."
                value={issueBorrower}
                onChange={(e) => setIssueBorrower(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />

              {/* Quick-fill sample students */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-500 block mb-1">
                  Quick Select College Student (Test Accounts):
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleStudents.map((stu) => (
                    <button
                      key={stu.address}
                      type="button"
                      onClick={() => setIssueBorrower(stu.address)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200 transition"
                    >
                      {stu.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending || !account || availableBooks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isPending ? "Confirming on Blockchain..." : "Issue Book"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RECORD RETURN */}
      {activeTab === "return" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Record Book Return</h3>
            <p className="text-xs text-slate-500">
              Calls <code className="font-mono text-blue-600">returnBook(bookId)</code>. Clears borrower
              and sets status back to Available.
            </p>
          </div>

          <form onSubmit={handleReturnBook} className="space-y-4 text-xs">
            {/* Issued Books Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Select Currently Issued Book <span className="text-rose-500">*</span>
                </label>
                <span className="text-slate-400 text-[11px]">
                  {issuedBooks.length} books currently out on loan
                </span>
              </div>

              {issuedBooks.length > 0 ? (
                <select
                  value={returnBookId}
                  onChange={(e) => setReturnBookId(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose an Issued Book to Return --</option>
                  {issuedBooks.map((b) => (
                    <option key={b.bookId} value={b.bookId}>
                      [{b.bookId}] {b.title} (Borrower: {formatAddress(b.currentBorrower, 4)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs">
                  No books are currently issued. All registered books are available in the library!
                </div>
              )}
            </div>

            {/* Custom Book ID override */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[11px]">Or Enter Book ID manually:</label>
              <input
                type="text"
                placeholder="e.g. CS-AI-101"
                value={returnBookId}
                onChange={(e) => setReturnBookId(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending || !account || issuedBooks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isPending ? "Confirming Return..." : "Record Return"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
