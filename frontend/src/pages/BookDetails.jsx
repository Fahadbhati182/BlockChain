import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  User,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  ExternalLink,
  RotateCcw,
  PlusCircle,
  Copy,
  Check,
  Cpu,
  MapPin,
  FileText,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  CONTRACT_ADDRESS,
  getReadOnlyContract,
  formatBook,
} from "../utils/contract";
import { formatAddress, formatTxHash, formatTimestamp } from "../utils/formatters";
import { fetchBookMetadataById, fetchStudentProfile } from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import TransactionModal from "../components/TransactionModal";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, isLibrarian, refreshData } = useWeb3();

  const [book, setBook] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [borrowerProfile, setBorrowerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBookData() {
      try {
        setLoading(true);
        setError(null);
        const contract = getReadOnlyContract();

        // 1. Fetch on-chain state directly from Solidity contract
        const raw = await contract.getBook(id);
        const parsedBook = formatBook(raw);

        if (!isMounted) return;
        setBook(parsedBook);

        // 2. Fetch off-chain enrichment metadata from backend API
        const meta = await fetchBookMetadataById(id);
        if (isMounted) setMetadata(meta);

        // 3. If book is currently issued, fetch student profile
        if (parsedBook.currentBorrower) {
          const profile = await fetchStudentProfile(parsedBook.currentBorrower);
          if (isMounted) setBorrowerProfile(profile);
        }
      } catch (err) {
        console.error("Error loading book details:", err);
        if (isMounted) {
          setError(`No book registered with ID '${id}' on the blockchain.`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      loadBookData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Filter events specifically for this book ID
  const bookEvents = events.filter(
    (e) => e.bookId && e.bookId.toLowerCase() === (id || "").toLowerCase()
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Querying on-chain book state for {id}...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Book Not Found</h2>
          <p className="text-xs text-slate-500">{error || `Book '${id}' does not exist.`}</p>
        </div>
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {book.status === 0 ? (
            <Link
              to={`/librarian?tab=issue`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
            >
              Issue Book
            </Link>
          ) : (
            <Link
              to={`/librarian?tab=return`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Record Return
            </Link>
          )}
        </div>
      </div>

      {/* Main Book Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {book.bookId}
              </span>
              <StatusBadge status={book.status} />
              {metadata?.category && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                  {metadata.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {book.title}
            </h1>

            <p className="text-sm text-slate-600">
              By <strong className="text-slate-800">{book.author}</strong>
            </p>

            {metadata?.description && (
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Book Cover Image */}
          <div className="w-32 h-44 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
            {metadata?.coverImage ? (
              <img
                src={metadata.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-10 h-10 text-slate-400" />
            )}
          </div>
        </div>

        {/* Technical Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">ISBN Number</span>
            <span className="font-mono font-bold text-slate-800 mt-0.5 block">{book.isbn}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Shelf Location</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {metadata?.shelfLocation || "Main Library"}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Registration Time</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formatTimestamp(book.registrationTimestamp)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block">Smart Contract</span>
            <span className="font-mono text-slate-800 mt-0.5 block">
              {formatAddress(CONTRACT_ADDRESS, 4)}
            </span>
          </div>
        </div>
      </div>

      {/* Borrower Card (If Currently Issued) */}
      {book.status === 1 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-amber-950">Current Borrower Details</h3>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-800">
                {borrowerProfile?.fullName || "Student Account"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Student ID / Dept</span>
              <span className="text-slate-700">
                {borrowerProfile?.studentId || "Enrolled Student"} •{" "}
                {borrowerProfile?.department || "Engineering"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Borrower Wallet</span>
              <span className="font-mono text-amber-800 font-bold text-[11px] break-all">
                {book.currentBorrower}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Blockchain History Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Chronological Blockchain Tracking Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Immutable history reconstructed directly from on-chain event logs for this book
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {bookEvents.length} Event{bookEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {bookEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No events found for this book in current block logs.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {bookEvents.map((ev, index) => {
              const isRegister = ev.eventName === "BookRegistered";
              const isIssue = ev.eventName === "BookIssued";
              const isReturn = ev.eventName === "BookReturned";

              return (
                <div key={ev.id} className="relative space-y-2">
                  {/* Timeline bullet dot */}
                  <div
                    className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      isRegister
                        ? "bg-blue-600"
                        : isIssue
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  {/* Event item box */}
                  <div className="bg-slate-50 hover:bg-slate-100/70 p-4 rounded-xl border border-slate-200/80 transition space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isRegister
                              ? "bg-blue-100 text-blue-800"
                              : isIssue
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {ev.eventName}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          Block #{ev.blockNumber}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {formatTimestamp(ev.timestamp)}
                      </span>
                    </div>

                    {isIssue && ev.borrower && (
                      <p className="text-slate-700">
                        Issued to student:{" "}
                        <strong className="font-mono text-amber-800">{ev.borrower}</strong>
                      </p>
                    )}

                    {isReturn && ev.borrower && (
                      <p className="text-slate-700">
                        Returned by student:{" "}
                        <strong className="font-mono text-emerald-800">{ev.borrower}</strong>
                      </p>
                    )}

                    {isRegister && (
                      <p className="text-slate-600">
                        Registered in library registry by authorized librarian.
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200/60">
                      <span>Tx: {formatTxHash(ev.transactionHash, 8)}</span>
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-semibold text-xs"
                      >
                        Inspect Transaction
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedEvent && (
        <TransactionModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
