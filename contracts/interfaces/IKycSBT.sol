// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IKycSBT
/// @notice Interface matching HashKey Chain's live KYC Soulbound Token system
interface IKycSBT {
    enum KycLevel { NONE, BASIC, ADVANCED, PREMIUM, ULTIMATE }
    enum KycStatus { NONE, APPROVED, REVOKED }

    function isHuman(address account) external view returns (bool isValid, uint8 level);

    function getKycInfo(address account) external view returns (
        string memory ensName,
        KycLevel level,
        KycStatus status,
        uint256 createTime
    );
}
