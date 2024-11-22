use anchor_lang::prelude::*;

#[error_code] 
pub enum ErrorCode {
    #[msg("Insufficient Funds")]
    InsufficientFunds,  

    #[msg("Requested borrow amount exceeds borrowable amount")]
    OverBorrowableAmount, 

    #[msg("Repay amount is exceeding the borrowed value")]
    OverRepay,   

    #[msg("User is not Under Collateralized, Can't be liquidated")]
    NotUnderCollateralized,
}