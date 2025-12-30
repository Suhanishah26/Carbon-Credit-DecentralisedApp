import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { SECTORS } from '../config/contract';

// PRESERVED: Your exact CSS
const orgDashboardStyles = `
  .organization { padding: 20px 0; background-color: #f8fafc; min-height: 100vh; }
  .dashboard-header { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-left: 5px solid #1e3a8a; }
  .status-banner { margin-bottom: 2rem; padding: 2rem; border-radius: 12px; color: white; transition: all 0.3s ease; }
  .status-banner.safe { background: linear-gradient(135deg, #059669 0%, #10b981 100%); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2); }
  .status-banner.danger { background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%); box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.2); animation: pulse-border 2s infinite; }
  @keyframes pulse-border { 0% { outline: 0px solid rgba(239, 68, 68, 0); } 50% { outline: 4px solid rgba(239, 68, 68, 0.3); } 100% { outline: 0px solid rgba(239, 68, 68, 0); } }
  .status-flex { display: flex; justify-content: space-between; align-items: center; }
  .shortfall-badge { background: rgba(0, 0, 0, 0.2); padding: 15px 25px; border-radius: 12px; text-align: center; backdrop-filter: blur(4px); }
  .shortfall-badge p { font-size: 1.5rem; font-weight: 800; margin: 0; }
  .two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .btn { padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; width: 100%; margin-bottom: 10px; }
  .btn-primary { background: #1e3a8a; color: white; }
  .btn-danger { background: #000; color: white; }
  .btn-danger:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
  .inventory-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 15px; }
  .error-text { color: #ef4444; font-size: 0.85rem; font-weight: 600; margin-top: 10px; text-align: center; }
`;

function OrganizationDashboard({ contract, account, setView }) {
  const [org, setOrg] = useState(null);
  const [balance, setBalance] = useState('0');
  const [shortfall, setShortfall] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) loadOrganizationData();
  }, [contract, account]);

  const loadOrganizationData = async () => {
    try {
      const orgData = await contract.organizations(account);
      setOrg(orgData);

      const bal = await contract.balanceOf(account);
      setBalance(ethers.utils.formatUnits(bal, 18));

      const sf = await contract.calculateShortfall(account);
      setShortfall(ethers.utils.formatUnits(sf, 18));
      
      // Note: Vintage balances can be added back if you want to show the specific inventory breakdown
    } catch (error) {
      console.error('Data Load Error:', error);
      toast.error('Failed to sync compliance data');
    }
  };

  const handleSettleCompliance = async () => {
    setLoading(true);
    const tId = toast.loading('Initiating retirement...');
    try {
      const currentYear = new Date().getFullYear();
      const tx = await contract.settleCompliance(currentYear);
      await tx.wait();
      toast.success('Compliance Settled!', { id: tId });
      loadOrganizationData();
    } catch (error) {
      toast.error('Settlement failed', { id: tId });
    } finally {
      setLoading(false);
    }
  };

  if (!org?.isRegistered) {
    return <div className="container card" style={{marginTop: '50px'}}><h2>⚠️ Unregistered Organization</h2></div>;
  }

  return (
    <div className="dashboard organization">
      <style>{orgDashboardStyles}</style>
      <div className="container">
        <div className="dashboard-header">
          <h2>🏢 Compliance & Carbon Management</h2>
          <p>{org.name} | Sector: {SECTORS[org.sector] || 'Industrial'}</p>
        </div>

        <div className={`card status-banner ${org.isCompliant ? 'safe' : 'danger'}`}>
          <div className="status-flex">
            <div>
              <h3>Status: {org.isCompliant ? '✅ COMPLIANT' : '🚨 NON-COMPLIANT'}</h3>
              <p>Target GEI: {(org.targetGEI / 1000).toFixed(3)} | Actual GEI: {(org.actualGEI / 1000).toFixed(3)}</p>
            </div>
            <div className="shortfall-badge">
              <small>Carbon Debt</small>
              <p>{parseFloat(shortfall).toFixed(2)} ICC</p>
            </div>
          </div>
        </div>

        <div className="two-col-grid">
          {/* CARD 1: MARKETPLACE REDIRECT */}
          <div className="card">
            <h3>🛒 Acquire Credits</h3>
            <p style={{marginBottom: '20px', color: '#64748b'}}>You need to purchase carbon credits to offset your shortfall.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setView('marketplace')}
            >
              Go to Marketplace →
            </button>
          </div>

          {/* CARD 2: SETTLEMENT */}
          <div className="card">
            <h3>🔥 Retirement (Burn)</h3>
            <div className="inventory-row">
              <span>Available Balance:</span>
              <strong>{parseFloat(balance).toFixed(2)} ICC</strong>
            </div>
            
            <button 
              onClick={handleSettleCompliance}
              disabled={loading || parseFloat(balance) < parseFloat(shortfall) || org.isCompliant}
              className="btn btn-danger"
            >
              {org.isCompliant ? 'Compliance Fulfilled' : 'Settle & Retire Credits'}
            </button>
            
            {parseFloat(balance) < parseFloat(shortfall) && !org.isCompliant && (
              <p className="error-text">
                Insufficient balance. You need { (parseFloat(shortfall) - parseFloat(balance)).toFixed(2) } more ICC.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDashboard;