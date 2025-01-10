// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILiquidityPool {
    function addLiquidity(address token, uint256 amount) external;
    function removeLiquidity(address token, uint256 amount) external;
    function swap(address fromToken, address toToken, uint256 amount) external;
    function getExchangeRate(address fromToken, address toToken) external view returns (uint256);
}

contract MockLiquidityPool is ILiquidityPool {
    // Maps to simulate token balances in the pool
    mapping(address => mapping(address => uint256)) public liquidity;
    mapping(address => mapping(address => uint256)) public exchangeRates;

    // Event declarations for actions
    event LiquidityAdded(address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed token, uint256 amount);
    event TokensSwapped(address indexed fromToken, address indexed toToken, uint256 amount);
    event ExchangeRateSet(address indexed fromToken, address indexed toToken, uint256 rate);

    // Get exchange rate between two tokens
    function getExchangeRate(address fromToken, address toToken) public view override returns (uint256) {
        return exchangeRates[fromToken][toToken];
    }

    // Add liquidity to the pool for a specific token
    function addLiquidity(address token, uint256 amount) external override {
        liquidity[msg.sender][token] += amount;
        emit LiquidityAdded(token, amount);
    }

    // Remove liquidity from the pool for a specific token
    function removeLiquidity(address token, uint256 amount) external override {
        require(liquidity[msg.sender][token] >= amount, "Insufficient liquidity");
        liquidity[msg.sender][token] -= amount;
        emit LiquidityRemoved(token, amount);
    }
    

    // Swap tokens in the pool
    function swap(address fromToken, address toToken, uint256 amount) external override {
        require(liquidity[msg.sender][fromToken] >= amount, "Insufficient liquidity to swap");

        uint256 rate = getExchangeRate(fromToken, toToken); // Now calling it after definition
        uint256 toAmount = amount * rate / 1e18;  // Assume exchange rate has 18 decimal places

        liquidity[msg.sender][fromToken] -= amount;
        liquidity[msg.sender][toToken] += toAmount;

        emit TokensSwapped(fromToken, toToken, amount);
    }

    // Set exchange rate for a pair of tokens (for mock purposes)
    function setExchangeRate(address fromToken, address toToken, uint256 rate) external {
        exchangeRates[fromToken][toToken] = rate;
        emit ExchangeRateSet(fromToken, toToken, rate);
    }
}
