// Test script to verify creator reward functionality
import { parseEther } from "viem";
import hre from "hardhat";

async function testCreatorRewards() {
  console.log("🧪 Testing Creator Reward System");
  
  const [deployer, user1, projectCreator] = await hre.viem.getWalletClients();
  
  // Get the deployed factory
  const factoryAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const factory = await hre.viem.getContractAt("ProjectCoinFactory", factoryAddress);
  
  console.log("\n📝 Testing with existing project or creating unique one");
  
  // Try to get existing project first
  let tokenAddress;
  let projectInfo;
  
  try {
    // Check if testowner/testrepo already exists
    tokenAddress = await factory.read.getTokenByRepo(["testowner", "testrepo"]);
    projectInfo = await factory.read.tokenToProject([tokenAddress]);
    console.log("✅ Using existing project:", tokenAddress);
  } catch (error) {
    // Create a new unique project
    const timestamp = Date.now();
    const uniqueRepo = `testrepo-${timestamp}`;
    
    console.log(`📝 Creating new project: testowner/${uniqueRepo}`);
    
    const createTx = await factory.write.createProjectCoin([
      "TestProject",
      "TEST",
      "testowner",
      uniqueRepo,
      deployer.account.address, // treasury
      deployer.account.address  // reward pool
    ], {
      account: projectCreator.account,
      value: parseEther("0.01") // creation fee
    });
    
    console.log("✅ Project creation transaction:", createTx);
    
    // Get the newly created project
    tokenAddress = await factory.read.getTokenByRepo(["testowner", uniqueRepo]);
    projectInfo = await factory.read.tokenToProject([tokenAddress]);
  }
  
  console.log("📊 Project Info:");
  console.log("  Token Address:", projectInfo[0]);
  console.log("  Creator:", projectInfo[5]);
  console.log("  Name:", projectInfo[1]);
  
  // Get the token contract
  const token = await hre.viem.getContractAt("ProjectCoin", projectInfo[0]);
  
  console.log("\n💰 Testing token purchase and creator rewards");
  console.log("Creator address:", projectInfo[5]);
  
  // Get creator's initial balance
  const publicClient = await hre.viem.getPublicClient();
  const initialCreatorBalance = await publicClient.getBalance({
    address: projectInfo[5] as `0x${string}`
  });
  console.log("💎 Creator initial balance:", initialCreatorBalance);
  
  // User buys tokens (this should trigger creator rewards)
  const tokenAmount = parseEther("1"); // 1 token
  
  // Check mint cost first
  const mintCost = await token.read.calculateMintCost([tokenAmount]);
  console.log("💰 Mint cost for 1 token:", mintCost);
  
  console.log("🛒 User minting 1 token...");
  const buyTx = await token.write.mintTokens([tokenAmount], {
    account: user1.account,
    value: mintCost + (mintCost * 10n / 100n) // Add 10% buffer
  });
  
  console.log("✅ Mint transaction:", buyTx);
  
  // Check creator balance after mint
  const finalCreatorBalance = await publicClient.getBalance({
    address: projectInfo[5] as `0x${string}`
  });
  
  console.log("💎 Creator final balance:", finalCreatorBalance);
  console.log("💰 Creator reward received:", finalCreatorBalance - initialCreatorBalance);
  
  console.log("💎 Creator final balance:", finalCreatorBalance);
  console.log("💰 Creator reward received:", finalCreatorBalance - initialCreatorBalance);
  console.log("🎉 Creator reward system test completed!");
}

testCreatorRewards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });