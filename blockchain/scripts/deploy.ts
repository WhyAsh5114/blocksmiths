import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment to", hre.network.name);
  
  // Deploy ProjectCoinFactory
  console.log("\n📦 Deploying ProjectCoinFactory...");
  
  const projectCoinFactory = await hre.viem.deployContract("ProjectCoinFactory", [
    parseEther("0.001"), // Creation fee: 0.001 ETH
    "0x0000000000000000000000000000000000000000", // Default treasury (placeholder)
    "0x0000000000000000000000000000000000000000"  // Default reward pool (placeholder)
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