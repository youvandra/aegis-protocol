import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useWalletTracking } from '../hooks/useWalletTracking';

interface CreateRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (receiverAddress: string, amount: string, expiresAt?: string) => Promise<void> | void;
}

const CreateRelayModal: React.FC<CreateRelayModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { hederaAccountId } = useWalletTracking();
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationError, setExpirationError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSelfSend = hederaAccountId && receiverAddress.toLowerCase() === hederaAccountId.toLowerCase();

  const getCurrentUTC = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const validateExpirationTime = (dateTimeValue: string) => {
    if (!dateTimeValue) {
      setExpirationError('');
      return true;
    }
    const inputDate = new Date(dateTimeValue);
    const nowUTC = new Date();
    if (inputDate.getTime() <= nowUTC.getTime()) {
      setExpirationError('Expiration time must be in the future (UTC timezone)');
      return false;
    }
    setExpirationError('');
    return true;
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpiresAt(value);
    validateExpirationTime(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelfSend) {
      alert('You cannot create a relay to your own address. Please enter a different receiver address.');
      return;
    }
    if (receiverAddress.trim() && amount.trim()) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }
      if (!receiverAddress.trim()) {
        alert('Please enter a valid receiver address');
        return;
      }
      if (hasExpiration && expiresAt && !validateExpirationTime(expiresAt)) {
        return;
      }
      let expirationTimestamp = undefined;
      if (hasExpiration && expiresAt) {
        const localDate = new Date(expiresAt);
        expirationTimestamp = localDate.toISOString();
      }
      setLoading(true);
      try {
        await Promise.resolve(onSubmit(
          receiverAddress.trim(),
          amount.trim(),
          expirationTimestamp
        ));
        setReceiverAddress('');
        setAmount('');
        setExpiresAt('');
        setHasExpiration(false);
      } finally {
        setLoading(false);
      }
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
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Relay</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="receiverAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Receiver Address
            </label>
            <input
              type="text"
              id="receiverAddress"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0.0.6526667"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                isSelfSend 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-black'
              }`}
              required
              disabled={loading}
            />
            {isSelfSend && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">You cannot send a relay to your own address</span>
              </div>
            )}
          </div>
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
              disabled={loading}
            />
          </div>
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">Set expiration time</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Relay will automatically expire if not completed by this time
            </p>
          </div>
          {hasExpiration && (
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                Expires At 
              </label>
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
                disabled={loading}
              />
              {expirationError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-red-700">{expirationError}</p>
                  </div>
                </div>
              )}
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
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSelfSend || (hasExpiration && !!expirationError) || loading}
              className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 font-medium ${
                isSelfSend || (hasExpiration && !!expirationError) || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              } flex items-center justify-center`}
            >
              {loading ? (
                <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : null}
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRelayModal;
