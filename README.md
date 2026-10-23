# MarketPulse Starter — Web + Android-ready

A responsive dark trading terminal starter built with React, Vite, and TradingView Lightweight Charts.

## Included
- Live crypto 24-hour ticker cards from Binance public REST API (refreshes every 5 seconds).
- Live crypto candlesticks from Binance public WebSocket; intervals: 1m, 5m, 15m, 1h, 4h, 1d.
- Watchlist, category filter, chart, rule-based trend snapshot, paper-signal log.
- Responsive web UI that can be wrapped as an Android app using Capacitor.
- Forex instruments are shown but deliberately marked "Not configured" until you add a real FX provider.
- No broker orders, no deposits, no financial account connection.

## Requirements
- Node.js 20+ recommended
- npm
- Android Studio only if you want to build the APK

## Run the website
```bash
npm install
cp .env.example .env
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

Build production files:
```bash
npm run build
npm run preview
```

## Real data sources
### Crypto
This starter uses public Binance market-data endpoints:
- REST: `https://api.binance.com/api/v3/ticker/24hr`
- Candles: `https://api.binance.com/api/v3/klines`
- WebSocket: `wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>`

Public endpoints may be unavailable in some regions/networks, can rate-limit, and do not guarantee uptime. For a production app, proxy requests through your own backend and respect provider terms.

### Forex
Forex is not falsely simulated. Add a provider such as Twelve Data, Alpha Vantage, or another licensed provider with the symbols and WebSocket/refresh plan you need. Keep API keys on your backend, not in `VITE_*` client variables. Then map provider quote/candle responses into the `quotes` and `candles` state in `src/main.jsx`. Provider plans, rate limits, delayed-vs-live status, and redistribution rights vary; verify before launch.

## Android APK using Capacitor
This web app is Android-ready to wrap; it is not a compiled APK yet.
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init MarketPulse com.example.marketpulse --web-dir=dist
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
In Android Studio, wait for Gradle sync, then use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Test on a physical device. For local device access, ensure the phone and development computer are on the same Wi-Fi and use Vite's network URL; production should use HTTPS.

## AI/signals notes
The included “AI signal desk” is a transparent moving-average heuristic (7-candle average vs 20-candle average), not a trained AI model and not a prediction guarantee. Its score is a visual trend-strength heuristic, not the probability a trade will win. Signal history is in browser memory only and clears on reload. For persistence, add a database and authenticated API.

## Safety / limitations
- Paper signals only. Buy/Sell buttons save ideas locally; they do not place trades.
- No guarantee of profitability or signal accuracy.
- This project is a starter, not audited financial software.
- Do not paste API secrets into frontend code or commit them to Git.
