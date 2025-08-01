import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RelayItem } from '../types/relay';

interface RelayTableRowProps {
  item: RelayItem;
  currentWallet: string;
  onRelayAction: (relayId: string, action: 'approve' | 'reject' | 'execute' | 'cancel') => void;
}

const RelayTableRow: React.FC<RelayTableRowProps> = ({ item, currentWallet, onRelayAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if current user is sender or receiver
  const isSender = item.sender_address.toLowerCase() === currentWallet.toLowerCase();
  const isReceiver = item.receiver_address.toLowerCase() === currentWallet.toLowerCase();
  const relayType = isSender ? 'send' : 'receive';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Request Initiated':
        return 'text-blue-600 bg-blue-50';
      case 'Waiting for Receiver\'s Approval':
        return 'text-yellow-600 bg-yellow-50';
      case 'Waiting for Sender to Execute':
        return 'text-orange-600 bg-orange-50';
      case 'Complete':
        return 'text-green-600 bg-green-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (relayType: string) => {
    return relayType === 'receive' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';
  };

  const handleAction = (action: 'approve' | 'reject' | 'execute' | 'cancel') => {
    onRelayAction(item.id, action);
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} HBAR`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatExpirationTime = (expiresAt?: string) => {
    if (!expiresAt) return 'No expiration';
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (expirationDate <= now) {
      return 'Expired';
    }
    
    return expirationDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderActionButton = () => {
    // No actions for expired relays
    if (item.status === 'Expired') {
      return null;
    }
    
    // Receiver gets approve/reject buttons when relay is initiated
    if (isReceiver && item.status === 'Request Initiated') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('approve');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('reject');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Reject
          </button>
        </div>
      );
    }
    
    // Sender gets execute/cancel buttons after receiver approves
    if (isSender && item.status === 'Waiting for Receiver\'s Approval') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('execute');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Execute
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction('cancel');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      );
    }
    
    // Sender can cancel if still in initial state (before receiver action)
    if (isSender && item.status === 'Request Initiated') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction('cancel');
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Cancel
        </button>
      );
    }
    
    // No actions available for completed or rejected relays
    return null;
  };

  return (
    <>
      <tr 
        className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 mr-2 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
            )}
            {item.relay_number}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(relayType)}`}>
            {relayType}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
          {formatAmount(item.amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDateTime(item.created_at)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatExpirationTime(item.expires_at)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {renderActionButton()}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">From Address:</span>
                  <p className="text-gray-600 font-mono text-xs break-all">{item.sender_address}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">To Address:</span>
                  <p className="text-gray-600 font-mono text-xs break-all">{item.receiver_address}</p>
                </div>
                {item.expires_at && (
                  <div>
                    <span className="font-medium text-gray-700">Expires At:</span>
                    <p className="text-gray-600">{formatExpirationTime(item.expires_at)}</p>
                  </div>
                )}
                {item.transaction_hash && (
                  <div>
                    <span className="font-medium text-gray-700">Transaction Hash:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">{item.transaction_hash}</p>
                  </div>
                )}
                {item.gas_used && (
                  <div>
                    <span className="font-medium text-gray-700">Gas Used:</span>
                    <p className="text-gray-600">{item.gas_used}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {formatDateTime(item.created_at)}</span>
                  <span>Updated: {formatDateTime(item.updated_at)}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default RelayTableRow;