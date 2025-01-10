const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  //const SecureContract = await ethers.getContractFactory("SecureContract");
  const MockLiquidityPool = await ethers.getContractFactory(
    "MockLiquidityPool"
  );

  // Deploy the contract
  const mockLiquidityPool = await MockLiquidityPool.deploy();

  await new Promise(resolve => setTimeout(resolve, 20000));

  // Log the deployed contract address
  console.log("MockLiquidityPool contract deployed to:", mockLiquidityPool.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
