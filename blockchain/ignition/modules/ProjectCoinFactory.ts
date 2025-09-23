import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ProjectCoinFactoryModule = buildModule("ProjectCoinFactoryModule", (m) => {
  // Parameters for deployment - using proper checksummed addresses
  const defaultTreasury = m.getParameter("defaultTreasury", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // Hardhat account 0
  const defaultRewardPool = m.getParameter("defaultRewardPool", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Hardhat account 1
  const initialOwner = m.getParameter("initialOwner", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // Hardhat account 0

  // Deploy the ProjectCoinFactory contract
  const projectCoinFactory = m.contract("ProjectCoinFactory", [
    defaultTreasury,
    defaultRewardPool,
    initialOwner
  ]);

  return { projectCoinFactory };
});

export default ProjectCoinFactoryModule;