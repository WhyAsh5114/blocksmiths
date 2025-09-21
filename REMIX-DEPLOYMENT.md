# 🎯 Easy Remix Deployment Guide

## Step 1: Open Remix IDE

1. Go to **<https://remix.ethereum.org>**
2. Create a new workspace or use the default

## Step 2: Install OpenZeppelin Contracts

1. In Remix file explorer, create a new folder: `contracts`
2. Right-click and select **Add dependency**
3. Enter: `@openzeppelin/contracts@5.0.0`
4. Wait for installation to complete

## Step 3: Copy Contract Files

### 3.1 Create ProjectCoin.sol

1. In the `contracts` folder, create a new file: `ProjectCoin.sol`
2. Copy the entire content from `blockchain/contracts/ProjectCoin.sol`
3. Paste and save

### 3.2 Create ProjectCoinFactory.sol

1. Create another file: `ProjectCoinFactory.sol`
2. Copy the entire content from `blockchain/contracts/ProjectCoinFactory.sol`
3. Paste and save

## Step 4: Compile Contracts

1. Go to the **Solidity Compiler** tab (🔨 icon)
2. Select compiler version: **0.8.28**
3. **Enable Optimizer**:
   - Click **Advanced Configurations**
   - Check **Enable optimization**
   - Set **Runs**: `200`
4. Click **Compile contracts/ProjectCoin.sol**
5. Click **Compile contracts/ProjectCoinFactory.sol**
6. Wait for green checkmarks ✅ on both contracts

## Step 4: Connect to Sepolia Testnet

1. Go to **Deploy & Run** tab (🚀 icon)
2. In **Environment**, select **Injected Provider - MetaMask**
3. MetaMask will popup - connect your wallet
4. Make sure you're on **Sepolia Test Network**
5. Get some test ETH from: <https://faucets.chain.link/sepolia>

## Step 5: Deploy ProjectCoinFactory

1. In the **Contract** dropdown, select **ProjectCoinFactory**
2. Fill in constructor parameters:

   ```text
   _DEFAULTTREASURY: YOUR_WALLET_ADDRESS
   _DEFAULTREWARDPOOL: YOUR_WALLET_ADDRESS  
   _INITIALOWNER: YOUR_WALLET_ADDRESS
   ```

3. Click **Deploy** (orange button)
4. Confirm transaction in MetaMask
5. Wait for confirmation ⏳

## Step 6: Configure Factory Settings

After deployment, you must configure the factory:

1. Find your deployed **ProjectCoinFactory** contract
2. Expand the contract functions
3. **Set Creation Fee** (required):
   - Function: `updateCreationFee`
   - Parameter: `10000000000000000` (0.01 ETH in wei)
   - Click **transact** and confirm
4. **Verify the fee** (optional):
   - Function: `creationFee` (view function)
   - Click **call** to see current fee

## Step 7: Test Token Creation

1. In the deployed **ProjectCoinFactory** contract
2. Find the `createProjectCoin` function
3. Fill in parameters:

   ```text
   _NAME: "Test Repo Token"
   _SYMBOL: "TEST"  
   _GITHUBOWNER: "facebook"
   _GITHUBREPO: "react"
   _TREASURY: 0x0000000000000000000000000000000000000000
   _REWARDPOOL: 0x0000000000000000000000000000000000000000
   ```

4. **Value**: Enter `10000000000000000` (0.01 ETH) in the value field
   - Make sure this matches the creation fee you set in Step 6
   - **Double-check**: Call `creationFee` function first to verify the exact amount needed
5. Click **transact** and confirm transaction

**💡 Pro Tip**: If you get "Insufficient creation fee" error:

- Call the `creationFee` view function to see the exact required amount
- Copy that exact number to the Value field

## Step 8: Copy Contract Address

1. After deployment, find your contract in **Deployed Contracts**
2. **Copy the contract address** (looks like: 0x123abc...)
3. This is your `FACTORY_ADDRESS`!

## Step 9: Update Frontend

1. Open `frontend/src/hooks/web3/useProjectCoin.ts`
2. Replace this line:

   ```typescript
   const FACTORY_ADDRESS = '0x0000000000000000000000000000000000000000';
   ```

   With:

   ```typescript
   const FACTORY_ADDRESS = 'YOUR_DEPLOYED_ADDRESS_HERE';
   ```

## Step 10: Test Your dApp

1. Start frontend: `npm run dev`
2. Go to <http://localhost:3000/dashboard>
3. Connect your wallet (top right)
4. Search for "facebook/react"
5. Click **Create Token** on any PR
6. Confirm transaction and wait for success! 🎉

## 🎯 You're Done

Your GitHub PR Prediction Market is now live on Sepolia testnet!

### What you can do now

- ✅ Create tokens for any GitHub repository
- ✅ Mint tokens using the bonding curve pricing
- ✅ Search real GitHub PRs
- ✅ Connect wallet and interact with smart contracts
- ✅ Burn tokens for buyback mechanism

### Deployment Details

- **Network**: Sepolia Testnet
- **Factory Contract**: Your deployed address
- **Default Creation Fee**: 0.01 ETH per token (configurable)
- **GitHub Integration**: Live API data
- **Optimizer Enabled**: Contracts optimized for gas efficiency

Enjoy your decentralized prediction market! 🚀

---

## 🔧 Advanced: Individual ProjectCoin Testing

Once you have tokens created, you can also interact with individual ProjectCoin contracts:

### Find Your Token Address

1. In the deployed **ProjectCoinFactory** contract
2. Use `getTokenByRepo` function with:
   - `_GITHUBOWNER`: "facebook"  
   - `_GITHUBREPO`: "react"
3. Copy the returned token address

### Deploy ProjectCoin Interface

1. In **Deploy & Run** tab, select **ProjectCoin** from dropdown
2. Enter the token address in **At Address** field
3. Click **At Address** button

### Test Token Functions

- **Mint tokens**: Use `mintTokens` function with ETH value
- **Check balance**: Use `balanceOf` with your address
- **Burn tokens**: Use `burn` function
- **Get stats**: Use `getMintingStats` function

---

## Troubleshooting

**"Insufficient creation fee" error** → Check these steps:

1. Verify you set the creation fee in Step 6 using `updateCreationFee`
2. Check current fee with `creationFee` view function
3. Make sure the Value field matches exactly the creation fee amount
4. Ensure you have enough ETH in your wallet for the fee + gas

**"Stack too deep" error** → Contracts are now optimized to avoid this
**"Transaction failed"** → You need more Sepolia ETH
**"Contract not found"** → Double-check the FACTORY_ADDRESS
**"MetaMask error"** → Make sure you're on Sepolia network
**"Optimizer error"** → Make sure optimizer is enabled with 200 runs

### Common Creation Fee Issues

- **Default fee**: The contract initializes with 0.01 ETH creation fee
- **Wei conversion**: 0.01 ETH = 10000000000000000 wei
- **Exact match**: The value sent must be >= the creation fee
- **Fee updates**: Only the contract owner can update the creation fee

### Contract Structure Notes

- **ProjectCoin.sol**: Individual ERC20 tokens for each repository
- **ProjectCoinFactory.sol**: Factory to create and manage ProjectCoin tokens
- **Optimized**: Both contracts use function splitting to avoid stack limits
- **Gas Efficient**: Optimizer enabled for smaller contract size

Need help? The contracts are fully tested and stack-optimized! 🎯
