const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 1. Get the contract factory
  const DocumentVerification = await ethers.getContractFactory(
    "DocumentVerification"
  );

  // 2. Start the deployment
  console.log("Deploying DocumentVerification contract...");
  const contract = await DocumentVerification.deploy();

  // 3. --- THIS IS THE FIX ---
  // Wait for the deployment to be confirmed on the network
  await contract.waitForDeployment();
  // -------------------------

  // --- THIS IS THE FIX ---
  // Get the contract's address
  const contractAddress = await contract.getAddress();
  // -----------------------

  // 4. Log the address
  console.log("---------------------------------------------------------");
  console.log("DocumentVerification contract deployed to:", contractAddress);
  console.log("---------------------------------------------------------");

  // 5. Save the contract's address and ABI to the server/ directory
  saveContractFiles(contractAddress);
}

function saveContractFiles(contractAddress) {
  // The path to the server directory (two levels up)
  const serverDir = path.join(__dirname, "..", "..", "server");

  if (!fs.existsSync(serverDir)) {
    console.warn("Could not find /server directory. Skipping file save.");
    return;
  }

  // The path for the new file we'll create in the server
  const contractInfoPath = path.join(serverDir, "contract-info.json");

  // --- THIS IS THE SECOND FIX ---
  // Read the ABI from the artifact file
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DocumentVerification.sol",
    "DocumentVerification.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("Could not find artifact JSON file. Did you compile?");
    return;
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  // --- END OF SECOND FIX ---

  const contractData = {
    address: contractAddress,
    abi: artifact.abi, // Use the ABI from the artifact
  };

  // Write the file
  fs.writeFileSync(
    contractInfoPath,
    JSON.stringify(contractData, null, 2)
  );

  console.log(`Contract address and ABI saved to ${contractInfoPath}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});