// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface ILiquidityPool {
    function addLiquidity(address token, uint256 amount) external;
    function removeLiquidity(address token, uint256 amount) external;
    function swap(address fromToken, address toToken, uint256 amount) external;
    function getExchangeRate(address fromToken, address toToken) external view returns (uint256);
}

contract SecureLiquidityPool is ILiquidityPool, Ownable {
    using SafeERC20 for IERC20;

    // Maps to simulate token balances in the pool
    mapping(address => mapping(address => uint256)) public liquidity;
    mapping(address => mapping(address => uint256)) public exchangeRates;
    
    // Mapping to track supported tokens
    mapping(address => bool) public supportedTokens;
    
    // Constants
    uint256 public constant MAX_RATE = 1000000 * 1e18; // Maximum allowed exchange rate
    
    // Events
    event LiquidityAdded(address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed token, uint256 amount);
    event TokensSwapped(address indexed fromToken, address indexed toToken, uint256 amount, uint256 receivedAmount);
    event ExchangeRateSet(address indexed fromToken, address indexed toToken, uint256 rate);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    // Modifiers
    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= type(uint256).max, "Amount too large");
        _;
    }

    // Constructor
    constructor() Ownable() {}

    // Token management functions
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    // View functions
    function getExchangeRate(address fromToken, address toToken) 
        public 
        view 
        override 
        validToken(fromToken) 
        validToken(toToken) 
        returns (uint256) 
    {
        require(exchangeRates[fromToken][toToken] > 0, "Exchange rate not set");
        return exchangeRates[fromToken][toToken];
    }

    // Main functions
    function addLiquidity(address token, uint256 amount) 
        external 
        override 
        validToken(token) 
        validAmount(amount) 
    {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        liquidity[msg.sender][token] += amount;
        emit LiquidityAdded(token, amount);
    }

    function removeLiquidity(address token, uint256 amount) 
        external 
        override 
        validToken(token) 
        validAmount(amount) 
    {
        require(liquidity[msg.sender][token] >= amount, "Insufficient liquidity");
        
        liquidity[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit LiquidityRemoved(token, amount);
    }

    function swap(address fromToken, address toToken, uint256 amount)
        external
        override
        validToken(fromToken)
        validToken(toToken)
        validAmount(amount)
    {
        require(fromToken != toToken, "Cannot swap same token");
        require(liquidity[msg.sender][fromToken] >= amount, "Insufficient liquidity");

        uint256 rate = getExchangeRate(fromToken, toToken);
        uint256 toAmount = (amount * rate) / 1e18;  // Assume exchange rate has 18 decimal places
        
        require(toAmount > 0, "Output amount too small");
        
        // Update state before external calls
        liquidity[msg.sender][fromToken] -= amount;
        liquidity[msg.sender][toToken] += toAmount;

        // Perform transfers
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(toToken).safeTransfer(msg.sender, toAmount);

        emit TokensSwapped(fromToken, toToken, amount, toAmount);
    }

    // Admin functions
    function setExchangeRate(address fromToken, address toToken, uint256 rate) 
        external 
        onlyOwner 
        validToken(fromToken) 
        validToken(toToken) 
    {
        require(rate > 0 && rate <= MAX_RATE, "Invalid rate");
        exchangeRates[fromToken][toToken] = rate;
        emit ExchangeRateSet(fromToken, toToken, rate);
    }

    // function pause() external onlyOwner {
    //     _pause();
    // }

    // function unpause() external onlyOwner {
    //     _unpause();
    // }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }
}