🇮🇳 Indian Carbon Credit Trading Scheme (CCTS) 🌳
A decentralized blockchain application built on Ethereum (Sepolia Testnet) designed to digitize the Indian Carbon Credit Trading Scheme. This platform allows Green Projects to earn ICC tokens and Organizations to buy and retire them to meet mandatory compliance targets under the oversight of the BEE (Bureau of Energy Efficiency).

🛠 Prerequisites
Node.js (v16.x or later)

MetaMask browser extension

Alchemy account for Sepolia RPC access

⚙️ Initial Configuration

1. MetaMask Setup (Create 4 Accounts)
   To test the full lifecycle of the application, you must create 4 distinct accounts in your MetaMask:

Account 1: BEE Admin (Deployer) - Manages the system.

Account 2: Accredited Auditor - Validates data and issues credits.

Account 3: Organization - The buyer (e.g., Bharat Steel Works).

Account 4: Green Project Owner - The seller (Forestry project).

2. Collect Faucets
   Switch MetaMask to Sepolia Testnet and collect test ETH for Account 1 (to deploy) and Account 2 (to process audits) from faucets.

3. Auditor Address Setup (CRITICAL)
   Before deploying, you must authorize your Auditor account:

Open scripts/deploy.js.

Locate the line: const AUDITOR_ADDRESS =,

Replace the address with the address of your Account 2 from MetaMask.

🔑 Environment Variables
A. Hardhat Root Directory .env
Create a .env file in the root folder:

Code snippet

ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=YOUR_ACCOUNT_1_PRIVATE_KEY
B. Frontend Directory .env
Create a .env file inside the frontend folder:

Code snippet

REACT_APP_CONTRACT_ADDRESS=PASTE_DEPLOYED_ADDRESS_AFTER_STEP_1
REACT_APP_SEPOLIA_CHAIN_ID=11155111
🚀 Deployment & Integration
Step 1: Deploy the Smart Contract
From the root directory:

Bash

npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
Copy the Contract Address printed in the terminal into your frontend .env.

Step 2: Configure the ABI (IMPORTANT)
The frontend needs the contract's "map" (ABI) to function:

Go to artifacts/contracts/IndianCarbonCredit.sol/IndianCarbonCredit.json.

Copy the entire abi array.

Open frontend/src/contract.js and paste it into the abi variable:

JavaScript

export const abi = [ /* Paste your ABI array here */ ];
Step 3: Run the Web App
Bash

cd frontend
npm install
npm start
🧪 Testing the Workflow
Register (Accounts 3 & 4): Register an Organization and a Green Project.

Audit (Account 2): Switch to the Auditor account and submit audits for both.

Marketplace (Account 3): Post a "Buy Request" for the shortfall amount.

Fulfill (Account 4): Use the Green Project account to fulfill the order and receive payment.

Settle (Account 3): Burn the credits to return to a "Compliant" status.
