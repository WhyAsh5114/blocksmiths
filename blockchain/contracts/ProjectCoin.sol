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
    uint256 public constant TREASURY_FEE = 30; // 30% to treasury
    uint256 public constant REWARD_POOL_FEE = 50; // 50% to reward pool
    uint256 public constant BUYBACK_FEE = 20; // 20% for buyback/burn
    
    // State tracking
    uint256 public totalMinted;
    uint256 public totalBurned;
    mapping(address => uint256) public userMintedAmount;
    
    // Events
    event TokensMinted(address indexed user, uint256 amount, uint256 price, uint256 ethSpent);
    event TokensBurned(uint256 amount);
    event PriceUpdated(uint256 newPrice);
    event FeesDistributed(uint256 treasury, uint256 rewardPool, uint256 buyback);
    
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
        address _initialOwner
    ) 
        ERC20(_name, _symbol) 
        Ownable(_initialOwner)
        validGithubRepo(_githubOwner, _githubRepo)
    {
        require(_treasury != address(0), "Treasury address cannot be zero");
        require(_rewardPool != address(0), "Reward pool address cannot be zero");
        
        githubOwner = _githubOwner;
        githubRepo = _githubRepo;
        repositoryUrl = string(abi.encodePacked("https://github.com/", _githubOwner, "/", _githubRepo));
        
        treasury = _treasury;
        rewardPool = _rewardPool;
        
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
     * @dev Owner can burn tokens for buyback mechanism
     */
    function buybackBurn(uint256 _amount) external onlyOwner {
        require(balanceOf(address(this)) >= _amount, "Insufficient contract balance");
        _burn(address(this), _amount);
        totalBurned += _amount;
        emit TokensBurned(_amount);
    }
    
    /**
     * @dev Distribute fees to treasury, reward pool, and keep some for buyback
     */
    function _distributeFees(uint256 _totalFees) internal {
        uint256 treasuryAmount = (_totalFees * TREASURY_FEE) / 100;
        uint256 rewardPoolAmount = (_totalFees * REWARD_POOL_FEE) / 100;
        uint256 buybackAmount = _totalFees - treasuryAmount - rewardPoolAmount;
        
        _transferToTreasury(treasuryAmount);
        _transferToRewardPool(rewardPoolAmount);
        
        emit FeesDistributed(treasuryAmount, rewardPoolAmount, buybackAmount);
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
}