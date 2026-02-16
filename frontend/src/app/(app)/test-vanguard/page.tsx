'use client';

/**
 * Test Page: "Vanguard" Tactical Dark Fantasy Design
 * Based on docs/paste.txt
 * 
 * Key Features:
 * - Notched 45-degree corners (clip-path polygons)
 * - Dark obsidian glass with heavy backdrop blur
 * - Tactical Amber (#ffaa00) accent
 * - Bebas Neue display font
 * - Scanline overlay for tactical monitor feel
 * - Sharp, angular, martial geometry
 */

export default function TestVanguardPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .vanguard-root {
          --bg: #050506;
          --surface: rgba(20, 22, 26, 0.8);
          --accent: #ffaa00;
          --border: rgba(255, 255, 255, 0.08);
          --text-main: #e0e0e0;
          --text-dim: #888;
          --hp: #2ecc71;
        }
        
        .vanguard-root {
          background: var(--bg);
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(255, 170, 0, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.05) 0%, transparent 40%);
          color: var(--text-main);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
        
        .war-room-container {
          width: 100%;
          max-width: 950px;
          background: var(--surface);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          padding: 40px;
          clip-path: polygon(
            20px 0%, calc(100% - 20px) 0%, 100% 20px, 
            100% calc(100% - 20px), calc(100% - 20px) 100%, 
            20px 100%, 0% calc(100% - 20px), 0% 20px
          );
          position: relative;
        }
        
        /* Decorative Scanlines Overlay */
        .war-room-container::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
            linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          opacity: 0.3;
        }
        
        .vanguard-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .vanguard-h1 {
          font-family: 'Bebas Neue', cursive;
          font-size: 3rem;
          letter-spacing: 4px;
          margin: 0;
          background: linear-gradient(to bottom, #fff, #999);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .vanguard-subtitle {
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .vanguard-subtitle-dim {
          color: var(--text-dim);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: rgba(255,255,255,0.03);
          border-left: 3px solid var(--border);
          padding: 15px;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          background: rgba(255,255,255,0.06);
          border-left-color: var(--accent);
        }
        
        .stat-label {
          font-size: 0.65rem;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .vanguard-actions {
          display: flex;
          gap: 20px;
        }
        
        .vanguard-btn {
          flex: 1;
          padding: 20px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.2rem;
          letter-spacing: 2px;
          cursor: pointer;
          position: relative;
          transition: 0.3s;
          clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
        }
        
        .vanguard-btn:hover {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 20px rgba(255, 170, 0, 0.4);
        }
        
        .vanguard-btn-secondary {
          border-color: var(--text-dim);
          color: var(--text-dim);
        }
        
        .vanguard-btn-secondary:hover {
          background: var(--text-dim);
          color: #000;
          box-shadow: 0 0 20px rgba(136, 136, 136, 0.3);
        }
        
        .battle-chronicle {
          margin-top: 40px;
          width: 100%;
          border-collapse: collapse;
        }
        
        .battle-chronicle th {
          text-align: left;
          font-size: 0.7rem;
          color: var(--text-dim);
          text-transform: uppercase;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        
        .battle-chronicle td {
          padding: 12px 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        
        .victory { color: var(--hp); font-weight: bold; }
        .defeat { color: #e74c3c; font-weight: bold; }
      `}</style>
      
      <div className="vanguard-root">
        <div className="war-room-container">
          <header className="vanguard-header">
            <div className="vanguard-subtitle">// SQUADRON COMMAND</div>
            <h1 className="vanguard-h1">WAR ROOM</h1>
            <div className="vanguard-subtitle vanguard-subtitle-dim">
              Champion: <span style={{ color: '#fff' }}>Shadow Striker</span> | Level 5
            </div>
          </header>

          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: 'var(--hp)' }}>
              <span className="stat-label">Vitality</span>
              <div className="stat-value" style={{ color: 'var(--hp)' }}>150/150</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Might</span>
              <div className="stat-value">18</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Agility</span>
              <div className="stat-value">15</div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Arcana</span>
              <div className="stat-value">08</div>
            </div>
          </div>

          <div className="vanguard-actions">
            <button className="vanguard-btn">ENTER THE DEPTHS</button>
            <button className="vanguard-btn vanguard-btn-secondary">VISIT THE ARMORY</button>
          </div>

          <table className="battle-chronicle">
            <thead>
              <tr>
                <th>Opponent</th>
                <th>Time</th>
                <th>Result</th>
                <th>XP Yield</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fire Mage</td>
                <td>2H AGO</td>
                <td className="victory">VICTORY</td>
                <td>+45 XP</td>
              </tr>
              <tr>
                <td>Stone Golem</td>
                <td>5H AGO</td>
                <td className="victory">VICTORY</td>
                <td>+50 XP</td>
              </tr>
              <tr>
                <td>Dark Knight</td>
                <td>1D AGO</td>
                <td className="defeat">DEFEAT</td>
                <td>+15 XP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
