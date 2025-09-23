# Sepolia Deployment Guide

Follow these steps to deploy your contracts to Sepolia testnet using Hardhat.

## 🔧 Setup Environment Variables

### 1. Create `.env` file in `/blockchain` directory

```bash
cd blockchain
touch .env
```

### 2. Add your API keys and private key to `.env`

```env
# Alchemy or Infura RPC URL for Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Your wallet private key (the one with Sepolia ETH)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## 🔑 Getting API Keys

### Alchemy RPC URL
1. Go to [alchemy.com](https://www.alchemy.com/)
2. Create free account and app
3. Select "Ethereum" → "Sepolia" 
4. Copy the HTTPS URL

### Private Key
1. Open MetaMask
2. Click account menu → Account Details → Export Private Key
3. Enter password and copy the key
⚠️ **Keep this secret! Never commit it to git!**

### Etherscan API Key
1. Go to [etherscan.io](https://etherscan.io/)
2. Create account → API Keys → Create new key
3. Copy the API key

## 💰 Get Sepolia ETH

You need Sepolia ETH for gas fees:

1. **Alchemy Faucet**: https://sepoliafaucet.com/
2. **Chainlink Faucet**: https://faucets.chain.link/sepolia
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

Get at least 0.1 ETH for deployment.

## 🚀 Deploy Contracts

### 1. Install dependencies
```bash
cd blockchain
npm install
```

### 2. Compile contracts
```bash
npx hardhat compile
```

### 3. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

You should see output like:
```
🚀 Starting deployment to sepolia
📝 Deployer address: 0x...
💰 Deployer balance: 0.5 ETH
📦 Deploying ProjectCoinFactory...
✅ ProjectCoinFactory deployed to: 0x123...
🎯 Deploying PredictionMarket...
✅ PredictionMarket deployed to: 0x456...
🔍 Verifying contracts on Etherscan...
✅ Contracts verified!
```

## 🌐 Update Frontend Configuration

### 1. Create `.env.local` in `/frontend` directory

```bash
cd ../frontend
touch .env.local
```

### 2. Add contract addresses to `.env.local`

```env
# Contract addresses from deployment
NEXT_PUBLIC_FACTORY_ADDRESS=0x123...
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x456...

# Sepolia chain ID
NEXT_PUBLIC_CHAIN_ID=11155111

# Optional: GitHub API for PR data
GITHUB_TOKEN=your_github_token_here
```

### 3. Update MetaMask network

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Select "Sepolia test network"
4. Make sure you have Sepolia ETH

## ✅ Test Your Deployment

### 1. Start frontend
```bash
cd frontend
npm run dev
```

### 2. Open http://localhost:3001

### 3. Connect wallet (should show Sepolia network)

### 4. Try creating a token or placing a bet

## 🔍 Verify on Etherscan

Your contracts should be automatically verified, but you can check:

1. Go to [sepolia.etherscan.io](https://sepolia.etherscan.io/)
2. Search for your contract addresses
3. Look for green ✅ "Contract" tab

## 📁 Deployment Files

After deployment, you'll find:
- `deployments/sepolia-deployment.json` - Contract addresses and info
- Console output with all the addresses you need

## 🐛 Troubleshooting

### "Insufficient funds" error
- Get more Sepolia ETH from faucets
- Check you're on Sepolia network

### "Invalid private key" error
- Make sure private key is correct (without 0x prefix)
- Check `.env` file is in correct location

### "Network not found" error
- Verify SEPOLIA_RPC_URL is correct
- Check Alchemy/Infura dashboard

### Verification failed
- Wait a few minutes and try manual verification
- Check Etherscan API key is valid

## 🎯 Production Deployment

For mainnet deployment:

1. Add mainnet configuration to `hardhat.config.ts`
2. Get real ETH (not testnet)
3. Use same process but with `--network mainnet`
4. **Double-check everything!** Mainnet costs real money

---

**Security Notes:**
- Never commit `.env` files to git
- Keep private keys secure
- Start with small amounts for testing
- Verify contract addresses before sending funds