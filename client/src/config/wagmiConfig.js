import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';

// Get a free WalletConnect Cloud project ID at: https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';

export const wagmiConfig = getDefaultConfig({
  appName: 'Decentralized Document Verification System',
  projectId,
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(rpcUrl),
  },
  ssr: false,
});
