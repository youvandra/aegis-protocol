import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RelayItem } from '../types/relay';

interface RelayTableRowProps {
  item: RelayItem;
}

const RelayTableRow: React.FC<RelayTableRowProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '1 out of 3':
        return 'text-red-600 bg-red-50';
      case '2 out of 3':
        return 'text-yellow-600 bg-yellow-50';
      case '3 out of 3':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'receive' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';
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
            {item.number}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
            {item.type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
          {item.amount}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.timeCreated}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-6 py-4">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {item.details?.fromAddress && (
                  <div>
                    <span className="font-medium text-gray-700">From Address:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">{item.details.fromAddress}</p>
                  </div>
                )}
                {item.details?.toAddress && (
                  <div>
                    <span className="font-medium text-gray-700">To Address:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">{item.details.toAddress}</p>
                  </div>
                )}
                {item.details?.transactionHash && (
                  <div>
                    <span className="font-medium text-gray-700">Transaction Hash:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">{item.details.transactionHash}</p>
                  </div>
                )}
                {item.details?.gasUsed && (
                  <div>
                    <span className="font-medium text-gray-700">Gas Used:</span>
                    <p className="text-gray-600">{item.details.gasUsed}</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default RelayTableRow;