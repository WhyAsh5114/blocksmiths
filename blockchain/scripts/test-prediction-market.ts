import { parseEther, formatEther } from "viem";
import hre from "hardhat";

async function testPredictionMarket() {
  console.log("🧪 Testing YES/NO Prediction Market System");
  
  const [owner, alice, bob, charlie] = await hre.viem.getWalletClients();
  
  // Get the deployed prediction market
  const marketAddress = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
  const market = await hre.viem.getContractAt("PredictionMarket", marketAddress);
  
  console.log("\n📝 Creating prediction market for PR #123 in repo 'test/example'");
  
  // Create a market for a PR
  const createTx = await market.write.createMarket([
    "test/example",
    123n
  ], {
    account: owner.account
  });
  
  console.log("✅ Market created:", createTx);
  
  // Get market info
  const marketInfo = await market.read.getMarket(["test/example", 123n]);
  console.log("📊 Market Info - Active:", marketInfo[0], "YES Pool:", marketInfo[1], "NO Pool:", marketInfo[2]);
  
  console.log("\n💰 Users betting on the outcome:");
  
  // Alice bets YES (PR will merge) with 1 ETH
  console.log("🟢 Alice bets YES with 1 ETH (thinks PR will merge)");
  const aliceYesTx = await market.write.takeYesPosition([
    "test/example",
    123n
  ], {
    account: alice.account,
    value: parseEther("1")
  });
  console.log("✅ Alice YES position:", aliceYesTx);
  
  // Bob bets NO (PR will be closed) with 0.5 ETH
  console.log("🔴 Bob bets NO with 0.5 ETH (thinks PR will be closed)");
  const bobNoTx = await market.write.takeNoPosition([
    "test/example",
    123n
  ], {
    account: bob.account,
    value: parseEther("0.5")
  });
  console.log("✅ Bob NO position:", bobNoTx);
  
  // Charlie also bets NO with 0.3 ETH
  console.log("🔴 Charlie bets NO with 0.3 ETH (also thinks PR will be closed)");
  const charlieNoTx = await market.write.takeNoPosition([
    "test/example",
    123n
  ], {
    account: charlie.account,
    value: parseEther("0.3")
  });
  console.log("✅ Charlie NO position:", charlieNoTx);
  
  // Check market state
  const updatedMarketInfo = await market.read.getMarket(["test/example", 123n]);
  console.log("\n📊 Updated Market State:");
  console.log("  YES Pool:", formatEther(updatedMarketInfo[1]), "ETH");
  console.log("  NO Pool:", formatEther(updatedMarketInfo[2]), "ETH");
  console.log("  YES Tokens:", updatedMarketInfo[3]);
  console.log("  NO Tokens:", updatedMarketInfo[4]);
  
  // Show potential winnings
  const aliceWinnings = await market.read.calculatePotentialWinnings(["test/example", 123n, alice.account.address]);
  const bobWinnings = await market.read.calculatePotentialWinnings(["test/example", 123n, bob.account.address]);
  const charlieWinnings = await market.read.calculatePotentialWinnings(["test/example", 123n, charlie.account.address]);
  
  console.log("\n💎 Potential Winnings:");
  console.log("  Alice (YES):", formatEther(aliceWinnings[0]), "ETH if PR merges");
  console.log("  Bob (NO):", formatEther(bobWinnings[1]), "ETH if PR closes");
  console.log("  Charlie (NO):", formatEther(charlieWinnings[1]), "ETH if PR closes");
  
  console.log("\n🔮 Scenario 1: PR gets CLOSED (NO voters win!)");
  
  // Resolve market as closed (NO wins)
  const resolveTx = await market.write.resolveMarket([
    "test/example",
    123n,
    false // PR was closed, not merged
  ], {
    account: owner.account
  });
  console.log("✅ Market resolved as CLOSED:", resolveTx);
  
  // Check balances before claiming
  const publicClient = await hre.viem.getPublicClient();
  const bobBalanceBefore = await publicClient.getBalance({
    address: bob.account.address
  });
  const charlieBalanceBefore = await publicClient.getBalance({
    address: charlie.account.address
  });
  
  console.log("\n💰 Claiming winnings (NO voters win everything!):");
  
  // Bob claims his winnings
  const bobClaimTx = await market.write.claimWinnings([
    "test/example",
    123n
  ], {
    account: bob.account
  });
  console.log("✅ Bob claimed winnings:", bobClaimTx);
  
  // Charlie claims his winnings
  const charlieClaimTx = await market.write.claimWinnings([
    "test/example",
    123n
  ], {
    account: charlie.account
  });
  console.log("✅ Charlie claimed winnings:", charlieClaimTx);
  
  // Check balances after claiming
  const bobBalanceAfter = await publicClient.getBalance({
    address: bob.account.address
  });
  const charlieBalanceAfter = await publicClient.getBalance({
    address: charlie.account.address
  });
  
  console.log("\n🎉 Final Results:");
  console.log("  Bob's profit:", formatEther(bobBalanceAfter - bobBalanceBefore), "ETH");
  console.log("  Charlie's profit:", formatEther(charlieBalanceAfter - charlieBalanceBefore), "ETH");
  console.log("  Alice (YES voter) gets nothing - PR was closed!");
  
  console.log("\n✨ This demonstrates true prediction market mechanics:");
  console.log("  - YES voters bet PR will merge");
  console.log("  - NO voters bet PR will be closed");
  console.log("  - Winners take ALL the money from losers");
  console.log("  - If PR closes, NO voters gain all the money! 🎯");
}

testPredictionMarket()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });