import { ethers } from "ethers";
import contractArtifact from "../contracts/LibraryBookRegistry.json";
import deploymentConfig from "../contracts/contractAddress.json";

export const LOCAL_CHAIN_ID = 31337;
export const LOCAL_CHAIN_ID_HEX = "0x7a69";
export const DEFAULT_RPC_URL = "http://127.0.0.1:8545";

// Contract Address from deployment or fallback
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  deploymentConfig.address ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = contractArtifact.abi || [];

/**
 * Creates a read-only provider targeting the local blockchain
 */
export function getJsonRpcProvider() {
  return new ethers.JsonRpcProvider(DEFAULT_RPC_URL);
}

/**
 * Returns a read-only instance of LibraryBookRegistry
 */
export function getReadOnlyContract() {
  const provider = getJsonRpcProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Hardhat default deployer / librarian private key for local offline demoing
export const HARDHAT_LIBRARIAN_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const HARDHAT_LIBRARIAN_ADDRESS =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/**
 * Returns a write-enabled contract instance bound to either MetaMask or the local node directly
 */
export async function getSignerContract(forceDirectNode = false) {
  if (!forceDirectNode && typeof window !== "undefined" && window.ethereum) {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_accounts", []);
      if (accounts && accounts.length > 0) {
        const signer = await browserProvider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      }
    } catch (e) {
      // Fallback to direct node signer
    }
  }

  // Direct Node Signer: signs transactions using Hardhat's pre-funded local account #0
  const provider = getJsonRpcProvider();
  const wallet = new ethers.Wallet(HARDHAT_LIBRARIAN_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

/**
 * Formats a raw Solidity Book struct into a clean JavaScript object
 */
export function formatBook(raw) {
  if (!raw) return null;
  return {
    bookId: raw.bookId,
    title: raw.title,
    author: raw.author,
    isbn: raw.isbn,
    status: Number(raw.status), // 0 = Available, 1 = Issued
    statusLabel: Number(raw.status) === 0 ? "Available" : "Issued",
    currentBorrower:
      raw.currentBorrower && raw.currentBorrower !== ethers.ZeroAddress
        ? raw.currentBorrower
        : null,
    registrationTimestamp: raw.registrationTimestamp
      ? Number(raw.registrationTimestamp) * 1000
      : Date.now(),
  };
}

/**
 * Prompts MetaMask to switch to or add the local Hardhat network (ChainId: 31337)
 */
export async function switchOrAddHardhatNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LOCAL_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // Error 4902 indicates that the chain has not been added to MetaMask yet
    if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain ID")) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: LOCAL_CHAIN_ID_HEX,
            chainName: "Hardhat Localhost",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [DEFAULT_RPC_URL],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Queries and decodes all historical blockchain events emitted by LibraryBookRegistry
 */
export async function fetchAllBlockchainEvents(contractInstance = null) {
  try {
    const contract = contractInstance || getReadOnlyContract();
    const provider = contract.runner?.provider || getJsonRpcProvider();

    // Query all three events from block 0 to latest
    const [registeredFilter, issuedFilter, returnedFilter] = [
      contract.filters.BookRegistered(),
      contract.filters.BookIssued(),
      contract.filters.BookReturned(),
    ];

    const [regEvents, issEvents, retEvents] = await Promise.all([
      contract.queryFilter(registeredFilter, 0, "latest").catch(() => []),
      contract.queryFilter(issuedFilter, 0, "latest").catch(() => []),
      contract.queryFilter(returnedFilter, 0, "latest").catch(() => []),
    ]);

    // Combine all events
    const rawEvents = [
      ...regEvents.map((e) => ({ ...e, eventName: "BookRegistered" })),
      ...issEvents.map((e) => ({ ...e, eventName: "BookIssued" })),
      ...retEvents.map((e) => ({ ...e, eventName: "BookReturned" })),
    ];

    // Cache block timestamps
    const blockTimestamps = {};

    const formattedEvents = await Promise.all(
      rawEvents.map(async (event) => {
        let timestamp = null;
        if (!blockTimestamps[event.blockNumber]) {
          try {
            const block = await provider.getBlock(event.blockNumber);
            if (block) {
              blockTimestamps[event.blockNumber] = block.timestamp * 1000;
            }
          } catch (err) {
            // ignore
          }
        }
        timestamp = blockTimestamps[event.blockNumber] || Date.now();

        const args = event.args || {};
        return {
          id: `${event.transactionHash}-${event.index}`,
          eventName: event.eventName,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: args.timestamp ? Number(args.timestamp) * 1000 : timestamp,
          bookId: args.bookId || "",
          borrower: args.borrower || null,
          title: args.title || "",
          author: args.author || "",
          isbn: args.isbn || "",
          rawArgs: args,
        };
      })
    );

    // Sort descending (latest first)
    return formattedEvents.sort((a, b) => b.blockNumber - a.blockNumber);
  } catch (err) {
    console.error("Error fetching blockchain events:", err);
    return [];
  }
}

/**
 * Parses Ethereum / Solidity revert errors into clear human messages
 */
export function parseContractError(error) {
  if (!error) return "An unknown error occurred.";

  // User rejected transaction in MetaMask
  if (error.code === 4001 || error.code === "ACTION_REJECTED") {
    return "Transaction was rejected in MetaMask.";
  }

  // Reason in error.reason
  if (error.reason) {
    return error.reason.replace("execution reverted: ", "");
  }

  // Short message inside error
  if (error.shortMessage) {
    return error.shortMessage;
  }

  // Check nested error data
  const message = error.message || error.toString();
  if (message.includes("LibraryBookRegistry: caller is not authorized librarian")) {
    return "Access Denied: Connected wallet is not the authorized librarian.";
  }
  if (message.includes("LibraryBookRegistry: book already registered")) {
    return "Error: A book with this ID is already registered on the blockchain.";
  }
  if (message.includes("LibraryBookRegistry: book is already issued")) {
    return "Error: This book is already issued to another student.";
  }
  if (message.includes("LibraryBookRegistry: book is already available")) {
    return "Error: This book is already in Available status.";
  }
  if (message.includes("LibraryBookRegistry: book does not exist")) {
    return "Error: No book exists with this ID in the registry.";
  }
  if (message.includes("LibraryBookRegistry: invalid borrower address")) {
    return "Error: Invalid student borrower address.";
  }

  return message.length > 120 ? message.substring(0, 120) + "..." : message;
}
