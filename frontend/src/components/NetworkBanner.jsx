import React from "react";
import { AlertTriangle, Server, ArrowRight } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export default function NetworkBanner() {
  const { isWrongNetwork, switchNetwork, chainId, contractError } = useWeb3();

  if (contractError) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Local Node Notice:</strong> {contractError}. Run{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">npm run node</code>{" "}
              and deploy the contract to interact with live blockchain state.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Wrong Network Detected:</strong> MetaMask is connected to Chain ID {chainId}.
              Please switch to <strong>Hardhat Localhost (Chain ID: 31337)</strong>.
            </span>
          </div>
          <button
            onClick={switchNetwork}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md shadow-sm transition"
          >
            Switch to Hardhat (31337)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
