'use client';

/**
 * Test Page: "Ceremony" Restrained Design
 * Based on docs/paste2.txt
 * 
 * Design Philosophy: "Reduce effects. Increase meaning."
 * 
 * Key Features:
 * - Dark, restrained, confident
 * - Solid panels (NOT transparent)
 * - Limited gold accents (#d6a74a) - feels earned
 * - Strong hierarchy - one dominant element
 * - Asymmetry is intentional
 * - Minimal effects (no glow, no gradients)
 * - Ceremonial, competitive feel
 */

export default function TestCeremonyPage() {
  return (
    <>
      <style jsx global>{`
        .ceremony-root {
          --bg: #0b0b0c;
          --panel: #141417;
          --text-primary: #f2f2f2;
          --text-muted: #9a9a9a;
          --gold: #d6a74a;
        }
        
        .ceremony-root * {
          box-sizing: border-box;
        }
        
        .ceremony-root {
          margin: 0;
          background: var(--bg);
          color: var(--text-primary);
          font-family: system-ui, sans-serif;
          min-height: 100vh;
        }
        
        .ceremony-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 64px 32px;
        }
        
        .ceremony-hero {
          text-align: center;
          margin-bottom: 64px;
        }
        
        .ceremony-hero .icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        
        .ceremony-hero h1 {
          font-size: 42px;
          letter-spacing: -0.02em;
          margin: 0;
        }
        
        .ceremony-hero p {
          color: var(--text-muted);
          margin-top: 8px;
        }
        
        .top-three {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 24px;
          align-items: end;
        }
        
        .champion {
          background: var(--panel);
          padding: 32px 24px;
          border-radius: 10px;
          text-align: center;
          position: relative;
        }
        
        .champion.first {
          border: 1px solid rgba(214, 167, 74, 0.4);
          transform: translateY(-16px);
        }
        
        .crown {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 28px;
        }
        
        .rank {
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        
        .champion h3 {
          margin: 12px 0 8px;
          font-size: 20px;
        }
        
        .elo {
          font-size: 36px;
          font-weight: 700;
          color: var(--gold);
        }
        
        .meta {
          font-size: 13px;
          color: var(--text-muted);
        }
      `}</style>
      
      <div className="ceremony-root">
        <main className="ceremony-container">

          <header className="ceremony-hero">
            <div className="icon">🏆</div>
            <h1>Hall of Champions</h1>
            <p>The greatest agents to enter the arena</p>
          </header>

          <section className="top-three">

            <div className="champion second">
              <span className="rank">#2</span>
              <h3>Alduin</h3>
              <div className="elo">2691</div>
              <span className="meta">Lv 42 · 75% WR</span>
            </div>

            <div className="champion first">
              <span className="crown">👑</span>
              <span className="rank">#1</span>
              <h3>Nyx</h3>
              <div className="elo">2847</div>
              <span className="meta">Lv 45 · 78% WR</span>
            </div>

            <div className="champion third">
              <span className="rank">#3</span>
              <h3>Merlin</h3>
              <div className="elo">2534</div>
              <span className="meta">Lv 40 · 70% WR</span>
            </div>

          </section>

        </main>
      </div>
    </>
  );
}
