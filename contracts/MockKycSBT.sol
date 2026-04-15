// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IKycSBT.sol";

/// @title MockKycSBT
/// @notice Testnet-only mock of HashKey Chain's KYC SBT.
///         On mainnet, point IdentiFi at HashKey's live KYC contract instead.
///         Owner can manually set KYC levels for demo wallets.
contract MockKycSBT {
    address public owner;

    mapping(address => IKycSBT.KycLevel) private _levels;
    mapping(address => IKycSBT.KycStatus) private _statuses;

    event KycLevelSet(address indexed account, IKycSBT.KycLevel level);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set KYC level for a wallet (owner only — testnet demo)
    function setKycLevel(address account, IKycSBT.KycLevel level) external onlyOwner {
        _levels[account] = level;
        _statuses[account] = IKycSBT.KycStatus.APPROVED;
        emit KycLevelSet(account, level);
    }

    /// @notice Matches HashKey's IKycSBT.isHuman interface exactly
    function isHuman(address account) external view returns (bool isValid, uint8 level) {
        IKycSBT.KycLevel kycLevel = _levels[account];
        bool approved = _statuses[account] == IKycSBT.KycStatus.APPROVED;
        return (approved && kycLevel != IKycSBT.KycLevel.NONE, uint8(kycLevel));
    }

    /// @notice Matches HashKey's IKycSBT.getKycInfo interface exactly
    function getKycInfo(address account) external view returns (
        string memory ensName,
        IKycSBT.KycLevel level,
        IKycSBT.KycStatus status,
        uint256 createTime
    ) {
        return ("", _levels[account], _statuses[account], block.timestamp);
    }
}
