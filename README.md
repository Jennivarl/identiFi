# IdentiFi

**Your identity is your credit score.**

IdentiFi is a DeFi lending protocol built on HashKey Chain. It reads your on-chain KYC verification level and gives you better loan terms the more verified you are — lower collateral required, lower interest rate.

Live demo: **https://identifi-beta.vercel.app**

---

## What Problem Does It Solve?

In traditional DeFi lending, every borrower is treated the same. You need to put up a lot of collateral (usually 150% or more) because the protocol has no idea who you are or how trustworthy you are. It's overcollateralized by default because trust is zero.

HashKey Chain is different. It has a native on-chain KYC (Know Your Customer) system. When users verify their identity on HashKey Exchange, they receive a **Soul-Bound Token (SBT)** — a non-transferable NFT that is permanently attached to their wallet and records their KYC level. You cannot buy it, sell it, or transfer it. It is proof of who you are.

IdentiFi reads this SBT and uses it to give each borrower personalized loan terms. The more verified you are, the less collateral you need and the less interest you pay.

---

## Hackathon Track

**HashKey Chain On-Chain Horizon — ZKID Track**

This track rewards projects that use HashKey Chain's on-chain identity infrastructure in a meaningful way. IdentiFi demonstrates a direct, practical use case: **KYC SBTs as a DeFi primitive**. Instead of identity being a compliance checkbox, it becomes something economically valuable — it saves you money every time you borrow.

---

## How It Works (Step by Step)

### 1. You get verified on HashKey Exchange
Users complete KYC verification on HashKey Exchange. Depending on how much they verify (email only, government ID, proof of address, institutional standing), they receive a KYC level from 1 to 4. This level is written on-chain as a Soul-Bound Token on HashKey Chain.

### 2. You connect your wallet to IdentiFi
IdentiFi reads your wallet address and calls the `MockKycSBT` contract (which mirrors the real KYC SBT system) to check your KYC level. This happens automatically when you sign in.

### 3. IdentiFi assigns you a borrowing tier
Based on your KYC level, you are placed into one of 5 tiers:

| KYC Level | Collateral Required | Interest Rate (APR) | What it means in real life |
|-----------|--------------------|--------------------|---------------------------|
| NONE      | 150%               | 12%                | Anonymous wallet, no verification |
| BASIC     | 130%               | 10%                | Email + phone verified |
| ADVANCED  | 120%               | 8%                 | Government ID submitted and approved |
| PREMIUM   | 110%               | 6%                 | Address proof + enhanced due diligence |
| ULTIMATE  | 105%               | 4%                 | Full institutional-grade KYC |

### 4. You deposit HSK collateral and borrow USDC
Once you know your tier, you choose how much USDC to borrow. The protocol calculates the exact amount of HSK you need to send as collateral based on your tier. You send the HSK as transaction value, and USDC is transferred to your wallet instantly.

### 5. You repay to get your collateral back
You repay the borrowed USDC amount. The protocol returns your HSK collateral.

---

## Architecture

```
User Wallet
    │
    ├──► MockKycSBT contract  ──► reads KYC level (0–4)
    │
    └──► IdentiFi contract    ──► depositAndBorrow(), repay()
              │
              └──► MockUSDC contract  ──► transfers USDC to user
```

### Smart Contracts (HashKey Testnet)

| Contract     | Address                                      | What it does |
|--------------|----------------------------------------------|--------------|
| IdentiFi     | `0x82c3eB94d1666cE1Cb42b2DC4756ed409E894ca7` | Main lending protocol — handles deposits, borrows, repayments |
| MockKycSBT   | `0x5B163B75511C2A7967a6b1985A3420deD0ACca9D` | Simulates HashKey's KYC SBT system — stores KYC level per wallet |
| MockUSDC     | `0x85F2a83e6849Bf963d5E8324122093f00c0e4b83` | Test USDC token used as the borrowable asset |

### Frontend

- **Next.js 15** with TypeScript
- **Tailwind CSS v4** for styling
- **wagmi v3 + viem v2** for blockchain reads/writes
- **Privy** for wallet connection (supports email, Google, MetaMask, WalletConnect)
- **HashKey Testnet** (Chain ID: 133, RPC: `https://testnet.hsk.xyz`)

---

## Demo Wallets

Two wallets have been pre-loaded with elevated KYC levels on the testnet for demonstration purposes. In production, these levels would be set by the real HashKey Exchange KYC process.

| Wallet | Address | Private Key | KYC Level |
|--------|---------|-------------|-----------|
| ADVANCED demo | `0xB0dE846CaaEb0e66A4303D1E1015619AfdDC09aB` | `0x12d8b1cff643769f4754cf753026f3e1bdecc81775d77c703c089ae3094495a2` | Level 2 — 120% collateral, 8% APR |
| ULTIMATE demo | `0x0D412380a6cd1938602Fd163FE90F2527001e87b` | `0x1adee8ab189b63cf5b56cb1135e4c93930d2f7039a5f9439abd53e66742b46d3` | Level 4 — 105% collateral, 4% APR |

> **Note:** These are testnet-only wallets with no real value. They exist purely to show the difference in borrowing terms between KYC levels during the demo.

To import one into MetaMask: Settings → Import Account → paste the private key.

---

## Running Locally

### Prerequisites
- Node.js 18+
- A wallet with some HashKey Testnet HSK (get from the faucet at https://testnet.hsk.xyz)

### Steps

```bash
# Clone the repo
git clone https://github.com/Jennivarl/identiFi
cd identiFi

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your own Privy App ID and contract addresses (already set in .env.example for testnet)

# Run the dev server
npm run dev
```

Open http://localhost:3000

### Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_IDENTIFI_ADDRESS=0x82c3eB94d1666cE1Cb42b2DC4756ed409E894ca7
NEXT_PUBLIC_KYC_SBT_ADDRESS=0x5B163B75511C2A7967a6b1985A3420deD0ACca9D
NEXT_PUBLIC_USDC_ADDRESS=0x85F2a83e6849Bf963d5E8324122093f00c0e4b83
```

---

## Smart Contract Details

### IdentiFi.sol — Main Contract

The core lending logic. Key functions:

- **`depositAndBorrow(uint256 usdcAmount)`** — Send HSK as `msg.value`, receive USDC. The required HSK is calculated based on your KYC tier's collateral percentage.
- **`repay()`** — Repay the USDC loan and receive your HSK collateral back.
- **`getKycLevel(address wallet)`** — Read the KYC level for any wallet from the SBT contract.
- **`requiredCollateral(address borrower, uint256 usdcAmount)`** — View function that tells you how much HSK you need to send before you commit.

### MockKycSBT.sol — KYC Oracle

Simulates HashKey's real KYC SBT contract. In production, this would be HashKey's actual SBT contract which is written to by their KYC verification system.

- **`setKycLevel(address wallet, uint8 level)`** — Owner-only. Sets the KYC level for a wallet (0–4).
- **`getKycLevel(address wallet)`** — Returns the KYC level for a wallet.

### How Collateral is Calculated

```solidity
// If you want to borrow 100 USDC and you are ADVANCED tier (120% collateral):
// HSK price is read from the protocol (set at deploy time, e.g. $100/HSK for testnet)
// Required HSK = (100 USDC × 120%) / HSK price
// = $120 worth of HSK
// = 1.2 HSK if HSK = $100
```

---

## Project Structure

```
identiFi/
├── contracts/                  # Solidity smart contracts
│   ├── IdentiFi.sol           # Main lending protocol
│   ├── MockKycSBT.sol         # KYC Soul-Bound Token simulator
│   └── MockUSDC.sol           # Test USDC token
├── scripts/
│   └── deploy.js              # Hardhat deployment script
├── hardhat.config.js          # Hardhat config for HashKey Testnet
└── frontend/                  # Next.js frontend
    ├── app/
    │   ├── layout.tsx         # Root layout with fonts and providers
    │   ├── page.tsx           # Entry point
    │   └── providers.tsx      # Privy + wagmi providers
    ├── components/
    │   ├── ConnectScreen.tsx  # Landing page shown before sign-in
    │   ├── Dashboard.tsx      # Main app after sign-in (tabs: Overview, Borrow, Loans, KYC)
    │   ├── BorrowModal.tsx    # Modal to enter borrow amount and confirm transaction
    │   └── MyLoans.tsx        # Active loan management and repayment
    └── lib/
        ├── contracts.ts       # Contract addresses, ABIs, tier config
        └── wagmi.ts           # wagmi chain config for HashKey Testnet
```

---

## Why HashKey Chain?

HashKey Chain is uniquely positioned for identity-powered DeFi because it has **native on-chain KYC** — something no other major EVM chain has. The KYC SBT is:

- **Non-transferable** — you cannot sell or lend your KYC level to someone else
- **Immutable** — it cannot be altered by the user, only by HashKey's official KYC process
- **Composable** — any smart contract on HashKey Chain can read it with a single function call
- **Trustworthy** — backed by a regulated exchange with real identity verification

IdentiFi is a direct demonstration of what becomes possible when identity is a first-class primitive on a blockchain. Lower collateral and interest rates are just the beginning — the same mechanism could power undercollateralized loans, KYC-gated liquidity pools, or credit scoring systems.

---

## What's Next (Post-Hackathon)

- **Real KYC SBT integration** — swap MockKycSBT for HashKey's actual SBT contract
- **Undercollateralized loans** — for PREMIUM/ULTIMATE users, allow borrowing up to their verified credit limit with less than 100% collateral
- **Multi-asset lending** — support multiple collateral types beyond HSK
- **Interest accrual** — implement time-based interest accumulation on-chain
- **Liquidation engine** — automated liquidation when collateral value drops below threshold

---

## Team

Built solo for the HashKey Chain On-Chain Horizon Hackathon — April 2026.
