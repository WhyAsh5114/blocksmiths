import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther, formatEther } from "viem";

describe("ProjectCoinFactory", function () {
  // Fixture to deploy the factory contract
  async function deployProjectCoinFactoryFixture() {
    const [owner, treasury, rewardPool, user1, user2] = await hre.viem.getWalletClients();

    const factory = await hre.viem.deployContract("ProjectCoinFactory", [
      treasury.account.address,
      rewardPool.account.address,
      owner.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      factory,
      owner,
      treasury,
      rewardPool,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right default addresses", async function () {
      const { factory, treasury, rewardPool } = await loadFixture(deployProjectCoinFactoryFixture);

      expect(await factory.read.defaultTreasury()).to.equal(getAddress(treasury.account.address));
      expect(await factory.read.defaultRewardPool()).to.equal(getAddress(rewardPool.account.address));
    });

    it("Should set the right owner", async function () {
      const { factory, owner } = await loadFixture(deployProjectCoinFactoryFixture);

      expect(await factory.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should set the initial creation fee", async function () {
      const { factory } = await loadFixture(deployProjectCoinFactoryFixture);

      expect(await factory.read.creationFee()).to.equal(parseEther("0.01"));
    });
  });

  describe("Project Creation", function () {
    it("Should create a new ProjectCoin successfully", async function () {
      const { factory, user1, treasury, rewardPool, publicClient } = await loadFixture(deployProjectCoinFactoryFixture);

      const creationFee = await factory.read.creationFee();
      
      const hash = await factory.write.createProjectCoin([
        "Test ProjectCoin",
        "TPC",
        "testowner",
        "testrepo",
        treasury.account.address,
        rewardPool.account.address
      ], {
        account: user1.account,
        value: creationFee,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Check that token was created
      const tokenAddress = await factory.read.getTokenByRepo(["testowner", "testrepo"]);
      expect(tokenAddress).not.to.equal("0x0000000000000000000000000000000000000000");
      
      // Check project info
      const projectInfo = await factory.read.getProjectInfo([tokenAddress]);
      expect(projectInfo.name).to.equal("Test ProjectCoin");
      expect(projectInfo.symbol).to.equal("TPC");
      expect(projectInfo.githubOwner).to.equal("testowner");
      expect(projectInfo.githubRepo).to.equal("testrepo");
      expect(projectInfo.creator).to.equal(getAddress(user1.account.address));
      expect(projectInfo.isActive).to.be.true;
    });

    it("Should reject creating token for existing repository", async function () {
      const { factory, user1, user2, treasury, rewardPool, publicClient } = await loadFixture(deployProjectCoinFactoryFixture);

      const creationFee = await factory.read.creationFee();
      
      // Create first token
      const hash1 = await factory.write.createProjectCoin([
        "Test ProjectCoin",
        "TPC",
        "testowner",
        "testrepo",
        treasury.account.address,
        rewardPool.account.address
      ], {
        account: user1.account,
        value: creationFee,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Try to create second token for same repo
      await expect(
        factory.write.createProjectCoin([
          "Another ProjectCoin",
          "APC",
          "testowner",
          "testrepo",
          treasury.account.address,
          rewardPool.account.address
        ], {
          account: user2.account,
          value: creationFee,
        })
      ).to.be.rejectedWith("Token already exists for this repository");
    });

    it("Should reject creation with insufficient fee", async function () {
      const { factory, user1, treasury, rewardPool } = await loadFixture(deployProjectCoinFactoryFixture);

      const creationFee = await factory.read.creationFee();
      const insufficientFee = creationFee / 2n;
      
      await expect(
        factory.write.createProjectCoin([
          "Test ProjectCoin",
          "TPC",
          "testowner",
          "testrepo",
          treasury.account.address,
          rewardPool.account.address
        ], {
          account: user1.account,
          value: insufficientFee,
        })
      ).to.be.rejectedWith("Insufficient creation fee");
    });

    it("Should use default addresses when not provided", async function () {
      const { factory, user1, publicClient } = await loadFixture(deployProjectCoinFactoryFixture);

      const creationFee = await factory.read.creationFee();
      
      const hash = await factory.write.createProjectCoin([
        "Test ProjectCoin",
        "TPC",
        "testowner",
        "testrepo",
        "0x0000000000000000000000000000000000000000", // Use default treasury
        "0x0000000000000000000000000000000000000000"  // Use default reward pool
      ], {
        account: user1.account,
        value: creationFee,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      const tokenAddress = await factory.read.getTokenByRepo(["testowner", "testrepo"]);
      
      // Deploy ProjectCoin contract interface to check addresses
      const projectCoin = await hre.viem.getContractAt("ProjectCoin", tokenAddress);
      
      const defaultTreasury = await factory.read.defaultTreasury();
      const defaultRewardPool = await factory.read.defaultRewardPool();
      
      expect(await projectCoin.read.treasury()).to.equal(defaultTreasury);
      expect(await projectCoin.read.rewardPool()).to.equal(defaultRewardPool);
    });
  });

  describe("Search and Query Functions", function () {
    async function createMultipleProjectsFixture() {
      const baseFixture = await deployProjectCoinFactoryFixture();
      const { factory, user1, user2, treasury, rewardPool, publicClient } = baseFixture;

      const creationFee = await factory.read.creationFee();

      // Create multiple projects
      const projects = [
        { name: "Project Alpha", symbol: "PA", owner: "owner1", repo: "repo1", creator: user1 },
        { name: "Project Beta", symbol: "PB", owner: "owner1", repo: "repo2", creator: user1 },
        { name: "Project Gamma", symbol: "PG", owner: "owner2", repo: "repo1", creator: user2 },
      ];

      for (const project of projects) {
        const hash = await factory.write.createProjectCoin([
          project.name,
          project.symbol,
          project.owner,
          project.repo,
          treasury.account.address,
          rewardPool.account.address
        ], {
          account: project.creator.account,
          value: creationFee,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return { ...baseFixture, projects };
    }

    it("Should return correct project info by token address", async function () {
      const { factory } = await loadFixture(createMultipleProjectsFixture);

      const tokenAddress = await factory.read.getTokenByRepo(["owner1", "repo1"]);
      const projectInfo = await factory.read.getProjectInfo([tokenAddress]);

      expect(projectInfo.name).to.equal("Project Alpha");
      expect(projectInfo.githubOwner).to.equal("owner1");
      expect(projectInfo.githubRepo).to.equal("repo1");
    });

    it("Should return tokens by creator", async function () {
      const { factory, user1 } = await loadFixture(createMultipleProjectsFixture);

      const tokens = await factory.read.getTokensByCreator([user1.account.address]);
      expect(tokens.length).to.equal(2); // user1 created 2 projects
    });

    it("Should search projects by GitHub owner", async function () {
      const { factory } = await loadFixture(createMultipleProjectsFixture);

      const projects = await factory.read.searchByOwner(["owner1"]);
      expect(projects.length).to.equal(2); // owner1 has 2 repos
      
      expect(projects[0].githubOwner).to.equal("owner1");
      expect(projects[1].githubOwner).to.equal("owner1");
    });

    it("Should return all projects with pagination", async function () {
      const { factory } = await loadFixture(createMultipleProjectsFixture);

      const [allProjects, totalCount] = await factory.read.getAllProjects([0n, 10n]);
      expect(allProjects.length).to.equal(3);
      expect(totalCount).to.equal(3n);

      // Test pagination
      const [firstProject, _] = await factory.read.getAllProjects([0n, 1n]);
      expect(firstProject.length).to.equal(1);
    });

    it("Should check if repository has token", async function () {
      const { factory } = await loadFixture(createMultipleProjectsFixture);

      expect(await factory.read.hasToken(["owner1", "repo1"])).to.be.true;
      expect(await factory.read.hasToken(["nonexistent", "repo"])).to.be.false;
    });

    it("Should return total tokens count", async function () {
      const { factory } = await loadFixture(createMultipleProjectsFixture);

      const count = await factory.read.getTotalTokensCount();
      expect(count).to.equal(3n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update creation fee", async function () {
      const { factory, owner } = await loadFixture(deployProjectCoinFactoryFixture);

      const newFee = parseEther("0.02");
      await factory.write.updateCreationFee([newFee], {
        account: owner.account,
      });

      expect(await factory.read.creationFee()).to.equal(newFee);
    });

    it("Should reject non-owner updating creation fee", async function () {
      const { factory, user1 } = await loadFixture(deployProjectCoinFactoryFixture);

      const newFee = parseEther("0.02");
      await expect(
        factory.write.updateCreationFee([newFee], {
          account: user1.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should allow owner to deactivate project", async function () {
      const { factory, owner, user1, treasury, rewardPool, publicClient } = await loadFixture(deployProjectCoinFactoryFixture);

      // Create a project first
      const creationFee = await factory.read.creationFee();
      const hash = await factory.write.createProjectCoin([
        "Test ProjectCoin",
        "TPC",
        "testowner",
        "testrepo",
        treasury.account.address,
        rewardPool.account.address
      ], {
        account: user1.account,
        value: creationFee,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const tokenAddress = await factory.read.getTokenByRepo(["testowner", "testrepo"]);

      // Deactivate the project
      await factory.write.deactivateProject([tokenAddress, "Test deactivation"], {
        account: owner.account,
      });

      const projectInfo = await factory.read.getProjectInfo([tokenAddress]);
      expect(projectInfo.isActive).to.be.false;
    });

    it("Should allow owner to pause creation", async function () {
      const { factory, owner, user1, treasury, rewardPool } = await loadFixture(deployProjectCoinFactoryFixture);

      // Pause creation
      await factory.write.setCreationPaused([true], {
        account: owner.account,
      });

      const creationFee = await factory.read.creationFee();
      
      // Try to create project while paused
      await expect(
        factory.write.createProjectCoin([
          "Test ProjectCoin",
          "TPC",
          "testowner",
          "testrepo",
          treasury.account.address,
          rewardPool.account.address
        ], {
          account: user1.account,
          value: creationFee,
        })
      ).to.be.rejectedWith("Creation is currently paused");
    });
  });
});