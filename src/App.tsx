import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Activity, Globe, DollarSign, Briefcase, FileText, 
  TrendingUp, AlertTriangle, Menu, X, Zap, Cpu, Wifi, Terminal, 
  RefreshCw, ShieldAlert, Skull
} from 'lucide-react';

/**
 * US Economic Watchtower v6 (Doomsday Edition)
 * - Features "System Risk Score" and DEFCON levels
 * - "SitRep" only shows actionable threats
 */

// --- Component: Header ---
const Header = ({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Watchtower', icon: ShieldAlert },
    { id: 'crypto', label: 'Crypto', icon: Zap },
    { id: 'economy', label: 'Macro', icon: Globe },
    { id: 'bonds', label: 'Bonds', icon: TrendingUp },
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

// --- Helper: TradingView Widget ---
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

// --- Component: Doomsday Clock Face ---
const DoomsdayClock = ({ risk, defcon }) => {
    // Risk 0-100 mapped to rotation (0 = -90deg, 100 = 0deg/Midnight)
    const rotation = -90 + (risk * 0.9); 
    
    let color = "text-emerald-500";
    if (defcon <= 3) color = "text-yellow-500";
    if (defcon <= 2) color = "text-orange-600";
    if (defcon === 1) color = "text-red-600 animate-pulse";

    return (
        <div className="relative w-64 h-32 overflow-hidden mx-auto mt-6">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-60 h-60 border-t-[20px] border-l-[20px] border-r-[20px] border-slate-800 rounded-full box-border"></div>
            {/* The Hand */}
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

// --- View: Market Dashboard ---
const DashboardView = () => {
  const [systemData, setSystemData] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState({ system_risk: 0, defcon: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBackendData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('API Offline');
      const data = await response.json();
      setSystemData(data.data.assets); 
      setRiskMetrics({ system_risk: data.data.system_risk, defcon: data.data.defcon });
    } catch (err) {
      setError("NO CONNECTION TO RISK CORE");
      setRiskMetrics({ system_risk: 50, defcon: 3 }); // Fallback visual
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  // Filter for only critical info
  const criticalUpdates = systemData ? systemData.filter(i => i.signal === 'WARNING' || i.signal === 'CRITICAL') : [];

  return (
    <div className="space-y-8 animate-fadeIn text-slate-300">
      
      {/* SECTION 1: THE WAR ROOM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Clock Panel */}
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
                <div>
                    CRASH PROBABILITY
                    <div className="text-slate-300 text-lg">{(riskMetrics.system_risk * 1.2).toFixed(0)}%</div>
                </div>
                <div>
                    DATA LATENCY
                    <div className="text-emerald-500">LIVE</div>
                </div>
            </div>
        </div>

        {/* The SITREP (Situation Report) */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/50 rounded-sm border border-slate-800 p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-slate-100 font-mono font-bold text-lg flex items-center gap-2 uppercase tracking-wider">
                    <Terminal className="h-5 w-5 text-blue-500" /> 
                    SitRep <span className="text-xs text-slate-500 normal-case font-sans">(Situation Report)</span>
                </h2>
                <button onClick={fetchBackendData} className="text-xs text-slate-500 hover:text-white flex items-center gap-2">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> RELOAD INTEL
                </button>
            </div>

            <div className="space-y-3 h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-400 font-mono text-sm">
                        !! SYSTEM ERROR: {error} !!<br/>
                        &gt; Ensure python backend is running on port 8000
                    </div>
                )}
                
                {criticalUpdates.length > 0 ? (
                    criticalUpdates.map((item, idx) => (
                        <div key={idx} className="bg-red-900/10 border-l-2 border-red-500 p-3">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-red-400 font-mono text-sm">[{item.asset}] ALERT</span>
                                <span className="text-xs text-red-900/50 font-mono">{item.timestamp}</span>
                            </div>
                            <div className="text-slate-200 font-medium mt-1 text-sm">{item.details}</div>
                            <div className="mt-2 text-xs font-mono text-red-400/70 uppercase">
                                Signal: {item.signal} | Trend: {item.trend}
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && !error && (
                        <div className="p-4 bg-emerald-900/10 border border-emerald-900/30 text-emerald-400 font-mono text-sm text-center opacity-70">
                            &gt; NO CRITICAL THREATS DETECTED.<br/>
                            &gt; ALL MONITORED SECTORS WITHIN STABLE PARAMETERS.<br/>
                            &gt; STANDING BY...
                        </div>
                    )
                )}
                {loading && <div className="text-blue-500 font-mono text-sm animate-pulse">&gt; Scanning global markets...</div>}
            </div>
        </div>
      </div>

      {/* SECTION 2: RAW INTEL (Charts) */}
      <h3 className="text-slate-500 font-mono text-xs uppercase tracking-widest border-b border-slate-800 pb-2">Surveillance Feeds</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]">
          <TVScript 
            src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            className="h-full w-full"
            config={{ autosize: true, symbol: "SP:SPX", interval: "D", theme: "dark", style: "1", locale: "en", hide_top_toolbar: true, hide_legend: true }}
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-1 h-[400px]">
           <TVScript 
            src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
            className="h-full w-full"
            config={{ symbol: "HYG", width: "100%", height: "100%", locale: "en", dateRange: "12M", colorTheme: "dark", isTransparent: true, autosize: true }}
          />
          <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 text-xs font-mono text-red-500 border border-red-900">SUBPRIME / JUNK BONDS</div>
        </div>
      </div>
    </div>
  );
};

// --- Simplified Tab Views ---
const SimpleView = ({ title }) => (
    <div className="flex items-center justify-center h-64 border border-slate-800 border-dashed rounded text-slate-600 font-mono uppercase">
        {title} Module Offline
    </div>
);

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans selection:bg-red-900/50">
      <Header 
        activeTab={activeTab} setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'crypto' && <SimpleView title="Crypto" />}
        {activeTab === 'economy' && <SimpleView title="Macro" />}
        {activeTab === 'bonds' && <SimpleView title="Bonds" />}
      </main>
    </div>
  );
}