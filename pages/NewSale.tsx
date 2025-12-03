
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

const PAYMENT_METHODS = [
  { id: 'pix', name: 'Pix', icon: 'qr_code_2' },
  { id: 'money', name: 'Dinheiro', icon: 'payments' },
  { id: 'credit', name: 'Cartão de Crédito', icon: 'credit_card' },
  { id: 'debit', name: 'Cartão de Débito', icon: 'credit_card' },
];

interface SaleItem {
  id: string; // Changed to string to match inventory ID
  name: string;
  price: number;
  qty: number;
  img: string;
}

interface InventoryItem {
  id: string;
  type: 'product' | 'material' | 'service';
  name: string;
  price: number;
  image: string;
}

interface Customer {
  id: string;
  name: string;
  contact: { whatsapp: string };
}

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  // saleType controla qual aba está ativa (Produto ou Serviço)
  const [saleType, setSaleType] = useState<'Produtos' | 'Serviços/Encomendas'>('Produtos');
  
  // Sale State
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  
  // Data Lists (Loaded from LocalStorage)
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  // Modals State
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) setCustomersList(JSON.parse(storedCustomers));

    const storedInventory = localStorage.getItem('inventory');
    if (storedInventory) setInventoryList(JSON.parse(storedInventory));
  }, []);

  // Update Item Quantity
  const updateQty = (id: string, delta: number) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          return { ...item, qty: item.qty + delta };
        }
        return item;
      }).filter(item => item.qty > 0); // Remove items with 0 qty
    });
  };

  const addItemToSale = (product: InventoryItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        qty: 1, 
        img: product.image || 'https://picsum.photos/100/100' 
      }];
    });
    setShowItemModal(false);
  };

  const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Filtra itens do inventário baseado na aba selecionada na tela de venda
  const getFilteredInventoryForModal = () => {
    if (saleType === 'Produtos') {
      // Mostra produtos e materiais (caso queira vender insumo solto)
      return inventoryList.filter(i => i.type === 'product' || i.type === 'material');
    } else {
      // Mostra apenas serviços
      return inventoryList.filter(i => i.type === 'service');
    }
  };

  const handleSaveSale = () => {
    if (items.length === 0) {
      alert("Adicione itens à venda.");
      return;
    }
    
    // Simular salvamento e baixa de estoque
    const storedInventory = localStorage.getItem('inventory');
    if (storedInventory) {
      let currentInventory: any[] = JSON.parse(storedInventory);
      
      // Debita estoque para cada item vendido
      items.forEach(saleItem => {
        const invItemIndex = currentInventory.findIndex(i => i.id === saleItem.id);
        if (invItemIndex > -1) {
          const invItem = currentInventory[invItemIndex];
          // Só debita estoque se não for serviço
          if (invItem.type !== 'service') {
            invItem.stock = Math.max(0, (invItem.stock || 0) - saleItem.qty);
          }
        }
      });
      
      localStorage.setItem('inventory', JSON.stringify(currentInventory));
    }

    alert("Venda realizada com sucesso! Estoque atualizado.");
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background-light px-4 py-3 dark:bg-background-dark">
        <button onClick={() => navigate(-1)} className="flex size-12 shrink-0 items-center justify-start">
          <Icon name="arrow_back_ios_new" className="text-slate-900 dark:text-white" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">Nova Venda</h1>
        <div className="flex w-12 items-center justify-end gap-3">
          <button onClick={() => navigate('/')} className="text-primary" aria-label="Home">
            <Icon name="home" />
          </button>
          <button onClick={handleSaveSale} className="text-base font-bold leading-normal text-primary shrink-0">Salvar</button>
        </div>
      </div>

      <main className="flex-grow pb-32">
        {/* Segmented Control */}
        <div className="px-4 py-4">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-200 p-1 dark:bg-gray-800">
            {['Produtos', 'Serviços/Encomendas'].map((type) => (
              <label key={type} className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all ${saleType === type ? 'bg-white text-slate-900 shadow-sm dark:bg-surface-dark dark:text-white' : 'text-gray-500'}`}>
                <span className="truncate">{type}</span>
                <input 
                  type="radio" 
                  name="sale_type" 
                  value={type} 
                  checked={saleType === type} 
                  onChange={() => {
                    setSaleType(type as any);
                    // Limpa itens ao trocar de tipo para evitar misturar (opcional, mas bom para organização)
                    // setItems([]); 
                  }} 
                  className="invisible w-0" 
                />
              </label>
            ))}
          </div>
        </div>

        {/* Itens da Venda Section */}
        <div className="px-4 pb-2 pt-4">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">Itens da Venda ({saleType})</h2>
        </div>
        
        <div className="flex flex-col gap-px bg-gray-200 dark:bg-gray-800">
          {items.length === 0 && (
            <div className="bg-background-light dark:bg-background-dark px-4 py-8 text-center text-gray-500">
              Nenhum item adicionado.
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 bg-background-light px-4 py-3 dark:bg-background-dark">
              <div className="flex items-center gap-4">
                <img className="aspect-square size-14 rounded-lg object-cover" src={item.img} alt={item.name} />
                <div className="flex flex-col justify-center">
                  <p className="text-base font-medium leading-normal text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                  <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400 line-clamp-2">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <button onClick={() => updateQty(item.id, -1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 text-base font-medium leading-normal dark:bg-gray-800 dark:hover:bg-red-900/30 transition-colors">
                    <Icon name={item.qty === 1 ? "delete" : "remove"} className="text-sm" />
                  </button>
                  <span className="w-6 text-center text-base font-medium leading-normal">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-200 hover:bg-primary/20 hover:text-primary text-base font-medium leading-normal dark:bg-gray-800 transition-colors">
                    <Icon name="add" className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <div className="px-4 pt-4">
          <button 
            onClick={() => setShowItemModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 py-3 text-primary hover:bg-primary/5 transition-colors"
          >
            <Icon name="add_circle" className="text-xl" />
            <span className="text-base font-medium">Adicionar Item</span>
          </button>
        </div>

        {/* Detalhes da Venda Section */}
        <div className="px-4 pb-2 pt-8">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">Detalhes da Venda</h2>
        </div>
        <div className="flex flex-col gap-px bg-gray-200 dark:bg-gray-800">
          
          {/* Picker Cliente */}
          <button 
            onClick={() => setShowCustomerModal(true)}
            className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 bg-background-light px-4 py-2 active:bg-gray-50 dark:bg-background-dark dark:active:bg-surface-dark transition-colors"
          >
            <p className="text-base text-slate-900 dark:text-white">Cliente</p>
            <div className="flex items-center gap-2">
              <p className={`text-base ${selectedCustomer ? 'text-primary font-medium' : 'text-gray-500'}`}>
                {selectedCustomer ? selectedCustomer.name : 'Selecionar Cliente'}
              </p>
              <Icon name="arrow_forward_ios" className="text-gray-500 text-sm" />
            </div>
          </button>

          {/* Picker Forma de Pagamento */}
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 bg-background-light px-4 py-2 active:bg-gray-50 dark:bg-background-dark dark:active:bg-surface-dark transition-colors"
          >
            <p className="text-base text-slate-900 dark:text-white">Forma de Pagamento</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Icon name={paymentMethod.icon} className="text-lg" />
                <p className="text-base">{paymentMethod.name}</p>
              </div>
              <Icon name="arrow_forward_ios" className="text-gray-500 text-sm" />
            </div>
          </button>

          {/* Toggle Pago */}
          <div className="flex min-h-[56px] items-center justify-between gap-4 bg-background-light px-4 py-2 dark:bg-background-dark">
            <p className="text-base text-slate-900 dark:text-white">Venda Paga</p>
            <label className="relative inline-flex cursor-pointer items-center">
              <input defaultChecked className="peer sr-only" type="checkbox" />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
            </label>
          </div>
        </div>

        {/* Observações Section */}
        <div className="px-4 pb-2 pt-8">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">Observações</h2>
        </div>
        <div className="px-4">
          <textarea className="w-full rounded-lg border-gray-300 bg-gray-100 p-3 text-slate-900 placeholder-gray-500 focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-surface-dark dark:text-white dark:placeholder-gray-500" placeholder="Adicione notas sobre a venda..." rows={3}></textarea>
        </div>
      </main>

      {/* Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-background-light/95 backdrop-blur-sm dark:bg-background-dark/95">
        <div className="flex items-center justify-between p-4">
          <p className="text-base font-medium text-gray-500">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">R$ {total.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>


      {/* --- MODALS --- */}

      {/* 1. Item Selection Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Adicionar {saleType === 'Produtos' ? 'Produto' : 'Serviço'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-gray-500 dark:text-gray-400">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-2 space-y-2">
              {getFilteredInventoryForModal().length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhum item disponível nesta categoria.</p>
                  <button onClick={() => navigate('/products/new')} className="text-primary mt-2 font-bold">Cadastrar Novo</button>
                </div>
              ) : (
                getFilteredInventoryForModal().map((product) => (
                  <button 
                    key={product.id}
                    onClick={() => addItemToSale(product)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-left"
                  >
                    <img src={product.image || 'https://picsum.photos/100/100'} className="size-12 rounded-md object-cover" alt={product.name} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{product.name}</p>
                      <p className="text-sm text-primary font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <Icon name="add" className="text-primary bg-primary/10 rounded-full p-1" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Selecionar Cliente</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-500 dark:text-gray-400">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {customersList.length === 0 ? (
                 <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <Icon name="person_off" className="text-4xl mb-2" />
                    <p>Nenhum cliente cadastrado.</p>
                    <button 
                      onClick={() => { setShowCustomerModal(false); navigate('/customers/new'); }}
                      className="mt-4 text-primary font-bold"
                    >
                      Cadastrar Novo
                    </button>
                 </div>
              ) : (
                customersList.map((customer) => (
                  <button 
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-left border-b border-gray-100 dark:border-white/5 ${selectedCustomer?.id === customer.id ? 'bg-primary/10' : ''}`}
                  >
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                      {customer.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.contact.whatsapp}</p>
                    </div>
                    {selectedCustomer?.id === customer.id && <Icon name="check" className="text-primary" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-4">
           <div className="w-full max-w-sm bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-gray-200 dark:border-white/10">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">Forma de Pagamento</h3>
             </div>
             <div className="p-2">
               {PAYMENT_METHODS.map((method) => (
                 <button
                    key={method.id}
                    onClick={() => { setPaymentMethod(method); setShowPaymentModal(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors ${paymentMethod.id === method.id ? 'bg-primary/10' : ''}`}
                 >
                   <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full text-slate-900 dark:text-white">
                     <Icon name={method.icon} />
                   </div>
                   <span className="flex-1 text-left font-medium text-slate-900 dark:text-white">{method.name}</span>
                   {paymentMethod.id === method.id && <Icon name="check_circle" className="text-primary" />}
                 </button>
               ))}
             </div>
             <button onClick={() => setShowPaymentModal(false)} className="p-4 text-center text-red-500 font-medium border-t border-gray-200 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/10">
               Cancelar
             </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default NewSale;
