const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Indian Carbon Credit (ICC) to Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Your specific Auditor address to be accredited immediately
  const AUDITOR_ADDRESS = "0x5De421217349e07cf9623fAc9F44C424a2B7ccD9";

  const IndianCarbonCredit = await hre.ethers.getContractFactory("IndianCarbonCredit");
  
  // Deploy the contract
  const contract = await IndianCarbonCredit.deploy();

  // FIX: Change waitForDeployment() to deployed() for ethers v5
  await contract.deployed();

  const contractAddress = contract.address;
  console.log(`✅ Contract Deployed to: ${contractAddress}`);

  // 1. Accredit the Auditor so you can use the Auditor Dashboard immediately
  console.log(`Accrediting Auditor: ${AUDITOR_ADDRESS}`);
  const tx = await contract.accreditAuditor(AUDITOR_ADDRESS);
  await tx.wait(); // Wait for confirmation on Sepolia
  
  console.log("💎 Auditor Accredited!");
  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("Copy this address to your frontend config file.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});