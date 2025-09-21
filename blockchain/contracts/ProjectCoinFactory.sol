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
        
        // Deploy the token and get its address
        address tokenAddress = _deployTokenWithAddresses(_name, _symbol, _githubOwner, _githubRepo, _treasury, _rewardPool);
        
        // Store project information and update mappings
        _storeProjectInfo(tokenAddress, _name, _symbol, _githubOwner, _githubRepo);
        
        // Handle payment refund
        _handlePaymentRefund();
        
        // Emit event
        _emitCreationEvent(tokenAddress, _name, _symbol, _githubOwner, _githubRepo);
        
        return tokenAddress;
    }
    
    /**
     * @dev Internal function to emit creation event
     */
    function _emitCreationEvent(
        address tokenAddress,
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo
    ) internal {
        string memory repoKey = string(abi.encodePacked(_githubOwner, "/", _githubRepo));
        emit ProjectCoinCreated(
            tokenAddress,
            repoKey,
            msg.sender,
            _githubOwner,
            _githubRepo,
            _name,
            _symbol
        );
    }
    
    /**
     * @dev Internal function to deploy the ProjectCoin token with resolved addresses
     */
    function _deployTokenWithAddresses(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool
    ) internal returns (address) {
        return address(_createProjectCoinContract(_name, _symbol, _githubOwner, _githubRepo, _treasury, _rewardPool));
    }
    
    /**
     * @dev Internal function to create ProjectCoin contract
     */
    function _createProjectCoinContract(
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo,
        address _treasury,
        address _rewardPool
    ) internal returns (ProjectCoin) {
        return new ProjectCoin(
            _name,
            _symbol,
            _githubOwner,
            _githubRepo,
            _treasury != address(0) ? _treasury : defaultTreasury,
            _rewardPool != address(0) ? _rewardPool : defaultRewardPool,
            msg.sender
        );
    }
    
    /**
     * @dev Internal function to store project information
     */
    function _storeProjectInfo(
        address tokenAddress,
        string memory _name,
        string memory _symbol,
        string memory _githubOwner,
        string memory _githubRepo
    ) internal {
        // Update mappings and arrays directly to avoid struct creation
        repoToToken[_githubOwner][_githubRepo] = tokenAddress;
        
        tokenToProject[tokenAddress] = ProjectInfo({
            tokenAddress: tokenAddress,
            name: _name,
            symbol: _symbol,
            githubOwner: _githubOwner,
            githubRepo: _githubRepo,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        creatorToTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        allRepoKeys.push(string(abi.encodePacked(_githubOwner, "/", _githubRepo)));
    }
    
    /**
     * @dev Internal function to handle payment refund
     */
    function _handlePaymentRefund() internal {
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
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
        
        return _buildProjectList(_offset, end);
    }
    
    /**
     * @dev Internal function to build project list
     */
    function _buildProjectList(uint256 _start, uint256 _end) 
        internal view returns (ProjectInfo[] memory, uint256) {
        ProjectInfo[] memory projects = new ProjectInfo[](_end - _start);
        uint256 activeCount = 0;
        
        for (uint256 i = _start; i < _end; i++) {
            ProjectInfo storage project = tokenToProject[allTokens[i]];
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
        uint256 count = _countProjectsByOwner(_githubOwner);
        if (count == 0) {
            return new ProjectInfo[](0);
        }
        
        return _getProjectsByOwner(_githubOwner, count);
    }
    
    /**
     * @dev Internal function to count projects by owner
     */
    function _countProjectsByOwner(string memory _githubOwner) internal view returns (uint256) {
        uint256 count = 0;
        bytes32 ownerHash = keccak256(bytes(_githubOwner));
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            ProjectInfo storage project = tokenToProject[allTokens[i]];
            if (project.isActive && keccak256(bytes(project.githubOwner)) == ownerHash) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Internal function to get projects by owner
     */
    function _getProjectsByOwner(string memory _githubOwner, uint256 count) 
        internal view returns (ProjectInfo[] memory) {
        ProjectInfo[] memory results = new ProjectInfo[](count);
        uint256 index = 0;
        bytes32 ownerHash = keccak256(bytes(_githubOwner));
        
        for (uint256 i = 0; i < allTokens.length && index < count; i++) {
            ProjectInfo storage project = tokenToProject[allTokens[i]];
            if (project.isActive && keccak256(bytes(project.githubOwner)) == ownerHash) {
                results[index] = project;
                index++;
            }
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