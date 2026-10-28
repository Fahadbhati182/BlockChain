import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=================================================");
  console.log("  Deploying LibraryBookRegistry Smart Contract   ");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer Account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  const network = await hre.ethers.provider.getNetwork();
  console.log(`Target Network:   ${network.name} (Chain ID: ${network.chainId})`);

  // Deploy the contract
  const LibraryBookRegistry = await hre.ethers.getContractFactory("LibraryBookRegistry");
  const libraryRegistry = await LibraryBookRegistry.deploy();
  await libraryRegistry.waitForDeployment();

  const contractAddress = await libraryRegistry.getAddress();
  const deploymentTx = libraryRegistry.deploymentTransaction();
  const txHash = deploymentTx ? deploymentTx.hash : "N/A";
  const receipt = deploymentTx ? await deploymentTx.wait() : null;
  const blockNumber = receipt ? receipt.blockNumber : (await hre.ethers.provider.getBlockNumber());

  console.log("\n Contract Deployed Successfully!");
  console.log(`-------------------------------------------------`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Block Number:     ${blockNumber}`);
  console.log(`-------------------------------------------------`);

  // Read the compiled artifact to extract ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/LibraryBookRegistry.sol/LibraryBookRegistry.json"
  );

  let contractArtifact = {};
  if (fs.existsSync(artifactPath)) {
    contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  // Read Solidity source code
  const contractSourcePath = path.join(__dirname, "../contracts/LibraryBookRegistry.sol");
  const sourceCode = fs.existsSync(contractSourcePath)
    ? fs.readFileSync(contractSourcePath, "utf8")
    : "";

  const deploymentData = {
    contractName: "LibraryBookRegistry",
    address: contractAddress,
    deployer: deployer.address,
    transactionHash: txHash,
    blockNumber: blockNumber,
    networkName: network.name === "unknown" ? "localhost" : network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    solidityVersion: "0.8.24",
  };

  // 1. Write deployment summary to root
  const rootSummaryPath = path.join(__dirname, "../deployed-contract.json");
  fs.writeFileSync(rootSummaryPath, JSON.stringify(deploymentData, null, 2));

  // 2. Export to Frontend directory
  const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Save address config
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractAddress.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Save ABI and metadata
  const frontendArtifact = {
    contractName: "LibraryBookRegistry",
    address: contractAddress,
    abi: contractArtifact.abi || [],
    bytecode: contractArtifact.bytecode || "",
    sourceCode: sourceCode,
    solidityVersion: "0.8.24",
    network: {
      chainId: Number(network.chainId),
      name: network.name === "unknown" ? "Localhost (Hardhat)" : network.name,
      rpcUrl: "http://127.0.0.1:8545",
    },
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "LibraryBookRegistry.json"),
    JSON.stringify(frontendArtifact, null, 2)
  );

  console.log(` Exported configuration & ABI to:`);
  console.log(`   - ${path.join(frontendContractsDir, "contractAddress.json")}`);
  console.log(`   - ${path.join(frontendContractsDir, "LibraryBookRegistry.json")}`);
  console.log(`   - ${rootSummaryPath}`);
  console.log("\n=================================================");
  console.log("             Frontend Setup Note                 ");
  console.log("=================================================");
  console.log("1. Ensure your local node is running (npm run node)");
  console.log("2. Import the deployer private key into MetaMask to act as Librarian");
  console.log("3. Point MetaMask RPC to: http://127.0.0.1:8545 (Chain ID: 31337)");
  console.log("4. Start frontend with: cd frontend && npm run dev");
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
