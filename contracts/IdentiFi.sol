// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IKycSBT.sol";

interface IMockUSDC {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

/// @title IdentiFi
/// @notice KYC-tiered undercollateralized lending on HashKey Chain.
///         Borrowers with higher KYC levels unlock lower collateral ratios and
///         lower interest rates. Identity IS the credit score.
///
///         Collateral: HSK (native token, sent as msg.value)
///         Borrow asset: in-contract USDC mock (or USDC on mainnet via ERC-20 integration)
///         Price assumption: 1 HSK = $0.15 USD (or swap for Chainlink feed on mainnet)

contract IdentiFi {
    // ─── Types ────────────────────────────────────────────────────────────────

    struct Loan {
        uint256 collateralHSK;    // HSK deposited (wei)
        uint256 borrowedUSD;      // USD borrowed (6 decimals, like USDC)
        uint256 borrowedAt;       // timestamp
        bool active;
    }

    struct TierConfig {
        uint256 collateralRatioBps; // basis points, e.g. 15000 = 150%
        uint256 interestRateBps;    // annual, e.g. 1200 = 12%
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IKycSBT public kycSBT;
    address public usdc;
    address public owner;

    // HSK price in USD cents (e.g. 15 = $0.15). Owner can update.
    uint256 public hskPriceUSDCents = 15;

    // KYC level 0-4 → lending terms
    TierConfig[5] public tiers;

    // borrower → loan
    mapping(address => Loan) public loans;

    // protocol collateral pool (HSK wei)
    uint256 public totalCollateral;

    // mock USDC liquidity available to lend (6 decimals)
    uint256 public liquidityPool;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 hskAmount);
    event Borrowed(address indexed user, uint256 usdAmount, uint8 kycLevel, uint256 collateralRatioBps);
    event Repaid(address indexed user, uint256 usdAmount, uint256 interest, uint256 collateralReturned);
    event Liquidated(address indexed user, uint256 collateralSeized);
    event LiquidityAdded(uint256 amount);
    event PriceUpdated(uint256 newCents);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyHasLoan();
    error NoActiveLoan();
    error InsufficientCollateral(uint256 required, uint256 provided);
    error InsufficientLiquidity(uint256 requested, uint256 available);
    error NotLiquidatable();
    error ZeroAmount();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _kycSBT, address _usdc) {
        kycSBT = IKycSBT(_kycSBT);
        usdc   = _usdc;
        owner  = msg.sender;

        // KYC NONE    → 150% collateral, 12% APY
        tiers[0] = TierConfig({ collateralRatioBps: 15000, interestRateBps: 1200 });
        // KYC BASIC   → 130% collateral, 10% APY
        tiers[1] = TierConfig({ collateralRatioBps: 13000, interestRateBps: 1000 });
        // KYC ADVANCED → 120% collateral, 8% APY
        tiers[2] = TierConfig({ collateralRatioBps: 12000, interestRateBps:  800 });
        // KYC PREMIUM → 110% collateral, 6% APY
        tiers[3] = TierConfig({ collateralRatioBps: 11000, interestRateBps:  600 });
        // KYC ULTIMATE → 105% collateral, 4% APY
        tiers[4] = TierConfig({ collateralRatioBps: 10500, interestRateBps:  400 });
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Owner admin ──────────────────────────────────────────────────────────

    /// @notice Add mock USDC liquidity for lending (owner only, testnet)
    function addLiquidity(uint256 usdAmount) external onlyOwner {
        liquidityPool += usdAmount;
        emit LiquidityAdded(usdAmount);
    }

    /// @notice Update HSK price (owner only; on mainnet replace with Chainlink)
    function updateHSKPrice(uint256 newCents) external onlyOwner {
        require(newCents > 0, "Zero price");
        hskPriceUSDCents = newCents;
        emit PriceUpdated(newCents);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// @notice Get the KYC level (0-4) for a wallet
    function getKycLevel(address user) public view returns (uint8) {
        kycSBT.isHuman(user); // validate call succeeds
        // If not approved isHuman returns false, level is still stored
        // Use getKycInfo for approved status check
        (, IKycSBT.KycLevel kycLevel, IKycSBT.KycStatus status,) = kycSBT.getKycInfo(user);
        if (status != IKycSBT.KycStatus.APPROVED) return 0;
        return uint8(kycLevel);
    }

    /// @notice Convert HSK wei to USD (6 decimals)
    function hskToUSD(uint256 hskWei) public view returns (uint256) {
        // hskWei / 1e18 * (hskPriceUSDCents / 100) * 1e6 (USDC decimals)
        return (hskWei * hskPriceUSDCents * 1e6) / (100 * 1e18);
    }

    /// @notice Maximum borrowable USD given HSK collateral and KYC level
    function maxBorrow(address user, uint256 hskWei) public view returns (uint256 usdAmount) {
        uint8 level = getKycLevel(user);
        uint256 collateralUSD = hskToUSD(hskWei);
        // maxBorrow = collateralUSD * 10000 / collateralRatioBps
        return (collateralUSD * 10000) / tiers[level].collateralRatioBps;
    }

    /// @notice Required HSK collateral to borrow a given USD amount at current KYC level
    function requiredCollateral(address user, uint256 usdAmount) public view returns (uint256 hskWei) {
        uint8 level = getKycLevel(user);
        // collateralUSD = usdAmount * collateralRatioBps / 10000
        uint256 collateralUSD = (usdAmount * tiers[level].collateralRatioBps) / 10000;
        // hskWei = collateralUSD * 100 * 1e18 / (hskPriceUSDCents * 1e6)
        return (collateralUSD * 100 * 1e18) / (hskPriceUSDCents * 1e6);
    }

    /// @notice Accrued interest on an active loan (USD, 6 decimals)
    function accruedInterest(address user) public view returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.active) return 0;
        uint8 level = getKycLevel(user);
        uint256 elapsed = block.timestamp - loan.borrowedAt;
        // interest = principal * rate * elapsed / (365 days * 10000)
        return (loan.borrowedUSD * tiers[level].interestRateBps * elapsed) / (365 days * 10000);
    }

    /// @notice Current health factor in bps (10000 = 100%, below 10000 = liquidatable)
    function healthFactor(address user) public view returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.active) return type(uint256).max;
        uint8 level = getKycLevel(user);
        uint256 collateralUSD = hskToUSD(loan.collateralHSK);
        uint256 debt = loan.borrowedUSD + accruedInterest(user);
        if (debt == 0) return type(uint256).max;
        // healthFactor = collateralUSD * 10000 / (debt * collateralRatioBps / 10000)
        uint256 threshold = (debt * tiers[level].collateralRatioBps) / 10000;
        return (collateralUSD * 10000) / threshold;
    }

    // ─── Core actions ─────────────────────────────────────────────────────────

    /// @notice Deposit HSK collateral and borrow USD in one transaction
    /// @param usdAmount Amount to borrow (6 decimals, e.g. 100e6 = $100)
    function depositAndBorrow(uint256 usdAmount) external payable {
        if (loans[msg.sender].active) revert AlreadyHasLoan();
        if (usdAmount == 0) revert ZeroAmount();
        if (msg.value == 0) revert ZeroAmount();
        if (usdAmount > liquidityPool) revert InsufficientLiquidity(usdAmount, liquidityPool);

        uint256 needed = requiredCollateral(msg.sender, usdAmount);
        if (msg.value < needed) revert InsufficientCollateral(needed, msg.value);

        uint8 level = getKycLevel(msg.sender);

        loans[msg.sender] = Loan({
            collateralHSK: msg.value,
            borrowedUSD: usdAmount,
            borrowedAt: block.timestamp,
            active: true
        });

        totalCollateral += msg.value;
        liquidityPool -= usdAmount;

        // Mint mock USDC to borrower — visible as a token transfer on the block explorer
        IMockUSDC(usdc).mint(msg.sender, usdAmount);

        emit Borrowed(msg.sender, usdAmount, level, tiers[level].collateralRatioBps);
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Repay loan + interest, receive HSK collateral back
    /// @dev On mainnet this would pull USDC from msg.sender via ERC-20 transferFrom
    ///      On testnet we just track it numerically (no real USDC movement)
    function repay() external {
        Loan storage loan = loans[msg.sender];
        if (!loan.active) revert NoActiveLoan();

        uint256 interest = accruedInterest(msg.sender);
        uint256 collateralToReturn = loan.collateralHSK;
        uint256 principal = loan.borrowedUSD;

        liquidityPool += principal;
        totalCollateral -= loan.collateralHSK;

        delete loans[msg.sender];

        // Burn mock USDC from repayer — visible as a token burn on the block explorer
        IMockUSDC(usdc).burn(msg.sender, principal);

        // Return HSK collateral
        (bool ok,) = msg.sender.call{ value: collateralToReturn }("");
        require(ok, "HSK transfer failed");

        emit Repaid(msg.sender, principal, interest, collateralToReturn);
    }

    /// @notice Liquidate an undercollateralized position
    function liquidate(address borrower) external {
        if (healthFactor(borrower) >= 10000) revert NotLiquidatable();

        Loan storage loan = loans[borrower];
        uint256 seized = loan.collateralHSK;

        totalCollateral -= loan.collateralHSK;
        delete loans[borrower];

        // Liquidator receives the collateral
        (bool ok,) = msg.sender.call{ value: seized }("");
        require(ok, "HSK transfer failed");

        emit Liquidated(borrower, seized);
    }

    receive() external payable {}
}
