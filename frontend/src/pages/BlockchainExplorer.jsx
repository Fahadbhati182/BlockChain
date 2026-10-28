import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Layers,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Hash,
  Database,
  Info,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  CONTRACT_ADDRESS,
  getJsonRpcProvider,
  fetchAllBlockchainEvents,
} from "../utils/contract";
import { formatAddress, formatTxHash, formatTimestamp } from "../utils/formatters";
import TransactionModal from "../components/TransactionModal";

export default function BlockchainExplorer() {
  const { events, books, loadingData, refreshData, networkName, chainId, account } = useWeb3();
  const [currentBlock, setCurrentBlock] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [bookIdFilter, setBookIdFilter] = useState("");
  const [fromBlockFilter, setFromBlockFilter] = useState("");
  const [toBlockFilter, setToBlockFilter] = useState("");

  // Fetch current block number from RPC provider
  useEffect(() => {
    let isMounted = true;
    async function loadBlockNumber() {
      try {
        const provider = getJsonRpcProvider();
        const block = await provider.getBlockNumber();
        if (isMounted) setCurrentBlock(block);
      } catch (err) {
        // ignore
      }
    }
    loadBlockNumber();
    const interval = setInterval(loadBlockNumber, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const copyContractAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Event type filter
      if (eventTypeFilter !== "all" && ev.eventName !== eventTypeFilter) return false;

      // Book ID filter
      if (
        bookIdFilter.trim() &&
        !ev.bookId.toLowerCase().includes(bookIdFilter.trim().toLowerCase())
      ) {
        return false;
      }

      // Block range filter
      if (fromBlockFilter && ev.blockNumber < Number(fromBlockFilter)) return false;
      if (toBlockFilter && ev.blockNumber > Number(toBlockFilter)) return false;

      return true;
    });
  }, [events, eventTypeFilter, bookIdFilter, fromBlockFilter, toBlockFilter]);

  const getEventBadge = (name) => {
    switch (name) {
      case "BookRegistered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            BookRegistered
          </span>
        );
      case "BookIssued":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            BookIssued
          </span>
        );
      case "BookReturned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            BookReturned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {name}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Blockchain Transaction Explorer
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Live Hardhat Node
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger audit displaying confirmed state transition transactions and emitted events
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          disabled={loadingData}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-blue-600" : ""}`} />
          Refresh Explorer
        </button>
      </div>

      {/* Explorer Overview Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Network Name
          </span>
          <p className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hardhat Localhost
          </p>
          <p className="text-xs text-slate-500 font-mono">Chain ID: {chainId || 31337}</p>
        </div>

        {/* Current Block */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Latest Block Height
          </span>
          <p className="text-xl font-bold font-mono text-slate-900">
            {currentBlock !== null ? `#${currentBlock}` : "Syncing..."}
          </p>
          <p className="text-xs text-slate-500">Auto-mined on local network</p>
        </div>

        {/* Contract Address */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Contract Address
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-800">
              {formatAddress(CONTRACT_ADDRESS, 5)}
            </span>
            <button
              onClick={copyContractAddress}
              className="p-1 text-slate-400 hover:text-blue-600 transition"
              title="Copy Contract Address"
            >
              {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">LibraryBookRegistry.sol</p>
        </div>

        {/* Total Events */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Recorded Event Logs
          </span>
          <p className="text-xl font-bold text-slate-900">{events.length}</p>
          <p className="text-xs text-slate-500">{books.length} unique registered books</p>
        </div>
      </div>

      {/* Explanatory Architecture Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold">Understanding Blockchain Event Logs vs Contract State</p>
          <p className="text-blue-800">
            In Ethereum and EVM-compatible chains, event logs (<code className="font-mono">BookRegistered</code>,{" "}
            <code className="font-mono">BookIssued</code>, <code className="font-mono">BookReturned</code>) are stored
            permanently in the transaction receipts of each block. They provide a tamper-proof historical timeline of
            state changes, whereas view functions like <code className="font-mono">getBook()</code> return the current
            snapshot state.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Filter Blockchain Transactions
          </span>
          {(eventTypeFilter !== "all" || bookIdFilter || fromBlockFilter || toBlockFilter) && (
            <button
              onClick={() => {
                setEventTypeFilter("all");
                setBookIdFilter("");
                setFromBlockFilter("");
                setToBlockFilter("");
              }}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Event Type Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Events ({events.length})</option>
              <option value="BookRegistered">BookRegistered</option>
              <option value="BookIssued">BookIssued</option>
              <option value="BookReturned">BookReturned</option>
            </select>
          </div>

          {/* Book ID Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Book ID</label>
            <input
              type="text"
              placeholder="e.g. CS-AI-101"
              value={bookIdFilter}
              onChange={(e) => setBookIdFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* From Block */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">From Block</label>
            <input
              type="number"
              placeholder="0"
              value={fromBlockFilter}
              onChange={(e) => setFromBlockFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* To Block */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">To Block</label>
            <input
              type="number"
              placeholder={currentBlock ? String(currentBlock) : "Latest"}
              value={toBlockFilter}
              onChange={(e) => setToBlockFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">
            Recorded Ledger Transactions ({filteredEvents.length})
          </h3>
          <span className="text-[11px] text-slate-400">Ordered by Block Height (Newest First)</span>
        </div>

        {loadingData ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Scanning blockchain blocks for contract event logs...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No transactions match your criteria</p>
            <p className="text-[11px] text-slate-400">
              Execute a registration, issue, or return operation to generate transactions on the chain.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Tx Hash</th>
                  <th className="py-3 px-4">Book ID</th>
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Details / Borrower</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-sans">{getEventBadge(ev.eventName)}</td>

                    <td className="py-3 px-4 text-blue-600 font-semibold">
                      {formatTxHash(ev.transactionHash, 6)}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-bold">{ev.bookId}</td>

                    <td className="py-3 px-4 text-slate-600">#{ev.blockNumber}</td>

                    <td className="py-3 px-4 font-sans text-slate-500">
                      {formatTimestamp(ev.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600">
                      {ev.borrower ? (
                        <span className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {formatAddress(ev.borrower, 4)}
                        </span>
                      ) : ev.title ? (
                        <span className="truncate max-w-xs block text-slate-700">
                          "{ev.title}"
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-md text-xs transition"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
