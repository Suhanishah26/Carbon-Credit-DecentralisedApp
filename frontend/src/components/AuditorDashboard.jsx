import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { SECTORS } from '../config/contract';

// ---------------------------------------------------------
// CALIBRATED CSS (Auditor Portal Specific)
// ---------------------------------------------------------
const auditorStyles = `
  .auditor {
    padding: 20px 0;
    background-color: #f0f4f8;
    min-height: 100vh;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .dashboard-header {
    background: #1a202c;
    color: white;
    padding: 2.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .dashboard-header h2 { margin: 0; font-size: 1.8rem; }
  .dashboard-header p { opacity: 0.8; margin-top: 5px; font-family: monospace; word-break: break-all; }

  .tab-navigation {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
    background: #e2e8f0;
    padding: 6px;
    border-radius: 10px;
    width: fit-content;
  }

  .tab-btn {
    padding: 10px 25px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: #4a5568;
  }

  .tab-btn.active {
    background: white;
    color: #2d3748;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .audit-section {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card {
    background: white;
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
  }

  .card h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2d3748;
    border-bottom: 2px solid #edf2f7;
    padding-bottom: 10px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .input {
    width: 100%;
    padding: 12px 15px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
    background: #f8fafc;
  }

  .input:focus {
    outline: none;
    border-color: #3182ce;
    background: white;
  }

  .estimation-box {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
    color: #2f855a;
    padding: 15px;
    border-radius: 8px;
    font-weight: 700;
    text-align: center;
    font-size: 1.1rem;
  }

  .btn-primary {
    background: #2d3748;
    color: white;
    padding: 15px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover { background: #1a202c; }
  .btn-primary:disabled { background: #cbd5e0; cursor: not-allowed; }

  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
  }
`;

function AuditorDashboard({ contract, account }) {
  const [activeTab, setActiveTab] = useState('green'); 
  const [loading, setLoading] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  
  const [greenForm, setGreenForm] = useState({
    projectAddress: '',
    avgDBH: '',
    treeHeight: '',
    sampleCount: '',
    biomassFactor: '',
    vintageYear: new Date().getFullYear()
  });
  
  const [industrialForm, setIndustrialForm] = useState({
    orgAddress: '',
    coalConsumed: '',
    electricityPurchased: '',
    limestoneProcessed: '',
    totalFinishedProduct: '',
    vintageYear: new Date().getFullYear()
  });
  
  const [estimatedCredits, setEstimatedCredits] = useState(null);

  useEffect(() => {
    if (contract) loadAuditorData();
  }, [contract]);

  const loadAuditorData = async () => {
    try {
      const projectOwners = await contract.getAllProjectOwners();
      const orgAddresses = await contract.getAllOrgs(); 
      
      const projectsData = await Promise.all(
        projectOwners.map(async (addr) => {
          const project = await contract.greenProjects(addr);
          return { address: addr, ...project };
        })
      );
      
      const orgsData = await Promise.all(
        orgAddresses.map(async (addr) => {
          const org = await contract.organizations(addr);
          return { address: addr, ...org };
        })
      );
      
      setAllProjects(projectsData);
      setAllOrgs(orgsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateCO2Sequestration = () => {
    const { avgDBH, treeHeight, sampleCount, biomassFactor } = greenForm;
    
    // Ensure we have all numbers
    if (!avgDBH || !treeHeight || !sampleCount || !biomassFactor) {
      setEstimatedCredits(null);
      return;
    }
  
    // 1. Convert inputs to Numbers
    const dbh = Number(avgDBH);
    const h = Number(treeHeight);
    const count = Number(sampleCount);
    const factor = Math.round(parseFloat(biomassFactor) * 100); // 0.60 -> 60
  
    // 2. The Total Product
    // (250 * 1500 * 500 * 60 * 50 * 367) = 20,643,750,000,000
    const rawProduct = dbh * h * count * factor * 50 * 367;

    // 3. The Combined Divisor for Metric Tonnes (10^11)
    // 100,000 (biomass) * 1,000,000 (CO2 conversion)
    const co2 = rawProduct / 1000000000000; 
  
    // Result: 206.4375 -> .toFixed(2) -> "206.44"
    setEstimatedCredits(co2.toFixed(2));
};

  useEffect(() => {
    if (activeTab === 'green') calculateCO2Sequestration();
  }, [greenForm, activeTab]);

  const handleGreenProjectAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tId = toast.loading('Submitting Forestry Audit...');
  
    try {
        // Convert 0.60 to integer 60
        const factorScaled = Math.round(parseFloat(greenForm.biomassFactor) * 100);
  
        const tx = await contract.issueCreditsToProject(
            greenForm.projectAddress,
            Math.floor(greenForm.avgDBH),      // e.g. 250
            Math.floor(greenForm.treeHeight),  // e.g. 1500
            Math.floor(greenForm.sampleCount), // e.g. 500
            factorScaled,                      // e.g. 60
            parseInt(greenForm.vintageYear)
        );
  
        await tx.wait();
        toast.success(`Credits Issued! Blockchain updated.`, { id: tId });
        loadAuditorData();
        setEstimatedCredits(null);
    } catch (error) {
        console.error(error);
        toast.error('Audit failed. Check contract constraints.', { id: tId });
    } finally {
        setLoading(false);
    }
};
  const handleIndustrialAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tId = toast.loading('Calculating Industrial Compliance...');
    try {
      // Ensure all values are sent as clean Integers to prevent BigNumber/Decimal errors
      const tx = await contract.updateOrganizationEmissions(
        industrialForm.orgAddress,
        Math.floor(industrialForm.coalConsumed),
        Math.floor(industrialForm.electricityPurchased),
        Math.floor(industrialForm.limestoneProcessed),
        Math.floor(industrialForm.totalFinishedProduct),
        parseInt(industrialForm.vintageYear)
      );
      await tx.wait();
      toast.success('Emissions verified and logged!', { id: tId });
      loadAuditorData();
    } catch (error) {
      console.error(error);
      toast.error('Verification failed. Check your inputs.', { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="dashboard auditor">
      <style>{auditorStyles}</style>
      <div className="container">
        <div className="dashboard-header">
          <h2>🔍 Auditor Verification Portal</h2>
          <p>Accredited Authority: {account}</p>
        </div>

        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'green' ? 'active' : ''}`} onClick={() => setActiveTab('green')}>🌳 Forestry Audit</button>
          <button className={`tab-btn ${activeTab === 'industrial' ? 'active' : ''}`} onClick={() => setActiveTab('industrial')}>🏭 Industrial Audit</button>
        </div>

        {activeTab === 'green' ? (
          <div className="audit-section">
            <div className="card">
              <h3>Forestry Data Entry</h3>
              <form onSubmit={handleGreenProjectAudit} className="form">
                <select className="input" required onChange={(e) => setGreenForm({...greenForm, projectAddress: e.target.value})}>
                  <option value="">Select Project</option>
                  {allProjects.map((p, i) => (
                    <option key={i} value={p.address}>
                      {p.speciesType || "Unnamed Project"} - {formatAddress(p.address)}
                    </option>
                  ))}
                </select>
                <div className="form-row">
                   <input type="number" placeholder="Avg DBH (mm)" className="input" required onChange={(e) => setGreenForm({...greenForm, avgDBH: e.target.value})} />
                   <input type="number" placeholder="Tree Height (cm)" className="input" required onChange={(e) => setGreenForm({...greenForm, treeHeight: e.target.value})} />
                </div>
                <div className="form-row">
                   <input type="number" placeholder="Sample Count" className="input" required onChange={(e) => setGreenForm({...greenForm, sampleCount: e.target.value})} />
                   <input type="number" step="0.01" placeholder="Biomass Factor (e.g. 0.60)" className="input" required onChange={(e) => setGreenForm({...greenForm, biomassFactor: e.target.value})} />
                </div>
                <div className="form-group">
                    <label style={{fontSize: '0.8rem', color: '#718096'}}>Vintage Year</label>
                    <input type="number" className="input" value={greenForm.vintageYear} onChange={(e) => setGreenForm({...greenForm, vintageYear: e.target.value})} />
                </div>
                {estimatedCredits && <div className="estimation-box">Verification Estimate: {estimatedCredits} ICC</div>}
                <button disabled={loading} className="btn-primary">{loading ? "Processing..." : "Issue Carbon Credits"}</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="audit-section">
            <div className="card">
              <h3>Industrial Data Entry</h3>
              <form onSubmit={handleIndustrialAudit} className="form">
                <select className="input" required onChange={(e) => setIndustrialForm({...industrialForm, orgAddress: e.target.value})}>
                  <option value="">Select Organization</option>
                  {allOrgs.map((o, i) => <option key={i} value={o.address}>{o.name}</option>)}
                </select>
                <div className="form-row">
                  <input type="number" placeholder="Coal Consumed (tonnes)" className="input" required onChange={(e) => setIndustrialForm({...industrialForm, coalConsumed: e.target.value})} />
                  <input type="number" placeholder="Electricity (kWh)" className="input" required onChange={(e) => setIndustrialForm({...industrialForm, electricityPurchased: e.target.value})} />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Limestone (tonnes)" className="input" required onChange={(e) => setIndustrialForm({...industrialForm, limestoneProcessed: e.target.value})} />
                  <input type="number" placeholder="Total Production (tonnes)" className="input" required onChange={(e) => setIndustrialForm({...industrialForm, totalFinishedProduct: e.target.value})} />
                </div>
                <div className="form-group">
                    <label style={{fontSize: '0.8rem', color: '#718096'}}>Audit Vintage Year</label>
                    <input type="number" className="input" value={industrialForm.vintageYear} onChange={(e) => setIndustrialForm({...industrialForm, vintageYear: e.target.value})} />
                </div>
                <button disabled={loading} className="btn-primary">{loading ? "Verifying..." : "Confirm Emissions & GEI"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditorDashboard;