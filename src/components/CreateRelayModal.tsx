import React, { useState } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';

interface CreateRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (receiverAddress: string, amount: string, expiresAt?: string) => void;
}

const CreateRelayModal: React.FC<CreateRelayModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { address: currentAddress } = useAccount();
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationError, setExpirationError] = useState('');

  // Check if user is trying to send to their own address
  const isSelfSend = currentAddress && receiverAddress.toLowerCase() === currentAddress.toLowerCase();

  // Get current UTC time for validation
  const getCurrentUTC = () => {
    return new Date().toISOString().slice(0, 16);
  };

  // Validate expiration time against UTC
  const validateExpirationTime = (dateTimeValue: string) => {
    if (!dateTimeValue) {
      setExpirationError('');
      return true;
    }

    // The datetime-local input gives us a local time string like "2025-08-01T12:00"
    // We need to create a Date object that treats this as the user's local time
    const inputDate = new Date(dateTimeValue);
    const nowUTC = new Date();
    
    // Convert input local time to UTC for comparison
    // inputDate is already in user's timezone, so we compare directly with UTC now
    if (inputDate.getTime() <= nowUTC.getTime()) {
      setExpirationError('Expiration time must be in the future (UTC timezone)');
      return false;
    }
    
    setExpirationError('');
    return true;
  };

  // Handle expiration time change with validation
  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpiresAt(value);
    validateExpirationTime(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent self-send
    if (isSelfSend) {
      alert('You cannot create a relay to your own address. Please enter a different receiver address.');
      return;
    }
    
    if (receiverAddress.trim() && amount.trim()) {
    // Validate inputs
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!receiverAddress.trim()) {
      alert('Please enter a valid receiver address');
      return;
    }

    // Validate expiration time if provided
    if (hasExpiration && expiresAt && !validateExpirationTime(expiresAt)) {
      return;
    }


      // Convert expiration time to preserve user's timezone
      let expirationTimestamp = undefined;
      if (hasExpiration && expiresAt) {
        // Store the datetime exactly as entered by user (their local time)
        // Add seconds to make it a complete timestamp
        expirationTimestamp = `${expiresAt}:00`;
      }

      onSubmit(
        receiverAddress.trim(), 
        amount.trim(), 
        expirationTimestamp
      );
      setReceiverAddress('');
      setAmount('');
      setExpiresAt('');
      setHasExpiration(false);
    }
  };

  const handleClose = () => {
    setReceiverAddress('');
    setAmount('');
    setExpiresAt('');
    setHasExpiration(false);
    setExpirationError('');
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                isSelfSend 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-black'
              }`}
              required
            />
            {isSelfSend && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">You cannot send a relay to your own address</span>
              </div>
            )}
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

          {/* Expiration Toggle */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-medium text-gray-700">Set expiration time</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Relay will automatically expire if not completed by this time
            </p>
          </div>

          {/* Expiration Date Input */}
          {hasExpiration && (
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                Expires At (UTC Timezone)
              </label>
              
              {/* UTC Time Info */}
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Timezone Information</span>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• Current UTC time: {new Date().toISOString().slice(0, 19).replace('T', ' ')}</p>
                  <p>• Your local time: {new Date().toLocaleString()}</p>
                  <p>• Input time will be treated as your local time</p>
                  <p>• Example: Enter 12:00 = 12:00 in your timezone</p>
                </div>
              </div>
              
              <input
                type="datetime-local"
                id="expiresAt"
                value={expiresAt}
                onChange={handleExpirationChange}
                min={getCurrentUTC()}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  expirationError 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-black'
                }`}
                required={hasExpiration}
              />
              
              {/* Error Message */}
              {expirationError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-red-700">{expirationError}</p>
                  </div>
                </div>
              )}
              
              {/* Success Message */}
              {!expirationError && expiresAt && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-700 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Valid expiration time set
                  </p>
                </div>
              )}
            </div>
          )}

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
              disabled={isSelfSend || (hasExpiration && !!expirationError)}
              className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 font-medium ${
                isSelfSend || (hasExpiration && !!expirationError)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
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