# Setup Instructions

This guide will help you remove mock data and set up real GitHub API and Web3 contract integration.

## 1. GitHub API Setup

The app fetches real pull request data from GitHub repositories. To avoid rate limits:

### Step 1: Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Crypto Starter App"
4. Select the **public_repo** scope (allows access to public repository data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### Step 2: Configure Environment Variables

1. In the `frontend` folder, open `.env.local`
2. Add your GitHub token:
   ```bash
   NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
   ```
3. Save the file

## 2. Smart Contract Setup

The app integrates with deployed smart contracts for creating and managing project tokens.

### Option A: Deploy to Local Network (Recommended for Development)

1. Start a local blockchain:
   ```bash
   cd blockchain
   npx hardhat node
   ```

2. Deploy the contracts:
   ```bash
   npm run deploy -- --network localhost
   ```

3. Copy the deployed factory address and add it to `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_FACTORY_ADDRESS=0x...
   ```

### Option B: Use Existing Testnet Deployment

If contracts are already deployed to a testnet, add the factory address to your environment:

```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

## 3. Start the Application

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 4. Verify Setup

1. Visit `http://localhost:3000`
2. Go to the Dashboard
3. You should see real GitHub pull requests from popular repositories
4. Search should work with actual GitHub repository data
5. If contracts are deployed, you can create tokens for repositories

## Troubleshooting

### GitHub API Rate Limit (403 Error)
- Ensure you've added a valid GitHub token to `.env.local`
- Check that your token has the `public_repo` scope
- Restart the development server after adding the token

### Contract Not Deployed Error
- Make sure you've deployed the contracts and added the factory address
- Verify the contract address is correct
- Check that your wallet is connected to the right network

### No Markets Loading
- Check browser console for error messages
- Verify your GitHub token is valid
- Ensure you have an internet connection

## Features Without Mock Data

✅ **Real GitHub Data:**
- Actual pull requests from popular repositories
- Real repository search functionality
- Authentic PR metadata (comments, labels, dates)
- Realistic probability calculations based on PR characteristics

✅ **Real Web3 Integration:**
- Deployed smart contract interaction
- Real token creation and management
- Actual transaction handling
- Live contract state reading

✅ **Improved Error Handling:**
- Clear error messages for API issues
- Setup instructions for common problems
- Better user guidance for configuration