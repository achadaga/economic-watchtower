import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  LineChart, Activity, Globe, DollarSign, Briefcase, FileText, 
  TrendingUp, AlertTriangle, Menu, X, Zap, Cpu, Wifi, Terminal, 
  RefreshCw, ShieldAlert, Skull, ArrowUpRight, ArrowDownRight, Minus,
  BookOpen, Bookmark, Lock, Download, CheckCircle, Play, History
} from 'lucide-react';

/**
 * US Economic Watchtower v16 (Multi-Asset Simulation)
 * - Added BTC and 10Y Yields to Simulation Results table
 */

// --- Configuration ---
const getApiUrl = () => {
  try {
    // @ts-ignore
    if (import.meta.env && import.meta.env.VITE_API_URL) {
      // @ts-ignore
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {
    // Ignore errors if import.meta is not available
  }
  return 'https://doomsday-test-backend.onrender.com';
};

const API_BASE_URL = getApiUrl();

// --- Shared Components ---

const Header = ({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Watchtower', icon: ShieldAlert },
    { id: 'crypto', label: 'Crypto', icon: Zap },
    { id: 'economy', label: 'Macro', icon: Globe },
    { id: 'bonds', label: 'Bonds', icon: TrendingUp },
    { id: 'simulation', label: 'Sim Lab', icon: History },
    { id: 'handbook', label: 'Manual', icon: BookOpen },
  ];

  return (
    <header className="bg-black border-b border-red-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-red-600 rounded flex items-center justify-center">
                <Skull className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold text-red-500 tracking-wider uppercase font-mono">
              Doomsday<span className="text-white">Clock</span>
            </span>
          </div>
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 font-mono uppercase tracking-widest ${
                  activeTab === item.id ? 'bg-red-900/40 text-red-500 border border-red-800' : 'text-slate-500 hover:text-red-400'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-red-500 p-2">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const TVScript = ({ src, config, className = "h-96" }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const div = document.createElement('div');
    div.className = "tradingview-widget-container h-full w-full";
    const widgetDiv = document.createElement('div');
    widgetDiv.className = "tradingview-widget-container__widget h-full w-full";
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    div.appendChild(widgetDiv);
    div.appendChild(script);
    ref.current.appendChild(div);
  }, [src, config]); 
  return <div ref={ref} className={className} />;
};

const DoomsdayClock = ({ risk, defcon }) => {
    const rotation = -90 + (risk * 0.9); 
    let color = "text-emerald-500";
    if (defcon <= 3) color = "text-yellow-500";
    if (defcon <= 2) color = "text-orange-600";
    if (defcon === 1) color = "text-red-600 animate-pulse";

    return (
        <div className="relative w-64 h-32 overflow-hidden mx-auto mt-6">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-60 h-60 border-t-[20px] border-l-[20px] border-r-[20px] border-slate-800 rounded-full box-border"></div>
            <div 
                className={`absolute bottom-0 left-1/2 w-1 h-28 bg-current origin-bottom transition-all duration-1000 ${color}`}
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-current rounded-full shadow-[0_0_15px_currentColor]"></div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">System Risk</div>
                <div className={`text-4xl font-black font-mono ${color}`}>{risk}%</div>
            </div>
        </div>
    );
};

const IntelCard = ({ asset }) => {
    const getSignalColor = (signal) => {
        if (signal === 'BULLISH' || signal === 'STABLE') return 'text-emerald-400 border-emerald-500/50 bg-emerald-900/10';
        if (signal === 'BEARISH' || signal === 'WARNING' || signal === 'CRITICAL') return 'text-red-400 border-red-500/50 bg-red-900/10';
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/10';
    };

    const getIcon = (trend) => {
        if (trend.toLowerCase().includes('uptrend')) return <ArrowUpRight className="h-4 w-4" />;
        if (trend.toLowerCase().includes('downtrend')) return <ArrowDownRight className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    return (
        <div className={`p-4 rounded border ${getSignalColor(asset.signal)} transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-black font-mono">{asset.asset}</h3>
                <span className="text-xs font-mono opacity-70">{asset.timestamp}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">${asset.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono mb-3 border-b border-white/10 pb-2">
                {getIcon(asset.trend)}
                {asset.trend.toUpperCase()}
            </div>
            <div className="text-xs opacity-80 leading-relaxed font-mono">
                {asset.details}
            </div>
        </div>
    );
};

const LeadCaptureModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); 

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            // Using Dynamic URL
            const response = await fetch(`${API_BASE_URL}/api/capture-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            if (!response.ok) throw new Error('Failed');
            setStatus('success');
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = '/handbook.pdf'; 
                link.download = 'Economic_Watchtower_Field_Manual.pdf';
                link.click();
                onClose();
                setStatus('idle');
                setName('');
                setEmail('');
            }, 1500);
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-emerald-500/30 rounded-lg p-8 max-w-md w-full shadow-2xl">
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-8 w-8 text-emerald-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Access Granted</h3>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-xl font-bold text-white text-center">Classified Material</h3>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white" placeholder="Name" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white" placeholder="Email" />
                        <button type="submit" disabled={status === 'submitting'} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded">
                            {status === 'submitting' ? 'Verifying...' : 'UNLOCK DOWNLOAD'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const BacktestView = () => {
    const [scenario, setScenario] = useState('ROLLING_90D');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const runSimulation = async () => {
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            // Using Dynamic URL
            const response = await fetch(`${API_BASE_URL}/api/backtest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
            
            if (!response.ok) throw new Error('Simulation failed. Backend offline?');
            const json = await response.json();
            
            if (json.status === 'error') throw new Error(json.message);
            setResults(json.data);
        } catch (err) {
            // @ts-ignore
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // calculate max risk safely (avoiding -Infinity on empty arrays)
    const maxRisk = results?.timeline?.length 
        ? Math.max(...results.timeline.map((d: any) => d.risk_score)) 
        : 0;

    return (
        <div className="space-y-6 animate-fadeIn h-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="col-span-1 bg-slate-900 border border-slate-800 rounded p-6 h-fit">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <History className="h-6 w-6 text-blue-500" /> Time Machine
                    </h2>
                    <p className="text-sm text-slate-400 mb-6">
                        Test the "Doomsday Algorithm" against historical crashes to validate performance.
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-slate-500 mb-1">SCENARIO</label>
                            <select 
                                value={scenario} 
                                onChange={(e) => setScenario(e.target.value)}
                                className="w-full bg-black border border-slate-700 rounded p-3 text-white font-mono focus:border-blue-500 outline-none"
                            >
                                <option value="ROLLING_90D">Last 3 Months (Tactical)</option>
                                <option value="ROLLING_180D">Last 6 Months (Strategic)</option>
                                <option value="2020_COVID">2020: The Covid Crash</option>
                                <option value="2008_GFC">2008: Great Financial Crisis</option>
                                <option value="2022_INFLATION">2022: Inflation Bear Market</option>
                            </select>
                        </div>
                        
                        <button 
                            onClick={runSimulation}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {loading ? 'CALCULATING...' : 'RUN SIMULATION'}
                        </button>
                    </div>

                    {results && (
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <h3 className="text-sm font-bold text-slate-300 mb-2">SIMULATION REPORT</h3>
                            <div className="space-y-2 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Period:</span>
                                    <span className="text-slate-300">{results.period}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Peak Risk:</span>
                                    <span className="text-red-500 font-bold">
                                        {maxRisk}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-xs font-mono">
                            ERROR: {error}
                        </div>
                    )}
                </div>

                <div className="col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded p-6 h-[600px] overflow-y-auto custom-scrollbar">
                    {!results ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <History className="h-16 w-16 mb-4" />
                            <p className="font-mono text-sm">AWAITING INPUT PARAMETERS...</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Updated Header Row */}
                            <div className="grid grid-cols-12 text-xs font-mono text-slate-500 mb-2 px-2 border-b border-slate-800 pb-2">
                                <div className="col-span-2">DATE</div>
                                <div className="col-span-2 text-right text-blue-400">SPX</div>
                                <div className="col-span-2 text-right text-yellow-400">BTC</div>
                                <div className="col-span-2 text-right text-orange-400">10Y</div>
                                <div className="col-span-4 pl-4">RISK (DEFCON)</div>
                            </div>
                            
                            {(results.timeline || []).map((day: any, idx: number) => {
                                let barColor = "bg-emerald-500";
                                if(day.defcon <= 3) barColor = "bg-yellow-500";
                                if(day.defcon <= 2) barColor = "bg-orange-500";
                                if(day.defcon === 1) barColor = "bg-red-600";

                                return (
                                    <div key={idx} className="grid grid-cols-12 text-xs font-mono hover:bg-slate-800 p-2 rounded transition-colors items-center group">
                                        <div className="col-span-2 text-slate-400">{day.date}</div>
                                        
                                        {/* SPX Price */}
                                        <div className="col-span-2 text-right text-blue-300">
                                            {day.spx_price ? `$${day.spx_price.toFixed(0)}` : '-'}
                                        </div>

                                        {/* BTC Price */}
                                        <div className="col-span-2 text-right text-yellow-300">
                                            {day.btc_price ? `$${day.btc_price.toFixed(0)}` : '-'}
                                        </div>

                                        {/* 10Y Yield */}
                                        <div className="col-span-2 text-right text-orange-300">
                                            {day.yield_10y ? `${day.yield_10y.toFixed(2)}%` : '-'}
                                        </div>

                                        {/* Risk Bar */}
                                        <div className="col-span-4 pl-4 flex items-center gap-2">
                                            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${barColor}`} 
                                                    style={{ width: `${day.risk_score}%` }}
                                                />
                                            </div>
                                            <span className={`w-8 text-right font-bold ${day.defcon === 1 ? 'text-red-500' : 'text-slate-500'}`}>
                                                {day.risk_score}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ systemData, riskMetrics, loading, error, fetchBackendData }) => {
  const criticalUpdates = systemData ? systemData.filter(i => i.signal === 'WARNING' || i.signal === 'CRITICAL') : [];
  return (
    <div className="space-y-8 animate-fadeIn text-slate-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-black rounded-sm border border-red-900/50 p-6 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.1)]">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
            <h2 className="text-red-500 font-mono uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Threat Level
            </h2>
            <div className="mt-4 mb-2">
                <span className={`text-6xl font-black font-mono ${
                    riskMetrics.defcon === 1 ? 'text-red-600 animate-pulse' : 
                    riskMetrics.defcon <= 3 ? 'text-yellow-500' : 'text-emerald-600'
                }`}>
                    DEFCON {riskMetrics.defcon}
                </span>
            </div>
            <DoomsdayClock risk={riskMetrics.system_risk} defcon={riskMetrics.defcon} />
            <div className="w-full mt-4 pt-4 border-t border-red-900/30 grid grid-cols-2 text-center text-xs font-mono text-slate-500">
                <div>CRASH PROBABILITY<div className="text-slate-300 text-lg">{(riskMetrics.system_risk * 1.2).toFixed(0)}%</div></div>
                <div>DATA LATENCY<div className="text-emerald-500">LIVE</div></div>
            </div>
        </div>
        <div className="col-span-1 lg:col-span-2 bg-slate-900/50 rounded-sm border border-slate-800 p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-slate-100 font-mono font-bold text-lg flex items-center gap-2 uppercase tracking-wider">
                    <Terminal className="h-5 w-5 text-blue-500" /> SitRep
                </h2>
                <button onClick={fetchBackendData} className="text-xs text-slate-500 hover:text-white flex items-center gap-2">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> RELOAD INTEL
                </button>
            </div>
            <div className="space-y-3 h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {error && <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 font-mono text-sm">!! SYSTEM ERROR: {error} !!</div>}
                {criticalUpdates.length > 0 ? (
                    criticalUpdates.map((item, idx) => (
                        <div key={idx} className="bg-red-900/10 border-l-2 border-red-500 p-3">
                            <div className="flex justify-between items-start"><span className="font-bold text-red-400 font-mono text-sm">[{item.asset}] ALERT</span><span className="text-xs text-red-900/50 font-mono">{item.timestamp}</span></div>
                            <div className="text-slate-200 font-medium mt-1 text-sm">{item.details}</div>
                            <div className="mt-2 text-xs font-mono text-red-400/70 uppercase">Signal: {item.signal} | Trend: {item.trend}</div>
                        </div>
                    ))
                ) : (!loading && !error && <div className="p-4 bg-emerald-900/10 border border-emerald-900/30 text-emerald-400 font-mono text-sm text-center opacity-70">&gt; NO CRITICAL THREATS DETECTED.</div>)}
                {loading && <div className="text-blue-500 font-mono text-sm animate-pulse">&gt; Scanning global markets...</div>}
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" className="h-full w-full" config={{ autosize: true, symbol: "SP:SPX", interval: "D", theme: "dark", style: "1", locale: "en", hide_top_toolbar: true, hide_legend: true }} /></div>
        <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" className="h-full w-full" config={{ symbol: "HYG", width: "100%", height: "100%", locale: "en", dateRange: "12M", colorTheme: "dark", isTransparent: true, autosize: true }} /></div>
      </div>
    </div>
  );
};

const CryptoView = ({ systemData, loading }) => {
    const assets = systemData ? systemData.filter(item => ['BTC', 'ETH', 'SOL'].includes(item.asset)) : [];
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assets.map((asset, idx) => <IntelCard key={idx} asset={asset} />)}
                {loading && <div className="col-span-3 text-center text-blue-500 font-mono animate-pulse">&gt; FETCHING CRYPTO INTEL...</div>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded p-1"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" className="h-full w-full" config={{ autosize: true, symbol: "BITSTAMP:BTCUSD", interval: "D", theme: "dark", style: "1", locale: "en", hide_top_toolbar: false }} /></div>
                <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col gap-1">
                    <div className="h-1/2"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" className="h-full w-full" config={{ symbol: "BITSTAMP:ETHUSD", width: "100%", height: "100%", locale: "en", dateRange: "1M", colorTheme: "dark", isTransparent: true, autosize: true }} /></div>
                    <div className="h-1/2"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" className="h-full w-full" config={{ symbol: "COINBASE:SOLUSD", width: "100%", height: "100%", locale: "en", dateRange: "1M", colorTheme: "dark", isTransparent: true, autosize: true }} /></div>
                </div>
            </div>
        </div>
    );
};

const EconomyView = ({ systemData, loading }) => {
    const assets = systemData ? systemData.filter(item => ['LABOR', 'SMALL_CAP', 'COPPER'].includes(item.asset)) : [];
    return (
        <div className="space-y-6 animate-fadeIn">
             <div className="flex items-center gap-2 text-slate-400 font-mono text-sm border-b border-slate-800 pb-2"><Globe className="h-4 w-4" /> ECONOMIC HEALTH INDICATORS</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assets.map((asset, idx) => <IntelCard key={idx} asset={asset} />)}
                {loading && <div className="col-span-3 text-center text-blue-500 font-mono animate-pulse">&gt; ANALYZING MACRO DATA...</div>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <div className="bg-slate-900 border border-slate-800 rounded p-4"><h3 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-400"/> Economic Calendar</h3><div className="h-[520px]"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" className="h-full w-full" config={{ colorTheme: "dark", isTransparent: true, width: "100%", height: "100%", locale: "en", importanceFilter: "-1,0,1", countryFilter: "us" }} /></div></div>
                 <div className="bg-slate-900 border border-slate-800 rounded p-4"><h3 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-orange-400"/> Industrial Demand (Copper)</h3><div className="h-[520px]"><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" className="h-full w-full" config={{ autosize: true, symbol: "COMEX:HG1!", interval: "D", theme: "dark", style: "1", locale: "en", hide_top_toolbar: true }} /></div></div>
            </div>
        </div>
    );
};

const BondsView = ({ systemData, loading }) => {
    const assets = systemData ? systemData.filter(item => ['10Y', 'JUNK', 'BANKS'].includes(item.asset)) : [];
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-sm border-b border-slate-800 pb-2"><TrendingUp className="h-4 w-4" /> YIELD CURVE & CREDIT RISK</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assets.map((asset, idx) => <IntelCard key={idx} asset={asset} />)}
                {loading && <div className="col-span-3 text-center text-blue-500 font-mono animate-pulse">&gt; CHECKING BOND MARKETS...</div>}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]"><div className="absolute top-4 left-4 z-10 bg-black/50 px-2 py-1 text-xs font-mono text-slate-300">10-YEAR YIELD</div><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" className="h-full w-full" config={{ autosize: true, symbol: "TVC:US10Y", interval: "D", theme: "dark", style: "2", locale: "en", hide_top_toolbar: true, hide_legend: true }} /></div>
                <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]"><div className="absolute top-4 left-4 z-10 bg-black/50 px-2 py-1 text-xs font-mono text-slate-300">2-YEAR YIELD</div><TVScript src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" className="h-full w-full" config={{ autosize: true, symbol: "TVC:US02Y", interval: "D", theme: "dark", style: "2", locale: "en", hide_top_toolbar: true, hide_legend: true }} /></div>
            </div>
        </div>
    );
};

const HandbookView = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('/handbook.md')
            .then(res => res.text())
            .then(text => { setContent(text); setLoading(false); })
            .catch(err => { console.error(err); setContent("# Error Loading Manual"); setLoading(false); });
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn h-[calc(100vh-120px)]">
            <LeadCaptureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <div className="hidden lg:flex flex-col col-span-1 bg-slate-900 border border-slate-800 rounded p-4">
                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-slate-100 font-bold mb-4 flex items-center gap-2"><Bookmark className="h-4 w-4 text-emerald-400" /> Chapters</h3>
                    <nav className="space-y-1 text-sm text-slate-400">
                        <div className="hover:text-white cursor-pointer p-1">Part I: Physics of Finance</div>
                        <div className="hover:text-white cursor-pointer p-1">Part II: The Debt Engine</div>
                        <div className="hover:text-white cursor-pointer p-1">Part III: Visual Intel</div>
                        <div className="hover:text-white cursor-pointer p-1">Part IV: Macro-Forensics</div>
                        <div className="hover:text-white cursor-pointer p-1">Part V: Forex & Currency</div>
                        <div className="hover:text-white cursor-pointer p-1">Part VI: Digital Assets</div>
                        <div className="hover:text-white cursor-pointer p-1">Part VII: Operational Doctrine</div>
                    </nav>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <button onClick={() => setIsModalOpen(true)} className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 text-red-400 py-3 rounded flex items-center justify-center gap-2 transition-all group">
                        <Lock className="h-4 w-4 group-hover:hidden" /><Download className="h-4 w-4 hidden group-hover:block" />
                        <span className="text-xs font-bold font-mono">DOWNLOAD FULL PDF</span>
                    </button>
                </div>
            </div>
            <div className="col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded p-8 overflow-y-auto custom-scrollbar relative">
                <div className="lg:hidden absolute top-4 right-4 z-10"><button onClick={() => setIsModalOpen(true)} className="bg-red-600 text-white p-2 rounded-full shadow-lg"><Download className="h-5 w-5" /></button></div>
                {loading ? <div className="text-center text-blue-500 font-mono animate-pulse mt-20">&gt; DECRYPTING OPERATOR MANUAL...</div> : <article className="prose prose-invert prose-slate max-w-none"><ReactMarkdown>{content}</ReactMarkdown></article>}
            </div>
        </div>
    );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [systemData, setSystemData] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState({ system_risk: 0, defcon: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBackendData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using Dynamic URL
      const response = await fetch(`${API_BASE_URL}/api/status`);
      if (!response.ok) throw new Error('API Offline');
      const data = await response.json();
      setSystemData(data.data.assets); 
      setRiskMetrics({ system_risk: data.data.system_risk, defcon: data.data.defcon });
    } catch (err) {
      console.error(err);
      setError("NO CONNECTION TO RISK CORE");
      setRiskMetrics({ system_risk: 50, defcon: 3 }); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-red-900/50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-80px)]">
        {activeTab === 'dashboard' && <DashboardView systemData={systemData} riskMetrics={riskMetrics} loading={loading} error={error} fetchBackendData={fetchBackendData} />}
        {activeTab === 'crypto' && <CryptoView systemData={systemData} loading={loading} />}
        {activeTab === 'economy' && <EconomyView systemData={systemData} loading={loading} />}
        {activeTab === 'bonds' && <BondsView systemData={systemData} loading={loading} />}
        {activeTab === 'simulation' && <BacktestView />}
        {activeTab === 'handbook' && <HandbookView />}
      </main>
    </div>
  );
}
