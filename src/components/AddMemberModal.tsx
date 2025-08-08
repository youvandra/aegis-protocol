import React, { useState } from 'react';
import { X, UserPlus, Plus, AlertTriangle } from 'lucide-react';
import { Group } from '../types/stream';
import { useAccount } from 'wagmi';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: {
    topicId: string;
    groupId: string;
    name: string;
    address: string;
    amount: string;
  }) => Promise<void> | void; // Make onSubmit async-compatible
  onCreateGroup: () => void;
  groups: Group[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCreateGroup,
  groups 
}) => {
  const { address: currentAddress } = useAccount();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [name, setName] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const upcomingGroups = groups.filter(group => group.status === 'upcoming');
  const isSelfAdd = currentAddress && memberAddress.toLowerCase() === currentAddress.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSelfAdd) {
      alert('You cannot add your own wallet address as a member. Please enter a different address.');
      return;
    }
    if (!selectedGroupId || !name.trim() || !memberAddress.trim() || !amount.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    const numericAmount = parseFloat(amount.trim());
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      await Promise.resolve(onSubmit({
        topicId: upcomingGroups.find(group => group.id === selectedGroupId)?.topic_id || '',
        groupId: selectedGroupId,
        name: name.trim(),
        address: memberAddress.trim(),
        amount: amount.trim(),
      }));
      setSelectedGroupId('');
      setName('');
      setMemberAddress('');
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedGroupId('');
    setName('');
    setMemberAddress('');
    setAmount('');
    setLoading(false);
    onClose();
  };

  const handleCreateGroupFromDropdown = () => {
    handleClose();
    onCreateGroup();
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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Member
          </h2>
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
            <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Group
            </label>
            {upcomingGroups.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No upcoming groups available</p>
                <p className="text-xs text-gray-400 mb-3">Members can only be added to upcoming groups</p>
                <button
                  type="button"
                  onClick={handleCreateGroupFromDropdown}
                  className="inline-flex items-center space-x-2 text-sm text-black hover:text-gray-700 transition-colors duration-200"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create your first group</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="groupSelect"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  required
                  disabled={loading}
                >
                  <option value="">Choose a group...</option>
                  {upcomingGroups
                    .filter(group => !group.scheduled)
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_name}
                      </option>
                    ))}
                </select>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleCreateGroupFromDropdown}
                    className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-black transition-colors duration-200"
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create new group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-2">
              Member Name
            </label>
            <input
              type="text"
              id="memberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Michael Jordan"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="memberAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              id="memberAddress"
              value={memberAddress}
              onChange={(e) => setMemberAddress(e.target.value)}
              placeholder="0.0.6526667"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-mono text-sm ${
                isSelfAdd 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-black'
              }`}
              required
              disabled={loading}
            />
            {isSelfAdd && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">You cannot add your own address as a member</span>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="memberAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (HBAR)
            </label>
            <input
              type="number"
              id="memberAmount"
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
              disabled={upcomingGroups.length === 0 || isSelfAdd || loading}
              className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 font-medium ${
                upcomingGroups.length === 0 || isSelfAdd || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              } flex items-center justify-center`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : null}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
