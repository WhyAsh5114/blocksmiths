import hre from "hardhat";

async function main() {
  console.log("🚀 Starting PredictionMarket deployment to", hre.network.name);
  
  // Get the deployer account
  const [deployer] = await hre.viem.getWalletClients();
  
  console.log("\n📦 Deploying PredictionMarket...");
  
  const predictionMarket = await hre.viem.deployContract("PredictionMarket", [
    deployer.account.address // Initial owner
  ]);
  
  console.log("✅ PredictionMarket deployed to:", predictionMarket.address);
  
  console.log("\n🎉 Deployment Complete!");
  console.log("================================");
  console.log("Network:", hre.network.name);
  console.log("PredictionMarket:", predictionMarket.address);
  console.log("\n🔮 Testing YES/NO prediction market:");
  console.log("1. Create a market for a GitHub PR");
  console.log("2. Users can bet YES (PR will merge) or NO (PR will close)");
  console.log("3. When resolved, winners take all the losing side's money!");
  console.log("4. This addresses your concern: 'if a PR gets closed, shouldn't the NO voters gain all the money?'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });