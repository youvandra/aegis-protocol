import React, { useState } from 'react';
import { X, Users } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: {
    groupName: string;
    releaseType: 'monthly' | 'one-time';
    releaseDate?: string;
  }) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [releaseType, setReleaseType] = useState<'monthly' | 'one-time'>('one-time');
  const [releaseDate, setReleaseDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (groupName.trim()) {
      const submitData = {
        groupName: groupName.trim(),
        releaseType,
        ...(releaseType === 'one-time' && releaseDate ? { releaseDate } : {})
      };
      
      onSubmit(submitData);
      
      // Reset form
      setGroupName('');
      setReleaseType('one-time');
      setReleaseDate('');
    }
  };

  const handleClose = () => {
    setGroupName('');
    setReleaseType('one-time');
    setReleaseDate('');
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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Create Group
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name Input */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Family Trust Fund"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Release Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Release Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="releaseType"
                  value="one-time"
                  checked={releaseType === 'one-time'}
                  onChange={(e) => setReleaseType(e.target.value as 'one-time')}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black focus:ring-2"
                />
                <span className="text-sm text-gray-900">Specific Date Release</span>
              </label>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="releaseDateTime" className="block text-sm font-medium text-gray-700 mb-2">
              Release Date & Time
            </label>
            <input
              type="datetime-local"
              id="releaseDateTime"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
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
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;