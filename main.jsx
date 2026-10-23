import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createChart, CandlestickSeries, LineSeries } from "lightweight-charts";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit, ChevronDown, CircleHelp, Clock3, Gauge, LayoutDashboard, LineChart, Menu, Search, Settings2, ShieldCheck, Sparkles, WalletCards, Wifi, X } from "lucide-react";
import "./style.css";

const WATCH = [
  { symbol: "BTCUSDT", label: "Bitcoin", group: "Crypto", color: "#f5a623" },
  { symbol: "ETHUSDT", label: "Ethereum", group: "Crypto", color: "#8b9cff" },
  { symbol: "SOLUSDT", label: "Solana", group: "Crypto", color: "#b78cff" },
  { symbol: "BNBUSDT", label: "BNB", group: "Crypto", color: "#f0c34e" },
  { symbol: "EUR/USD", label: "Euro / US Dollar", group: "Forex", color: "#52d6b5" },
  { symbol: "GBP/USD", label: "British Pound / US Dollar", group: "Forex", color: "#69a7ff" },
  { symbol: "USD/JPY", label: "US Dollar / Japanese Yen", group: "Forex", color: "#f17c91" }
];
const fmt = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: v < 10 ? 4 : 2, minimumFractionDigits: v < 10 ? 4 : 2 });
const timeNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function App() {
  const [active, setActive] = useState("BTCUSDT");
  const [category, setCategory] = useState("All");
  const [quotes, setQuotes] = useState({});
  const [candles, setCandles] = useState([]);
  const [interval, setInterval] = useState("1m");
  const [connected, setConnected] = useState(false);
  const [updated, setUpdated] = useState("Connecting…");
  const [signals, setSignals] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const selected = WATCH.find(x => x.symbol === active) || WATCH[0];
  const quote = quotes[active];
  const visible = WATCH.filter(x => (category === "All" || x.group === category) && (x.label + x.symbol).toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    let alive = true;
    const fetchPrices = async () => {
      try {
        const symbols = WATCH.filter(x => x.group === "Crypto").map(x => x.symbol);
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
        if (!res.ok) throw new Error("Market endpoint unavailable");
        const data = await res.json();
        if (!alive) return;
        setQuotes(prev => {
          const next = { ...prev };
          data.forEach(d => next[d.symbol] = { price: Number(d.lastPrice), change: Number(d.priceChangePercent), high: Number(d.highPrice), low: Number(d.lowPrice), volume: Number(d.quoteVolume), source: "Binance" });
          // Forex cards intentionally show unavailable until a licensed FX provider is configured.
          ["EUR/USD", "GBP/USD", "USD/JPY"].forEach(s => { if (!next[s]) next[s] = { unavailable: true, source: "Not configured" }; });
          return next;
        });
        setConnected(true); setUpdated(timeNow());
      } catch (e) { setConnected(false); setUpdated("Feed unavailable"); }
    };
    fetchPrices();
    const id = setInterval(fetchPrices, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (selected.group !== "Crypto") { setCandles([]); return; }
    let ws;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${active}&interval=${interval}&limit=120`);
        if (!r.ok) throw new Error("Klines unavailable");
        const rows = await r.json();
        if (!alive) return;
        setCandles(rows.map(k => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4] })));
      } catch { setCandles([]); }
    };
    load();
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${active.toLowerCase()}@kline_${interval}`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const k = msg.k;
      const c = { time: Math.floor(k.t / 1000), open: +k.o, high: +k.h, low: +k.l, close: +k.c };
      setCandles(old => {
        const next = [...old];
        const i = next.findIndex(x => x.time === c.time);
        if (i >= 0) next[i] = c; else next.push(c);
        return next.slice(-160);
      });
      setQuotes(prev => ({ ...prev, [active]: { ...(prev[active] || {}), price: c.close, source: "Binance WebSocket" } }));
      setConnected(true); setUpdated(timeNow());
    };
    ws.onerror = () => setConnected(false);
    return () => { alive = false; ws?.close(); };
  }, [active, interval, selected.group]);

  useEffect(() => {
    const el = document.getElementById("chart");
    if (!el || !candles.length) return;
    el.innerHTML = "";
    const chart = createChart(el, {
      width: el.clientWidth, height: 320,
      layout: { background: { color: "#0b1020" }, textColor: "#8b96ad", fontFamily: "Inter, system-ui", fontSize: 11 },
      grid: { vertLines: { color: "#171e30" }, horzLines: { color: "#171e30" } },
      rightPriceScale: { borderColor: "#222a3e" },
      timeScale: { borderColor: "#222a3e", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#53617c", labelBackgroundColor: "#202b43" }, horzLine: { color: "#53617c", labelBackgroundColor: "#202b43" } }
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#20c997", downColor: "#ff5d78", borderUpColor: "#20c997", borderDownColor: "#ff5d78",
      wickUpColor: "#20c997", wickDownColor: "#ff5d78"
    });
    series.setData(candles);
    chart.timeScale().fitContent();
    const resize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [candles]);

  const signal = useMemo(() => {
    if (candles.length < 20) return { side: "WAIT", strength: 0, reason: "Waiting for enough live candles" };
    const closes = candles.map(c => c.close);
    const avg = n => closes.slice(-n).reduce((a,b)=>a+b,0)/n;
    const fast = avg(7), slow = avg(20);
    const side = fast > slow ? "BULLISH" : fast < slow ? "BEARISH" : "NEUTRAL";
    const strength = Math.min(92, Math.round(50 + Math.abs(fast - slow) / slow * 10000));
    return { side, strength, reason: `7-candle average ${fast > slow ? "above" : "below"} 20-candle average` };
  }, [candles]);

  const saveSignal = (side) => {
    const item = { id: Date.now(), time: new Date().toLocaleString(), asset: active, side, price: quote?.price || candles.at(-1)?.close || null, status: "Open", source: "Manual paper signal" };
    setSignals(old => [item, ...old].slice(0, 50));
    setHistory(old => [item, ...old].slice(0, 100));
    setToast(`${side} paper signal saved`); setTimeout(() => setToast(""), 2400);
  };

  const cards = [
    { title: "BTC / USD", symbol: "BTCUSDT", price: quotes.BTCUSDT?.price, change: quotes.BTCUSDT?.change, icon: "₿" },
    { title: "ETH / USD", symbol: "ETHUSDT", price: quotes.ETHUSDT?.price, change: quotes.ETHUSDT?.change, icon: "◆" },
    { title: "SOL / USD", symbol: "SOLUSDT", price: quotes.SOLUSDT?.price, change: quotes.SOLUSDT?.change, icon: "◎" },
    { title: "BNB / USD", symbol: "BNBUSDT", price: quotes.BNBUSDT?.price, change: quotes.BNBUSDT?.change, icon: "⬡" }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><b>MARKET<span>PULSE</span></b><small>LIVE MARKET TERMINAL</small></div></div>
      <div className="workspace"><div className="avatar">MP</div><div><b>Personal Workspace</b><small>Free terminal</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      {[[LayoutDashboard,"Overview"],[LineChart,"Markets"],[BrainCircuit,"AI Signals"],[Clock3,"Signal History"]].map(([Icon,label])=><button key={label} className={`nav-item ${tab===label?"active":""}`} onClick={()=>setTab(label)}><Icon size={18}/><span>{label}</span>{label==="AI Signals"&&<i>NEW</i>}</button>)}
      <div className="nav-label market-label">MARKET WATCH</div>
      <div className="watch-list">{WATCH.slice(0,4).map(a=><button key={a.symbol} className={`watch-mini ${active===a.symbol?"chosen":""}`} onClick={()=>{setActive(a.symbol);setTab("Overview")}}><span className="coin-dot" style={{background:a.color}}>{a.label[0]}</span><span><b>{a.symbol.replace("USDT","")}</b><small>{a.label}</small></span><span className="watch-price">{quotes[a.symbol]?.price?fmt(quotes[a.symbol].price):"—"}</span></button>)}</div>
      <div className="sidebar-bottom"><div className="pro-card"><Sparkles size={18}/><b>Trade with clarity</b><p>Track the market. Keep risk visible. Stay disciplined.</p><button onClick={()=>setToast("Paper trading only — no broker connected.")}>Explore tools <ArrowUpRight size={14}/></button></div><button className="nav-item"><Settings2 size={18}/> Settings</button><div className="profile"><div className="avatar user">U</div><div><b>Trader</b><small>Local demo session</small></div><ChevronDown size={15}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>{tab}</b></div><div className="top-actions"><div className="feed-state"><span className={connected?"pulse":"pulse off"}></span>{connected?"Live feed connected":"Feed reconnecting"}</div><button className="icon-btn" title="Notifications" onClick={()=>setToast("No new alerts")}><Bell size={18}/></button><button className="help-btn" onClick={()=>setToast("Market data can lag; verify prices with your provider.")}><CircleHelp size={17}/> Help</button></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"></span> MARKET OVERVIEW <span className="muted">/ REAL-TIME TERMINAL</span></div><h1>Market at a glance<span>.</span></h1><p>Live crypto data, clear signals, and a calmer view of the market.</p></div><div className="heading-right"><div className="updated"><Wifi size={14}/> Updated {updated}</div><button className="outline-btn" onClick={()=>{setTab("Signal History");setToast("Signal history opened")}}><Clock3 size={15}/> View history</button></div></div>
        <div className="stats-grid">{[
          ["Tracked assets", "07", "4 crypto · 3 FX pairs", <Activity/>],
          ["Live crypto pairs", connected?"04":"—", connected?"Binance public feed":"Connecting to feed", <Wifi/>],
          ["Signals recorded", String(history.length).padStart(2,"0"), "This browser session", <BrainCircuit/>],
          ["Data mode", "LIVE", "Public market data", <ShieldCheck/>]
        ].map(([label,val,sub,Icon])=><div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><Icon size={17}/></div><div className="stat-value">{val}</div><div className="stat-sub"><span className="tiny-green"></span>{sub}</div></div>)}</div>
        <div className="section-head"><div><h2>Market overview</h2><p>Prices and 24-hour movement</p></div><button className="text-btn" onClick={()=>setTab("Markets")}>All markets <ArrowUpRight size={15}/></button></div>
        <div className="asset-grid">{cards.map(c=><button key={c.symbol} onClick={()=>{setActive(c.symbol);setTab("Overview")}} className={`asset-card ${active===c.symbol?"selected":""}`}><div className="asset-top"><span className={`asset-icon ${c.symbol.toLowerCase()}`}>{c.icon}</span><span className="asset-symbol">{c.symbol.replace("USDT","")} <small>/ USDT</small></span><span className={`change ${c.change>=0?"up":"down"}`}>{c.change==null?"—":`${c.change>=0?"+":""}${c.change.toFixed(2)}%`}</span></div><div className="asset-price">{c.price?`$${fmt(c.price)}`:"Loading…"}</div><div className="sparkline"><svg viewBox="0 0 180 32" preserveAspectRatio="none"><path d={c.symbol==="BTCUSDT"?"M0 24 L12 20 L24 23 L36 11 L48 16 L60 10 L72 14 L84 8 L96 12 L108 5 L120 9 L132 4 L144 11 L156 6 L168 8 L180 2":"M0 23 L12 19 L24 21 L36 14 L48 18 L60 9 L72 15 L84 12 L96 17 L108 8 L120 12 L132 6 L144 13 L156 8 L168 10 L180 4}"/><path className="spark-fill" d="M0 24 L12 20 L24 23 L36 11 L48 16 L60 10 L72 14 L84 8 L96 12 L108 5 L120 9 L132 4 L144 11 L156 6 L168 8 L180 2 L180 32 L0 32 Z"/></svg></div><div className="asset-footer"><span>24h volume</span><b>{quotes[c.symbol]?.volume?`$${(quotes[c.symbol].volume/1e6).toFixed(1)}M`:"—"}</b></div></button>)}</div>
        <div className="work-grid">
          <section className="panel chart-panel"><div className="panel-head"><div><div className="panel-title"><span className="asset-icon mini" style={{background:selected.color+"22",color:selected.color}}>{selected.label[0]}</span><div><h3>{selected.label} <span className="pair">{active}</span></h3><small>{selected.group==="Crypto"?"Spot market · Binance":"Forex provider not configured"}</small></div></div></div><div className="chart-actions">{["1m","5m","15m","1h","4h","1d"].map(t=><button key={t} className={interval===t?"chosen":""} onClick={()=>setInterval(t)}>{t}</button>)}</div></div>
            <div className="chart-price-row"><div><strong>{quote?.price?`$${fmt(quote.price)}`:candles.length?`$${fmt(candles.at(-1).close)}`:"—"}</strong><span className={quote?.change>=0?"up":"down"}>{quote?.change==null?"Live candle feed":`${quote.change>=0?"+":""}${quote.change.toFixed(2)}% today`}</span></div><div className="chart-legend"><span className="legend-up"></span> Bullish <span className="legend-down"></span> Bearish</div></div>
            <div id="chart" className="chart-area">{!candles.length&&<div className="chart-loading"><Activity size={24}/><span>{selected.group==="Crypto"?"Connecting to live candles…":"Connect a licensed forex data provider to enable this chart."}</span></div>}</div>
            <div className="chart-foot"><span><span className="tiny-green"></span> Source: {selected.group==="Crypto"?"Binance public API / WebSocket":"Not configured"}</span><span>Times shown in your browser timezone</span></div>
          </section>
          <section className="panel signal-panel"><div className="panel-head"><div><h3>AI signal desk</h3><small>Rule-based trend snapshot</small></div><span className="ai-badge"><Sparkles size={13}/> BETA</span></div>
            <div className="signal-orb"><div className="orb-ring ring1"></div><div className="orb-ring ring2"></div><div className="orb-core"><BrainCircuit size={31}/><b>{signal.side}</b><small>Trend read</small></div></div>
            <div className="signal-meter"><div><span>Trend alignment</span><b>{signal.strength}%</b></div><div className="meter-track"><span style={{width:`${signal.strength}%`}}/></div><small>Heuristic score — not a probability of profit</small></div>
            <div className="signal-reason"><span className="reason-icon"><Gauge size={16}/></span><div><b>Signal rationale</b><p>{signal.reason}. Based on recent candle averages only.</p></div></div>
            <div className="signal-buttons"><button className="buy-btn" onClick={()=>saveSignal("BUY / UP")}><ArrowUpRight size={16}/> Save bullish idea</button><button className="sell-btn" onClick={()=>saveSignal("SELL / DOWN")}><ArrowDownRight size={16}/> Save bearish idea</button></div>
            <div className="risk-note"><ShieldCheck size={15}/><span>Paper signals only. No order is sent to a broker.</span></div>
          </section>
        </div>
        <div className="lower-grid">
          <section className="panel table-panel"><div className="panel-head"><div><h3>Watchlist</h3><small>Track the instruments you care about</small></div><div className="search-box"><Search size={14}/><input placeholder="Search assets" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="filter-row">{["All","Crypto","Forex"].map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="table-wrap"><table><thead><tr><th>Asset</th><th>Last price</th><th>24h change</th><th>Feed</th></tr></thead><tbody>{visible.map(a=>{const q=quotes[a.symbol];return <tr key={a.symbol} onClick={()=>{setActive(a.symbol);setTab("Overview")}}><td><span className="table-asset"><span className="coin-dot" style={{background:a.color}}>{a.label[0]}</span><span><b>{a.label}</b><small>{a.symbol}</small></span></span></td><td>{q?.price?`$${fmt(q.price)}`:a.group==="Forex"?"Not configured":"Loading…"}</td><td><span className={q?.change>=0?"up":"down"}>{q?.change==null?"—":`${q.change>=0?"+":""}${q.change.toFixed(2)}%`}</span></td><td><span className={`source-pill ${q?.price?"online":""}`}>{q?.price?"LIVE":a.group==="Forex"?"SETUP":"CONNECTING"}</span></td></tr>})}</tbody></table></div></section>
          <section className="panel history-panel"><div className="panel-head"><div><h3>Recent signal history</h3><small>Saved locally for this session</small></div><Clock3 size={17}/></div>{history.length===0?<div className="empty-state"><div className="empty-icon"><BrainCircuit size={22}/></div><b>No signals recorded yet</b><p>Save a bullish or bearish idea from the signal desk to start your log.</p></div>:<div className="history-list">{history.slice(0,5).map(h=><div className="history-item" key={h.id}><span className={`history-direction ${h.side.includes("BUY")?"buy":"sell"}`}>{h.side.includes("BUY")?"↗":"↘"}</span><div className="history-main"><b>{h.side} · {h.asset}</b><small>{h.time}</small></div><span className="source-pill">{h.status}</span></div>)}</div>}<button className="full-link" onClick={()=>setTab("Signal History")}>Open full history <ArrowUpRight size={14}/></button></section>
        </div>
        {tab==="Markets"&&<div className="panel tab-extra"><h3>Markets</h3><p>Choose an asset in the watchlist. Crypto prices use Binance public endpoints; forex requires a configured provider.</p></div>}
        {tab==="AI Signals"&&<div className="panel tab-extra"><h3>AI Signals</h3><p>This starter uses a transparent moving-average heuristic, not a trained AI model. Validate signals before relying on them.</p></div>}
        {tab==="Signal History"&&<div className="panel tab-extra"><h3>Signal history</h3>{history.length?history.map(h=><p key={h.id}>{h.time} — {h.asset}: {h.side} — {h.source}</p>):<p>No saved signals in this browser session yet.</p>}</div>}
        <footer><span>© 2026 MarketPulse Starter</span><span><span className="tiny-green"></span> Public data · Paper mode · No brokerage connection</span></footer>
      </div>
    </main>
    {toast&&<div className="toast"><span>{toast}</span><button onClick={()=>setToast("")}><X size={14}/></button></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
