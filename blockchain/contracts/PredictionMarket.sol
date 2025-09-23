// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @dev Standalone YES/NO prediction market for GitHub PR outcomes
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    
    struct Market {
        uint256 prNumber;
        string repository;     // "owner/repo" format
        bool isActive;
        uint256 yesPool;      // Total ETH backing YES positions
        uint256 noPool;       // Total ETH backing NO positions
        uint256 totalYesTokens; // Total tokens representing YES votes
        uint256 totalNoTokens;  // Total tokens representing NO votes
        bool isResolved;
        bool outcome;         // true = merged, false = closed/rejected
        uint256 resolvedAt;
        uint256 createdAt;
    }
    
    // Market storage
    mapping(bytes32 => Market) public markets; // keccak256(repository, prNumber) => Market
    mapping(bytes32 => mapping(address => uint256)) public userYesPositions;
    mapping(bytes32 => mapping(address => uint256)) public userNoPositions;
    mapping(bytes32 => mapping(address => bool)) public userHasClaimed;
    
    // Market tracking
    bytes32[] public allMarkets;
    bytes32[] public activeMarkets;
    
    // Settings
    uint256 public constant PLATFORM_FEE = 5; // 5% platform fee
    uint256 public constant TOKENS_PER_ETH = 1000; // 1 ETH = 1000 tokens
    
    // Events
    event MarketCreated(bytes32 indexed marketId, string repository, uint256 prNumber);
    event YesPositionTaken(bytes32 indexed marketId, address indexed user, uint256 tokens, uint256 ethSpent);
    event NoPositionTaken(bytes32 indexed marketId, address indexed user, uint256 tokens, uint256 ethSpent);
    event MarketResolved(bytes32 indexed marketId, bool outcome, uint256 yesPool, uint256 noPool);
    event WinningsClaimed(bytes32 indexed marketId, address indexed user, uint256 amount, bool wasYesPosition);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    /**
     * @dev Create a new prediction market for a PR
     */
    function createMarket(string memory repository, uint256 prNumber) external onlyOwner {
        bytes32 marketId = getMarketId(repository, prNumber);
        require(!markets[marketId].isActive, "Market already exists");
        
        markets[marketId] = Market({
            prNumber: prNumber,
            repository: repository,
            isActive: true,
            yesPool: 0,
            noPool: 0,
            totalYesTokens: 0,
            totalNoTokens: 0,
            isResolved: false,
            outcome: false,
            resolvedAt: 0,
            createdAt: block.timestamp
        });
        
        allMarkets.push(marketId);
        activeMarkets.push(marketId);
        
        emit MarketCreated(marketId, repository, prNumber);
    }
    
    /**
     * @dev Take a YES position (bet that PR will be merged)
     */
    function takeYesPosition(string memory repository, uint256 prNumber) external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        bytes32 marketId = getMarketId(repository, prNumber);
        Market storage market = markets[marketId];
        
        require(market.isActive, "Market not active");
        require(!market.isResolved, "Market already resolved");
        
        // Calculate platform fee
        uint256 platformFee = (msg.value * PLATFORM_FEE) / 100;
        uint256 marketAmount = msg.value - platformFee;
        
        // Issue YES tokens
        uint256 tokensToIssue = marketAmount * TOKENS_PER_ETH;
        
        market.yesPool += marketAmount;
        market.totalYesTokens += tokensToIssue;
        userYesPositions[marketId][msg.sender] += tokensToIssue;
        
        // Send platform fee to owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        emit YesPositionTaken(marketId, msg.sender, tokensToIssue, msg.value);
    }
    
    /**
     * @dev Take a NO position (bet that PR will be closed/rejected)
     */
    function takeNoPosition(string memory repository, uint256 prNumber) external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        bytes32 marketId = getMarketId(repository, prNumber);
        Market storage market = markets[marketId];
        
        require(market.isActive, "Market not active");
        require(!market.isResolved, "Market already resolved");
        
        // Calculate platform fee
        uint256 platformFee = (msg.value * PLATFORM_FEE) / 100;
        uint256 marketAmount = msg.value - platformFee;
        
        // Issue NO tokens
        uint256 tokensToIssue = marketAmount * TOKENS_PER_ETH;
        
        market.noPool += marketAmount;
        market.totalNoTokens += tokensToIssue;
        userNoPositions[marketId][msg.sender] += tokensToIssue;
        
        // Send platform fee to owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        emit NoPositionTaken(marketId, msg.sender, tokensToIssue, msg.value);
    }
    
    /**
     * @dev Resolve a prediction market when PR outcome is known
     */
    function resolveMarket(string memory repository, uint256 prNumber, bool merged) external onlyOwner {
        bytes32 marketId = getMarketId(repository, prNumber);
        Market storage market = markets[marketId];
        
        require(market.isActive, "Market not active");
        require(!market.isResolved, "Already resolved");
        
        market.isResolved = true;
        market.outcome = merged;
        market.resolvedAt = block.timestamp;
        
        // Remove from active markets
        _removeFromActiveMarkets(marketId);
        
        emit MarketResolved(marketId, merged, market.yesPool, market.noPool);
    }
    
    /**
     * @dev Claim winnings from a resolved prediction market
     */
    function claimWinnings(string memory repository, uint256 prNumber) external nonReentrant {
        bytes32 marketId = getMarketId(repository, prNumber);
        Market memory market = markets[marketId];
        
        require(market.isResolved, "Market not resolved");
        require(!userHasClaimed[marketId][msg.sender], "Already claimed");
        
        uint256 userWinnings = 0;
        bool wasYesPosition = false;
        
        if (market.outcome) {
            // PR was merged - YES voters win
            uint256 userYesTokens = userYesPositions[marketId][msg.sender];
            if (userYesTokens > 0 && market.totalYesTokens > 0) {
                // User gets their share of the total pool (YES + NO pools)
                uint256 totalPool = market.yesPool + market.noPool;
                userWinnings = (totalPool * userYesTokens) / market.totalYesTokens;
                wasYesPosition = true;
            }
        } else {
            // PR was closed - NO voters win
            uint256 userNoTokens = userNoPositions[marketId][msg.sender];
            if (userNoTokens > 0 && market.totalNoTokens > 0) {
                // User gets their share of the total pool (YES + NO pools)
                uint256 totalPool = market.yesPool + market.noPool;
                userWinnings = (totalPool * userNoTokens) / market.totalNoTokens;
                wasYesPosition = false;
            }
        }
        
        require(userWinnings > 0, "No winnings to claim");
        
        userHasClaimed[marketId][msg.sender] = true;
        payable(msg.sender).transfer(userWinnings);
        
        emit WinningsClaimed(marketId, msg.sender, userWinnings, wasYesPosition);
    }
    
    /**
     * @dev Get market info
     */
    function getMarket(string memory repository, uint256 prNumber) external view returns (
        bool isActive,
        uint256 yesPool,
        uint256 noPool,
        uint256 totalYesTokens,
        uint256 totalNoTokens,
        bool isResolved,
        bool outcome,
        uint256 createdAt,
        uint256 resolvedAt
    ) {
        bytes32 marketId = getMarketId(repository, prNumber);
        Market memory market = markets[marketId];
        
        return (
            market.isActive,
            market.yesPool,
            market.noPool,
            market.totalYesTokens,
            market.totalNoTokens,
            market.isResolved,
            market.outcome,
            market.createdAt,
            market.resolvedAt
        );
    }
    
    /**
     * @dev Get user's positions in a market
     */
    function getUserPositions(string memory repository, uint256 prNumber, address user) external view returns (
        uint256 yesTokens,
        uint256 noTokens,
        bool hasClaimed
    ) {
        bytes32 marketId = getMarketId(repository, prNumber);
        return (
            userYesPositions[marketId][user],
            userNoPositions[marketId][user],
            userHasClaimed[marketId][user]
        );
    }
    
    /**
     * @dev Calculate potential winnings for a user
     */
    function calculatePotentialWinnings(string memory repository, uint256 prNumber, address user) external view returns (
        uint256 yesWinnings,
        uint256 noWinnings
    ) {
        bytes32 marketId = getMarketId(repository, prNumber);
        Market memory market = markets[marketId];
        uint256 totalPool = market.yesPool + market.noPool;
        
        if (totalPool == 0) return (0, 0);
        
        // YES winnings if PR gets merged
        uint256 userYesTokens = userYesPositions[marketId][user];
        if (userYesTokens > 0 && market.totalYesTokens > 0) {
            yesWinnings = (totalPool * userYesTokens) / market.totalYesTokens;
        }
        
        // NO winnings if PR gets closed
        uint256 userNoTokens = userNoPositions[marketId][user];
        if (userNoTokens > 0 && market.totalNoTokens > 0) {
            noWinnings = (totalPool * userNoTokens) / market.totalNoTokens;
        }
    }
    
    /**
     * @dev Get all active markets
     */
    function getActiveMarkets() external view returns (bytes32[] memory) {
        return activeMarkets;
    }
    
    /**
     * @dev Get all markets
     */
    function getAllMarkets() external view returns (bytes32[] memory) {
        return allMarkets;
    }
    
    /**
     * @dev Generate market ID from repository and PR number
     */
    function getMarketId(string memory repository, uint256 prNumber) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(repository, prNumber));
    }
    
    /**
     * @dev Remove market from active markets array
     */
    function _removeFromActiveMarkets(bytes32 marketId) internal {
        for (uint256 i = 0; i < activeMarkets.length; i++) {
            if (activeMarkets[i] == marketId) {
                activeMarkets[i] = activeMarkets[activeMarkets.length - 1];
                activeMarkets.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}