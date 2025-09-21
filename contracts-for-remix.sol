// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// This file contains all contracts needed for Remix deployment
// Copy this entire file to Remix IDE

// OpenZeppelin imports (Remix will automatically fetch these)
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectCoin
 * @dev ERC20 token with bonding curve pricing for GitHub PR prediction markets
 */
contract ProjectCoin is ERC20, Ownable, ReentrancyGuard {
    // GitHub repository information
    string public githubOwner;
    string public githubRepo;
    
    // Addresses for fee distribution
    address public treasury;
    address public rewardPool;
    
    // Bonding curve parameters
    uint256 public constant CURVE_FACTOR = 1000000; // Base price factor
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    // Fee structure (in basis points, 10000 = 100%)
    uint256 public constant TREASURY_FEE = 3000;    // 30%
    uint256 public constant REWARD_POOL_FEE = 5000; // 50%
    uint256 public constant BUYBACK_FEE = 2000;     // 20%
    
    // Events
    event TokensMinted(address indexed user, uint256 amount, uint256 cost);
    event TokensBurned(address indexed user, uint256 amount, uint256 refund);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RewardPoolUpdated(address indexed oldRewardPool, address indexed newRewardPool);
    
    /**
     * @dev Constructor
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _githubOwner GitHub repository owner
     * @param _githubRepo GitHub repository name
     * @param _treasury Treasury address for fee collection
     * @param _rewardPool Reward pool address for fee distribution
     * @param _initialOwner Initial owner of the contract
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool,
        address _initialOwner
    ) ERC20(_name, _symbol) Ownable(_initialOwner) {
        githubOwner = _githubOwner;
        githubRepo = _githubRepo;
        treasury = _treasury;
        rewardPool = _rewardPool;
    }
    
    /**
     * @dev Calculate the cost to mint a specific amount of tokens
     * Uses bonding curve: price = CURVE_FACTOR * (totalSupply + 1)
     */
    function calculateMintCost(uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < amount; i++) {
            totalCost += CURVE_FACTOR * (currentSupply + i + 1);
        }
        
        return totalCost;
    }
    
    /**
     * @dev Mint tokens by paying ETH according to bonding curve
     * @param amount Number of tokens to mint
     */
    function mintTokens(uint256 amount) external payable nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 cost = calculateMintCost(amount);
        require(msg.value >= cost, "Insufficient ETH sent");
        
        // Mint tokens to user
        _mint(msg.sender, amount);
        totalMinted += amount;
        
        // Distribute fees
        _distributeFees(cost);
        
        // Refund excess ETH
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
        
        emit TokensMinted(msg.sender, amount, cost);
    }
    
    /**
     * @dev Burn tokens and receive ETH refund
     * @param amount Number of tokens to burn
     */
    function burnTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");
        
        // Calculate refund (80% of current mint cost to prevent arbitrage)
        uint256 refund = (calculateMintCost(amount) * 8) / 10;
        require(address(this).balance >= refund, "Insufficient contract balance");
        
        // Burn tokens
        _burn(msg.sender, amount);
        totalBurned += amount;
        
        // Send refund
        payable(msg.sender).transfer(refund);
        
        emit TokensBurned(msg.sender, amount, refund);
    }
    
    /**
     * @dev Distribute fees to treasury, reward pool, and keep some for buybacks
     */
    function _distributeFees(uint256 amount) internal {
        uint256 treasuryAmount = (amount * TREASURY_FEE) / 10000;
        uint256 rewardAmount = (amount * REWARD_POOL_FEE) / 10000;
        // Remaining stays in contract for buybacks
        
        if (treasury != address(0)) {
            payable(treasury).transfer(treasuryAmount);
        }
        
        if (rewardPool != address(0)) {
            payable(rewardPool).transfer(rewardAmount);
        }
    }
    
    /**
     * @dev Owner function to update treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @dev Owner function to update reward pool address
     */
    function updateRewardPool(address _newRewardPool) external onlyOwner {
        address oldRewardPool = rewardPool;
        rewardPool = _newRewardPool;
        emit RewardPoolUpdated(oldRewardPool, _newRewardPool);
    }
    
    /**
     * @dev Owner function to burn tokens using contract's ETH (buyback mechanism)
     */
    function buybackBurn(uint256 amount) external onlyOwner {
        require(totalSupply() >= amount, "Insufficient total supply");
        
        uint256 cost = calculateMintCost(amount);
        require(address(this).balance >= cost, "Insufficient contract balance");
        
        // Burn from total supply (this reduces everyone's relative supply)
        _burn(address(this), amount);
        totalBurned += amount;
    }
    
    /**
     * @dev Get repository identifier
     */
    function getRepository() external view returns (string memory) {
        return string(abi.encodePacked(githubOwner, "/", githubRepo));
    }
    
    /**
     * @dev Get minting statistics
     */
    function getMintingStats() external view returns (uint256, uint256, uint256) {
        return (totalMinted, totalBurned, address(this).balance);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}

/**
 * @title ProjectCoinFactory
 * @dev Factory contract for creating and managing ProjectCoin instances
 */
contract ProjectCoinFactory is Ownable {
    // Structure to store project information
    struct ProjectInfo {
        address tokenAddress;
        string name;
        string symbol;
        string githubOwner;
        string githubRepo;
        address creator;
        uint256 createdAt;
        bool isActive;
    }
    
    // State variables
    uint256 public creationFee;
    address public defaultTreasury;
    address public defaultRewardPool;
    bool public creationPaused;
    
    // Mappings
    mapping(string => address) public repoToToken; // "owner/repo" => token address
    mapping(address => ProjectInfo) public tokenToProject;
    mapping(address => address[]) public creatorToTokens;
    mapping(string => address[]) public ownerToTokens; // GitHub owner => token addresses
    address[] public allTokens;
    
    // Events
    event ProjectCoinCreated(
        address indexed tokenAddress,
        string githubOwner,
        string githubRepo,
        address indexed creator,
        string name,
        string symbol
    );
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event CreationPausedUpdated(bool isPaused);
    event ProjectDeactivated(address indexed tokenAddress);
    
    /**
     * @dev Constructor
     * @param _creationFee Fee required to create a new ProjectCoin (in wei)
     * @param _defaultTreasury Default treasury address for new tokens
     * @param _defaultRewardPool Default reward pool address for new tokens
     */
    constructor(
        uint256 _creationFee,
        address _defaultTreasury,
        address _defaultRewardPool
    ) Ownable(msg.sender) {
        creationFee = _creationFee;
        defaultTreasury = _defaultTreasury;
        defaultRewardPool = _defaultRewardPool;
    }
    
    /**
     * @dev Create a new ProjectCoin for a GitHub repository
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _githubOwner GitHub repository owner
     * @param _githubRepo GitHub repository name
     * @param _treasury Treasury address (use address(0) for default)
     * @param _rewardPool Reward pool address (use address(0) for default)
     */
    function createProjectCoin(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool
    ) external payable returns (address) {
        require(!creationPaused, "Project creation is paused");
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(_githubOwner).length > 0, "GitHub owner cannot be empty");
        require(bytes(_githubRepo).length > 0, "GitHub repo cannot be empty");
        
        string memory repoKey = string(abi.encodePacked(_githubOwner, "/", _githubRepo));
        require(repoToToken[repoKey] == address(0), "Project already exists for this repository");
        
        // Use default addresses if not provided
        address treasury = _treasury == address(0) ? defaultTreasury : _treasury;
        address rewardPool = _rewardPool == address(0) ? defaultRewardPool : _rewardPool;
        
        // Deploy new ProjectCoin
        ProjectCoin newToken = new ProjectCoin(
            _name,
            _symbol,
            _githubOwner,
            _githubRepo,
            treasury,
            rewardPool,
            msg.sender // Creator becomes the initial owner
        );
        
        address tokenAddress = address(newToken);
        
        // Store project information
        ProjectInfo memory projectInfo = ProjectInfo({
            tokenAddress: tokenAddress,
            name: _name,
            symbol: _symbol,
            githubOwner: _githubOwner,
            githubRepo: _githubRepo,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Update mappings
        repoToToken[repoKey] = tokenAddress;
        tokenToProject[tokenAddress] = projectInfo;
        creatorToTokens[msg.sender].push(tokenAddress);
        ownerToTokens[_githubOwner].push(tokenAddress);
        allTokens.push(tokenAddress);
        
        // Transfer creation fee to contract owner
        if (creationFee > 0) {
            payable(owner()).transfer(creationFee);
        }
        
        // Refund excess payment
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
        
        emit ProjectCoinCreated(tokenAddress, _githubOwner, _githubRepo, msg.sender, _name, _symbol);
        
        return tokenAddress;
    }
    
    /**
     * @dev Get project information by token address
     */
    function getProjectInfo(address _tokenAddress) external view returns (ProjectInfo memory) {
        return tokenToProject[_tokenAddress];
    }
    
    /**
     * @dev Get all tokens created by a specific address
     */
    function getTokensByCreator(address _creator) external view returns (address[] memory) {
        return creatorToTokens[_creator];
    }
    
    /**
     * @dev Get all tokens for a specific GitHub owner
     */
    function getTokensByGitHubOwner(string memory _githubOwner) external view returns (address[] memory) {
        return ownerToTokens[_githubOwner];
    }
    
    /**
     * @dev Search projects by GitHub owner (returns project info)
     */
    function searchProjectsByOwner(string memory _githubOwner) external view returns (ProjectInfo[] memory) {
        address[] memory tokens = ownerToTokens[_githubOwner];
        ProjectInfo[] memory projects = new ProjectInfo[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            projects[i] = tokenToProject[tokens[i]];
        }
        
        return projects;
    }
    
    /**
     * @dev Get all projects with pagination
     */
    function getAllProjects(uint256 _offset, uint256 _limit) external view returns (ProjectInfo[] memory, uint256) {
        uint256 totalCount = allTokens.length;
        
        if (_offset >= totalCount) {
            return (new ProjectInfo[](0), totalCount);
        }
        
        uint256 end = _offset + _limit;
        if (end > totalCount) {
            end = totalCount;
        }
        
        uint256 length = end - _offset;
        ProjectInfo[] memory projects = new ProjectInfo[](length);
        
        for (uint256 i = 0; i < length; i++) {
            projects[i] = tokenToProject[allTokens[_offset + i]];
        }
        
        return (projects, totalCount);
    }
    
    /**
     * @dev Check if a repository has an associated token
     */
    function hasToken(string memory _githubOwner, string memory _githubRepo) external view returns (bool) {
        string memory repoKey = string(abi.encodePacked(_githubOwner, "/", _githubRepo));
        return repoToToken[repoKey] != address(0);
    }
    
    /**
     * @dev Get token address for a repository
     */
    function getTokenByRepo(string memory _githubOwner, string memory _githubRepo) external view returns (address) {
        string memory repoKey = string(abi.encodePacked(_githubOwner, "/", _githubRepo));
        return repoToToken[repoKey];
    }
    
    /**
     * @dev Get total number of tokens created
     */
    function getTotalTokensCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    // Admin functions
    
    /**
     * @dev Update creation fee (only owner)
     */
    function updateCreationFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = _newFee;
        emit CreationFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Pause/unpause project creation (only owner)
     */
    function setCreationPaused(bool _paused) external onlyOwner {
        creationPaused = _paused;
        emit CreationPausedUpdated(_paused);
    }
    
    /**
     * @dev Deactivate a project (only owner)
     */
    function deactivateProject(address _tokenAddress) external onlyOwner {
        require(tokenToProject[_tokenAddress].tokenAddress != address(0), "Project does not exist");
        tokenToProject[_tokenAddress].isActive = false;
        emit ProjectDeactivated(_tokenAddress);
    }
    
    /**
     * @dev Update default treasury address (only owner)
     */
    function updateDefaultTreasury(address _newTreasury) external onlyOwner {
        defaultTreasury = _newTreasury;
    }
    
    /**
     * @dev Update default reward pool address (only owner)
     */
    function updateDefaultRewardPool(address _newRewardPool) external onlyOwner {
        defaultRewardPool = _newRewardPool;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}