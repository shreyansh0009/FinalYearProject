require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Get the values from the .env file
const AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!AMOY_RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing required environment variables (POLYGON_AMOY_RPC_URL, PRIVATE_KEY). Check your .env file.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    polygonAmoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};
