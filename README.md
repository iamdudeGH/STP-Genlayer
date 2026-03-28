# 🖊️ Sell Me This Pen - GenLayer DApp

A decentralized "Shark Tank" style game where an AI consensus mechanism evaluates your sales pitches on the GenLayer blockchain.

## 🚀 Quick Start (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

## 🏗️ GenLayer Smart Contract

The intelligent contract is located at `contracts/SellMeThisPen.py`. 

To deploy it to your own GenLayer environment:
```bash
genlayer deploy --contract contracts/SellMeThisPen.py
```
*Be sure to update the `CONTRACT_ADDRESS` in `src/App.jsx` after deployment.*

## 🚢 Deploying to Vercel

This repository is ready for one-click deployment to Vercel:

1. Push this folder to a new GitHub repository.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Vercel will auto-detect **Vite** as the framework.
5. Click **Deploy**.

## 🛠️ Features
- **AI Consensus**: Uses GenLayer's `nondet` execution to run LLM-based sales evaluation.
- **Equivalence Principle**: Ensures validators agree on scores within a 15-point variance.
- **Neon-Punk UI**: Premium Cyberpunk aesthetic using Vanilla CSS.
- **MetaMask Integration**: Connect and sign transactions via standard Web3 wallets.
