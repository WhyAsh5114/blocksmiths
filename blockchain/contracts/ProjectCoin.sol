// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectCoin
 * @dev ERC20 token linked to a specific GitHub repository for prediction markets
 */
contract ProjectCoin is ERC20, Ownable, ReentrancyGuard {
    // GitHub repository information
    string public githubOwner;
    string public githubRepo;
    string public repositoryUrl;
    
    // Token economics
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10M tokens max
    
    // Minting parameters
    uint256 public mintPrice = 0.001 ether; // Initial mint price in ETH
    uint256 public mintPriceIncrement = 0.0001 ether; // Price increase per mint batch
    uint256 public tokensPerMint = 1000 * 10**18; // 1000 tokens per mint
    
    // Fee distribution
    address public treasury;
    address public rewardPool;
    address public projectCreator; // The original creator of this project token
    uint256 public constant TREASURY_FEE = 30; // 30% to treasury
    uint256 public constant REWARD_POOL_FEE = 40; // 40% to reward pool (reduced from 50%)
    uint256 public constant CREATOR_FEE = 10; // 10% to project creator
    uint256 public constant BUYBACK_FEE = 20; // 20% for buyback/burn
    
    // Market Resolution System
    struct MarketOutcome {
        uint256 prNumber;
        bool isResolved;
        bool prMerged;
        uint256 resolvedAt;
        uint256 rewardMultiplier; // Basis points (10000 = 100%)
    }
    
    mapping(uint256 => MarketOutcome) public marketOutcomes;
    uint256[] public resolvedPRs;
    
    // State tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    mapping(address => uint256) public userMintedAmount;
    
    // Events
    event TokensMinted(address indexed user, uint256 amount, uint256 price, uint256 ethSpent);
    event TokensBurned(uint256 amount);
    event TokensRedeemed(address indexed user, uint256 tokenAmount, uint256 ethReceived, uint256 burnFee);
    event PriceUpdated(uint256 newPrice);
    event FeesDistributed(uint256 treasury, uint256 rewardPool, uint256 buyback);
    event CreatorRewardDistributed(address indexed creator, uint256 amount);
    event MarketResolved(uint256 indexed prNumber, bool merged, uint256 rewardMultiplier);
    
    modifier validGithubRepo(string memory _owner, string memory _repo) {
        require(bytes(_owner).length > 0, "GitHub owner cannot be empty");
        require(bytes(_repo).length > 0, "GitHub repo cannot be empty");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool,
        address _projectCreator,
        address _initialOwner
    ) 
        ERC20(_name, _symbol) 
        Ownable(_initialOwner)
        validGithubRepo(_githubOwner, _githubRepo)
    {
        require(_treasury != address(0), "Treasury address cannot be zero");
        require(_rewardPool != address(0), "Reward pool address cannot be zero");
        require(_projectCreator != address(0), "Project creator address cannot be zero");
        
        githubOwner = _githubOwner;
        githubRepo = _githubRepo;
        repositoryUrl = string(abi.encodePacked("https://github.com/", _githubOwner, "/", _githubRepo));
        
        treasury = _treasury;
        rewardPool = _rewardPool;
        projectCreator = _projectCreator;
        
        // Mint initial supply to the contract owner
        _mint(_initialOwner, INITIAL_SUPPLY);
        totalMinted = INITIAL_SUPPLY;
    }
    
    /**
     * @dev Mint tokens by paying ETH - follows bonding curve pricing
     */
    function mintTokens(uint256 _tokenAmount) external payable nonReentrant {
        require(_tokenAmount > 0, "Token amount must be greater than 0");
        require(totalMinted + _tokenAmount <= MAX_SUPPLY, "Would exceed max supply");
        
        uint256 requiredEth = calculateMintCost(_tokenAmount);
        require(msg.value >= requiredEth, "Insufficient ETH sent");
        
        // Mint tokens to user
        _mint(msg.sender, _tokenAmount);
        _updateMintingState(_tokenAmount);
        
        // Update price based on bonding curve
        _updateMintPrice(_tokenAmount);
        
        // Distribute fees
        _distributeFees(msg.value);
        
        // Refund excess ETH
        _refundExcess(msg.value, requiredEth);
        
        emit TokensMinted(msg.sender, _tokenAmount, mintPrice, requiredEth);
    }
    
    /**
     * @dev Internal function to update minting state
     */
    function _updateMintingState(uint256 _tokenAmount) internal {
        totalMinted += _tokenAmount;
        userMintedAmount[msg.sender] += _tokenAmount;
    }
    
    /**
     * @dev Internal function to update mint price
     */
    function _updateMintPrice(uint256 _tokenAmount) internal {
        uint256 mintBatches = _tokenAmount / tokensPerMint;
        if (mintBatches > 0) {
            mintPrice += mintPriceIncrement * mintBatches;
            emit PriceUpdated(mintPrice);
        }
    }
    
    /**
     * @dev Internal function to refund excess ETH
     */
    function _refundExcess(uint256 paidAmount, uint256 requiredAmount) internal {
        if (paidAmount > requiredAmount) {
            payable(msg.sender).transfer(paidAmount - requiredAmount);
        }
    }
    
    /**
     * @dev Calculate the cost to mint a specific amount of tokens
     */
    function calculateMintCost(uint256 _tokenAmount) public view returns (uint256) {
        uint256 batches = (_tokenAmount + tokensPerMint - 1) / tokensPerMint; // Ceiling division
        uint256 totalCost = 0;
        uint256 currentPrice = mintPrice;
        
        for (uint256 i = 0; i < batches; i++) {
            totalCost += currentPrice;
            currentPrice += mintPriceIncrement;
        }
        
        return totalCost;
    }
    
    /**
     * @dev Burn tokens (can be used for buyback mechanism)
     */
    function burn(uint256 _amount) external {
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        _burn(msg.sender, _amount);
        totalBurned += _amount;
        emit TokensBurned(_amount);
    }
    
    /**
     * @dev Redeem tokens for ETH based on pro-rata share of contract balance
     */
    function redeem(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No ETH available for redemption");
        
        // Calculate pro-rata ETH amount
        uint256 currentSupply = totalSupply();
        require(currentSupply > 0, "No tokens in circulation");
        
        uint256 redemptionValue = (contractBalance * _amount) / currentSupply;
        
        // Apply small burn fee (2%) to discourage frequent redemptions
        uint256 burnFee = (redemptionValue * 2) / 100;
        uint256 netRedemption = redemptionValue - burnFee;
        
        require(netRedemption > 0, "Redemption amount too small");
        require(netRedemption <= contractBalance, "Insufficient contract balance");
        
        // Burn tokens
        _burn(msg.sender, _amount);
        totalBurned += _amount;
        
        // Transfer ETH to user
        payable(msg.sender).transfer(netRedemption);
        
        emit TokensRedeemed(msg.sender, _amount, netRedemption, burnFee);
    }
    
    /**
     * @dev Get current redemption value for a given amount of tokens
     */
    function getRedemptionValue(uint256 _amount) external view returns (uint256) {
        if (totalSupply() == 0 || address(this).balance == 0 || _amount == 0) {
            return 0;
        }
        
        uint256 grossValue = (address(this).balance * _amount) / totalSupply();
        uint256 burnFee = (grossValue * 2) / 100;
        return grossValue - burnFee;
    }
    
    /**
     * @dev Owner can burn tokens for buyback mechanism
     */
    function buybackBurn(uint256 _amount) external onlyOwner {
        require(balanceOf(address(this)) >= _amount, "Insufficient contract balance");
        _burn(address(this), _amount);
        totalBurned += _amount;
        emit TokensBurned(_amount);
    }
    
    /**
     * @dev Distribute fees to treasury, reward pool, creator, and keep some for buyback
     */
    function _distributeFees(uint256 _totalFees) internal {
        uint256 treasuryAmount = (_totalFees * TREASURY_FEE) / 100;
        uint256 rewardPoolAmount = (_totalFees * REWARD_POOL_FEE) / 100;
        uint256 creatorAmount = (_totalFees * CREATOR_FEE) / 100;
        uint256 buybackAmount = _totalFees - treasuryAmount - rewardPoolAmount - creatorAmount;
        
        _transferToTreasury(treasuryAmount);
        _transferToRewardPool(rewardPoolAmount);
        _transferToCreator(creatorAmount);
        
        emit FeesDistributed(treasuryAmount, rewardPoolAmount, buybackAmount);
        emit CreatorRewardDistributed(projectCreator, creatorAmount);
    }
    
    /**
     * @dev Internal function to transfer fees to treasury
     */
    function _transferToTreasury(uint256 amount) internal {
        if (amount > 0) {
            payable(treasury).transfer(amount);
        }
    }
    
    /**
     * @dev Internal function to transfer fees to reward pool
     */
    function _transferToRewardPool(uint256 amount) internal {
        if (amount > 0) {
            payable(rewardPool).transfer(amount);
        }
    }
    
    /**
     * @dev Internal function to transfer rewards to project creator
     */
    function _transferToCreator(uint256 amount) internal {
        if (amount > 0) {
            payable(projectCreator).transfer(amount);
        }
    }
    
    /**
     * @dev Get repository information
     */
    function getRepositoryInfo() external view returns (string memory, string memory, string memory) {
        return (githubOwner, githubRepo, repositoryUrl);
    }
    
    /**
     * @dev Get current minting statistics
     */
    function getMintingStats() external view returns (
        uint256 currentPrice,
        uint256 totalMintedTokens,
        uint256 totalBurnedTokens,
        uint256 circulatingSupply,
        uint256 remainingSupply
    ) {
        return (
            mintPrice,
            totalMinted,
            totalBurned,
            totalSupply(),
            MAX_SUPPLY - totalMinted
        );
    }
    
    /**
     * @dev Update treasury address (only owner)
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury address cannot be zero");
        treasury = _newTreasury;
    }
    
    /**
     * @dev Update reward pool address (only owner)
     */
    function updateRewardPool(address _newRewardPool) external onlyOwner {
        require(_newRewardPool != address(0), "Reward pool address cannot be zero");
        rewardPool = _newRewardPool;
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // ========================================
    // MARKET RESOLUTION SYSTEM
    // ========================================
    
    /**
     * @dev Resolve a PR outcome and set reward multiplier
     * @param prNumber The GitHub PR number
     * @param merged Whether the PR was merged (true) or closed/rejected (false)
     */
    function resolveMarket(uint256 prNumber, bool merged) external onlyOwner {
        require(!marketOutcomes[prNumber].isResolved, "Market already resolved");
        
        // Calculate reward multiplier based on outcome
        uint256 rewardMultiplier;
        if (merged) {
            rewardMultiplier = 12000; // 120% for merged PRs (20% bonus)
        } else {
            rewardMultiplier = 8000;  // 80% for closed PRs (20% penalty)
        }
        
        marketOutcomes[prNumber] = MarketOutcome({
            prNumber: prNumber,
            isResolved: true,
            prMerged: merged,
            resolvedAt: block.timestamp,
            rewardMultiplier: rewardMultiplier
        });
        
        resolvedPRs.push(prNumber);
        
        emit MarketResolved(prNumber, merged, rewardMultiplier);
    }
    
    /**
     * @dev Get market outcome for a specific PR
     */
    function getMarketOutcome(uint256 prNumber) external view returns (
        bool isResolved,
        bool prMerged,
        uint256 resolvedAt,
        uint256 rewardMultiplier
    ) {
        MarketOutcome memory outcome = marketOutcomes[prNumber];
        return (
            outcome.isResolved,
            outcome.prMerged,
            outcome.resolvedAt,
            outcome.rewardMultiplier
        );
    }
    
    /**
     * @dev Get all resolved PRs
     */
    function getResolvedPRs() external view returns (uint256[] memory) {
        return resolvedPRs;
    }
}