import React, { useState, useEffect } from 'react';
import { createClient } from 'genlayer-js';
import './index.css';

// Replace with dynamic deployed address in a real scenario
const CONTRACT_ADDRESS = "0xDaa8A1a551F39FaD490D8495e1BdE6436358A318";

function App() {
  const [client, setClient] = useState(null);
  const [account, setAccount] = useState("");
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const connectWallet = async () => {
    if (client) return;
    try {
      setStatusMsg("Connecting to MetaMask...");

      // Explicitly request MetaMask extension connection
      let accounts = [];
      if (typeof window.ethereum !== 'undefined') {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Try to automatically switch MetaMask to the GenLayer Studio Network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xf22f' }], // 61999 in hex
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xf22f',
                  chainName: 'Genlayer Studio Network',
                  rpcUrls: ['https://studio.genlayer.com/api'],
                  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 }
                }
              ],
            });
          }
        }
      } else {
        throw new Error("MetaMask is not installed!");
      }

      const glClient = createClient({
        endpoint: 'https://studio.genlayer.com/api', // Studio API
        account: accounts[0]
      });

      setClient(glClient);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        loadMyResult(glClient, accounts[0]);
      }
      setStatusMsg("");
      loadLeaderboard(glClient);
    } catch (err) {
      console.error("MetaMask Connect Error:", err);
      setStatusMsg("MetaMask connection failed: " + err.message);
    }
  };

  useEffect(() => {
    // Only pre-initialize if needed, but DO NOT auto-connect out of the box
    // Web3 extensions require a direct user click to open
  }, []);

  const loadLeaderboard = async (glClient = client) => {
    if (!glClient) return;
    try {
      const data = await glClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_leaderboard',
        args: []
      });
      setLeaderboard(data);
    } catch (e) {
      console.error("Error reading leaderboard:", e);
    }
  };

  const loadMyResult = async (glClient = client, acc = account) => {
    if (!glClient || !acc) return;
    const normalizedAcc = acc.toLowerCase();
    console.log("Loading result for:", normalizedAcc);
    try {
      const data = await glClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_my_result',
        args: [normalizedAcc]
      });
      console.log("Analysis data received:", data);
      if (data && (typeof data.score !== 'undefined' || data.analysis)) {
        setMyResult(data);
      }
    } catch (e) {
      console.error("Error reading my result:", e);
    }
  };

  const handlePitch = async (e) => {
    e.preventDefault();
    if (!client || !pitch.trim()) return;
    setLoading(true);
    setStatusMsg("Validating your pitch through AI consensus...");
    try {
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'submit_pitch',
        args: [pitch],
        value: 0
      });
      setStatusMsg(`Transaction submitted: ${tx}. Waiting for consensus...`);
      await client.waitForTransactionReceipt({ hash: tx });
      setStatusMsg("Pitch processed successfully! Finalizing state...");

      // Wait a tiny bit for indexing
      setTimeout(async () => {
        setPitch("");
        await loadLeaderboard();
        await loadMyResult();
      }, 2000);
    } catch (e) {
      console.error(e);
      setStatusMsg("Validation failed or pitch was rejected by the AI Validators.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  return (
    <div className="app-container">
      <div className="background-elements">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      <main className="glass-panel main-dashboard">
        <header>
          <h1 className="glitch" data-text="SELL ME THIS PEN">SELL ME THIS PEN</h1>
          <p className="subtitle">The Ultimate AI Sales Challenge on GenLayer</p>
          <div className="account-badge">
            <span className="dot"></span>
            {account ? (
              account.slice(0, 6) + '...' + account.slice(-4)
            ) : (
              <button
                onClick={connectWallet}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0 }}
              >
                Click to Connect Wallet
              </button>
            )}
          </div>
        </header>

        <div className="content-grid">
          <section className="pitch-section">
            <div className="panel-header">
              <h2>Submit Your Pitch</h2>
              <span className="ai-status">AI Validators Active</span>
            </div>

            <form onSubmit={handlePitch}>
              <textarea
                className="pitch-input"
                placeholder="Type your most compelling pitch for a simple ballpoint pen here. The GenLayer AI validator swarm is ruthless, they'll verify each other. Be convincing..."
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                disabled={loading}
                rows={6}
              />
              <button className={`submit-btn ${loading ? 'loading' : ''}`} type="submit" disabled={loading || !pitch.trim() || !client}>
                {loading ? 'EVALUATING...' : 'PITCH NOW'}
              </button>
            </form>

            {statusMsg && (
              <div className="status-message">
                {statusMsg}
              </div>
            )}

            {myResult && (
              <div className="analysis-box">
                <h3>AI Validator Feedback</h3>
                <div className="stat-row">
                  <span className="label">Your Score</span>
                  <span className="value accent">{myResult.score} / 100</span>
                </div>
                <p className="reasoning">"{myResult.analysis}"</p>
              </div>
            )}
          </section>

          <aside className="leaderboard-section">
            <div className="panel-header">
              <h2>Top Board</h2>
              <button className="refresh-btn" onClick={() => loadLeaderboard()} title="Refresh Data">
                ⟳
              </button>
            </div>
            {leaderboard ? (
              <div className="leaderboard-content">
                <div className="stat-row">
                  <span className="label">Current Best Score</span>
                  <span className="value accent">{leaderboard.best_score || 0} / 100</span>
                </div>
                <div className="stat-row">
                  <span className="label">Total Pitches</span>
                  <span className="value">{leaderboard.total_pitches || 0}</span>
                </div>
                {leaderboard.best_score > 0 && (
                  <div className="best-pitch-display">
                    <h3>Winning Pitch</h3>
                    <p>"{leaderboard.best_pitch}"</p>
                    <small>Won by: {leaderboard.winner.slice(0, 6)}...{leaderboard.winner.slice(-4)}</small>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                No successful pitches yet. Be the first to break the AI consensus.
              </div>
            )}

            <div className="info-box">
              <p><strong>How it works:</strong> Your pitch is evaluated by multiple LLM-based validators running GenVM concurrently. They must achieve a consensus using the Equivalence Principle before the state changes on-chain.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
