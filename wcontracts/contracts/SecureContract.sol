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
