import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProjectCoinModule = buildModule("ProjectCoinModule", (m) => {
  // Parameters for deployment
  const name = m.getParameter("name", "BlockSmiths ProjectCoin");
  const symbol = m.getParameter("symbol", "BSP");
  const githubOwner = m.getParameter("githubOwner", "WhyAsh5114");
  const githubRepo = m.getParameter("githubRepo", "blocksmiths");
  
  // Deploy-time addresses (you'll need to update these for your specific deployment)
  const treasury = m.getParameter("treasury", "0x742d35Cc6635C0532925a3b8D2C8c82d5FF1e8F7"); // Example address
  const rewardPool = m.getParameter("rewardPool", "0x8ba1f109551bD432803012645Hac136c82433e"); // Example address
  const initialOwner = m.getParameter("initialOwner", "0x742d35Cc6635C0532925a3b8D2C8c82d5FF1e8F7"); // Example address

  // Deploy the ProjectCoin contract
  const projectCoin = m.contract("ProjectCoin", [
    name,
    symbol,
    githubOwner,
    githubRepo,
    treasury,
    rewardPool,
    initialOwner
  ]);

  return { projectCoin };
});

export default ProjectCoinModule;