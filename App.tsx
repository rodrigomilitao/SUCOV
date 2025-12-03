
import React from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import NewQuote from './pages/NewQuote';
import NewProduct from './pages/NewProduct';
import Inventory from './pages/Inventory';
import ProductionPlanner from './pages/ProductionPlanner';
import NewSale from './pages/NewSale';
import NewCustomer from './pages/NewCustomer';

// Shared Layout Components
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const btnClass = (path: string) => 
    `flex flex-col items-center justify-center gap-1 w-20 transition-colors ${isActive(path) ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`;

  // Hide bottom nav on specific "Create" pages to focus user attention, similar to native apps
  // Also hide on edit pages (which share the same path structure or contain IDs)
  const isDetailOrFormPage = 
    location.pathname.includes('/new') || 
    (location.pathname.includes('/customers/') && location.pathname !== '/customers') ||
    (location.pathname.includes('/products/') && location.pathname !== '/products'); // Added logic for product edit

  if (isDetailOrFormPage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 backdrop-blur-sm border-t border-slate-200 dark:border-white/10 pb-safe z-50">
      <div className="flex justify-around p-2">
        <button onClick={() => navigate('/')} className={btnClass('/')}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/') ? "'FILL' 1" : "'FILL' 0" }}>home</span>
          <span className="text-xs font-bold">Início</span>
        </button>
        <button onClick={() => navigate('/production')} className={btnClass('/production')}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/production') ? "'FILL' 1" : "'FILL' 0" }}>calendar_month</span>
          <span className="text-xs">Planner</span>
        </button>
        <button onClick={() => navigate('/sales/new')} className={btnClass('/sales/new')}>
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          <span className="text-xs">Venda</span>
        </button>
        <button onClick={() => navigate('/inventory')} className={btnClass('/inventory')}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isActive('/inventory') ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
          <span className="text-xs">Estoque</span>
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/customers/:id" element={<NewCustomer />} />
          <Route path="/quotes/new" element={<NewQuote />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/:id" element={<NewProduct />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/production" element={<ProductionPlanner />} />
          <Route path="/sales/new" element={<NewSale />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
};

export default App;