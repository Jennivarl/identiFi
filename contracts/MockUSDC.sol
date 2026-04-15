// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockUSDC
/// @notice Minimal ERC-20 used as USDC on testnet.
///         Only the designated minter (IdentiFi contract) can mint/burn.
///         This makes borrow/repay transactions visible on the block explorer.
contract MockUSDC {
    string public constant name     = "Mock USD Coin";
    string public constant symbol   = "USDC";
    uint8  public constant decimals = 6;

    uint256 public totalSupply;
    address public minter;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        minter = msg.sender;
    }

    /// @notice Transfer minting rights to the IdentiFi contract after deployment
    function setMinter(address _minter) external {
        require(msg.sender == minter, "Not minter");
        minter = _minter;
    }

    /// @notice Mint tokens — called by IdentiFi on borrow
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Not minter");
        totalSupply    += amount;
        balanceOf[to]  += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burn tokens — called by IdentiFi on repay
    function burn(address from, uint256 amount) external {
        require(msg.sender == minter, "Not minter");
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        totalSupply     -= amount;
        emit Transfer(from, address(0), amount);
    }

    // ─── Standard ERC-20 ──────────────────────────────────────────────────────

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from]             -= amount;
        balanceOf[to]               += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
