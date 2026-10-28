import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  LOCAL_CHAIN_ID,
  getReadOnlyContract,
  getSignerContract,
  formatBook,
  fetchAllBlockchainEvents,
  switchOrAddHardhatNetwork,
  parseContractError,
} from "../utils/contract";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [isLibrarian, setIsLibrarian] = useState(false);
  const [librarianAddress, setLibrarianAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Blockchain Data Cache
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [contractError, setContractError] = useState(null);

  // Check if MetaMask is available in browser
  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && Boolean(window.ethereum));
  }, []);

  /**
   * Refreshes books and events from the smart contract
   */
  const refreshData = useCallback(async () => {
    try {
      setLoadingData(true);
      const contract = getReadOnlyContract();

      // Query librarian address
      try {
        const libAddr = await contract.librarian();
        setLibrarianAddress(libAddr);
      } catch (e) {
        console.warn("Could not query librarian address:", e.message);
      }

      // Query all books
      try {
        const rawBooks = await contract.getAllBooks();
        const formatted = rawBooks.map(formatBook);
        setBooks(formatted);
      } catch (e) {
        console.warn("Could not query all books:", e.message);
      }

      // Query all event logs
      try {
        const allEvents = await fetchAllBlockchainEvents(contract);
        setEvents(allEvents);
      } catch (e) {
        console.warn("Could not query blockchain event logs:", e.message);
      }

      setContractError(null);
    } catch (err) {
      console.error("Error refreshing blockchain data:", err);
      setContractError("Unable to connect to local Hardhat node at http://127.0.0.1:8545");
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initial data load from read-only RPC provider
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Check active account librarian status
  useEffect(() => {
    if (account && librarianAddress) {
      setIsLibrarian(account.toLowerCase() === librarianAddress.toLowerCase());
    } else {
      setIsLibrarian(false);
    }
  }, [account, librarianAddress]);

  /**
   * Checks current network and updates chainId
   */
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setNetworkName(network.name === "unknown" ? "Localhost (31337)" : network.name);
      setIsWrongNetwork(currentChainId !== LOCAL_CHAIN_ID);
    } catch (err) {
      console.error("Network check error:", err);
    }
  }, []);

  /**
   * Connect MetaMask Wallet
   */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask was not detected. Please install the MetaMask extension to use write functions.");
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        await checkNetwork();
        await refreshData();
      }
    } catch (err) {
      console.error("User rejected or connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Connect in Direct Demo Mode (No MetaMask needed, uses Hardhat node account #0)
   */
  const connectDemoLibrarian = () => {
    const librarianAcc = librarianAddress || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    setAccount(librarianAcc);
    setIsLibrarian(true);
    setIsDemoMode(true);
    setIsWrongNetwork(false);
    setChainId(LOCAL_CHAIN_ID);
    setNetworkName("Hardhat Localhost (Direct Signer)");
  };

  /**
   * Disconnect Wallet / Exit Demo Mode
   */
  const disconnectWallet = () => {
    setAccount(null);
    setIsLibrarian(false);
    setIsDemoMode(false);
  };

  /**
   * Switch or Add Local Hardhat Network in MetaMask
   */
  const switchNetwork = async () => {
    try {
      await switchOrAddHardhatNetwork();
      await checkNetwork();
    } catch (err) {
      console.error("Failed to switch network:", err);
    }
  };

  // Listen to MetaMask events (account changes and chain changes)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Per MetaMask guidelines, reloading or refreshing provider state
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkNetwork();
        }
      })
      .catch(() => {});

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkNetwork]);

  const value = {
    account,
    chainId,
    networkName,
    isWrongNetwork,
    isLibrarian,
    librarianAddress,
    hasMetaMask,
    isConnecting,
    isDemoMode,
    connectDemoLibrarian,
    books,
    events,
    loadingData,
    contractError,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshData,
    contractAddress: CONTRACT_ADDRESS,
    getSignerContract: () => getSignerContract(isDemoMode),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
