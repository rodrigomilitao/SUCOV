
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

interface InventoryItem {
  id: string;
  type: 'material' | 'product' | 'service';
  name: string;
  price: number;
  stock: number;
  image?: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'material' | 'service'>('product');
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar do LocalStorage
    const stored = localStorage.getItem('inventory');
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      // Mock inicial se vazio para não ficar tela em branco na primeira vez
      const mocks: InventoryItem[] = [
        { id: '1', type: 'product', name: "Caderno Artesanal A5", price: 89.90, stock: 5, image: "https://picsum.photos/100/100?random=1" },
        { id: '2', type: 'material', name: "Papel Pólen 90g (pct 100)", price: 45.00, stock: 20, image: "https://picsum.photos/100/100?random=2" },
        { id: '3', type: 'service', name: "Design de Capa Personalizada", price: 120.00, stock: 9999, image: "https://picsum.photos/100/100?random=3" },
      ];
      localStorage.setItem('inventory', JSON.stringify(mocks));
      setItems(mocks);
    }
  }, []);

  const filteredItems = items.filter(item => 
    item.type === activeTab && 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (item: InventoryItem) => {
    if (item.type === 'service') return 'blue';
    if (item.stock === 0) return 'red';
    if (item.stock < 5) return 'yellow';
    return 'green';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.type === 'service') return 'Disponível';
    if (item.stock === 0) return 'Esgotado';
    if (item.stock < 5) return 'Estoque Baixo';
    return 'Em Estoque';
  };

  return (
    <div className="flex flex-col w-full h-full pb-20">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-200/10 dark:border-white/10">
        <div className="flex size-12 shrink-0 items-center">
          <button 
            onClick={() => navigate('/')} 
            className="flex size-12 items-center justify-start text-slate-900 dark:text-white"
            aria-label="Voltar ao Início"
          >
            <Icon name="arrow_back_ios_new" className="text-2xl" />
          </button>
        </div>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Gestão de Estoque</h1>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-slate-900 dark:text-white gap-2 min-w-0 p-0">
            <Icon name="more_vert" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-10 bg-background-light dark:bg-background-dark">
        <div className="border-b border-gray-200/20 dark:border-white/20 px-4">
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveTab('product')}
              className={`flex flex-col items-center justify-center border-b-[3px] ${activeTab === 'product' ? 'border-b-primary text-primary' : 'border-b-transparent text-gray-500 dark:text-gray-400'} pb-[13px] pt-4 flex-1 transition-colors`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">Produtos</p>
            </button>
            <button 
              onClick={() => setActiveTab('material')}
              className={`flex flex-col items-center justify-center border-b-[3px] ${activeTab === 'material' ? 'border-b-primary text-primary' : 'border-b-transparent text-gray-500 dark:text-gray-400'} pb-[13px] pt-4 flex-1 transition-colors`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">Matéria-Prima</p>
            </button>
            <button 
              onClick={() => setActiveTab('service')}
              className={`flex flex-col items-center justify-center border-b-[3px] ${activeTab === 'service' ? 'border-b-primary text-primary' : 'border-b-transparent text-gray-500 dark:text-gray-400'} pb-[13px] pt-4 flex-1 transition-colors`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">Serviços</p>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-gray-500 dark:text-gray-400 flex border-none bg-gray-100 dark:bg-[#234848] items-center justify-center pl-4 rounded-l-lg border-r-0">
              <Icon name="search" />
            </div>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-gray-100 dark:bg-[#234848] focus:border-none h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal" 
              placeholder="Buscar item..." 
            />
          </div>
        </label>
      </div>

      <div className="h-2 bg-background-light dark:bg-background-dark"></div>

      {/* Item List */}
      <div className="flex flex-col gap-px min-h-[300px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Icon name="inventory_2" className="text-4xl mb-2 opacity-50" />
            <p>Nenhum item encontrado nesta categoria.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const statusColor = getStatusColor(item);
            return (
              <button 
                key={item.id} 
                onClick={() => navigate(`/products/${item.id}`)}
                className="w-full flex gap-4 bg-background-light dark:bg-background-dark px-4 py-3 justify-between items-center border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[60px]" 
                    style={{ backgroundImage: `url("${item.image}")` }}
                  ></div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-slate-900 dark:text-white text-base font-medium leading-normal line-clamp-1">{item.name}</p>
                    {item.type !== 'service' && (
                       <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Estoque: {item.stock}</p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">R$ {item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="flex items-center justify-center">
                    <div className={`flex items-center justify-center gap-1.5 rounded-full bg-${statusColor}-500/10 px-2.5 py-1`}>
                      <div className={`size-2 rounded-full bg-${statusColor}-500`}></div>
                      <p className={`text-xs font-medium text-${statusColor}-500`}>{getStatusText(item)}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-6">
        <button onClick={() => navigate('/products/new')} className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          <Icon name="add" className="text-3xl text-background-dark" />
        </button>
      </div>
    </div>
  );
};

export default Inventory;