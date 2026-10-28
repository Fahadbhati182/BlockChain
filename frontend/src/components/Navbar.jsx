import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Wallet,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Layers,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/formatters";

export default function Navbar({ onMenuToggle }) {
  const {
    account,
    connectWallet,
    disconnectWallet,
    isConnecting,
    isLibrarian,
    chainId,
    networkName,
    isWrongNetwork,
    switchNetwork,
    refreshData,
    loadingData,
    isDemoMode,
    connectDemoLibrarian,
  } = useWeb3();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Layers className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">LibTrack</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  Blockchain
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                College Library Book Tracking System
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Actions & Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Refresh state button */}
          <button
            onClick={() => refreshData()}
            disabled={loadingData}
            title="Refresh Blockchain Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {/* Network indicator pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                isWrongNetwork ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <span>{isWrongNetwork ? `Wrong Chain (${chainId})` : "Hardhat (31337)"}</span>
          </div>

          {/* Librarian Status Pill */}
          {account && isLibrarian && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Librarian
            </span>
          )}

          {/* Wallet connect/disconnect button */}
          {account ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 pl-3 rounded-lg text-xs">
              <span className="font-mono font-medium text-slate-800">
                {formatAddress(account)}
              </span>
              {isDemoMode && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  Direct Signer
                </span>
              )}
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={connectDemoLibrarian}
                title="Sign transactions directly on the local Hardhat node without MetaMask"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <span>⚡ Use Local Signer (No MetaMask)</span>
              </button>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-60"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
