import { useState } from "react";
import { useEffect } from "react";

const SAMPLE_MESSAGES = [
  "INR 294.99 spent on ICICI Bank Card XX7003 on 23-Apr-24 at TW Coffee Kora. Avl Lmt: INR 43,266.15.",
  "Your SBI Card ending 4521 has been used for INR 1,250.00 at Zomato on 08-May-24.",
  "Alert: Rs.3,499 debited from your HDFC Bank account via card ending 9876 at Amazon India.",
];


export default function App() {
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("user_001");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);












  
// --- ADD THIS START ---
  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:8010/v1/expenses?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const formattedHistory = data.map(item => ({
          message: item.raw_message,
          result: {
            amount: item.amount,
            merchant: item.merchant,
            currency: item.currency,
            user_id: item.user_id
          },
          ts: new Date(item.timestamp).toLocaleTimeString(),
          source: item.source 
        }));
        setHistory(formattedHistory);
      }
    } catch (e) {
      console.error("Connection to Flask failed:", e);
    }
  };



// Automatically refresh history
  useEffect(() => {
    fetchHistory(); // Load on startup
    const interval = setInterval(fetchHistory, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [userId]);














  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("http://localhost:8010/v1/ds/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || "anonymous",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);






        // --- ADD THIS LINE ---
        fetchHistory(); 
        // --------------------





        setHistory((prev) => [
          { message, result: data, ts: new Date().toLocaleTimeString() },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (e) {
      setError("Cannot reach server. Make sure Flask is running on port 8010.");
    } finally {
      setLoading(false);
    }
  }

  function useSample(s) {
    setMessage(s);
    setResult(null);
    setError(null);
  }

  const currencies = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const symbol = (c) => (c ? currencies[c.toUpperCase()] || c : "");





  return (
    <div style={{ minHeight: "100vh", background: "#0f0f11", color: "#e8e6e1", fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #2a5fd4; color: #fff; }
        textarea { resize: none; }
        button { cursor: pointer; }
        .tag { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.05em; }
        .shimmer { background: linear-gradient(90deg, #1a1a1f 25%, #252530 50%, #1a1a1f 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fadeUp { animation: fadeUp 0.35s ease forwards; }
        .pill-btn { background: #1a1a1f; border: 1px solid #2a2a35; color: #9e9b94; font-size: 12px; font-family: 'IBM Plex Mono', monospace; padding: 6px 12px; border-radius: 20px; transition: all 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .pill-btn:hover { border-color: #4a6fa5; color: #c8d8f0; background: #151520; }
        .submit-btn { background: #1e3a6e; border: 1px solid #2a5fd4; color: #90b4f5; font-family: 'IBM Plex Mono', monospace; font-size: 13px; padding: 10px 24px; border-radius: 6px; transition: all 0.15s; font-weight: 500; letter-spacing: 0.03em; }
        .submit-btn:hover:not(:disabled) { background: #2a5fd4; color: #fff; }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .result-card { background: #13131a; border: 1px solid #1f2d4a; border-radius: 10px; padding: 20px 24px; }
        .field-row { display: flex; align-items: baseline; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1c1c25; }
        .field-row:last-child { border-bottom: none; }
        .field-label { font-size: 11px; color: #5a6070; letter-spacing: 0.08em; text-transform: uppercase; }
        .field-value { font-size: 15px; color: #d4e0f7; font-weight: 500; }
        .amount-big { font-size: 32px; font-weight: 600; color: #7db8f7; letter-spacing: -0.02em; }
        .history-item { background: #111118; border: 1px solid #1c1c28; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: border-color 0.15s; }
        .history-item:hover { border-color: #2a5fd4; }
        textarea.msg-input { width: 100%; background: #111118; border: 1px solid #222230; color: #d4d0c8; font-family: 'IBM Plex Mono', monospace; font-size: 13px; padding: 14px 16px; border-radius: 8px; line-height: 1.6; transition: border-color 0.15s; outline: none; }
        textarea.msg-input:focus { border-color: #2a5fd4; }
        input.uid-input { background: #111118; border: 1px solid #222230; color: #d4d0c8; font-family: 'IBM Plex Mono', monospace; font-size: 13px; padding: 8px 12px; border-radius: 6px; outline: none; width: 180px; transition: border-color 0.15s; }
        input.uid-input:focus { border-color: #2a5fd4; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2a5fd4", boxShadow: "0 0 8px #2a5fd4" }} />
            <span style={{ fontSize: 11, color: "#4a6fa5", letterSpacing: "0.12em", textTransform: "uppercase" }}>dsService</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, color: "#e8e6e1", lineHeight: 1.2, marginBottom: 8 }}>
            SMS Expense Extractor
          </h1>
          <p style={{ fontSize: 13, color: "#5a6070", lineHeight: 1.6 }}>
            Paste a bank SMS → LLM extracts amount, merchant & currency via Mistral AI
          </p>
        </div>

        {/* Sample messages */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: "#3d4455", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Try a sample</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SAMPLE_MESSAGES.map((s, i) => (
              <button key={i} className="pill-btn" onClick={() => useSample(s)} title={s}>
                {s.slice(0, 40)}…
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="msg-input"
            rows={4}
            placeholder="Paste your bank SMS here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#3d4455", letterSpacing: "0.06em" }}>x-user-id</span>
            <input
              className="uid-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_001"
            />
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading || !message.trim()}>
            {loading ? "Extracting..." : "Extract →"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ marginBottom: 24 }}>
            {[80, 55, 65].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 16, width: `${w}%`, borderRadius: 4, marginBottom: 10 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fadeUp" style={{ background: "#1a0f0f", border: "1px solid #4a1515", borderRadius: 8, padding: "14px 18px", marginBottom: 24, color: "#f09595", fontSize: 13 }}>
            <span style={{ color: "#e24b4a", marginRight: 8 }}>✕</span>{error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fadeUp result-card" style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16 }}>
              <span className="tag" style={{ background: "#0d2a1a", color: "#5db888", border: "1px solid #1a4a2a" }}>extracted</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "#4a6070", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Amount</p>
              <p className="amount-big">
                {symbol(result.currency)}{result.amount ?? "—"}
                {result.currency && <span style={{ fontSize: 14, color: "#4a6fa5", marginLeft: 8, fontWeight: 400 }}>{result.currency}</span>}
              </p>
            </div>

            <div className="field-row">
              <span className="field-label">Merchant</span>
              <span className="field-value">{result.merchant ?? "—"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Currency</span>
              <span className="field-value">{result.currency ?? "—"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">User ID</span>
              <span className="field-value" style={{ color: "#6a7fa5", fontSize: 13 }}>{result.user_id}</span>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: "#3d4455", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Recent extractions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((h, i) => (
                <div key={i} className="history-item" onClick={() => { setMessage(h.message); setResult(h.result); setError(null); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#7db8f7", fontWeight: 500 }}>
                      {symbol(h.result.currency)}{h.result.amount} · {h.result.merchant}
                    </span>
                    <span style={{ fontSize: 11, color: "#3d4455" }}>{h.ts}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#3d4455", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.message.slice(0, 80)}…
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #161620" }}>
          <p style={{ fontSize: 11, color: "#2a2a35", letterSpacing: "0.06em" }}>
            Flask · Python · LangChain · Mistral AI · Kafka (disabled)
          </p>
        </div>
      </div>
    </div>
  );
}