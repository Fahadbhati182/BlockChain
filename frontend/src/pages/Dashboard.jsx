import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  PlusCircle,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Activity,
  Search,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import TransactionModal from "../components/TransactionModal";
import { formatAddress, formatTxHash, formatRelativeTime } from "../utils/formatters";

export default function Dashboard() {
  const { books, events, loadingData, isLibrarian, account } = useWeb3();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Compute live statistics from real blockchain state
  const totalRegistered = books.length;
  const availableCount = books.filter((b) => b.status === 0).length;
  const issuedCount = books.filter((b) => b.status === 1).length;
  const totalEventsCount = events.length;

  // Recent 4 books
  const recentBooks = [...books].reverse().slice(0, 4);

  // Recent 5 transactions
  const recentTransactions = events.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Smart Contract Backed System</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Decentralized Library Book Tracking
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Every book registration, issue, and return is permanently committed to Solidity smart
            contracts on the blockchain. Real-time availability and transparent audit logs ensure
            zero tampering.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Browse Catalogue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/librarian"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              Librarian Portal
            </Link>
          </div>
        </div>

        {/* Subtle decorative background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <BookOpen className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered"
          value={loadingData ? "..." : totalRegistered}
          subtitle="On-chain book records"
          icon={BookOpen}
          color="blue"
          badge="Live State"
        />
        <StatCard
          title="Available Books"
          value={loadingData ? "..." : availableCount}
          subtitle="Ready for issuance"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Currently Issued"
          value={loadingData ? "..." : issuedCount}
          subtitle="Borrowed by students"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Recorded Events"
          value={loadingData ? "..." : totalEventsCount}
          subtitle="Immutable blockchain logs"
          icon={Layers}
          color="indigo"
          badge="Block Logs"
        />
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Librarian Operations</h3>
            <p className="text-[11px] text-slate-500">
              Execute transactions on the local Hardhat smart contract
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Link
            to="/librarian?tab=register"
            className="flex-1 md:flex-initial text-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
          >
            + Register Book
          </Link>
          <Link
            to="/librarian?tab=issue"
            className="flex-1 md:flex-initial text-center px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition"
          >
            Issue to Student
          </Link>
          <Link
            to="/librarian?tab=return"
            className="flex-1 md:flex-initial text-center px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition"
          >
            Record Return
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Recent Books & Latest Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Books (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recently Registered Books</h3>
                <p className="text-xs text-slate-500">Latest entries committed to blockchain registry</p>
              </div>
              <Link
                to="/catalogue"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View all ({books.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading blockchain state...</div>
            ) : recentBooks.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">No books registered yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Use the Librarian Panel to register your first textbook on the local blockchain.
                  </p>
                </div>
                <Link
                  to="/librarian?tab=register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
                >
                  Register First Book
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentBooks.map((book) => (
                  <div
                    key={book.bookId}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {book.bookId.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/books/${encodeURIComponent(book.bookId)}`}
                          className="font-bold text-xs text-slate-900 hover:text-blue-600 truncate block"
                        >
                          {book.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {book.author} • <span className="font-mono text-slate-600">{book.bookId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={book.status} />
                      <Link
                        to={`/books/${encodeURIComponent(book.bookId)}`}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latest Blockchain Transactions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Latest Blockchain Events</h3>
                <p className="text-xs text-slate-500">Real verified block logs</p>
              </div>
              <Link
                to="/explorer"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Explorer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">Querying event logs...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No events emitted yet</p>
                <p className="text-[11px]">Transactions executed on the smart contract will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedEvent(tx)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {tx.eventName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(tx.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">
                        Book ID: <strong className="font-mono text-slate-800">{tx.bookId}</strong>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Block #{tx.blockNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                      <span>Tx: {formatTxHash(tx.transactionHash, 6)}</span>
                      <span className="text-blue-600 flex items-center gap-0.5">
                        Details <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedEvent && (
        <TransactionModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
