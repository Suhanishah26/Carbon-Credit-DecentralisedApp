import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Toaster, toast } from 'react-hot-toast';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config/contract';

// Import Dashboards
import BEEAdminDashboard from './components/BEEAdminDashboard';
import AuditorDashboard from './components/AuditorDashboard';
import GreenProjectDashboard from './components/GreenProjectDashboard';
import OrganizationDashboard from './components/OrganizationDashboard';
import Marketplace from './components/Marketplace';
import RoleSelector from './components/RoleSelector';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // FIX: Define the missing function
  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
      }
    } catch (error) {
      console.error("Connection check failed:", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      checkIfWalletIsConnected();

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Use generic toast() instead of .info()
          toast("Wallet Changed: " + accounts[0].substring(0, 6) + "...", {
            icon: '👤',
          });
        } else {
          setAccount(null);
          setUserRole(null);
          toast.error("Wallet Disconnected");
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    // Cleanup listeners when component unmounts
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    if (account && contract) {
      detectUserRole();
    }
  }, [account, contract]);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) throw new Error("Please install MetaMask!");
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setAccount(accounts[0]);
      setContract(contractInstance);
      toast.success('Wallet Connected!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const detectUserRole = async () => {
    try {
      // 1. BEE Admin (Exact match to Solidity: BEE_ADMIN)
      const beeAdmin = await contract.BEE_ADMIN();
      if (account.toLowerCase() === beeAdmin.toLowerCase()) {
        setUserRole('bee');
        return;
      }

      // 2. Auditor (Exact match to Solidity: accreditedAuditors mapping)
      const isAuditor = await contract.accreditedAuditors(account);
      if (isAuditor) {
        setUserRole('auditor');
        return;
      }

      // 3. Green Project (Checks .isRegistered flag in struct)
      const project = await contract.greenProjects(account);
      if (project.isRegistered) {
        setUserRole('green');
        return;
      }

      // 4. Organization (Checks .isRegistered flag in struct)
      const org = await contract.organizations(account);
      if (org.isRegistered) {
        setUserRole('organization');
        return;
      }

      setUserRole('unregistered');
    } catch (error) {
      console.error("Role Detection Failed:", error);
      setUserRole('unregistered');
    }
  };

  const renderContent = () => {
    if (view === 'marketplace') {
      return <Marketplace contract={contract} account={account} userRole={userRole} />;
    }

    switch (userRole) {
      case 'bee': return <BEEAdminDashboard contract={contract} account={account} />;
      case 'auditor': return <AuditorDashboard contract={contract} account={account} />;
      case 'green': 
      return <GreenProjectDashboard contract={contract} account={account} setView={setView} />;
    
    case 'organization': 
      return <OrganizationDashboard contract={contract} account={account} setView={setView} />;
      case 'unregistered': return <RoleSelector contract={contract} account={account} onRegister={detectUserRole} />;
      default: return (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Analyzing Account Status...</p>
        </div>
      );
    }
  };

  return (
    <div className="App">
      <Toaster position="top-right" />
      <nav className="navbar">
        <div className="nav-brand">🇮🇳 Carbon Credit Portal</div>
        {account && (
          <div className="nav-links">
            <button 
              onClick={() => setView('dashboard')} 
              className={view === 'dashboard' ? 'active-link' : ''}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('marketplace')} 
              className={view === 'marketplace' ? 'active-link' : ''}
            >
              Marketplace
            </button>
            <div className="user-info">
              <span className="user-role-badge">{userRole}</span>
              <span className="user-address">{account.substring(0,6)}...{account.substring(38)}</span>
            </div>
          </div>
        )}
      </nav>

      <main className="main-content">
        {!account ? (
          <div className="hero-section">
            <h1>Indian Carbon Credit Trading Scheme (CCTS)</h1>
            <p>Blockchain-based Verification and Trading for a Greener India</p>
            <button onClick={connectWallet} className="connect-btn" disabled={loading}>
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}

export default App;