// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    // State variables
    address public owner;
    uint public targetAmount;
    uint public raisedAmount;
    uint public campaignEndTime;
    bool public campaignSucceeded;
    mapping(address => bool) public whitelistedAddresses;
    mapping(address => uint) public contributions;
    
    // Events
    event ContributionReceived(address indexed contributor, uint amount);
    event CampaignSucceeded(address indexed owner, uint totalRaised);
    event CampaignFailed(address indexed owner, uint totalRaised);
    event RewardClaimed(address indexed contributor, uint reward);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    modifier onlyWhitelisted() {
        require(whitelistedAddresses[msg.sender], "You are not whitelisted");
        _;
    }
    
    modifier onlyOncePerUser() {
        require(contributions[msg.sender] == 0, "You can only contribute once per campaign");
        _;
    }
    
    modifier isCampaignActive() {
        require(block.timestamp < campaignEndTime, "Campaign has ended");
        _;
    }
    
    modifier hasCampaignEnded() {
        require(block.timestamp >= campaignEndTime, "Campaign is still active");
        _;
    }
    
    // Constructor to initialize the contract
    constructor(uint _targetAmount, uint _durationInMinutes) {
        owner = msg.sender;
        targetAmount = _targetAmount;
        raisedAmount = 0;
        campaignEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        campaignSucceeded = false;
    }

    // Whitelist an address
    function addToWhitelist(address _address) external onlyOwner {
        whitelistedAddresses[_address] = true;
    }
    
    // Remove an address from the whitelist
    function removeFromWhitelist(address _address) external onlyOwner {
        whitelistedAddresses[_address] = false;
    }

    // Contribute to the crowdfunding campaign
    function contribute() external payable onlyWhitelisted onlyOncePerUser isCampaignActive {
        require(msg.value > 0, "Contribution must be greater than 0");
        
        contributions[msg.sender] = msg.value; // Record the contribution
        raisedAmount += msg.value; // Accumulate raised amount
        
        emit ContributionReceived(msg.sender, msg.value);
        
        // Check if the campaign has succeeded
        if (raisedAmount >= targetAmount) {
            campaignSucceeded = true;
            emit CampaignSucceeded(owner, raisedAmount);
        }
    }

    // Claim rewards (only after campaign has ended)
    function claimReward() external hasCampaignEnded {
        require(campaignSucceeded, "Campaign did not succeed");
        require(contributions[msg.sender] > 0, "No contribution found");
        
        uint reward = contributions[msg.sender] * 10 / 100; // 10% reward of contribution
        payable(msg.sender).transfer(reward);
        
        emit RewardClaimed(msg.sender, reward);
        
        // Reset the contribution to prevent re-claiming
        contributions[msg.sender] = 0;
    }

    // Finalize campaign (in case it didn't reach the target)
    function finalizeCampaign() external hasCampaignEnded onlyOwner {
    require(!campaignSucceeded, "Campaign already succeeded");

    if (raisedAmount < targetAmount) {
        // Refund all contributors if the target wasn't reached
        address[] memory contributors = getContributors();
        for (uint i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            uint refundAmount = contributions[contributor];
            if (refundAmount > 0) {
                payable(contributor).transfer(refundAmount);
            }
        }
        emit CampaignFailed(owner, raisedAmount);
    }
}

    // Utility function to return all contributors (mock function for simplicity)
    function getContributors() public view returns (address[] memory) {
        // In a real implementation, this could be a mapping that stores contributors addresses.
        // For simplicity, assume contributors are tracked correctly.
        address[] memory contributors;
        return contributors;
    }
}
