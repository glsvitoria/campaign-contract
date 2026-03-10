// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract CampaignFactory {
  address[] public deployedCampaigns;

  constructor() {}

  function createCampaign(uint minimum) public {
    Campaign newCampaign = new Campaign(minimum, msg.sender);

    deployedCampaigns.push(address(newCampaign));
  }

  function getDeployedCampaigns() public view returns (address[] memory){
    return deployedCampaigns;
  }
}

contract Campaign {
  struct Request {
    string description;
    uint value;
    address payable recipient;
    bool complete;
    uint approvalCount;
  }

  Request[] public requests;
  address public manager;
  uint public minimumContribution;

  mapping(address => bool) public approvers;
  uint public approversCount;

  mapping(uint => mapping(address => bool)) public approvals;

  modifier restricted() {
    require(msg.sender == manager, "Only manager can call this");
    _;
  }

  constructor(uint minimum, address creator) {
    manager = creator;
    minimumContribution = minimum;
  }

  function contribute() public payable {
    require(msg.value >= minimumContribution, "Minimum contribution not met");

    if (!approvers[msg.sender]) {
      approvers[msg.sender] = true;
      approversCount++;
    }   
  }

  function createRequest(string memory description, uint value, address payable recipient) public restricted {
    Request storage newRequest = requests.push();

    newRequest.description = description;
    newRequest.value = value;
    newRequest.recipient = recipient;
    newRequest.complete = false;
    newRequest.approvalCount = 0;
  }

  function approveRequest(uint index) public {
    Request storage request = requests[index];

    require(approvers[msg.sender], "Only contributors can approve");
    require(!approvals[index][msg.sender], "Already approved");

    approvals[index][msg.sender] = true;
    request.approvalCount++;
  }

  function finalizeRequest(uint index) public restricted {
    Request storage request = requests[index];

    require(request.approvalCount > (approversCount / 2), "Not enough approvals");
    require(!request.complete, "Request already finalized");
    
    (bool success, ) = request.recipient.call{value: request.value}("");
    require(success, "Transfer failed");
    request.complete = true;
  }
}