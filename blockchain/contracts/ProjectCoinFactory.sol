// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ProjectCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectCoinFactory
 * @dev Factory contract to create and manage ProjectCoin tokens for GitHub repositories
 */
contract ProjectCoinFactory is Ownable, ReentrancyGuard {
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
    
    // Mappings for efficient lookups
    mapping(string => mapping(string => address)) public repoToToken; // githubOwner => githubRepo => tokenAddress
    mapping(address => ProjectInfo) public tokenToProject; // tokenAddress => ProjectInfo
    mapping(address => address[]) public creatorToTokens; // creator => tokenAddresses[]
    
    // Arrays for enumeration
    address[] public allTokens;
    string[] public allRepoKeys; // Format: "owner/repo"
    
    // Default addresses for new projects
    address public defaultTreasury;
    address public defaultRewardPool;
    
    // Factory settings
    uint256 public creationFee = 0.01 ether; // Fee to create a new project token
    bool public creationPaused = false;
    
    // Events
    event ProjectCoinCreated(
        address indexed tokenAddress,
        string indexed repoKey,
        address indexed creator,
        string githubOwner,
        string githubRepo,
        string name,
        string symbol
    );
    event ProjectDeactivated(address indexed tokenAddress, string reason);
    event CreationFeeUpdated(uint256 newFee);
    event DefaultAddressesUpdated(address treasury, address rewardPool);
    
    modifier notPaused() {
        require(!creationPaused, "Creation is currently paused");
        _;
    }
    
    modifier validRepo(string memory _owner, string memory _repo) {
        require(bytes(_owner).length > 0, "GitHub owner cannot be empty");
        require(bytes(_repo).length > 0, "GitHub repo cannot be empty");
        require(repoToToken[_owner][_repo] == address(0), "Token already exists for this repository");
        _;
    }
    
    constructor(
        address _defaultTreasury,
        address _defaultRewardPool,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_defaultTreasury != address(0), "Default treasury cannot be zero");
        require(_defaultRewardPool != address(0), "Default reward pool cannot be zero");
        
        defaultTreasury = _defaultTreasury;
        defaultRewardPool = _defaultRewardPool;
    }
    
    /**
     * @dev Create a new ProjectCoin for a GitHub repository
     */
    function createProjectCoin(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool
    ) external payable nonReentrant notPaused validRepo(_githubOwner, _githubRepo) returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(_name).length > 0, "Token name cannot be empty");
        require(bytes(_symbol).length > 0, "Token symbol cannot be empty");
        
        // Use default addresses if not provided
        address treasury = _treasury != address(0) ? _treasury : defaultTreasury;
        address rewardPool = _rewardPool != address(0) ? _rewardPool : defaultRewardPool;
        
        // Deploy new ProjectCoin contract
        ProjectCoin newToken = new ProjectCoin(
            _name,
            _symbol,
            _githubOwner,
            _githubRepo,
            treasury,
            rewardPool,
            msg.sender // Creator becomes initial owner
        );
        
        address tokenAddress = address(newToken);
        string memory repoKey = string(abi.encodePacked(_githubOwner, "/", _githubRepo));
        
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
        
        // Update mappings and arrays
        repoToToken[_githubOwner][_githubRepo] = tokenAddress;
        tokenToProject[tokenAddress] = projectInfo;
        creatorToTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        allRepoKeys.push(repoKey);
        
        // Refund excess payment
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
        
        emit ProjectCoinCreated(
            tokenAddress,
            repoKey,
            msg.sender,
            _githubOwner,
            _githubRepo,
            _name,
            _symbol
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Get ProjectCoin address for a specific GitHub repository
     */
    function getTokenByRepo(string memory _githubOwner, string memory _githubRepo) 
        external view returns (address) {
        return repoToToken[_githubOwner][_githubRepo];
    }
    
    /**
     * @dev Get project information by token address
     */
    function getProjectInfo(address _tokenAddress) 
        external view returns (ProjectInfo memory) {
        return tokenToProject[_tokenAddress];
    }
    
    /**
     * @dev Get all tokens created by a specific address
     */
    function getTokensByCreator(address _creator) 
        external view returns (address[] memory) {
        return creatorToTokens[_creator];
    }
    
    /**
     * @dev Get all active projects (paginated)
     */
    function getAllProjects(uint256 _offset, uint256 _limit) 
        external view returns (ProjectInfo[] memory, uint256) {
        require(_offset < allTokens.length, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > allTokens.length) {
            end = allTokens.length;
        }
        
        ProjectInfo[] memory projects = new ProjectInfo[](end - _offset);
        uint256 activeCount = 0;
        
        for (uint256 i = _offset; i < end; i++) {
            ProjectInfo memory project = tokenToProject[allTokens[i]];
            if (project.isActive) {
                projects[activeCount] = project;
                activeCount++;
            }
        }
        
        // Resize array to remove empty slots
        assembly {
            mstore(projects, activeCount)
        }
        
        return (projects, allTokens.length);
    }
    
    /**
     * @dev Search for projects by GitHub owner
     */
    function searchByOwner(string memory _githubOwner) 
        external view returns (ProjectInfo[] memory) {
        ProjectInfo[] memory tempResults = new ProjectInfo[](allTokens.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            ProjectInfo memory project = tokenToProject[allTokens[i]];
            if (project.isActive && keccak256(bytes(project.githubOwner)) == keccak256(bytes(_githubOwner))) {
                tempResults[count] = project;
                count++;
            }
        }
        
        // Resize array to actual results
        ProjectInfo[] memory results = new ProjectInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = tempResults[i];
        }
        
        return results;
    }
    
    /**
     * @dev Check if a repository already has a token
     */
    function hasToken(string memory _githubOwner, string memory _githubRepo) 
        external view returns (bool) {
        return repoToToken[_githubOwner][_githubRepo] != address(0);
    }
    
    /**
     * @dev Get total number of created tokens
     */
    function getTotalTokensCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Get a repository key by index
     */
    function getRepoKeyByIndex(uint256 _index) external view returns (string memory) {
        require(_index < allRepoKeys.length, "Index out of bounds");
        return allRepoKeys[_index];
    }
    
    // Admin functions
    
    /**
     * @dev Deactivate a project (only owner)
     */
    function deactivateProject(address _tokenAddress, string memory _reason) 
        external onlyOwner {
        require(tokenToProject[_tokenAddress].tokenAddress != address(0), "Project does not exist");
        tokenToProject[_tokenAddress].isActive = false;
        emit ProjectDeactivated(_tokenAddress, _reason);
    }
    
    /**
     * @dev Update creation fee (only owner)
     */
    function updateCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
        emit CreationFeeUpdated(_newFee);
    }
    
    /**
     * @dev Update default addresses (only owner)
     */
    function updateDefaultAddresses(address _treasury, address _rewardPool) 
        external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero");
        require(_rewardPool != address(0), "Reward pool cannot be zero");
        
        defaultTreasury = _treasury;
        defaultRewardPool = _rewardPool;
        
        emit DefaultAddressesUpdated(_treasury, _rewardPool);
    }
    
    /**
     * @dev Pause/unpause creation (only owner)
     */
    function setCreationPaused(bool _paused) external onlyOwner {
        creationPaused = _paused;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
}