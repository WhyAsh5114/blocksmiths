# 🚀 Deployment Guide for GitHub PR Prediction Market

## Prerequisites

### 1. Set Up Wallet
- Install MetaMask or another wallet
- Get some Sepolia testnet ETH from:
  - https://faucets.chain.link/sepolia
  - https://sepoliafaucet.com/
  - You'll need ~0.01 ETH for deployment

### 2. Get API Keys
- **Alchemy**: Sign up at https://alchemy.com and create a Sepolia app
- **Etherscan**: Sign up at https://etherscan.io/apis for contract verification
- **GitHub** (optional): Create a personal access token for higher rate limits

### 3. Update Environment Variables
Edit `blockchain/.env`:
```
PRIVATE_KEY=your_wallet_private_key_without_0x
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Steps

### Step 1: Deploy Smart Contracts
```bash
cd blockchain
npx hardhat ignition deploy ./ignition/modules/ProjectCoinFactory.ts --network sepolia
```

### Step 2: Update Frontend Configuration
Copy the deployed contract address and update:
`frontend/src/hooks/web3/useProjectCoin.ts`
Replace `FACTORY_ADDRESS` with your deployed address.

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Test the Integration
1. Open http://localhost:3000/dashboard
2. Connect your wallet (top right)
3. Search for a repository like "facebook/react"
4. Click "Create Token" on a PR market
5. Confirm the transaction in your wallet
6. Once confirmed, try minting some tokens!

## Troubleshooting

### Common Issues:
1. **"Insufficient Balance"**: Get more Sepolia ETH from faucets
2. **"Network Error"**: Check your Alchemy API key
3. **"Transaction Failed"**: Ensure you have enough ETH for gas fees
4. **"Contract Not Found"**: Verify the FACTORY_ADDRESS is correct

### Useful Commands:
```bash
# Check wallet balance
npx hardhat run scripts/check-balance.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "arg1" "arg2"
```

## What to Expect

After successful deployment, you'll have:
- ✅ A working prediction market for GitHub PRs
- ✅ Real-time data from GitHub API
- ✅ Smart contracts on Sepolia testnet
- ✅ Token creation and minting functionality
- ✅ Wallet integration with Web3 features

## Next Steps

1. **Add Real PR Data**: The system uses GitHub's API to fetch real PRs
2. **Implement Trading**: Add buy/sell functionality between users
3. **Add Resolution Logic**: Implement automated PR merge detection
4. **Deploy to Mainnet**: Once tested, deploy to Ethereum mainnet

Enjoy your decentralized GitHub PR prediction market! 🎯🚀