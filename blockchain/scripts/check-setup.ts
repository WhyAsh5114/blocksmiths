import { formatEther } from "viem";
import hre from "hardhat";

async function main() {
  console.log("🔍 Checking deployment setup...\n");

  // Check network
  console.log("📡 Network:", hre.network.name);
  
  if (hre.network.name === "hardhat") {
    console.log("⚠️  You're on the local hardhat network");
    console.log("   To deploy to Sepolia, use: --network sepolia");
    return;
  }

  try {
    // Get wallet client
    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    
    console.log("👤 Deployer address:", deployer.account.address);
    
    // Check balance
    const balance = await publicClient.getBalance({ 
      address: deployer.account.address 
    });
    
    console.log("💰 Balance:", formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("❌ No ETH in wallet! Get some from Sepolia faucets:");
      console.log("   - https://faucets.chain.link/sepolia");
      console.log("   - https://sepoliafaucet.com/");
      return;
    }
    
    if (balance < 10000000000000000n) { // 0.01 ETH
      console.log("⚠️  Low balance. Recommended: at least 0.01 ETH for deployment");
    } else {
      console.log("✅ Sufficient balance for deployment!");
    }
    
    // Check if we can compile contracts
    console.log("\n🔨 Checking contract compilation...");
    await hre.run("compile");
    console.log("✅ Contracts compiled successfully!");
    
    console.log("\n🚀 Ready to deploy! Run:");
    console.log(`npx hardhat ignition deploy ./ignition/modules/ProjectCoinFactory.ts --network ${hre.network.name}`);
    
  } catch (error) {
    console.error("❌ Setup check failed:", error);
    console.log("\nMake sure you have:");
    console.log("1. PRIVATE_KEY in .env file");
    console.log("2. ALCHEMY_API_KEY in .env file");
    console.log("3. Sepolia ETH in your wallet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });