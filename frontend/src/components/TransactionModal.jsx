import React, { useState } from "react";
import { X, Check, Copy, ExternalLink, Layers, ShieldCheck, Hash, User, Calendar } from "lucide-react";
import { formatAddress, formatTimestamp } from "../utils/formatters";
import { CONTRACT_ADDRESS } from "../utils/contract";

export default function TransactionModal({ event, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!event) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getEventBadge = (name) => {
    switch (name) {
      case "BookRegistered":
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">BookRegistered</span>;
      case "BookIssued":
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">BookIssued</span>;
      case "BookReturned":
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">BookReturned</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">{name}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Blockchain Transaction Details</h3>
              <p className="text-xs text-slate-500">Verified immutable record on local Hardhat chain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Event Type & Status */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-xs text-slate-500 block">Event Trigger</span>
              <div className="mt-1">{getEventBadge(event.eventName)}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Execution Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Confirmed on-chain
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-3.5 text-xs">
            {/* Transaction Hash */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Transaction Hash</span>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-800 break-all text-[11px]">
                <span>{event.transactionHash}</span>
                <button
                  onClick={() => copyToClipboard(event.transactionHash, "txHash")}
                  className="ml-2 p-1 text-slate-500 hover:text-blue-600 rounded transition flex-shrink-0"
                  title="Copy Hash"
                >
                  {copiedField === "txHash" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Block Number & Timestamp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Block Number</span>
                <span className="font-mono font-semibold text-slate-900 text-sm">#{event.blockNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block mb-1">Timestamp</span>
                <span className="font-medium text-slate-900">{formatTimestamp(event.timestamp)}</span>
              </div>
            </div>

            {/* Contract Address */}
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Target Contract Address</span>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                <span>{CONTRACT_ADDRESS}</span>
                <button
                  onClick={() => copyToClipboard(CONTRACT_ADDRESS, "contract")}
                  className="ml-2 p-1 text-slate-500 hover:text-blue-600 rounded transition"
                  title="Copy Address"
                >
                  {copiedField === "contract" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Decoded Event Parameters */}
            <div className="pt-2">
              <h4 className="font-semibold text-slate-800 mb-2">Decoded Event Arguments</h4>
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-xs space-y-2 border border-slate-800">
                <div>
                  <span className="text-blue-400">bookId: </span>
                  <span className="text-emerald-300">"{event.bookId}"</span>
                </div>
                {event.borrower && (
                  <div>
                    <span className="text-blue-400">borrower: </span>
                    <span className="text-amber-300">"{event.borrower}"</span>
                  </div>
                )}
                {event.title && (
                  <div>
                    <span className="text-blue-400">title: </span>
                    <span className="text-slate-300">"{event.title}"</span>
                  </div>
                )}
                {event.author && (
                  <div>
                    <span className="text-blue-400">author: </span>
                    <span className="text-slate-300">"{event.author}"</span>
                  </div>
                )}
                {event.isbn && (
                  <div>
                    <span className="text-blue-400">isbn: </span>
                    <span className="text-slate-300">"{event.isbn}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
