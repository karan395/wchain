const {ethers} = require("hardhat");

async function main() {

  // Get the contract factory
  //const SecureContract = await ethers.getContractFactory("SecureContract");
  const SecureContract = await ethers.getContractFactory("Crowdfunding");

  // Deploy the contract
//   const secureContract = await SecureContract.deploy();
//   console.log("SecureContract deployed to:", secureContract.target);


  const targetAmount = 1; // Example: 1 ETH target
  const durationInMinutes = 60; // Campaign duration of 1 hour

  // Deploy the contract
  const crowdfunding = await SecureContract.deploy(targetAmount, durationInMinutes);

  console.log("Crowdfunding contract deployed to:", crowdfunding.target);



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
