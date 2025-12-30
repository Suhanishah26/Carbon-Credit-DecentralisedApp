````markdown
# 🇮🇳 Indian Carbon Credit Trading Scheme (CCTS) 🌳

A decentralized blockchain application built on **Ethereum (Sepolia Testnet)** to facilitate the Indian Carbon Credit Trading Scheme. This platform allows **Green Projects** to earn ICC tokens and **Organizations** to buy and retire them to meet mandatory compliance targets.

---

## 🛠 Prerequisites

- **Node.js**: v16.x or later
- **MetaMask**: Browser extension installed
- **Alchemy**: Account for Sepolia RPC access

---

## ⚙️ Initial Configuration

### 1. MetaMask Setup (4 Accounts)

To test the full lifecycle, create **4 distinct accounts** in MetaMask:

1. **Account 1: BEE Admin** (Deployer)
2. **Account 2: Accredited Auditor** (Hardcode this in `deploy.js`)
3. **Account 3: Organization** (The Buyer)
4. **Account 4: Green Project Owner** (The Seller)

### 2. Auditor Authorization

Before deploying, you **must** authorize your Auditor:

1. Open `scripts/deploy.js`.
2. Find `const AUDITOR_ADDRESS =`.
3. Replace the address with your **Account 2** address.

---

## 🔑 Environment Variables

Create these `.env` files to connect your backend and frontend.

**Root Directory `.env`**

```env
ALCHEMY_URL=[https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY](https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY)
PRIVATE_KEY=YOUR_ACCOUNT_1_PRIVATE_KEY
```
````

**Frontend Directory `.env**`

```env
REACT_APP_CONTRACT_ADDRESS=PASTE_ADDRESS_HERE
REACT_APP_SEPOLIA_CHAIN_ID=11155111

```

---

## 🚀 Deployment & ABI Setup

### Step 1: Deploy Contract

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia

```

### Step 2: Configure ABI

The frontend needs the contract's "map" to work:

1. Go to `artifacts/contracts/IndianCarbonCredit.sol/IndianCarbonCredit.json`.
2. Copy the **abi** array.
3. Open `frontend/src/contract.js` and paste it:

```javascript
export const abi = [
  /* Paste ABI here */
];
```

### Step 3: Start Web App

```bash
cd frontend
npm install
npm start

```

---

## 🧪 Testing Flow

1. **Auditor (Acc 2):** Submits industry/forestry data.
2. **Organization (Acc 3):** Views shortfall and posts "Buy Request".
3. **Green Project (Acc 4):** Fulfills the order.
4. **Settlement:** Organization retires credits to become compliant.

```


```
