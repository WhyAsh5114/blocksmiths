import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProjectCoinFactoryModule = buildModule("ProjectCoinFactoryModule", (m) => {
  // Parameters for deployment
  const defaultTreasury = m.getParameter("defaultTreasury", "0x742d35Cc6635C0532925a3b8D2C8c82d5FF1e8F7"); // Example address
  const defaultRewardPool = m.getParameter("defaultRewardPool", "0x8ba1f109551bD432803012645Hac136c82433e"); // Example address
  const initialOwner = m.getParameter("initialOwner", "0x742d35Cc6635C0532925a3b8D2C8c82d5FF1e8F7"); // Example address

  // Deploy the ProjectCoinFactory contract
  const projectCoinFactory = m.contract("ProjectCoinFactory", [
    defaultTreasury,
    defaultRewardPool,
    initialOwner
  ]);

  return { projectCoinFactory };
});

export default ProjectCoinFactoryModule;