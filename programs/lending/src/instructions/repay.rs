use std::f64::consts::E;

use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked}};

use crate::{error::ErrorCode, state::{Bank, User}};



#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [mint.key().as_ref()],
        bump
    )]
    pub bank: Account<'info, Bank>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump
    )]
    pub bank_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [signer.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, User>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>
}



pub fn process_repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
    let user = &mut ctx.accounts.user_account;

    let borrow_value: u64;

    match ctx.accounts.mint.to_account_info().key() {
        key if key == user.usdc_address => {
            msg!("Its USDC");
            borrow_value = user.borrowed_usdc;
        },
        _=> {
            msg!("Its SOL");
            borrow_value = user.borrowed_sol;
        }
    }

    //let time_diff = user.last_updated_borrow - Clock::get()?.unix_timestamp;
    // let time_diff = (Clock::get()?.unix_timestamp - user.last_updated_borrow).max(1);
    // msg!("Time DIFFF: {}", time_diff);

     let bank = &mut ctx.accounts.bank;

    // msg!("ToTAL BORRoWEd amt: {}", bank.total_borrowed);
    // msg!("Interest RATE: {}", bank.interest_rate);
    // bank.total_borrowed -= (bank.total_borrowed as f64 * E.powf(bank.interest_rate * time_diff as f64))  as u64;

    // msg!("ToTAL BORRoWEd after CALCULATION: {}", bank.total_borrowed);
    // msg!("ToTAL BORRoWEd SHARes: {}", bank.total_borrowed_shares);
    // let value_per_share = bank.total_borrowed as f64 / bank.total_borrowed_shares as f64;
    // msg!("Value Per SHARE: {}", value_per_share);
    // let user_value = borrow_value / value_per_share as u64;

    msg!("Borrow value: {}", borrow_value);
    if amount > borrow_value {
        return Err(ErrorCode::OverRepay.into());
    }

    let transfer_cpi_accounts = TransferChecked {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.bank_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
        mint:ctx.accounts.mint.to_account_info()
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, transfer_cpi_accounts);

    let decimals = ctx.accounts.mint.decimals;

    token_interface::transfer_checked(cpi_ctx, amount, decimals)?;

    let borrowed_ratio = amount.checked_div(bank.total_borrowed).unwrap();
    let user_shares = bank.total_borrowed_shares.checked_mul(borrowed_ratio).unwrap();

    match ctx.accounts.mint.to_account_info().key() {
        key if key == user.usdc_address => {
            user.borrowed_usdc -= amount;
            user.borrowed_usdc_shares -= user_shares;
        },
        _=> {
            user.borrowed_sol -= amount;
            user.borrowed_sol_shares -= user_shares;
        }
    }

    bank.total_borrowed -= amount;
    bank.total_borrowed_shares -= user_shares;

    Ok(())
    }