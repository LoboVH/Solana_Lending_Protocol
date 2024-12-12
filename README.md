# Lending Protocol Program
## Overview

This project implements a decentralized lending protocol on the Solana blockchain using the Anchor framework. The program allows users to deposit collateral, borrow against their collateral, repay loans, withdraw deposits, and handle liquidations. The lending protocol ensures safety with defined constraints, accurate interest calculations, and adherence to decentralized standards.

---

## Features
- **Collateral Deposit and Withdrawal**: Users can deposit supported tokens as collateral and withdraw them when necessary.
- **Borrowing**: Borrowers can take loans against their deposited collateral up to a defined LTV (Loan-to-Value) ratio.
- **Repayment**: Borrowers can repay loans to restore their collateralized health.
- **Liquidation**: Safeguards allow liquidation of borrowers whose health factor falls below the threshold.
- **Interest Calculation**: Accrued interest is dynamically calculated using real-time clock data.
- **Program Derived Addresses (PDAs)**: Utilized for creating secure treasuries and managing authority over assets.

---
# Instructions

## Admin Instructions (`admin.rs`)

- **`init_bank`**: Initializes a bank for a specific token mint with parameters like liquidation threshold and max LTV.
- **`init_user`**: Creates a user account linked to their wallet for tracking their deposits and borrowings.

## User Instructions

- **Deposit (`deposit.rs`)**:
  - Transfer tokens to the treasury.
  - Update shares and total deposits.
- **Withdraw (`withdraw.rs`)**:
  - Validate available funds and withdraw tokens.
  - Adjust shares and total deposits accordingly.
- **Borrow (`borrow.rs`)**:
  - Validate collateral and calculate the borrowable amount.
  - Issue loan tokens to the user’s token account.
- **Repay (`repay.rs`)**:
  - Accept loan repayment and adjust user’s borrow shares.
  - Update the total borrow amount of the bank.
- **Liquidate (`liquidate.rs`)**:
  - Allow third-party liquidators to restore collateralization for under-collateralized users.
  - Enforce close factors and provide liquidation bonuses.

---
# Technology Stack

- **Anchor Framework**: A Rust-based framework for building Solana programs.
- **Solana Blockchain**: High-performance blockchain for decentralized applications.
- **Pyth Oracle**: Used for real-time price feeds to ensure accurate collateral valuation.

---
# Setup and Deployment

## Prerequisites

1. Install [Anchor CLI](https://www.anchor-lang.com/).
2. Install Rust and set up a [Solana CLI](https://solana.com/docs/intro/installation) .
3. Configure the Solana environment for localnet/devnet/mainnet.

## Building and Testing
1. Clone the repo:
  ```bash
  git clone https://github.com/LoboVH/Solana_Lending_Protocol.git
  ```
2. Build:
 ```bash
   anchor build
```
3. Deploy and Test:

This project includes a comprehensive suite of tests for the lending protocol, set up using the **`solana-bankrun`** framework. The tests validate functionalities such as deposit, borrowing, repayment, and withdrawal, as well as program-specific instructions like initializing banks and accounts.

### Test Highlights:

- **BankrunProvider and BanksClient**: Utilized for managing testing contexts and simulating program interactions.
- **Real-Time Price Feeds**: Integrated with Pyth Oracle to ensure accurate and up-to-date pricing data.
- **Comprehensive Scenarios**:
  - Initializing bank and user accounts.
  - Depositing collateral and borrowing tokens.
  - Repaying loans and withdrawing collateral.
- To deploy and run the tests: 
 ```bash
   anchor test
```
