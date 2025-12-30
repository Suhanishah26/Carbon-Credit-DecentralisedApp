import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

// PRESERVED: Your exact calibrated CSS
const greenProjectStyles = `
  .green-project {
    padding: 20px 0;
    background-color: #f0f7f4;
    min-height: 100vh;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #065f46 0%, #064e3b 100%);
    color: white;
    padding: 2.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .dashboard-header h2 { margin: 0; font-size: 1.8rem; }
  .dashboard-header p { opacity: 0.8; margin-top: 5px; font-family: monospace; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
  }

  .success-gradient { border-top: 5px solid #10b981; }
  .info { border-top: 5px solid #3b82f6; }
  .warning { border-top: 5px solid #f59e0b; }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #064e3b;
    margin: 10px 0;
  }

  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 30px;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
  }

  .card h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #1f2937;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 10px;
  }

  .vintage-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .audit-card {
    background: #f8fafc;
    border-left: 5px solid #065f46;
  }

  .audit-info p {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    color: #4b5563;
  }

  .btn-market-redirect {
    background: #10b981;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
    transition: background 0.2s;
  }

  .btn-market-redirect:hover { background: #059669; }

  @media (max-width: 768px) {
    .two-col-grid { grid-template-columns: 1fr; }
  }
`;

function GreenProjectDashboard({ contract, account, setView }) {
  const [project, setProject] = useState(null);
  const [balance, setBalance] = useState('0');
  const [vintageBalances, setVintageBalances] = useState({});
  const [buyRequestsCount, setBuyRequestsCount] = useState(0);

  useEffect(() => {
    if (contract) loadProjectData();
  }, [contract, account]);

  const loadProjectData = async () => {
    try {
      const data = await contract.greenProjects(account);
      setProject(data);

      const bal = await contract.balanceOf(account);
      setBalance(ethers.utils.formatUnits(bal, 18));

      // PRESERVED: Your exact logic for vintageBalances
      const vintages = {};
      for (let year = 2022; year <= 2025; year++) {
        const vBal = await contract.vintageBalances(account, year);
        if (!vBal.isZero()) {
          vintages[year] = ethers.utils.formatUnits(vBal, 18);
        }
      }
      setVintageBalances(vintages);

      // Simple count of active orders for the dashboard notification
      const count = await contract.getMarketRequestCount();
      let active = 0;
      for (let i = 0; i < count; i++) {
        const req = await contract.marketRequests(i);
        if (!req.isFullfilled) active++;
      }
      setBuyRequestsCount(active);

    } catch (error) {
      console.error('Data Load Error:', error);
      toast.error('Blockchain Sync Failed');
    }
  };

  const formatDate = (timestamp) => {
    if (timestamp.isZero()) return "No Audit Conducted Yet";
    return new Date(timestamp.toNumber() * 1000).toLocaleDateString('en-IN');
  };

  if (!project || !project.isRegistered) {
    return (
      <div className="dashboard empty-state">
        <style>{greenProjectStyles}</style>
        <div className="container card" style={{marginTop: '50px', textAlign: 'center'}}>
          <h2>🚫 Not Registered</h2>
          <p>This wallet ({account?.slice(0,6)}...) is not a registered Green Project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard green-project">
      <style>{greenProjectStyles}</style>
      <div className="container">
        <div className="dashboard-header">
          <h2>🌳 Green Project Portal</h2>
          <p>Project Owner: {account}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card success-gradient">
            <h3>Total Balance</h3>
            <p className="stat-value">{parseFloat(balance).toFixed(2)} ICC</p>
            <small>Certified Carbon Credits</small>
          </div>
          <div className="stat-card info">
            <h3>Project Area</h3>
            <p className="stat-value">{project.totalArea.toString()} Ha</p>
            <small>GPS: {project.gpsCoordinates}</small>
          </div>
          <div className="stat-card warning">
            <h3>Forest Species</h3>
            <p className="stat-value" style={{fontSize: '1.4rem'}}>{project.speciesType}</p>
            <small>As per National Registry</small>
          </div>
        </div>

        <div className="two-col-grid">
          <div className="card">
            <h3>📅 Vintage Inventory</h3>
            <div className="vintage-list">
              {Object.keys(vintageBalances).length > 0 ? (
                Object.entries(vintageBalances).map(([year, amt]) => (
                  <div key={year} className="vintage-row">
                    <span>Vintage {year}</span>
                    <strong>{parseFloat(amt).toFixed(2)} ICC</strong>
                  </div>
                ))
              ) : (
                <p>No credits issued for recent years.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3>🤝 Marketplace Activity</h3>
            <div style={{textAlign: 'center', padding: '10px'}}>
               <p className="stat-value" style={{fontSize: '2.5rem', color: '#10b981'}}>{buyRequestsCount}</p>
               <p>Active Buy Requests Waiting</p>
               <button 
                 onClick={() => setView('marketplace')}
                 className="btn-market-redirect"
               >
                 Go to Marketplace to Sell →
               </button>
            </div>
          </div>
        </div>

        <div className="card audit-card">
          <h3>📋 Last Verification Status</h3>
          <div className="audit-info">
            <p><strong>Primary Species:</strong> <span>{project.mainSpecies}</span></p>
            <p><strong>Last Audit Date:</strong> <span>{formatDate(project.lastAuditDate)}</span></p>
            <p><strong>Lifetime Credits Issued:</strong> <span>{ethers.utils.formatUnits(project.cumulativeCreditsIssued, 18)} ICC</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GreenProjectDashboard;