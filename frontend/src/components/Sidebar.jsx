import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookMarked,
  ShieldAlert,
  Activity,
  Code2,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { CONTRACT_ADDRESS } from "../utils/contract";
import { formatAddress } from "../utils/formatters";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Book Catalogue", href: "/catalogue", icon: BookMarked },
  { name: "Librarian Panel", href: "/librarian", icon: ShieldAlert },
  { name: "Blockchain Explorer", href: "/explorer", icon: Activity },
  { name: "Smart Contracts", href: "/contracts", icon: Code2 },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Section: Main Menu */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Navigation
            </p>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Architecture Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Smart Contract</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              State transitions for registrations, issues, and returns execute on Solidity contract.
            </p>
            <div className="pt-1 border-t border-slate-200/60 font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>Registry:</span>
              <span className="font-semibold">{formatAddress(CONTRACT_ADDRESS, 4)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="text-center">
            <span className="text-[11px] font-medium text-slate-500">
              College Mini-Project
            </span>
            <p className="text-[10px] text-slate-400">Solidity ^0.8.24 • Ethers.js v6</p>
          </div>
        </div>
      </aside>
    </>
  );
}
