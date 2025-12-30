import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { SECTORS } from '../config/contract';

// ---------------------------------------------------------
// CALIBRATED CSS (BEE Admin Portal Specific)
// ---------------------------------------------------------
const adminStyles = `
  .bee-admin {
    padding: 20px 0;
    background-color: #f4f7f6;
    min-height: 100vh;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 2.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    border-bottom: 4px solid #fbbf24;
  }

  .dashboard-header h2 { margin: 0; font-size: 2rem; letter-spacing: -0.025em; }
  .dashboard-header p { opacity: 0.8; margin-top: 8px; font-weight: 500; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    border: 1px solid #e2e8f0;
  }

  .stat-card.primary-gradient { border-left: 6px solid #fbbf24; }
  .stat-card.info { border-left: 6px solid #3b82f6; }
  .stat-card.success { border-left: 6px solid #10b981; }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #1e293b;
    margin: 5px 0;
  }

  .stat-card h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 24px;
    margin-bottom: 30px;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .card h3 { margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 1.25rem; }

  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 6px; }

  .input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .btn-primary {
    width: 100%;
    padding: 12px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover { background: #334155; }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .data-table th {
    text-align: left;
    padding: 12px;
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    color: #64748b;
    font-size: 0.85rem;
  }

  .data-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

  .status-badge {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status-badge.compliant { background: #dcfce7; color: #166534; }
  .status-badge.non-compliant { background: #fee2e2; color: #991b1b; }
  .status-badge { background: #e2e8f0; color: #475569; }

  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  @media (max-width: 900px) {
    .actions-grid, .two-col-grid { grid-template-columns: 1fr; }
  }
`;

function BEEAdminDashboard({ contract, account }) {
  const [auditorAddress, setAuditorAddress] = useState('');
  const [selectedSector, setSelectedSector] = useState(0);
  const [newTarget, setNewTarget] = useState('');
  const [allProjects, setAllProjects] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSupply: '0',
    totalProjects: 0,
    totalOrgs: 0,
    compliantOrgs: 0
  });

  useEffect(() => {
    if (contract) loadDashboardData();
  }, [contract]);

  const loadDashboardData = async () => {
    try {
      const supply = await contract.totalSupply();
      const orgAddresses = await contract.getAllOrgs();
      const orgsData = await Promise.all(
        orgAddresses.map(async (addr) => {
          const org = await contract.organizations(addr);
          return { address: addr, ...org };
        })
      );

      const projectOwners = await contract.getAllProjectOwners();
      const projectsData = await Promise.all(
        projectOwners.map(async (addr) => {
          const project = await contract.greenProjects(addr);
          return { address: addr, ...project };
        })
      );

      const history = await contract.getAuditHistory();
      const compliantCount = orgsData.filter(org => org.isCompliant).length;

      setStats({
        totalSupply: ethers.utils.formatUnits(supply, 18),
        totalProjects: projectsData.length,
        totalOrgs: orgsData.length,
        compliantOrgs: compliantCount
      });

      setAllOrgs(orgsData);
      setAllProjects(projectsData);
      setAuditLog([...history].reverse());

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to sync with Blockchain Registry');
    }
  };

  const handleAccreditAuditor = async (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(auditorAddress)) return toast.error('Invalid Wallet Address');
    
    setLoading(true);
    const tId = toast.loading('Granting Auditor Accreditation...');
    try {
      const tx = await contract.accreditAuditor(auditorAddress);
      await tx.wait();
      toast.success('Auditor Successfully Accredited!', { id: tId });
      setAuditorAddress('');
      loadDashboardData();
    } catch (error) {
      toast.error('Transaction Failed. Verify Admin Rights.', { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    if (!newTarget || isNaN(newTarget)) return toast.error('Enter a valid numeric target');
    
    setLoading(true);
    const tId = toast.loading('Updating Sector Baseline...');
    try {
      const targetValue = Math.floor(parseFloat(newTarget) * 1000);
      const tx = await contract.setSectorTarget(selectedSector, targetValue);
      await tx.wait();
      toast.success(`${SECTORS[selectedSector]} target updated`, { id: tId });
      setNewTarget('');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update target', { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="dashboard bee-admin">
      <style>{adminStyles}</style>
      <div className="container">
        <div className="dashboard-header">
          <h2>🏛️ BEE Administration Portal</h2>
          <p>National Carbon Registry | Bureau of Energy Efficiency, India</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card primary-gradient">
            <div className="stat-content">
              <h3>Total ICC Issued</h3>
              <p className="stat-value">{parseFloat(stats.totalSupply).toLocaleString()} ICC</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-content">
              <h3>Compliance Rate</h3>
              <p className="stat-value">{stats.totalOrgs > 0 ? Math.round((stats.compliantOrgs/stats.totalOrgs)*100) : 0}%</p>
              <small style={{color: '#64748b'}}>{stats.compliantOrgs} of {stats.totalOrgs} Orgs Compliant</small>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-content">
              <h3>Forestry Projects</h3>
              <p className="stat-value">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="actions-grid">
          <div className="card">
            <h3>🔍 Auditor Management</h3>
            <form onSubmit={handleAccreditAuditor} className="form">
              <div className="form-group">
                <label>Auditor Wallet Address</label>
                <input
                  type="text"
                  value={auditorAddress}
                  onChange={(e) => setAuditorAddress(e.target.value)}
                  placeholder="0x..."
                  className="input"
                />
              </div>
              <button disabled={loading} className="btn-primary">
                {loading ? "Processing..." : "Grant Accreditation"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3>🎯 Sector Target Settings</h3>
            <form onSubmit={handleSetTarget} className="form">
              <div className="form-row" style={{display: 'flex', gap: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Sector</label>
                  <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="input">
                    {Object.entries(SECTORS).map(([val, name]) => (
                      <option key={val} value={val}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>GEI Baseline</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="e.g. 0.65"
                    className="input"
                  />
                </div>
              </div>
              <button disabled={loading} className="btn-primary">
                {loading ? "Updating..." : "Update Baseline"}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{marginBottom: '30px'}}>
          <h3>📋 Recent Audit Activity Log</h3>
          <div className="table-container" style={{maxHeight: '300px', overflowY: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Auditor</th>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log, i) => (
                  <tr key={i}>
                    <td>{new Date(log.timestamp * 1000).toLocaleDateString()}</td>
                    <td>{formatAddress(log.auditor)}</td>
                    <td>{formatAddress(log.target)}</td>
                    <td><span className="status-badge">{log.auditType}</span></td>
                    <td style={{fontWeight: 'bold'}}>
                    {log.auditType === "Industry Audit" 
    ? (log.value / 1000).toFixed(2) + " GEI" 
    : ethers.utils.formatUnits(log.value, 18) + " ICC"
  }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="two-col-grid">
           <div className="card">
              <h3>🏭 Industrial Registry</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Org Name</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {allOrgs.map((org, i) => (
                      <tr key={i}>
                        <td>{org.name}</td>
                        <td>
                          <span className={`status-badge ${org.isCompliant ? 'compliant' : 'non-compliant'}`}>
                            {org.isCompliant ? "COMPLIANT" : "SHORTFALL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="card">
              <h3>🌳 Forestry Registry</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Location</th><th>Inventory</th></tr>
                  </thead>
                  <tbody>
                    {allProjects.map((p, i) => (
                      <tr key={i}>
                        <td>{p.gpsCoordinates}</td>
                        <td style={{color: '#10b981', fontWeight: 'bold'}}>{ethers.utils.formatUnits(p.cumulativeCreditsIssued, 18)} ICC</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default BEEAdminDashboard;