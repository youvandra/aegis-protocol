import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (receiverAddress: string, amount: string) => void;
}

const CreateRelayModal: React.FC<CreateRelayModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiverAddress.trim() && amount.trim()) {
      onSubmit(receiverAddress.trim(), amount.trim());
      setReceiverAddress('');
      setAmount('');
    }
  };

  const handleClose = () => {
    setReceiverAddress('');
    setAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Relay</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receiver Address Input */}
          <div>
            <label htmlFor="receiverAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Receiver Address
            </label>
            <input
              type="text"
              id="receiverAddress"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (HBAR)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRelayModal;