// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC - simple mintable ERC20 for testing
contract MockUSDC is ERC20, Ownable {
    // decimals: emulate USDC style but using 18 decimals for convenience
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
        Ownable(msg.sender) // <-- pass deployer as initial owner
    {}

    /// @notice Mint tokens for testing. Owner only.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Faucet-style mint for convenience (optional)
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
