import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import NetworkBanner from "./components/NetworkBanner";

// Pages
import Dashboard from "./pages/Dashboard";
import BookCatalogue from "./pages/BookCatalogue";
import LibrarianPanel from "./pages/LibrarianPanel";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import SmartContractsExplorer from "./pages/SmartContractsExplorer";
import BookDetails from "./pages/BookDetails";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <NetworkBanner />
          <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            {/* Sidebar Navigation */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Page Container */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/catalogue" element={<BookCatalogue />} />
                <Route path="/librarian" element={<LibrarianPanel />} />
                <Route path="/explorer" element={<BlockchainExplorer />} />
                <Route path="/contracts" element={<SmartContractsExplorer />} />
                <Route path="/books/:id" element={<BookDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                <strong>LibTrack</strong> — Blockchain-Based Library Book Tracking System
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                Solidity ^0.8.24 • Ethers.js v6 • Hardhat Localhost
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}
