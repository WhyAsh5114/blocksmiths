import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment to", hre.network.name);
  
  // Get the deployer account
  const [deployer] = await hre.viem.getWalletClients();
  
  // Deploy ProjectCoinFactory
  console.log("\n📦 Deploying ProjectCoinFactory...");
  
  const projectCoinFactory = await hre.viem.deployContract("ProjectCoinFactory", [
    deployer.account.address, // Default treasury (deployer)
    deployer.account.address, // Default reward pool (deployer)
    deployer.account.address  // Initial owner (deployer)
  ]);
  
  console.log("✅ ProjectCoinFactory deployed to:", projectCoinFactory.address);
  
  console.log("\n🎉 Deployment Complete!");
  console.log("================================");
  console.log("Network:", hre.network.name);
  console.log("ProjectCoinFactory:", projectCoinFactory.address);
  console.log("\n📋 Next steps:");
  console.log("1. Copy the address above");
  console.log("2. Update FACTORY_ADDRESS in frontend/src/hooks/web3/useProjectCoin.ts");
  console.log("3. Test the frontend with a real deployed contract!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });