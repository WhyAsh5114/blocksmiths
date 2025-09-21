import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther, formatEther } from "viem";

describe("ProjectCoin", function () {
  // Fixture to deploy the contract
  async function deployProjectCoinFixture() {
    const [owner, treasury, rewardPool, user1, user2] = await hre.viem.getWalletClients();

    const projectCoin = await hre.viem.deployContract("ProjectCoin", [
      "Test ProjectCoin",
      "TPC",
      "testowner",
      "testrepo",
      treasury.account.address,
      rewardPool.account.address,
      owner.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      projectCoin,
      owner,
      treasury,
      rewardPool,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right GitHub repository info", async function () {
      const { projectCoin } = await loadFixture(deployProjectCoinFixture);

      const [githubOwner, githubRepo, repositoryUrl] = await projectCoin.read.getRepositoryInfo();
      
      expect(githubOwner).to.equal("testowner");
      expect(githubRepo).to.equal("testrepo");
      expect(repositoryUrl).to.equal("https://github.com/testowner/testrepo");
    });

    it("Should set the right owner", async function () {
      const { projectCoin, owner } = await loadFixture(deployProjectCoinFixture);

      expect(await projectCoin.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should assign the initial supply to the owner", async function () {
      const { projectCoin, owner } = await loadFixture(deployProjectCoinFixture);

      const ownerBalance = await projectCoin.read.balanceOf([owner.account.address]);
      const totalSupply = await projectCoin.read.totalSupply();
      
      expect(ownerBalance).to.equal(totalSupply);
      expect(formatEther(totalSupply)).to.equal("1000000"); // 1M tokens
    });

    it("Should set the correct treasury and reward pool addresses", async function () {
      const { projectCoin, treasury, rewardPool } = await loadFixture(deployProjectCoinFixture);

      expect(await projectCoin.read.treasury()).to.equal(getAddress(treasury.account.address));
      expect(await projectCoin.read.rewardPool()).to.equal(getAddress(rewardPool.account.address));
    });
  });

  describe("Minting", function () {
    it("Should allow users to mint tokens with correct ETH payment", async function () {
      const { projectCoin, user1, publicClient } = await loadFixture(deployProjectCoinFixture);

      const tokensToMint = parseEther("1000"); // 1000 tokens
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);

      const balanceBefore = await projectCoin.read.balanceOf([user1.account.address]);
      
      const hash = await projectCoin.write.mintTokens([tokensToMint], {
        account: user1.account,
        value: mintCost,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await projectCoin.read.balanceOf([user1.account.address]);
      expect(balanceAfter - balanceBefore).to.equal(tokensToMint);
    });

    it("Should reject minting with insufficient ETH", async function () {
      const { projectCoin, user1 } = await loadFixture(deployProjectCoinFixture);

      const tokensToMint = parseEther("1000");
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);
      const insufficientPayment = mintCost / 2n; // Half the required amount

      await expect(
        projectCoin.write.mintTokens([tokensToMint], {
          account: user1.account,
          value: insufficientPayment,
        })
      ).to.be.rejectedWith("Insufficient ETH sent");
    });

    it("Should increase price after minting (bonding curve)", async function () {
      const { projectCoin, user1, publicClient } = await loadFixture(deployProjectCoinFixture);

      const initialPrice = await projectCoin.read.mintPrice();
      const tokensToMint = parseEther("1000"); // Exactly one batch
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);

      const hash = await projectCoin.write.mintTokens([tokensToMint], {
        account: user1.account,
        value: mintCost,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const newPrice = await projectCoin.read.mintPrice();
      const priceIncrement = await projectCoin.read.mintPriceIncrement();
      
      expect(newPrice).to.equal(initialPrice + priceIncrement);
    });

    it("Should distribute fees correctly", async function () {
      const { projectCoin, user1, treasury, rewardPool, publicClient } = await loadFixture(deployProjectCoinFixture);

      const treasuryBalanceBefore = await publicClient.getBalance({
        address: treasury.account.address,
      });
      const rewardPoolBalanceBefore = await publicClient.getBalance({
        address: rewardPool.account.address,
      });

      const tokensToMint = parseEther("1000");
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);

      const hash = await projectCoin.write.mintTokens([tokensToMint], {
        account: user1.account,
        value: mintCost,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const treasuryBalanceAfter = await publicClient.getBalance({
        address: treasury.account.address,
      });
      const rewardPoolBalanceAfter = await publicClient.getBalance({
        address: rewardPool.account.address,
      });

      const expectedTreasuryFee = (mintCost * 30n) / 100n; // 30%
      const expectedRewardPoolFee = (mintCost * 50n) / 100n; // 50%

      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedTreasuryFee);
      expect(rewardPoolBalanceAfter - rewardPoolBalanceBefore).to.equal(expectedRewardPoolFee);
    });
  });

  describe("Token Operations", function () {
    it("Should allow users to burn their tokens", async function () {
      const { projectCoin, user1, publicClient } = await loadFixture(deployProjectCoinFixture);

      // First mint some tokens
      const tokensToMint = parseEther("1000");
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);

      let hash = await projectCoin.write.mintTokens([tokensToMint], {
        account: user1.account,
        value: mintCost,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceBefore = await projectCoin.read.balanceOf([user1.account.address]);
      const tokensToBurn = parseEther("500");

      hash = await projectCoin.write.burn([tokensToBurn], {
        account: user1.account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const balanceAfter = await projectCoin.read.balanceOf([user1.account.address]);
      expect(balanceBefore - balanceAfter).to.equal(tokensToBurn);
    });

    it("Should track minting statistics correctly", async function () {
      const { projectCoin, user1, publicClient } = await loadFixture(deployProjectCoinFixture);

      const tokensToMint = parseEther("2000");
      const mintCost = await projectCoin.read.calculateMintCost([tokensToMint]);

      const hash = await projectCoin.write.mintTokens([tokensToMint], {
        account: user1.account,
        value: mintCost,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const [currentPrice, totalMinted, totalBurned, circulatingSupply, remainingSupply] = 
        await projectCoin.read.getMintingStats();

      expect(totalMinted).to.equal(parseEther("1000000") + tokensToMint); // Initial supply + minted
      expect(totalBurned).to.equal(0n);
      expect(circulatingSupply).to.equal(parseEther("1000000") + tokensToMint);
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to update treasury", async function () {
      const { projectCoin, owner, user1 } = await loadFixture(deployProjectCoinFixture);

      const newTreasury = user1.account.address;

      // Owner should be able to update
      await projectCoin.write.updateTreasury([newTreasury], {
        account: owner.account,
      });

      expect(await projectCoin.read.treasury()).to.equal(getAddress(newTreasury));

      // Non-owner should not be able to update
      await expect(
        projectCoin.write.updateTreasury([owner.account.address], {
          account: user1.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should allow only owner to perform buyback burn", async function () {
      const { projectCoin, owner, user1 } = await loadFixture(deployProjectCoinFixture);

      // Transfer some tokens to the contract
      const tokensToTransfer = parseEther("1000");
      await projectCoin.write.transfer([projectCoin.address, tokensToTransfer], {
        account: owner.account,
      });

      // Owner should be able to buyback burn
      await projectCoin.write.buybackBurn([parseEther("500")], {
        account: owner.account,
      });

      // Non-owner should not be able to buyback burn
      await expect(
        projectCoin.write.buybackBurn([parseEther("100")], {
          account: user1.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });
});