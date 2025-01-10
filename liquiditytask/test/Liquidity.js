const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureLiquidityPool", function () {
    let SecureLiquidityPool;
    let liquidityPool;
    let owner;
    let user1;
    let user2;
    let tokenA;
    let tokenB;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy mock tokens
        const MockTokenFactory = await ethers.getContractFactory("MockERC20");
        tokenA = await MockTokenFactory.deploy("Token A", "TKA");
        tokenB = await MockTokenFactory.deploy("Token B", "TKB");

        // Deploy liquidity pool
        SecureLiquidityPool = await ethers.getContractFactory("SecureLiquidityPool");
        liquidityPool = await SecureLiquidityPool.deploy();

        // Add tokens to supported tokens list
        await liquidityPool.addSupportedToken(await tokenA.getAddress());
        await liquidityPool.addSupportedToken(await tokenB.getAddress());

        // Set exchange rate (1 TokenA = 2 TokenB)
        await liquidityPool.setExchangeRate(await tokenA.getAddress(), await tokenB.getAddress(), ethers.parseEther("2"));
        await liquidityPool.setExchangeRate(await tokenB.getAddress(), await tokenA.getAddress(), ethers.parseEther("0.5"));

        // Mint tokens to users
        await tokenA.mint(user1.address, ethers.parseEther("1000"));
        await tokenB.mint(user1.address, ethers.parseEther("1000"));
        await tokenA.mint(user2.address, ethers.parseEther("1000"));
        await tokenB.mint(user2.address, ethers.parseEther("1000"));
    });

    describe("Token Management", function () {
        it("Should add supported token correctly", async function () {
            const MockTokenFactory = await ethers.getContractFactory("MockERC20");
            const newToken = await MockTokenFactory.deploy("Token C", "TKC");
            await liquidityPool.addSupportedToken(await newToken.getAddress());
            expect(await liquidityPool.supportedTokens(await newToken.getAddress())).to.be.true;
        });

        it("Should remove supported token correctly", async function () {
            await liquidityPool.removeSupportedToken(await tokenA.getAddress());
            expect(await liquidityPool.supportedTokens(await tokenA.getAddress())).to.be.false;
        });

        it("Should fail to add zero address token", async function () {
            await expect(liquidityPool.addSupportedToken(ethers.ZeroAddress))
                .to.be.revertedWith("Invalid token address");
        });
    });

    describe("Liquidity Management", function () {
        beforeEach(async function () {
            // Approve tokens for liquidity pool
            await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
            await tokenB.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
        });

        it("Should add liquidity correctly", async function () {
            await liquidityPool.connect(user1).addLiquidity(await tokenA.getAddress(), ethers.parseEther("100"));
            expect(await liquidityPool.liquidity(user1.address, await tokenA.getAddress()))
                .to.equal(ethers.parseEther("100"));
        });

        it("Should remove liquidity correctly", async function () {
            await liquidityPool.connect(user1).addLiquidity(await tokenA.getAddress(), ethers.parseEther("100"));
            await liquidityPool.connect(user1).removeLiquidity(await tokenA.getAddress(), ethers.parseEther("50"));
            expect(await liquidityPool.liquidity(user1.address, await tokenA.getAddress()))
                .to.equal(ethers.parseEther("50"));
        });

        it("Should fail to remove more liquidity than available", async function () {
            await liquidityPool.connect(user1).addLiquidity(await tokenA.getAddress(), ethers.parseEther("100"));
            await expect(liquidityPool.connect(user1).removeLiquidity(await tokenA.getAddress(), ethers.parseEther("150")))
                .to.be.revertedWith("Insufficient liquidity");
        });
    });

    describe("Swapping", function () {
      beforeEach(async function () {
          // Add liquidity by user1
          await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
          await tokenB.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
          await liquidityPool.connect(user1).addLiquidity(await tokenA.getAddress(), ethers.parseEther("100"));
          await liquidityPool.connect(user1).addLiquidity(await tokenB.getAddress(), ethers.parseEther("200"));
  
          // Approve tokens for user2
          await tokenA.connect(user2).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
          await tokenB.connect(user2).approve(await liquidityPool.getAddress(), ethers.parseEther("1000"));
          
          // Add initial liquidity for user2
          await liquidityPool.connect(user2).addLiquidity(await tokenA.getAddress(), ethers.parseEther("50"));
      });
  
      it("Should swap tokens correctly", async function () {
          const swapAmount = ethers.parseEther("10");
          
          // Get initial balances
          const initialTokenBBalance = await tokenB.balanceOf(user2.address);
          
          // Perform swap
          await liquidityPool.connect(user2).swap(
              await tokenA.getAddress(),
              await tokenB.getAddress(),
              swapAmount
          );
  
          // Get final balance
          const finalTokenBBalance = await tokenB.balanceOf(user2.address);
          
          // Check that user2 received the correct amount of TokenB (2x the input amount due to exchange rate)
          const expectedTokenBReceived = ethers.parseEther("20"); // 10 TokenA * 2 (exchange rate) = 20 TokenB
          expect(finalTokenBBalance - initialTokenBBalance).to.equal(expectedTokenBReceived);
      });
  
      it("Should fail to swap unsupported tokens", async function () {
          const MockTokenFactory = await ethers.getContractFactory("MockERC20");
          const newToken = await MockTokenFactory.deploy("Token C", "TKC");
          await expect(liquidityPool.connect(user1).swap(
              await newToken.getAddress(),
              await tokenB.getAddress(),
              ethers.parseEther("10")
          )).to.be.revertedWith("Token not supported");
      });
  
      it("Should fail to swap same token", async function () {
          await expect(liquidityPool.connect(user1).swap(
              await tokenA.getAddress(),
              await tokenA.getAddress(),
              ethers.parseEther("10")
          )).to.be.revertedWith("Cannot swap same token");
      });
  });

    describe("Emergency Functions", function () {
        it("Should allow owner to withdraw tokens", async function () {
            await tokenA.connect(user1).approve(await liquidityPool.getAddress(), ethers.parseEther("100"));
            await liquidityPool.connect(user1).addLiquidity(await tokenA.getAddress(), ethers.parseEther("100"));
            
            await liquidityPool.emergencyWithdraw(await tokenA.getAddress());
            expect(await tokenA.balanceOf(owner.address)).to.be.above(0);
        });

        it("Should not allow non-owner to withdraw tokens", async function () {
            await expect(liquidityPool.connect(user1).emergencyWithdraw(await tokenA.getAddress()))
                .to.be.revertedWithCustomError;
        });
    });
});