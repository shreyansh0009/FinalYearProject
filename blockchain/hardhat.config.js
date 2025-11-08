require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Get the values from the .env file
const AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!AMOY_RPC_URL) {
  console.error("Missing POLYGON_AMOY_RPC_URL. Have you set your .env file?");
}
if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY. Have you set your .env file?");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // We will use this version
  networks: {
    // This is the new network we added
    polygonAmoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    // Hardhat also provides a local network for testing
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};