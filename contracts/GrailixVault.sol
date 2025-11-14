// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title GrailixVault - minimal vault for deposits/withdrawals + hash events
/// @dev Vault does not keep internal accounting for balances (off-chain ledger used).
contract GrailixVault is Ownable {
    IERC20 public immutable mockUSDC;

    event Deposited(address indexed user, uint256 amount, string internalDepositId, bytes32 txHash);
    event WithdrawRequested(address indexed user, uint256 amount, string internalWithdrawId, bytes32 txHash);
    event PredictionHashStored(uint256 indexed predictionId, bytes32 predictionHash);
    event OutcomeHashStored(uint256 indexed predictionId, bytes32 outcomeHash);

    /// @param _mockUSDC address of MockUSDC token
    constructor(address _mockUSDC)
        Ownable(msg.sender) // <-- pass deployer as initial owner
    {
        require(_mockUSDC != address(0), "zero token");
        mockUSDC = IERC20(_mockUSDC);
    }

    function deposit(uint256 amount, string calldata internalDepositId) external {
        require(amount > 0, "amount=0");

        bool ok = mockUSDC.transferFrom(msg.sender, address(this), amount);
        require(ok, "transfer failed");

        bytes32 txHash = keccak256(
            abi.encodePacked(block.number, msg.sender, amount, internalDepositId, block.timestamp)
        );
        emit Deposited(msg.sender, amount, internalDepositId, txHash);
    }

    function withdraw(address user, uint256 amount, string calldata internalWithdrawId) external onlyOwner {
        require(user != address(0), "zero user");
        require(amount > 0, "amount=0");

        bool ok = mockUSDC.transfer(user, amount);
        require(ok, "transfer failed");

        bytes32 txHash = keccak256(
            abi.encodePacked(block.number, user, amount, internalWithdrawId, block.timestamp)
        );
        emit WithdrawRequested(user, amount, internalWithdrawId, txHash);
    }

    function storePredictionHash(uint256 predictionId, bytes32 predictionHash) external onlyOwner {
        emit PredictionHashStored(predictionId, predictionHash);
    }

    function storeOutcomeHash(uint256 predictionId, bytes32 outcomeHash) external onlyOwner {
        emit OutcomeHashStored(predictionId, outcomeHash);
    }
}
