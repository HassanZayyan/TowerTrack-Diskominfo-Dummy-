import React, { useState } from 'react';
import BanUserConfirmDialog from '../BanUserConfirmDialog';

/**
 * Example component showing how to use BanUserConfirmDialog
 * This can be used as a reference for implementing the dialog in other components
 */
const BanUserDialogExample: React.FC = () => {
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banDialogData, setBanDialogData] = useState<{
    userName: string;
    userEmail: string;
    isBanning: boolean;
    userId: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Example user data
  const exampleUser = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    banned: false
  };

  const handleBanUser = (user: typeof exampleUser) => {
    setBanDialogData({
      userName: user.name,
      userEmail: user.email,
      isBanning: !user.banned, // Toggle ban status
      userId: user.id
    });
    setShowBanDialog(true);
  };

  const handleBanConfirm = () => {
    if (!banDialogData) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(`${banDialogData.isBanning ? 'Banning' : 'Unbanning'} user:`, banDialogData);
      setIsProcessing(false);
      setShowBanDialog(false);
      setBanDialogData(null);
    }, 2000);
  };

  const handleBanCancel = () => {
    setShowBanDialog(false);
    setBanDialogData(null);
    setIsProcessing(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Ban User Dialog Example</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-medium text-gray-900">{exampleUser.name}</h3>
        <p className="text-sm text-gray-600">{exampleUser.email}</p>
        <p className="text-sm text-gray-500">
          Status: {exampleUser.banned ? 'Banned' : 'Active'}
        </p>
      </div>

      <button
        onClick={() => handleBanUser(exampleUser)}
        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
          exampleUser.banned
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {exampleUser.banned ? 'Unban User' : 'Ban User'}
      </button>

      {/* Ban User Confirmation Dialog */}
      {banDialogData && (
        <BanUserConfirmDialog
          show={showBanDialog}
          onClose={handleBanCancel}
          onConfirm={handleBanConfirm}
          userName={banDialogData.userName}
          userEmail={banDialogData.userEmail}
          isBanning={banDialogData.isBanning}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default BanUserDialogExample;
