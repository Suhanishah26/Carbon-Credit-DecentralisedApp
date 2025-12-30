import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

const marketplaceStyles = `
  .marketplace-container { 
    max-width: 1100px; 
    margin: 2rem auto; 
    padding: 0 20px; 
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1e293b;
  }
  
  .market-header {
    text-align: left;
    margin-bottom: 2.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .market-header h2 { font-size: 2.2rem; margin: 0; color: #0f172a; }
  .subtitle { color: #64748b; font-size: 1.1rem; margin-top: 0.5rem; }

  /* Post Request Section */
  .post-request-card { 
    background: #ffffff; 
    padding: 2rem; 
    border-radius: 20px; 
    border: 1px solid #e2e8f0; 
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    margin-bottom: 3rem;
  }

  .post-request-card h3 { margin-top: 0; color: #1e2937; margin-bottom: 1.5rem; }
  
  .form-group { display: flex; gap: 12px; align-items: center; }
  
  .input-field { 
    flex: 1;
    padding: 14px 18px; 
    border: 2px solid #f1f5f9; 
    border-radius: 12px; 
    font-size: 1rem;
    transition: all 0.2s;
    background: #f8fafc;
  }

  .input-field:focus { border-color: #3b82f6; outline: none; background: #fff; }

  /* Grid and Cards */
  .grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
    gap: 25px; 
  }

  .request-card { 
    background: white; 
    padding: 1.8rem; 
    border-radius: 20px; 
    border: 1px solid #e2e8f0; 
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .request-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); 
  }

  .buyer-label { 
    font-size: 0.75rem; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    color: #94a3b8; 
    font-weight: 700;
  }

  .buyer-address { 
    font-family: monospace; 
    color: #475569; 
    display: block; 
    margin-bottom: 1rem; 
  }

  .amount-box {
    background: #f0fdf4;
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .amount { 
    font-size: 2rem; 
    font-weight: 800; 
    color: #059669; 
    display: block; 
  }

  .token-label { font-size: 0.8rem; color: #10b981; font-weight: 600; }

  /* Buttons */
  .btn-primary { 
    background: #2563eb; 
    color: white; 
    padding: 14px 28px; 
    border: none; 
    border-radius: 12px; 
    cursor: pointer; 
    font-weight: 700;
    transition: background 0.2s;
  }

  .btn-primary:hover { background: #1d4ed8; }

  .btn-sell { 
    width: 100%; 
    background: #0f172a; 
    color: white; 
    padding: 12px; 
    border: none; 
    border-radius: 10px; 
    font-weight: 700; 
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-sell:hover { background: #334155; }
  .btn-sell:disabled { background: #cbd5e1; cursor: not-allowed; }

  @media (max-width: 640px) {
    .form-group { flex-direction: column; align-items: stretch; }
  }
`;

const Marketplace = ({ contract, account, userRole }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tonnesToBuy, setTonnesToBuy] = useState("");

  useEffect(() => {
    if (contract) fetchMarketRequests();
  }, [contract]);

  const fetchMarketRequests = async () => {
    try {
      const count = await contract.getMarketRequestCount();
      const tempRequests = [];
      for (let i = 0; i < count; i++) {
        const req = await contract.marketRequests(i);
        if (!req.isFullfilled) {
          tempRequests.push({ 
            id: i, 
            buyer: req.buyer, 
            amount: req.amountInTonnes.toString() 
          });
        }
      }
      setRequests(tempRequests);
    } catch (error) { console.error("Fetch error:", error); }
  };

  const handlePostRequest = async (e) => {
    e.preventDefault();
    if (!tonnesToBuy || tonnesToBuy <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    const tId = toast.loading("Broadcasting to market...");
    try {
      const tx = await contract.postBuyRequest(tonnesToBuy);
      await tx.wait();
      toast.success("Request Live on Marketplace!", { id: tId });
      setTonnesToBuy("");
      fetchMarketRequests();
    } catch (error) { 
      toast.error("Transaction failed", { id: tId }); 
    } finally { setLoading(false); }
  };

  const handleFulfill = async (requestId) => {
    setLoading(true);
    const tId = toast.loading("Initiating Carbon Credit Transfer...");
    try {
      const tx = await contract.fulfillRequest(requestId);
      await tx.wait();
      toast.success("Credits Sold & Transferred!", { id: tId });
      fetchMarketRequests();
    } catch (error) { 
      toast.error("Transfer failed. Check balance.", { id: tId }); 
    } finally { setLoading(false); }
  };

  return (
    <div className="marketplace-container">
      <style>{marketplaceStyles}</style>
      
      <div className="market-header">
        <h2>📊 ICC Marketplace</h2>
        <p className="subtitle">Official Secondary Trading Floor for Indian Carbon Credits</p>
      </div>

      {userRole === 'organization' && (
        <div className="post-request-card">
          <h3>📢 Create Buy Order</h3>
          <form onSubmit={handlePostRequest} className="form-group">
            <input 
              className="input-field"
              type="number" 
              placeholder="How many tonnes (ICC) do you need?" 
              value={tonnesToBuy} 
              onChange={(e) => setTonnesToBuy(e.target.value)} 
            />
            <button className="btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Post Request"}
            </button>
          </form>
        </div>
      )}

      <div className="requests-list">
        <h3 style={{marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px'}}>
          📂 Active Buy Orders {requests.length > 0 && <span style={{fontSize: '0.9rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '5px'}}>{requests.length}</span>}
        </h3>
        
        {requests.length === 0 ? (
          <div style={{textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '20px', color: '#64748b'}}>
            No active buy requests found.
          </div>
        ) : (
          <div className="grid">
            {requests.map((req) => (
              <div key={req.id} className="request-card">
                <span className="buyer-label">Authorized Buyer</span>
                <span className="buyer-address">{req.buyer.slice(0,12)}...{req.buyer.slice(-8)}</span>
                
                <div className="amount-box">
                  <span className="token-label">DEMANDED AMOUNT</span>
                  <span className="amount">{req.amount} ICC</span>
                  <small style={{color: '#64748b'}}>≈ {req.amount} Metric Tonnes $CO_2$</small>
                </div>

                {userRole === 'green' && (
                  <button 
                    onClick={() => handleFulfill(req.id)} 
                    className="btn-sell" 
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Fulfill Order"}
                  </button>
                )}
                
                {userRole !== 'green' && (
                  <div style={{fontSize: '0.8rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic'}}>
                    Only Green Projects can fulfill
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;