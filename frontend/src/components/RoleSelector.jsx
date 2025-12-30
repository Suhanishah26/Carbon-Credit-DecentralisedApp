import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { SECTORS } from '../config/contract';

// ---------------------------------------------------------
// CALIBRATED CSS (Injected directly into the document head)
// ---------------------------------------------------------
const roleSelectorStyles = `
  .role-selector-container {
    max-width: 900px;
    margin: 40px auto;
    padding: 20px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 30px;
  }

  .role-card {
    background: white;
    padding: 40px 30px;
    border-radius: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid #edf2f7;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .role-card:hover {
    transform: translateY(-8px);
    border-color: #48bb78;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .role-card.green:hover { border-color: #48bb78; }
  .role-card.org:hover { border-color: #4299e1; }

  .role-card .icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .role-card h3 {
    font-size: 1.5rem;
    color: #2d3748;
    margin-bottom: 12px;
  }

  .role-card p {
    color: #718096;
    line-height: 1.6;
  }

  .form-card {
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    max-width: 500px;
    margin: 0 auto;
  }

  .back-btn {
    background: none;
    border: none;
    color: #718096;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
  }

  .back-btn:hover { color: #2d3748; }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
  }

  .input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .input:focus {
    outline: none;
    border-color: #48bb78;
    box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
  }

  .btn-primary {
    width: 100%;
    padding: 14px;
    background: #48bb78;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 10px;
  }

  .btn-primary:hover:not(:disabled) { background: #38a169; }
  .btn-primary:disabled { background: #cbd5e0; cursor: not-allowed; }

  .animate-in {
    animation: slideUp 0.4s ease-out;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function RoleSelector({ contract, account, onRegister }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [greenForm, setGreenForm] = useState({ gps: '', species: '', area: '' });
  const [orgForm, setOrgForm] = useState({ name: '', sector: 0, production: '' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isGreen = (await contract.greenProjects(account)).isRegistered;
        const isOrg = (await contract.organizations(account)).isRegistered;
        if (isGreen || isOrg) onRegister(); 
      } catch (e) { console.error("Initial check failed", e); }
    };
    if (contract && account) checkStatus();
  }, [contract, account, onRegister]);

  const finalizeRegistration = async (toastId) => {
    toast.loading('Synchronizing with Indian Carbon Registry...', { id: toastId });
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    toast.success('Onboarding Complete!', { id: toastId });
    onRegister();
  };

  const handleGreenRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tId = toast.loading('Initiating registration on Sepolia...');
    try {
      const areaBN = ethers.BigNumber.from(greenForm.area);
      const tx = await contract.registerGreenProject(greenForm.gps, greenForm.species, areaBN);
      toast.loading('Confirming block...', { id: tId });
      await Promise.race([
        tx.wait(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000))
      ]);
      await finalizeRegistration(tId);
    } catch (error) {
      console.error(error);
      const msg = error.message === "Timeout" ? "Network is slow. Refresh page to see dashboard." : (error.reason || "Registration Failed");
      toast.error(msg, { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    const tId = toast.loading('Sending Industrial Credentials...');
    try {
      const prodBN = ethers.BigNumber.from(orgForm.production);
      const tx = await contract.registerOrganization(orgForm.name, orgForm.sector, prodBN);
      toast.loading('Finalizing registry update...', { id: tId });
      await Promise.race([
        tx.wait(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 60000))
      ]);
      await finalizeRegistration(tId);
    } catch (error) {
      console.error(error);
      const msg = error.message === "Timeout" ? "Blockchain is slow. Please refresh browser." : "Registration failed: Name or Address in use";
      toast.error(msg, { id: tId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{roleSelectorStyles}</style>
      <div className="role-selector-container">
        {!selectedRole ? (
          <div className="role-grid">
            <div className="role-card green" onClick={() => setSelectedRole('green')}>
              <div className="icon">🌱</div>
              <h3>Project Developer</h3>
              <p>I own land/forests and want to issue carbon credits (ICC).</p>
            </div>
            <div className="role-card org" onClick={() => setSelectedRole('organization')}>
              <div className="icon">🏭</div>
              <h3>Industrial Buyer</h3>
              <p>I represent a company that needs to offset emissions.</p>
            </div>
          </div>
        ) : (
          <div className="form-card animate-in">
             <button className="back-btn" onClick={() => setSelectedRole('')}>← Change Role</button>
             
             {selectedRole === 'green' ? (
               <form onSubmit={handleGreenRegistration}>
                  <h2>Register Carbon Assets</h2>
                  <div className="form-group">
                      <label>GPS Coordinates</label>
                      <input className="input" placeholder="e.g. 19.07, 72.87" onChange={e => setGreenForm({...greenForm, gps: e.target.value})} required />
                  </div>
                  <div className="form-group">
                      <label>Main Tree Species</label>
                      <input className="input" placeholder="e.g. Mangroves, Bamboo" onChange={e => setGreenForm({...greenForm, species: e.target.value})} required />
                  </div>
                  <div className="form-group">
                      <label>Area in Hectares</label>
                      <input className="input" type="number" placeholder="150" onChange={e => setGreenForm({...greenForm, area: e.target.value})} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Processing Transaction...' : 'Submit to Registry'}
                  </button>
               </form>
             ) : (
               <form onSubmit={handleOrgRegistration}>
                  <h2>Industrial Onboarding</h2>
                  <div className="form-group">
                      <label>Company Legal Name</label>
                      <input className="input" placeholder="Steel Corp Ltd" onChange={e => setOrgForm({...orgForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                      <label>Industrial Sector</label>
                      <select className="input" onChange={e => setOrgForm({...orgForm, sector: e.target.value})}>
                         {Object.entries(SECTORS).map(([id, name]) => (
                           <option key={id} value={id}>{name}</option>
                         ))}
                      </select>
                  </div>
                  <div className="form-group">
                      <label>Annual Production (Tonnes)</label>
                      <input className="input" type="number" placeholder="25000" onChange={e => setOrgForm({...orgForm, production: e.target.value})} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Confirming...' : 'Register Organization'}
                  </button>
               </form>
             )}
          </div>
        )}
      </div>
    </>
  );
}

export default RoleSelector;