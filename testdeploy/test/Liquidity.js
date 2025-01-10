const {expect} = require('chai')
const {ethers} = require('hardhat')

describe("MockLiquidityPool Contract", function () {
  let MockLiquidityPool;
  let mockLiquidityPool;
  let owner, addr1, addr2;

  // Initialize before tests
  beforeEach(async function () {
    // Get the ContractFactory and Signers
    MockLiquidityPool = await ethers.getContractFactory("MockLiquidityPool");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    mockLiquidityPool = await MockLiquidityPool.deploy();
    await mockLiquidityPool.deployTransaction.wait(); // Wait for deployment to complete
  });

  describe("Liquidity Management", function () {
    it("should allow adding liquidity", async function () {
      const tokenAddress = ethers.constants.AddressZero; // Using native token (ETH)
      const amount = ethers.utils.parseEther("1");

      // Add liquidity
      await mockLiquidityPool.connect(addr1).addLiquidity(tokenAddress, amount);

      // Verify the balance of addr1 for the given token
      const balance = await mockLiquidityPool.liquidity(addr1.address, tokenAddress);
      expect(balance).to.equal(amount);
    });

    it("should allow removing liquidity", async function () {
      const tokenAddress = ethers.constants.AddressZero;
      const amount = ethers.utils.parseEther("1");

      // Add liquidity first
      await mockLiquidityPool.connect(addr1).addLiquidity(tokenAddress, amount);

      // Remove liquidity
      await mockLiquidityPool.connect(addr1).removeLiquidity(tokenAddress, amount);

      // Verify the balance is now zero
      const balance = await mockLiquidityPool.liquidity(addr1.address, tokenAddress);
      expect(balance).to.equal(0);
    });

    it("should revert if removing more liquidity than available", async function () {
      const tokenAddress = ethers.constants.AddressZero;
      const amount = ethers.utils.parseEther("1");

      // Try to remove liquidity without adding any
      await expect(
        mockLiquidityPool.connect(addr1).removeLiquidity(tokenAddress, amount)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Swapping Tokens", function () {
    it("should allow swapping tokens", async function () {
      const token1 = ethers.constants.AddressZero; // ETH as token1
      const token2 = ethers.Wallet.createRandom().address; // Mock address for token2
      const amount = ethers.utils.parseEther("1");
      const exchangeRate = ethers.utils.parseUnits("2", 18); // 1 ETH = 2 Token2

      // Set exchange rate
      await mockLiquidityPool.setExchangeRate(token1, token2, exchangeRate);

      // Add liquidity to token1 (ETH)
      await mockLiquidityPool.connect(addr1).addLiquidity(token1, amount);

      // Swap token1 (ETH) to token2
      await mockLiquidityPool.connect(addr1).swap(token1, token2, amount);

      // Verify the new balance of addr1 for token2
      const balanceToken2 = await mockLiquidityPool.liquidity(addr1.address, token2);
      expect(balanceToken2).to.equal(amount.mul(exchangeRate).div(ethers.utils.parseUnits("1", 18)));
    });

    it("should revert if insufficient liquidity for swapping", async function () {
      const token1 = ethers.constants.AddressZero; // ETH as token1
      const token2 = ethers.Wallet.createRandom().address; // Mock address for token2
      const amount = ethers.utils.parseEther("1");

      // Try to swap without adding liquidity to token1
      await expect(
        mockLiquidityPool.connect(addr1).swap(token1, token2, amount)
      ).to.be.revertedWith("Insufficient liquidity to swap");
    });
  });

  describe("Exchange Rate", function () {
    it("should allow setting exchange rate", async function () {
      const token1 = ethers.constants.AddressZero; // ETH as token1
      const token2 = ethers.Wallet.createRandom().address; // Mock address for token2
      const rate = ethers.utils.parseUnits("2", 18); // 1 ETH = 2 Token2

      // Set exchange rate for token pair
      await mockLiquidityPool.setExchangeRate(token1, token2, rate);

      // Verify exchange rate is correctly set
      const fetchedRate = await mockLiquidityPool.getExchangeRate(token1, token2);
      expect(fetchedRate).to.equal(rate);
    });

    it("should allow fetching exchange rate", async function () {
      const token1 = ethers.constants.AddressZero; // ETH as token1
      const token2 = ethers.Wallet.createRandom().address; // Mock address for token2
      const rate = ethers.utils.parseUnits("2", 18); // 1 ETH = 2 Token2

      // Set exchange rate
      await mockLiquidityPool.setExchangeRate(token1, token2, rate);

      // Fetch exchange rate
      const fetchedRate = await mockLiquidityPool.getExchangeRate(token1, token2);
      expect(fetchedRate).to.equal(rate);
    });
  });
});
