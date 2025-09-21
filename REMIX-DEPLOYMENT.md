# 🎯 Easy Remix Deployment Guide

## Step 1: Open Remix IDE
1. Go to **https://remix.ethereum.org**
2. Create a new workspace or use the default

## Step 2: Copy Contract Code
1. Copy the entire content from `contracts-for-remix.sol` 
2. In Remix, create a new file: `ProjectCoinFactory.sol`
3. Paste the code and save

## Step 3: Compile Contract
1. Go to the **Solidity Compiler** tab (🔨 icon)
2. Select compiler version: **0.8.28** 
3. Click **Compile ProjectCoinFactory.sol**
4. Wait for green checkmark ✅

## Step 4: Connect to Sepolia Testnet
1. Go to **Deploy & Run** tab (🚀 icon)
2. In **Environment**, select **Injected Provider - MetaMask**
3. MetaMask will popup - connect your wallet
4. Make sure you're on **Sepolia Test Network**
5. Get some test ETH from: https://faucets.chain.link/sepolia

## Step 5: Deploy ProjectCoinFactory
1. In the **Contract** dropdown, select **ProjectCoinFactory**
2. Fill in constructor parameters:
   ```
   _CREATIONFEE: 1000000000000000 (0.001 ETH in wei)
   _DEFAULTTREASURY: YOUR_WALLET_ADDRESS
   _DEFAULTREWARDPOOL: YOUR_WALLET_ADDRESS
   ```
3. Click **Deploy** (orange button)
4. Confirm transaction in MetaMask
5. Wait for confirmation ⏳

## Step 6: Copy Contract Address
1. After deployment, find your contract in **Deployed Contracts**
2. **Copy the contract address** (looks like: 0x123abc...)
3. This is your `FACTORY_ADDRESS`!

## Step 7: Update Frontend
1. Open `frontend/src/hooks/web3/useProjectCoin.ts`
2. Replace this line:
   ```typescript
   const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000';
   ```
   With:
   ```typescript
   const FACTORY_ADDRESS = 'YOUR_DEPLOYED_ADDRESS_HERE';
   ```

## Step 8: Test Your dApp!
1. Start frontend: `npm run dev`
2. Go to http://localhost:3000/dashboard
3. Connect your wallet (top right)
4. Search for "facebook/react" 
5. Click **Create Token** on any PR
6. Confirm transaction and wait for success! 🎉

## 🎯 You're Done!

Your GitHub PR Prediction Market is now live on Sepolia testnet!

### What you can do now:
- ✅ Create tokens for any GitHub repository
- ✅ Mint tokens using the bonding curve
- ✅ Search real GitHub PRs
- ✅ Connect wallet and interact with smart contracts

### Deployment Details:
- **Network**: Sepolia Testnet
- **Factory Contract**: Your deployed address
- **Creation Fee**: 0.001 ETH per token
- **GitHub Integration**: Live API data

Enjoy your decentralized prediction market! 🚀

---

## Troubleshooting

**"Transaction failed"** → You need more Sepolia ETH
**"Contract not found"** → Double-check the FACTORY_ADDRESS
**"MetaMask error"** → Make sure you're on Sepolia network

Need help? The contract is fully tested and ready to go! 🎯