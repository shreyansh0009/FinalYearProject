import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";


// --- CONFIGURATION ---

// 1. Get the path to the contract-info.json file
// This is a bit complex in ES modules, but it's robust
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env")});
// Navigate two levels up from utils (src/utils -> src -> server) to the root
const contractInfoPath = path.resolve(__dirname, "..", "..", "contract-info.json");

if (!fs.existsSync(contractInfoPath)) {
    console.error("Fatal Error: contract-info.json not found.");
    console.error("Please deploy the contract first (run `npx hardhat run scripts/deploy.js --network polygonAmoy` in the /blockchain folder).");
    process.exit(1);
}

const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath));
const CONTRACT_ADDRESS = contractInfo.address;
const CONTRACT_ABI = contractInfo.abi;

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const ADMIN_PRIVATE_KEY = process.env.CONTRACT_ADMIN_PRIVATE_KEY;

if (!RPC_URL || !ADMIN_PRIVATE_KEY || !CONTRACT_ADDRESS || !CONTRACT_ABI) {
    console.error("Missing required environment variables (RPC_URL, ADMIN_PRIVATE_KEY) or contract info.");
    process.exit(1);
}

// 2. Initialize the Provider and Signer (Admin Wallet)
const provider = new ethers.JsonRpcProvider(RPC_URL);
const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

// 3. Initialize the Contract Instance (with Admin read/write access)
const adminContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, adminWallet);

console.log("Ethers service initialized. Connected to contract at:", CONTRACT_ADDRESS);

// 4. Export the contract instance and the provider
export { adminContract, provider };