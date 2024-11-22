import { describe, it  } from 'node:test';
import IDL from '../target/idl/lending.json';
import { Lending } from '../target/types/lending';
import { BanksClient, ProgramTestContext, startAnchor } from 'solana-bankrun';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { BankrunProvider } from 'anchor-bankrun';
import { PythSolanaReceiver } from '@pythnetwork/pyth-solana-receiver';
import { BankrunContextWrapper } from '../bankrun-utils/bankrunConnection';
import { BN, Program } from '@coral-xyz/anchor';
import { createMint, mintTo, createAccount } from 'spl-token-bankrun';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
//import 'rpc-websockets/dist/lib/client';
import 'rpc-websockets/dist/lib/client'

describe('Lending Smart Contract Test', async () => {

    let context: ProgramTestContext
    let provider: BankrunProvider
    let bankrunContextWrapper: BankrunContextWrapper
    let banksClient: BanksClient
    let signer: Keypair

    const pyth = new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE");

    //const priceFeed = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

    const devnetConnection =  new Connection("https://api.devnet.solana.com");
    const accountInfo = await devnetConnection.getAccountInfo(pyth);

    context = await startAnchor("",[
        { name: 'lending', programId: new PublicKey(IDL.address)}
    ],
    [
        {address: pyth, info: accountInfo}
    ]
    );

    provider = new BankrunProvider(context);

    //const SOL_PRICE_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
    const SOL_PRICE_FEED_ID = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

    bankrunContextWrapper = new BankrunContextWrapper(context);

    const connection = bankrunContextWrapper.connection.toConnection();

    const pythSolanaReceiver = new PythSolanaReceiver({
        connection,
        wallet: provider.wallet
    });

    const solUsdPriceFeedAccount = pythSolanaReceiver.getPriceFeedAccountAddress(0, SOL_PRICE_FEED_ID);

    const feedAccountInfo = await devnetConnection.getAccountInfo(solUsdPriceFeedAccount);

    context.setAccount(solUsdPriceFeedAccount, feedAccountInfo);

    //program = new Program<Lending>(IDL as Lending, provider);
    let program = new Program<Lending>(IDL as Lending, provider);

    banksClient = context.banksClient;

    signer = provider.wallet.payer;

    const mintUSDC = await createMint(
        banksClient,
        signer,
        signer.publicKey,
        null,
        2
    )

    const mintSol = await createMint(
        banksClient,
        signer,
        signer.publicKey,
        null,
        2
    )

    let [usdcBankAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), mintUSDC.toBuffer()],
        program.programId
    )

    let [solBankAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), mintSol.toBuffer()],
        program.programId
    );


    it("Test Init and Fund USDC Bank", async () => {
        const initUSDCBankTx = await program.methods.initBank(new BN(1), new BN(1)).accounts({
            signer: signer.publicKey,
            mint: mintUSDC,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed"});

        console.log("Create USDC Bank Account:", initUSDCBankTx);

        const amount = 10_000 * 10 ** 9;

        const mintTx = mintTo(
            banksClient,
            signer,
            mintUSDC,
            usdcBankAccount,
            signer,
            amount
        )

        console.log("MINT tx:", mintTx);
    })


    it("Test User Account", async () => {
        const initUserTx = await program.methods.initUser(mintUSDC).accounts({
            signer: signer.publicKey
        }).rpc({ commitment: "confirmed"});

        console.log("Create User Account:", initUserTx);
    })

    it("Test Init and Fund SOL Bank", async () => {
        const initSOLBankTx = await program.methods.initBank(new BN(2), new BN(1)).accounts({
            signer: signer.publicKey,
            mint: mintSol,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed"});

        console.log("Create USDC Bank Account:", initSOLBankTx);

        const amount = 10_000 * 10 ** 9;

        const mintTx = mintTo(
            banksClient,
            signer,
            mintSol,
            solBankAccount,
            signer,
            amount
        )

        console.log("MINT tx:", mintTx);
    })


    it("Create and Fund Token accounts", async () => {
        const USDCTokenAccount = await createAccount(
            banksClient,
            signer,
            mintUSDC,
            signer.publicKey
        );

        console.log("USDC Token Account:", USDCTokenAccount);

        const amount = 10_000 * 10 ** 9;

        const mintUSDCTx = mintTo(
            banksClient,
            signer,
            mintUSDC,
            USDCTokenAccount,
            signer,
            amount
        )

        console.log("MINT tx:", mintUSDCTx);
    })


    it("Test Deposit", async () => {
        const depositTx = await program.methods.deposit(new BN(1000000000)).accounts({
            signer: signer.publicKey,
            mint: mintUSDC,
            tokenProgram: TOKEN_PROGRAM_ID
        }).rpc({ commitment: "confirmed"});

        console.log("Deposit USDC:", depositTx);
    })

    it("Test Borrow", async () => {
        const borrowSol = await program.methods.borrow(new BN(1)).accounts({
            signer: signer.publicKey,
            mint: mintSol,
            tokenProgram: TOKEN_PROGRAM_ID,
            priceUpdate: solUsdPriceFeedAccount,
        }).rpc({ commitment: "confirmed"});

        console.log("SOL Borrowed:", borrowSol);
    })

    it("Test Repay", async () => {
        const repaySol = await program.methods.repay(new BN(1)).accounts({
            signer: signer.publicKey,
            mint: mintSol,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed"});

        console.log("SOL Repay:", repaySol);
    })


    it("Test Withdraw", async () => {
        const withdrawUSDCTx = await program.methods.withdraw(new BN(100)).accounts({
            signer: signer.publicKey,
            mint: mintUSDC,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed"});

        console.log("Withdraw USDC collateral:", withdrawUSDCTx);
    })

} )