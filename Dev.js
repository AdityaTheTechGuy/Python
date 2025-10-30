import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Loader, AlertCircle, CheckCircle, Info, X, DollarSign, ClipboardCheck, Activity, BookOpen, Newspaper, Sun, Moon } from 'lucide-react';

// --- API Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5000';

// --- Helper Functions & Constants ---
const COLORS = { primary: '#10B981', secondary: '#3B82F6', neutral: '#6B7281', danger: '#EF4444', background: '#F9FAFB', card: '#FFFFFF', text: '#1F2937', subtleText: '#6B7281' };
const PIE_CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);

const formatPercentage = (value) => ${((value ?? 0) * 1).toFixed(1)}%;
const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value || 0);

// Strong numeric coercer for backend strings like "₹1,234.56", "9.9 %", etc.
const num = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[^\d.\-\+eE]/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Normalize one portfolio row to consistent keys used by the UI
const normalizePortfolioRow = (s) => {
  const price =
    s.price ?? s.current_price ?? s.entry_price ?? s.avg_price ?? s.ltp ?? 0;
  const stopLoss =
    s.stop_loss ?? s.stoploss ?? s.sl ?? s.stop ?? 0;
  const alloc =
    s.percentage_allocation ?? s.allocation_pct ?? s.alloc_percent ?? s.allocation ?? 0;
  const shares =
    s.number_of_shares ?? s.shares ?? s.qty ?? s.quantity ?? 0;
  const risk =
    s.risk ?? s.risk_amount ?? s.max_risk ?? 0;

  return {
    symbol: s.symbol || s.ticker || '',
    company: s.company || s.name || '',
    score: num(s.score),
    price: num(price),
    stop_loss: num(stopLoss),
    percentage_allocation: num(alloc),
    number_of_shares: Math.round(num(shares)),
    risk: num(risk),
  };
};

const getSentimentClasses = (sentiment) => {
  const s = (sentiment || '').toLowerCase();
  if (s.includes('bullish') || s.includes('positive')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
  if (s.includes('bearish') || s.includes('negative')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

const getGradeColor = (grade) => {
  if (!grade) return 'text-gray-500 dark:text-gray-400';
  if (grade.startsWith('A')) return 'text-green-500 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-blue-500 dark:text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
};

const getSignalClasses = (signal) => {
  if (!signal) return 'bg-gray-200 text-gray-800';
  const s = signal.toLowerCase();
  if (s.includes('strong buy')) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg';
  if (s.includes('buy')) return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
  if (s.includes('hold')) return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white';
  if (s.includes('avoid') || s.includes('sell')) return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
  return 'bg-gray-500 text-white';
};

// --- Custom Hooks ---
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => { if (!ref.current || ref.current.contains(event.target)) return; handler(event); };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('touchstart', listener); };
  }, [ref, handler]);
};

const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body = null) => {
    setLoading(true); setError(null);
    try {
      const fetchOptions = { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } };
      if (body) fetchOptions.body = JSON.stringify(body);
      const response = await fetch(${API_BASE_URL}${url}, fetchOptions);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'An unknown error occurred');
      setData(result.data);
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally { setLoading(false); }
  }, [url, JSON.stringify(options)]);

  return { data, loading, error, execute };
};

// --- Reusable UI Components ---
const Card = ({ children, className = '' }) =>
  <div className={bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 ${className}}>{children}</div>;

const Button = ({ children, onClick, className = '', variant = 'primary', disabled = false }) => {
  const base = 'px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0';
  const variants = { 
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-md hover:shadow-lg', 
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-300 dark:focus:ring-gray-600'
  };
  return <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={${base} ${variants[variant]} ${className}} disabled={disabled}>{children}</motion.button>;
};

const Input = ({ placeholder, value, onChange, type = 'text', icon }) =>
  <div className="relative">
    {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={w-full py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors}
    />
  </div>;

const Select = ({ value, onChange, children, className = '' }) =>
  <div className="relative">
    <select value={value} onChange={onChange} className={w-full py-2.5 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none ${className}}>{children}</select>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><ChevronDown className="h-4 w-4 text-gray-400" /></div>
  </div>;

const Alert = ({ message, type = 'error', className = '' }) => {
  if (!message) return null;
  const cfg = {
    error: { i: <AlertCircle className="h-5 w-5 text-red-400" />, c: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30' },
    success: { i: <CheckCircle className="h-5 w-5 text-green-400" />, c: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500/30' },
    info: { i: <Info className="h-5 w-5 text-blue-400" />, c: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500/30' }
  };
  const { i, c } = cfg[type];
  return <div className={p-4 rounded-lg border flex items-start space-x-3 ${c} ${className}}>{i}<p className="text-sm font-medium">{message}</p></div>;
};

const LoaderComponent = () =>
  <div className="flex justify-center items-center h-full min-h-[200px] w-full">
    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
      <Loader className="animate-spin h-8 w-8" /><span className="text-lg font-semibold">Loading...</span>
    </div>
  </div>;

const SkeletonLoader = () =>
  <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
    <div className="space-y-4">
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>;

const TabButton = ({ isActive, onClick, children }) =>
  <button onClick={onClick} className={px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${isActive ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}}>{children}</button>;

const EmptyState = ({ message, icon }) =>
  <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">{icon || <Info className="h-10 w-10 text-gray-400 mx-auto mb-4" />}<p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p></div>;

// --- Core Application Components ---
const Navbar = ({ setPage, theme, toggleTheme }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setOpenMenu(null));
  const navItems = [{ name: 'Home', page: 'home' }, { name: 'Stocks', page: 'stocks' }, { name: 'Swing Trading', page: 'swing', subItems: ['View All Stocks', 'Analyze Stock', 'Create Portfolio'] }, { name: 'Position Trading', page: 'position', subItems: ['View All Stocks', 'Analyze Stock', 'Create Portfolio'] }, { name: 'Compare', page: 'compare' }];
  const handleSubItemClick = (mainPage, subItem) => {
    if (subItem === 'View All Stocks') setPage('stocks');
    else if (subItem === 'Analyze Stock') setPage(analyze_${mainPage});
    else if (subItem === 'Create Portfolio') setPage(portfolio_${mainPage});
    setOpenMenu(null);
  };
  return (
    <nav className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setPage('home')}>
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-200">FinTrade</span>
          </div>
          <div className="hidden md:flex items-center space-x-2" ref={dropdownRef}>
            {navItems.map(item => (
              <div key={item.page} className="relative">
                <button
                  onClick={() => item.subItems ? setOpenMenu(openMenu === item.page ? null : item.page) : setPage(item.page)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
                >
                  {item.name}
                  {item.subItems && <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {item.subItems && openMenu === item.page && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 py-1 z-50">
                    {item.subItems.map(sub => (
                      <a
                        key={sub}
                        href="#"
                        onClick={e => { e.preventDefault(); handleSubItemClick(item.page, sub); }}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {sub}
                      </a>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage = () =>
  <div className="relative text-center p-8 py-16 md:py-24 overflow-hidden rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-green-900/30 animate-gradient-xy"></div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 dark:text-gray-100 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">Welcome to FinTrade</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">Your AI-powered platform for Swing and Position trading analysis. Get data-driven insights to make smarter investment decisions.</p>
    </motion.div>
  </div>;

const StocksListPage = ({ onStockSelect }) => {
  const { data, loading, error, execute } = useApi('/api/stocks');
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => { execute(); }, [execute]);
  const filteredStocks = data?.stocks?.filter(stock => stock.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">All Available Stocks</h2>
      <div className="mb-6">
        <Input placeholder="Search for a stock symbol..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={<Search className="h-5 w-5 text-gray-400" />} />
      </div>
      {loading && <LoaderComponent />}
      {error && <Alert message={error} />}
      {data && (
        <Card>
          <div className="max-h-[60vh] overflow-y-auto">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStocks.length > 0 ? filteredStocks.map(stock => (
                <motion.li key={stock} onClick={() => onStockSelect(stock)} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" whileHover={{ scale: 1.02 }}>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{stock}</span>
                </motion.li>
              )) : <p className="p-4 text-center text-gray-500">No stocks found.</p>}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};

// --- Analysis Detail Components ---
const DataGrid = ({ data }) => {
  if (!data || typeof data !== 'object') return <EmptyState message="No data available for this section." />;
  const validEntries = Object.entries(data).filter(([_, value]) => typeof value === 'string' || typeof value === 'number');
  if (validEntries.length === 0) return <EmptyState message="No valid data points to display." />;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {validEntries.map(([key, value]) => (
        <div key={key} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
      ))}
    </div>
  );
};

const TradingPlanTab = ({ plan }) => {
  if (!plan) return <EmptyState message="Trading plan is currently unavailable." />;
  return (
    <div className="p-2">
      <div className="text-center mb-6">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">AI Signal</p>
        <span className={px-6 py-3 text-2xl font-bold rounded-full ${getSignalClasses(plan.signal)}}>{plan.signal}</span>
      </div>
      <div className="mb-6">
        <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Strategy</h4>
        <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">{plan.strategy}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mb-6">
        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Entry Price</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(num(plan.entry_price))}</p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">Stop-Loss</p>
          <p className="text-xl font-bold text-red-800 dark:text-red-300">{formatCurrency(num(plan.stop_loss))}</p>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Profit Targets</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Target 1</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(num(plan.target_1))}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Target 2</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(num(plan.target_2))}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Target 3</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(num(plan.target_3))}</p>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Trade Management Advice</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">{plan.trailing_stop_advice}</p>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(num(payload[0].value))}</p>
      </div>
    );
  }
  return null;
};

const AnalysisSummaryTab = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="space-y-4">
        <div className="flex justify-between items-baseline p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <span className="text-gray-600 dark:text-gray-400">Current Price</span>
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(num(data.current_price))}</span>
        </div>
        <div className="flex justify-between items-baseline p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <span className="text-green-700 dark:text-green-400">Main Target Price</span>
          <span className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(num(data.target_price))}</span>
        </div>
        <div className="flex justify-between items-baseline p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-blue-700 dark:text-blue-400">Potential Return (to Main Target)</span>
          <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatPercentage(num(data.potential_return))}</span>
        </div>
      </div>
      <div className="p-4 border dark:border-gray-700 rounded-lg">
        <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Analysis Scorecard</h4>
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-600 dark:text-gray-400">Investment Grade</span>
          <span className={font-bold text-lg ${getGradeColor(data.investment_grade)}}>{data.investment_grade}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">AI Score</span>
          <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{(num(data.overall_score)).toFixed(2)} / 100</span>
        </div>
      </div>
    </div>
  );
};

const SentimentNewsTab = ({ data }) => {
  const { mda_tone, mda_score, ...marketSentiment } = data.sentiment || {};
  return (
    <div>
      <h3 className="text-xl font-bold mb-4 dark:text-gray-200">Market Sentiment</h3>
      <DataGrid data={marketSentiment} />
      {data.system_type === 'Position' && mda_tone && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 dark:text-gray-200">Management Analysis (MDA) Tone</h3>
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{mda_tone}</p>
            {mda_score && <p className="text-sm text-gray-500 dark:text-gray-400">Score: {num(mda_score).toFixed(2)}</p>}
          </Card>
        </div>
      )}
    </div>
  );
};

const AnalysisCard = ({ data, loading }) => {
  const [activeTab, setActiveTab] = useState('plan');
  if (loading) return <SkeletonLoader />;
  if (!data) return null;

  const baseTabs = [
    { id: 'plan', label: 'Trading Plan', icon: <ClipboardCheck className="h-4 w-4 mr-2" /> },
    { id: 'summary', label: 'Summary', icon: <Info className="h-4 w-4 mr-2" /> },
    { id: 'technicals', label: 'Technicals', icon: <Activity className="h-4 w-4 mr-2" /> },
    { id: 'fundamentals', label: 'Fundamentals', icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { id: 'sentiment', label: 'Sentiment', icon: <Newspaper className="h-4 w-4 mr-2" /> }
  ];
  const tabs = data.system_type === 'Swing' ? baseTabs.filter(tab => tab.id !== 'fundamentals') : baseTabs;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.company_name}</h3>
            <p className="font-mono text-lg text-blue-600 dark:text-blue-400">{data.symbol}</p>
          </div>
          <span className={px-3 py-1 text-sm font-semibold rounded-full ${getSentimentClasses(data.sentiment?.overall_sentiment)}}>{data.sentiment?.overall_sentiment || 'Neutral'}</span>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {tabs.map(tab => <TabButton key={tab.id} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}><span className="flex items-center">{tab.icon}{tab.label}</span></TabButton>)}
          </nav>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'plan' && <TradingPlanTab plan={data.trading_plan} />}
            {activeTab === 'summary' && <AnalysisSummaryTab data={data} />}
            {activeTab === 'technicals' && <DataGrid data={data.technical_indicators} />}
            {activeTab === 'fundamentals' && <DataGrid data={data.fundamentals} />}
            {activeTab === 'sentiment' && <SentimentNewsTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

const AnalysisPage = ({ type }) => {
  const [symbol, setSymbol] = useState('');
  const { data, loading, error, execute } = useApi(/api/analyze/${type}/${symbol}, { method: 'GET' });
  const handleAnalyze = e => { e.preventDefault(); if (symbol.trim()) execute(); };
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 capitalize">{type} Trading Analysis</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Enter a stock symbol to get a detailed AI-powered analysis.</p>
      <form onSubmit={handleAnalyze} className="flex items-center gap-4 mb-6">
        <div className="flex-grow">
          <Input placeholder="e.g., RELIANCE.NS" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} icon={<Search className="h-5 w-5 text-gray-400" />} />
        </div>
        <Button onClick={handleAnalyze} disabled={loading || !symbol.trim()}>{loading ? <Loader className="animate-spin h-5 w-5" /> : 'Analyze'}</Button>
      </form>
      {error && <Alert message={error} />}
      <AnalysisCard data={data} loading={loading} />
    </div>
  );
};

const PortfolioResults = ({ data, loading }) => {
  if (loading) return <SkeletonLoader />;
  if (!data || !data.portfolio || data.portfolio.length === 0) {
    return <EmptyState message="No portfolio to display. Adjust your criteria and try again." className="mt-8" />;
  }
  const { portfolio, summary } = data;

  // Normalize all rows once for consistent rendering
  const rows = portfolio.map(normalizePortfolioRow);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Personalized Portfolio</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card>
          <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Total Budget</h4>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(num(summary.total_budget))}</p>
        </Card>
        <Card>
          <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Total Allocated</h4>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(num(summary.total_allocated))}</p>
        </Card>
        <Card>
          <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Positions</h4>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">{summary.diversification}</p>
        </Card>
        <Card>
          <h4 className="font-bold text-lg mb-2 dark:text-gray-200">Avg. Score</h4>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">{num(summary.average_score).toFixed(1)} / 100</p>
        </Card>
      </div>
      <Card>
        <h4 className="font-bold text-lg mb-4 dark:text-gray-200">Stock Allocations</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Score</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Price</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Stop Loss</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Allocation</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Shares</th>
                <th className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((s, index) => (
                <tr key={s.symbol || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="p-3 text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">{s.symbol}</td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">{s.company}</td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200 text-right">{s.score ? s.score.toFixed(0) : 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200 text-right">{formatCurrency(num(s.price))}</td>
                  <td className="p-3 text-sm text-red-600 dark:text-red-400 text-right">{formatCurrency(num(s.stop_loss))}</td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200 text-right">{formatPercentage(num(s.percentage_allocation))}</td>
                  <td className="p-3 text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{formatNumber(num(s.number_of_shares))}</td>
                  <td className="p-3 text-sm text-gray-800 dark:text-gray-200 text-right">{formatCurrency(num(s.risk))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

const PortfolioPage = ({ type }) => {
  const [budget, setBudget] = useState('100000');
  const [risk, setRisk] = useState('MEDIUM');
  const [timePeriod, setTimePeriod] = useState('18');
  const { data, loading, error, execute } = useApi(/api/portfolio/${type}, { method: 'POST' });

  const handleSubmit = e => {
    e.preventDefault();
    const p = { budget: parseFloat(budget), risk_appetite: risk };
    if (type === 'position') p.time_period = parseInt(timePeriod, 10);
    execute(p);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2 capitalize">{type} Portfolio Builder</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Create a personalized portfolio based on your financial goals.</p>
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Budget (INR)</label>
            <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 100000" />
          </div>
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Risk Appetite</label>
            <Select value={risk} onChange={e => setRisk(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </div>
          {type === 'position' &&
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Time Period</label>
              <Select value={timePeriod} onChange={e => setTimePeriod(e.target.value)}>
                <option value="9">9 Months</option>
                <option value="18">18 Months</option>
                <option value="36">36 Months</option>
                <option value="60">60 Months</option>
              </Select>
            </div>
          }
          <div className={type === 'swing' ? 'md:col-start-3' : ''}>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : 'Build Portfolio'}
            </Button>
          </div>
        </form>
      </Card>
      {error && <Alert message={error} className="mt-6" />}
      <PortfolioResults data={data} loading={loading} />
    </div>
  );
};

const ComparePage = ({ initialSymbol, onSymbolChange }) => {
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const { data, loading, error, execute } = useApi(/api/compare/${symbol});

  const executeComparison = useCallback(() => {
    if (symbol.trim()) {
      execute();
    }
  }, [symbol, execute]);

  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (symbol) {
      executeComparison();
    }
  }, [symbol, executeComparison]);

  const handleCompare = e => {
    e.preventDefault();
    if (symbol.trim()) {
      onSymbolChange('');
      executeComparison();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Compare Trading Strategies</h2>
          <p className="text-gray-600 dark:text-gray-400">Get a side-by-side view of Swing and Position trading analysis for a stock.</p>
        </div>
      </div>
      <form onSubmit={handleCompare} className="flex items-center gap-4 mb-6">
        <div className="flex-grow">
          <Input
            placeholder="e.g., TATASTEEL.NS"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            icon={<Search className="h-5 w-5 text-gray-400" />}
          />
        </div>
        <Button onClick={handleCompare} disabled={loading || !symbol.trim()}>
          {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Compare'}
        </Button>
      </form>
      {error && <Alert message={error} />}
      {loading && <SkeletonLoader />}
      {data &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">Swing Analysis</h3>
            <AnalysisCard data={data.swing_analysis} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-center mb-4 text-green-600 dark:text-green-400">Position Analysis</h3>
            <AnalysisCard data={data.position_analysis} />
          </div>
        </motion.div>
      }
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [page, setPage] = useState('home');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleStockSelection = (symbol) => {
    setSelectedSymbol(symbol);
    setPage('compare');
  };

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'stocks': return <StocksListPage onStockSelect={handleStockSelection} />;
      case 'analyze_swing': return <AnalysisPage type="swing" />;
      case 'analyze_position': return <AnalysisPage type="position" />;
      case 'portfolio_swing': return <PortfolioPage type="swing" />;
      case 'portfolio_position': return <PortfolioPage type="position" />;
      case 'compare': return <ComparePage initialSymbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar setPage={setPage} theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;