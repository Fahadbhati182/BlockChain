import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  BookOpen,
  ArrowUpRight,
  User,
  LayoutGrid,
  List,
  RefreshCw,
  Layers,
  Database,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import StatusBadge from "../components/StatusBadge";
import { formatAddress } from "../utils/formatters";
import { fetchBooksMetadata } from "../utils/api";

export default function BookCatalogue() {
  const { books, loadingData, refreshData } = useWeb3();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'available', 'issued'
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [metadataList, setMetadataList] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load backend metadata to enrich books (covers, categories, shelf location)
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      setLoadingMetadata(true);
      const data = await fetchBooksMetadata();
      if (isMounted) {
        setMetadataList(data || []);
        setLoadingMetadata(false);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge on-chain books with off-chain metadata by bookId
  const enrichedBooks = useMemo(() => {
    return books.map((book) => {
      const meta = metadataList.find(
        (m) => m.bookId.toLowerCase() === book.bookId.toLowerCase()
      );
      return {
        ...book,
        category: meta?.category || "General",
        shelfLocation: meta?.shelfLocation || "Main Stacks",
        coverImage: meta?.coverImage || null,
        description: meta?.description || null,
      };
    });
  }, [books, metadataList]);

  // Filter books based on search query and status filter
  const filteredBooks = useMemo(() => {
    return enrichedBooks.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.bookId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "available") return book.status === 0;
      if (statusFilter === "issued") return book.status === 1;
      return true;
    });
  }, [enrichedBooks, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Library Book Catalogue
            </h1>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {books.length} Books On-Chain
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative inventory retrieved directly from Solidity smart contract state
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            disabled={loadingData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-blue-600" : ""}`} />
            Sync State
          </button>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md text-xs transition ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Title, Author, ID, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({books.length})
            </button>
            <button
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === "available"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Available ({books.filter((b) => b.status === 0).length})
            </button>
            <button
              onClick={() => setStatusFilter("issued")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                statusFilter === "issued"
                  ? "bg-white text-amber-800 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Issued ({books.filter((b) => b.status === 1).length})
            </button>
          </div>
        </div>
      </div>

      {/* Catalogue Content */}
      {loadingData ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          Retrieving book catalogue from smart contract...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">No books found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your filters or search terms."
                : "No books are registered on the smart contract yet. Go to the Librarian Panel to register books."}
            </p>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-3 py-1.5 text-xs text-blue-600 font-semibold hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Professional Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Book ID</th>
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => (
                  <tr key={book.bookId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-11 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/books/${encodeURIComponent(book.bookId)}`}
                            className="font-bold text-slate-900 hover:text-blue-600 block leading-snug"
                          >
                            {book.title}
                          </Link>
                          <span className="text-[11px] text-slate-500">{book.author}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {book.bookId}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {book.isbn}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {book.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={book.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      {book.currentBorrower ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatAddress(book.currentBorrower, 4)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/books/${encodeURIComponent(book.bookId)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-lg text-xs transition"
                      >
                        Details
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Modern Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.bookId}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between card-hover space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {book.bookId}
                  </span>
                  <StatusBadge status={book.status} />
                </div>

                <div>
                  <Link
                    to={`/books/${encodeURIComponent(book.bookId)}`}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600 line-clamp-2"
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{book.author}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ISBN:</span>
                    <span className="font-mono text-[11px]">{book.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span>{book.shelfLocation}</span>
                  </div>
                  {book.currentBorrower && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Borrower:</span>
                      <span className="font-mono text-amber-700 font-medium">
                        {formatAddress(book.currentBorrower, 4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to={`/books/${encodeURIComponent(book.bookId)}`}
                className="w-full text-center py-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
              >
                View Tracking & History
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
