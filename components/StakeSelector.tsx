"use client";

import { useState } from "react";

interface StakeSelectorProps {
  onSelect: (amount: number) => void;
  onCancel: () => void;
  userBalance: number;
}

/**
 * Stake amount selector component
 * Allows users to choose how many credits to stake
 */
export default function StakeSelector({ onSelect, onCancel, userBalance }: StakeSelectorProps) {
  const [selected, setSelected] = useState<number>(10);

  const amounts = [10, 20, 50];

  const handleConfirm = () => {
    if (selected > userBalance) {
      alert("Insufficient credits!");
      return;
    }
    onSelect(selected);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-white mb-4">Select Stake Amount</h3>
        
        <p className="text-gray-400 text-sm mb-4">
          Your balance: <span className="text-green-400 font-semibold">{userBalance}</span> credits
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {amounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelected(amount)}
              disabled={amount > userBalance}
              className={`py-4 px-2 rounded-lg font-semibold transition ${
                selected === amount
                  ? "bg-blue-600 text-white ring-2 ring-blue-400"
                  : amount > userBalance
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-lg font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected > userBalance}
            className="flex-1 py-3 px-4 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
