import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment to", hre.network.name);
  
  // Get the deployer account
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  
  console.log("📝 Deployer address:", deployer.account.address);
  
  // Check balance
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("💰 Deployer balance:", formatEther(balance), "ETH");
  
  if (balance < parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance. You might need more ETH for deployment and gas fees.");
  }
  
  // Deploy ProjectCoinFactory
  console.log("\n📦 Deploying ProjectCoinFactory...");
  
  const projectCoinFactory = await hre.viem.deployContract("ProjectCoinFactory", [
    deployer.account.address, // Default treasury (deployer)
    deployer.account.address, // Default reward pool (deployer)
    deployer.account.address  // Initial owner (deployer)
  ]);
  
  console.log("✅ ProjectCoinFactory deployed to:", projectCoinFactory.address);
  
  // Deploy PredictionMarket
  console.log("\n🎯 Deploying PredictionMarket...");
  
  const predictionMarket = await hre.viem.deployContract("PredictionMarket", [
    deployer.account.address  // Initial owner
  ]);
  
  console.log("✅ PredictionMarket deployed to:", predictionMarket.address);
  
  // Create project coins for specific repositories
  console.log("\n🪙 Creating project coins for repositories...");
  
  const projectsToCreate = [
    {
      name: "Blocksmiths Token",
      symbol: "BLOCKS",
      githubOwner: "WhyAsh5114",
      githubRepo: "blocksmiths"
    },
    {
      name: "MyFit Token", 
      symbol: "MYFIT",
      githubOwner: "WhyAsh5114",
      githubRepo: "MyFit"
    }
  ];
  
  const createdTokens = [];
  
  for (const project of projectsToCreate) {
    console.log(`\n📦 Creating ${project.name} (${project.symbol})...`);
    
    try {
      const tx = await projectCoinFactory.write.createProjectCoin([
        project.name,
        project.symbol,
        project.githubOwner,
        project.githubRepo,
        deployer.account.address, // treasury
        deployer.account.address  // reward pool
      ], {
        value: parseEther("0.01") // creation fee
      });
      
      console.log(`⏳ Transaction hash: ${tx}`);
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log(`✅ ${project.name} created successfully!`);
      
      // Get the token address from the repoToToken mapping
      const tokenAddress = await projectCoinFactory.read.repoToToken([
        project.githubOwner,
        project.githubRepo
      ]);
      
      createdTokens.push({
        ...project,
        tokenAddress: tokenAddress,
        transactionHash: tx
      });
      
      console.log(`   Token Address: ${tokenAddress}`);
      console.log(`   Repository: ${project.githubOwner}/${project.githubRepo}`);
      
    } catch (error: any) {
      console.error(`❌ Failed to create ${project.name}:`, error?.message || error);
    }
  }
  
  // Create prediction markets for specific PRs
  console.log("\n🎯 Creating prediction markets for active PRs...");
  
  const marketsToCreate = [
    {
      repository: "WhyAsh5114/blocksmiths",
      prNumber: 2,
      description: "Will PR #2 in WhyAsh5114/blocksmiths be merged?"
    },
    {
      repository: "WhyAsh5114/MyFit", 
      prNumber: 1,
      description: "Will PR #1 in WhyAsh5114/MyFit be merged?"
    }
  ];
  
  const createdMarkets = [];
  
  for (const market of marketsToCreate) {
    console.log(`\n🎯 Creating market for ${market.repository} PR #${market.prNumber}...`);
    
    try {
      const tx = await predictionMarket.write.createMarket([
        market.repository,
        BigInt(market.prNumber)
      ]);
      
      console.log(`⏳ Transaction hash: ${tx}`);
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log(`✅ Market created successfully!`);
      
      createdMarkets.push({
        ...market,
        transactionHash: tx
      });
      
      console.log(`   Repository: ${market.repository}`);
      console.log(`   PR Number: ${market.prNumber}`);
      
    } catch (error: any) {
      console.error(`❌ Failed to create market for ${market.repository} PR #${market.prNumber}:`, error?.message || error);
    }
  }
  
  // Verify contracts on Etherscan if on public network
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: projectCoinFactory.address,
        constructorArguments: [
          deployer.account.address,
          deployer.account.address,
          deployer.account.address
        ],
      });
      console.log("✅ ProjectCoinFactory verified on Etherscan");
    } catch (error: any) {
      console.log("⚠️  ProjectCoinFactory verification failed:", error?.message || error);
    }
    
    try {
      await hre.run("verify:verify", {
        address: predictionMarket.address,
        constructorArguments: [deployer.account.address],
      });
      console.log("✅ PredictionMarket verified on Etherscan");
    } catch (error: any) {
      console.log("⚠️  PredictionMarket verification failed:", error?.message || error);
    }
  }
  
  console.log("\n🎉 Deployment Complete!");
  console.log("================================");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  console.log("ProjectCoinFactory:", projectCoinFactory.address);
  console.log("PredictionMarket:", predictionMarket.address);
  
  if (createdTokens.length > 0) {
    console.log("\n🪙 Created Project Tokens:");
    createdTokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name} (${token.symbol})`);
      console.log(`   Repository: ${token.githubOwner}/${token.githubRepo}`);
      console.log(`   Token Address: ${token.tokenAddress}`);
    });
  }
  
  if (createdMarkets.length > 0) {
    console.log("\n🎯 Created Prediction Markets:");
    createdMarkets.forEach((market, index) => {
      console.log(`${index + 1}. ${market.description}`);
      console.log(`   Repository: ${market.repository}`);
      console.log(`   PR Number: ${market.prNumber}`);
    });
  }
  
  console.log("\n📋 Next steps:");
  console.log("1. Create a .env.local file in the frontend directory");
  console.log("2. Add these environment variables:");
  console.log(`   NEXT_PUBLIC_FACTORY_ADDRESS=${projectCoinFactory.address}`);
  console.log(`   NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=${predictionMarket.address}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${hre.network.config.chainId}`);
  if (hre.network.name === "sepolia") {
    console.log("3. Update your MetaMask to Sepolia testnet");
    console.log("4. Get some Sepolia ETH from https://sepoliafaucet.com/");
  }
  console.log("5. Test the frontend with your deployed contracts!");
  if (createdTokens.length > 0) {
    console.log("6. Try trading the pre-created tokens for blocksmiths and MyFit repos!");
  }
  if (createdMarkets.length > 0) {
    console.log("7. Check out the prediction markets for your GitHub PRs!");
  }
  
  // Save deployment info to file
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    projectCoinFactory: projectCoinFactory.address,
    predictionMarket: predictionMarket.address,
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
    createdTokens: createdTokens,
    createdMarkets: createdMarkets,
  };
  
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(
    path.join('deployments', `${hre.network.name}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n💾 Deployment info saved to deployments/${hre.network.name}-deployment.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });