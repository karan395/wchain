# Technical Tasks
## Blockchain Fundamentals (20 points)
### Basic Concepts (10 points)
1. Multiple Choice: What distinguishes an EVM-compatible blockchain from a
non-EVM blockchain?
a) Block time
b) Consensus mechanism
c) Smart contract execution environment
d) Transaction speed

Ans 1 -> c 


2. Short Answer: Explain the concept of gas optimization in EVM-compatible chains
and provide two specific techniques to reduce gas costs.

Ans-> 2

**Gas optimization** in EVM-compatible chains refers to minimizing the computational and storage costs of smart contract execution to reduce transaction fees. Since gas costs are proportional to the complexity and resource usage of a contract, optimizing code ensures efficient execution.

**Techniques to reduce gas costs:**

1. **Use Fixed-Size Arrays Instead of Dynamic Arrays**: Fixed-size arrays consume less gas because their storage size is predefined, eliminating dynamic memory allocation overhead.

2. **Minimize Storage Writes**: Writing to blockchain storage is expensive. Use memory variables for intermediate calculations and batch updates to storage whenever possible.



3. Technical Discussion: Compare and contrast the benefits and drawbacks of using
Layer 1 vs Layer 2 solutions for scaling blockchain applications.

Ans 3->  **Layer 1 (L1):** Enhances the base blockchain for scalability (e.g., Ethereum 2.0).  
- **Benefits:** Native security, universal adoption, simplified development.  
- **Drawbacks:** Slow upgrades, limited scalability due to decentralization constraints.

**Layer 2 (L2):** Offloads transactions to secondary layers (e.g., Rollups).  
- **Benefits:** Higher throughput, lower costs, flexible updates.  
- **Drawbacks:** Added complexity, reliance on L1 security, potential fragmentation.

**Summary:** L1 improves core functionality but is slower to scale, while L2 offers faster, cost-effective solutions with added complexity. A hybrid approach balances their strengths.




_________________________________________________________________________
Smart Contract Debugging (10 points)
Code:
```solidity
contract BuggyContract {
mapping(address => uint) public balances;
function deposit() public payable {
balances[msg.sender] = msg.value;
}
(uint amount) public {
require(balances[msg.sender] >= amount);
(bool success, ) = msg.sender.call{value: amount}("");
balances[msg.sender] -= amount;
}
}
```
4. Code Review: Identify and explain all security vulnerabilities in the above contract.


1. Overwrite Vulnerability in deposit()
Issue: The balances mapping is set to msg.value on each deposit(), overwriting any previous balance.
Impact: Users lose the ability to accumulate balances across multiple deposits since the balance is replaced, not incremented.
Fix: Update balances by adding the deposited amount instead of overwriting:

balances[msg.sender] += msg.value;

2. Reentrancy Vulnerability in withdraw()
Issue: The call function sends Ether before updating the balances mapping. A malicious user could exploit this by calling withdraw() recursively before the balance is updated, draining the contract's funds.

Fix: Update the state before making the external call:
balances[msg.sender] -= amount;
(bool success, ) = msg.sender.call{value: amount}("");

3. Use of call for Sending Ether
Issue: The call function is low-level and may lead to unexpected behavior if not handled properly. It does not revert automatically on failure, making it hard to identify errors.
Impact: Ether might not be sent successfully, leaving the user without their funds.
Fix: Use transfer or send for sending Ether, or handle errors from call explicitly:

require(success, "Ether transfer failed");

4. Lack of Event Emissions
Issue: The contract does not emit events for critical actions like deposit and withdraw.
Impact: Reduces transparency and makes it difficult to track transactions on the blockchain.

code

event Deposit(address indexed user, uint amount);
event Withdrawal(address indexed user, uint amount);

function deposit() public payable {
    balances[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
}

function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount;
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Ether transfer failed");
    emit Withdrawal(msg.sender, amount);
}


5. No Access Control or Guard Against Excessive Withdrawals
Issue: No mechanism prevents unauthorized access or rate-limiting for withdraw calls.
Impact: Malicious users could repeatedly call withdraw if combined with reentrancy attacks, draining funds quickly.
Fix: Implement mechanisms like mutex locks to prevent reentrancy and ensure proper access control.


6. Missing Fallback or Receive Function
Issue: The contract does not have a fallback or receive function to handle direct Ether transfers.
Impact: Ether sent directly to the contract (without using deposit) would fail, possibly locking funds.
Fix: Add a receive() function:

receive() external payable {
    balances[msg.sender] += msg.value;
}





5. Problem Solving: Write a corrected contract version implementing proper security
measures.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureContract {
    mapping(address => uint) public balances;

    // Events for transparency
    event Deposit(address indexed user, uint amount);
    event Withdrawal(address indexed user, uint amount);

    // Deposit function with proper balance accumulation
    function deposit() public payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        balances[msg.sender] += msg.value; // Accumulate balance
        emit Deposit(msg.sender, msg.value); // Emit deposit event
    }

    // Withdraw function with reentrancy guard
    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Update state before making external call
        balances[msg.sender] -= amount;

        // Transfer funds
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Ether transfer failed");

        emit Withdrawal(msg.sender, amount); // Emit withdrawal event
    }

    // Fallback function to handle direct Ether transfers
    receive() external payable {
        balances[msg.sender] += msg.value; // Accumulate balance
        emit Deposit(msg.sender, msg.value); // Emit deposit event
    }
}




EVM Development (20 points)
Smart Contract Development
Coding Task:

Create an innovative smart contract for any decentralized application (DApp) of your
choice that showcases the following:
Use of whitelisted addresses or specific access control mechanisms.
Implement functionality to ensure fair usage (e.g., rate limiting, one-time actions per
user).
A time-bound feature or mechanism is relevant to your DApp's purpose.
Automated calculations or outcomes based on your chosen use case (e.g., results,
rewards, etc.).



OR
System Design:
●
●
●
●
●
●
Design a decentralized application on W Chain with the following considerations:
Core Components: Define the architecture and key modules of your DApp.
Innovative Features: Describe unique functionalities that make your application
impactful.
Mechanism Design: Detail any specific algorithms or workflows such as reward
systems, governance processes, or user engagement mechanisms.
Security: Address potential security risks and mitigation strategies.
Upgrade Mechanisms: Explain how your design can accommodate future upgrades
and scalability.



_________________________________________________________________________
Testing and Deployment (20 points)
Code Implementation:
Instruction: Write a comprehensive test suite for the following smart contract interface:
Code:
----------------------------------------------------------------------------------------------------------------------------------------------------------------------
Proprietary and Confidential. Property of W Chain. Please do not disclose or redistribute it without permission.```solidity
interface ILiquidityPool {
function add liquidity(address token, uint256 amount) external;
function remove liquidity(address token, uint256 amount) external;
function swap(address from token, address toToken, uint256 amount) external;
function getExchangeRate(address from token, address toToken) external view returns
(uint256);
}
Architecture (20 points)
Instruction: Design a token bridge system between W Chain and Ethereum.
Provide:
●
●
●
●
High-level architecture diagram
Key smart contract interfaces
Security considerations
Gas optimization strategie



Ans:-
### Diagram

W Chain                              Ethereum
----------------------------------------------
+------------------------+
|    User Interaction    |
+------------------------+
          |
          | Initiates Cross-Chain Transfer
          v
+-----------------------------+     +-----------------------------+
| Ethereum Bridge Module      |     | W Chain Bridge Module       |
| (Token Lock/Unlock Logic)   |     | (Token Lock/Unlock Logic)   |
+-----------------------------+     +-----------------------------+
| - lockTokens(uint256)       |     | - lockTokens(uint256)       |
| - unlockTokens(address, amt)|     | - unlockTokens(address, amt)|
| - TransferStarted()         |     | - TransferStarted()         |
| - TransferConfirmed()       |     | - TransferConfirmed()       |
+-----------------------------+     +-----------------------------+
          |                               |
          |                               |
  +-------+-------------------------------+-------+
  |                                           |
  v                                           v
+---------------------+              +---------------------+
| Event Relayer Node  |              | State Sync Relayer  |
| (Listens for Events)|              | (Tracks Token State)|
+---------------------+              +---------------------+
          |                               |
          | Relays Transfer Data          |
          v                               v
+---------------------+              +---------------------+
| Ethereum Asset Pool |              | W Chain Asset Pool  |
| (Handles Balances)  |              | (Handles Balances)  |
+---------------------+              +---------------------+
          |                               |
Token Movement/Approval           Token Movement/Approval
          |                               |
          v                               v
+---------------------+              +---------------------+
| Ethereum User Wallet|              | W Chain User Wallet|
| (Receives Tokens)   |              | (Receives Tokens)  |
+---------------------+              +---------------------+
