
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';

interface QuoteItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  contact: { whatsapp: string; email: string };
}

interface InventoryItem {
  id: string;
  type: 'product' | 'material' | 'service';
  name: string;
  price: number;
  image?: string;
}

const PAYMENT_METHODS = [
  { id: 'pix', name: 'Pix', icon: 'qr_code_2' },
  { id: 'money', name: 'Dinheiro', icon: 'payments' },
  { id: 'credit', name: 'Cartão de Crédito', icon: 'credit_card' },
  { id: 'debit', name: 'Cartão de Débito', icon: 'credit_card' },
];

const NewQuote: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdParam = searchParams.get('customerId');

  // Client State
  const [clientType, setClientType] = useState('Novo Cliente');
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Quote Data
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', name: 'Bolsa de Crochê Sol', qty: 1, price: 85.00 }
  ]);
  const [validity, setValidity] = useState('Válido por 30 dias');
  const [notes, setNotes] = useState('');
  
  // Payment & Financials
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [payOnPickup, setPayOnPickup] = useState(false);

  // Data Lists
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  // UI State
  const [loadingPdf, setLoadingPdf] = useState(false);
  
  // Modals
  const [showExtraItemModal, setShowExtraItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Extra Item Form
  const [extraItemData, setExtraItemData] = useState({ name: '', price: '', qty: '1' });

  // --- Effects ---

  // Load Data
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) setCustomersList(JSON.parse(storedCustomers));

    const storedInventory = localStorage.getItem('inventory');
    if (storedInventory) setInventoryList(JSON.parse(storedInventory));
  }, []);

  // Handle URL Param for Customer
  useEffect(() => {
    if (customerIdParam && customersList.length > 0) {
      const customer = customersList.find(c => c.id === customerIdParam);
      if (customer) {
        selectCustomer(customer);
      }
    }
  }, [customerIdParam, customersList]);

  // --- Logic ---

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const selectCustomer = (customer: Customer) => {
    setClientType('Cliente Existente');
    setClientData({
      name: customer.name,
      phone: customer.contact.whatsapp,
      email: customer.contact.email
    });
  };

  const saveNewCustomerToDb = () => {
    if (!clientData.name) return alert("Preencha o nome do cliente.");
    
    const newCustomer = {
      id: Date.now().toString(),
      type: 'PF',
      name: clientData.name,
      document: '',
      contact: { whatsapp: clientData.phone, email: clientData.email },
      address: { street: '', city: '', state: '' },
      notes: ''
    };

    const newGenericList = [...customersList, newCustomer];
    // @ts-ignore - simplified for this view
    setCustomersList(newGenericList);
    localStorage.setItem('customers', JSON.stringify(newGenericList));
    
    setClientType('Cliente Existente');
    alert("Cliente salvo no banco de dados!");
  };

  const addItemFromStock = (product: InventoryItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        qty: 1, 
        price: product.price 
      }];
    });
    setShowStockModal(false);
  };

  const handleAddExtraItem = () => {
    if (!extraItemData.name || !extraItemData.price) return;
    
    setItems([
      ...items,
      {
        id: `extra-${Date.now()}`,
        name: extraItemData.name,
        qty: parseFloat(extraItemData.qty) || 1,
        price: parseFloat(extraItemData.price)
      }
    ]);
    
    setExtraItemData({ name: '', price: '', qty: '1' });
    setShowExtraItemModal(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  const hasDiscount = ['pix', 'money'].includes(paymentMethod.id) && discountPercent;
  const discountValue = hasDiscount ? (subtotal * (parseFloat(discountPercent) / 100)) : 0;
  
  const total = subtotal - discountValue;

  const handleGenerateAndSend = () => {
    setLoadingPdf(true);
    
    setTimeout(() => {
      setLoadingPdf(false);
      
      const phoneClean = clientData.phone.replace(/\D/g, '');
      const storeName = localStorage.getItem('atelie_name') || "Ateliê";
      
      const itemsListStr = items.map(i => `${i.qty}x ${i.name} - R$ ${i.price.toFixed(2)}`).join('%0A');
      
      let message = `Olá, ${clientData.name}!%0A%0AAqui está o seu orçamento do *${storeName}*.%0A%0A*Itens:*%0A${itemsListStr}%0A`;
      
      message += `%0ASubtotal: R$ ${subtotal.toFixed(2)}`;
      
      if (hasDiscount) {
        message += `%0ADesconto (${discountPercent}%): - R$ ${discountValue.toFixed(2)}`;
      }
      
      message += `%0A*Total: R$ ${total.toFixed(2)}*%0A`;
      
      message += `%0AForma de Pagamento: ${paymentMethod.name}`;
      if (payOnPickup) message += ` (Pagar na retirada)`;
      
      message += `%0AValidade: ${validity}`;
      if (notes) message += `%0AObs: ${notes}`;
      
      message += `%0A%0AAguardamos seu retorno!`;

      if (phoneClean) {
        window.open(`https://wa.me/55${phoneClean}?text=${message}`, '_blank');
      } else {
        alert("Número de telefone não encontrado para envio. O link seria:\n" + decodeURIComponent(message));
      }

    }, 1500);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden pb-12">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-200/10 dark:border-white/10">
        <button onClick={() => navigate(-1)} className="flex w-16 items-center">
          <p className="text-primary text-base font-medium leading-normal shrink-0">Cancelar</p>
        </button>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Novo Orçamento</h1>
        <div className="flex w-16 items-center justify-end gap-3">
          <button onClick={() => navigate('/')} className="text-primary/50 dark:text-primary/60" aria-label="Home">
            <Icon name="home" />
          </button>
          <button className="text-primary/50 dark:text-primary/60 text-base font-bold leading-normal tracking-[0.015em] shrink-0">Salvar</button>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-4 pb-48">
        
        {/* Section 1: Client Information */}
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">Informações do Cliente</h2>
        
        {/* Segmented Buttons */}
        <div className="flex py-3">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-primary/20 p-1">
            {['Novo Cliente', 'Cliente Existente'].map((type) => (
              <label key={type} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 ${clientType === type ? 'bg-background-light dark:bg-background-dark shadow-sm text-slate-900 dark:text-white' : 'text-primary'} transition-all text-sm font-medium leading-normal`}>
                <span className="truncate">{type}</span>
                <input 
                  type="radio" 
                  name="client_type" 
                  value={type} 
                  checked={clientType === type}
                  onChange={() => {
                    setClientType(type);
                    if (type === 'Novo Cliente') {
                      setClientData({ name: '', phone: '', email: '' });
                    }
                  }}
                  className="invisible w-0" 
                />
              </label>
            ))}
          </div>
        </div>

        {/* Client Inputs */}
        {clientType === 'Cliente Existente' ? (
           <button 
             onClick={() => setShowCustomerModal(true)}
             className="flex items-center justify-between w-full p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 mb-4"
           >
             <div className="flex flex-col items-start">
               <span className="text-sm text-gray-500">Cliente Selecionado</span>
               <span className={`text-lg font-bold ${clientData.name ? 'text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                 {clientData.name || "Toque para buscar..."}
               </span>
             </div>
             <Icon name="search" className="text-primary text-2xl" />
           </button>
        ) : (
          <div className="flex flex-col gap-3 pb-3">
             <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 flex items-start gap-2">
                <Icon name="info" className="text-orange-500 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-200">Preencha os dados abaixo. Você poderá salvar este cliente no banco de dados.</p>
             </div>
             <label className="flex flex-col flex-1">
              <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">Nome</p>
              <input 
                value={clientData.name}
                onChange={(e) => setClientData({...clientData, name: e.target.value})}
                className="form-input flex w-full rounded-lg text-slate-900 dark:text-white border border-primary/30 bg-primary/10 dark:bg-surface-dark focus:border-primary h-14 px-4" 
                placeholder="Insira o nome completo" 
              />
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col flex-1 min-w-[140px]">
                <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">Telefone</p>
                <input 
                  value={clientData.phone}
                  onChange={(e) => setClientData({...clientData, phone: maskPhone(e.target.value)})}
                  maxLength={15}
                  className="form-input flex w-full rounded-lg text-slate-900 dark:text-white border border-primary/30 bg-primary/10 dark:bg-surface-dark focus:border-primary h-14 px-4" 
                  placeholder="(XX) XXXXX-XXXX" 
                />
              </label>
              <label className="flex flex-col flex-1 min-w-[140px]">
                <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">E-mail</p>
                <input 
                  value={clientData.email}
                  onChange={(e) => setClientData({...clientData, email: e.target.value})}
                  className="form-input flex w-full rounded-lg text-slate-900 dark:text-white border border-primary/30 bg-primary/10 dark:bg-surface-dark focus:border-primary h-14 px-4" 
                  placeholder="exemplo@email.com" 
                />
              </label>
            </div>
            <button 
              onClick={saveNewCustomerToDb}
              className="mt-2 w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="person_add" />
              Salvar no Banco de Dados
            </button>
          </div>
        )}

        {/* Section 2: Quote Items */}
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-6">Itens do Orçamento</h2>
        <div className="flex flex-col gap-3 py-3">
          {items.length === 0 && (
             <p className="text-center text-gray-400 py-4 italic">Nenhum item adicionado</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl p-3 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex-1">
                <p className="text-slate-800 dark:text-white font-semibold line-clamp-1">{item.name}</p>
                <div className="flex items-center text-slate-600 dark:text-gray-300 text-sm gap-1">
                   <span>{item.qty} x</span>
                   <span>R$ {item.price.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-slate-800 dark:text-white font-bold whitespace-nowrap">R$ {(item.qty * item.price).toFixed(2)}</p>
              <button onClick={() => removeItem(item.id)} className="text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
                <Icon name="delete" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <button 
            onClick={() => setShowStockModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 text-primary py-3 hover:bg-primary/5 transition-colors"
          >
            <Icon name="inventory_2" />
            <span className="font-bold">Selecionar do Estoque</span>
          </button>
          
          <button 
            onClick={() => setShowExtraItemModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-surface-dark text-slate-700 dark:text-white py-3 hover:bg-gray-200 dark:hover:bg-surface-dark/80 transition-colors"
          >
            <Icon name="post_add" />
            <span className="font-bold">Adicionar Taxa / Item Extra</span>
          </button>
        </div>

        {/* Section 3: Payment & Options */}
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-8">Pagamento & Entrega</h2>
        
        <div className="flex flex-col gap-3">
           {/* Payment Picker */}
           <button 
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center justify-between w-full p-3 bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-background-dark p-2 rounded-full text-slate-700 dark:text-white">
                  <Icon name={paymentMethod.icon} />
                </div>
                <span className="text-slate-900 dark:text-white font-medium">{paymentMethod.name}</span>
              </div>
              <Icon name="arrow_drop_down" className="text-gray-400 text-2xl" />
            </button>
            
            {/* Pay on Pickup */}
            <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10">
               <span className="text-slate-900 dark:text-white font-medium">Pagar na retirada</span>
               <label className="relative inline-flex cursor-pointer items-center">
                <input 
                  type="checkbox" 
                  checked={payOnPickup} 
                  onChange={(e) => setPayOnPickup(e.target.checked)} 
                  className="peer sr-only" 
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
            </div>
        </div>

        {/* Details */}
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-8">Detalhes</h2>
        <div className="flex flex-col gap-4 py-3">
          <label className="flex flex-col flex-1">
            <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">Validade</p>
            <input 
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              className="form-input flex w-full rounded-lg text-slate-900 dark:text-white border border-primary/30 bg-primary/10 dark:bg-surface-dark focus:border-primary h-12 px-4" 
            />
          </label>
          <label className="flex flex-col flex-1">
            <p className="text-slate-800 dark:text-white text-base font-medium leading-normal pb-2">Observações</p>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea flex w-full rounded-lg text-slate-900 dark:text-white border border-primary/30 bg-primary/10 dark:bg-surface-dark focus:border-primary h-24 p-3" 
              placeholder="Adicione notas para o cliente"
            />
          </label>
        </div>
      </div>

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-white/10 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        
        {/* Discount Section (Conditional) */}
        {['pix', 'money'].includes(paymentMethod.id) && (
           <div className="mb-3 flex items-center justify-between gap-4">
             <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Desconto à vista (%)</span>
             <div className="relative w-24">
                <input 
                  type="number" 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-right pr-8 focus:ring-primary focus:border-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
             </div>
           </div>
        )}

        <div className="flex flex-col gap-1 mb-4">
          <div className="flex justify-between items-center text-slate-600 dark:text-gray-400 text-sm">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {hasDiscount && (
            <div className="flex justify-between items-center text-green-600 dark:text-green-400 text-sm font-medium">
              <span>Desconto ({discountPercent}%)</span>
              <span>- R$ {discountValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-900 dark:text-white text-xl font-bold mt-1">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
        
        <button 
          onClick={handleGenerateAndSend}
          disabled={loadingPdf}
          className="w-full bg-primary text-background-dark hover:bg-primary/90 rounded-xl h-14 text-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {loadingPdf ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Gerando...
            </>
          ) : (
            <>
              <Icon name="ios_share" />
              Gerar e Enviar (WhatsApp)
            </>
          )}
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Adicionar Item Extra */}
      {showExtraItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col p-4 gap-4 animate-in slide-in-from-bottom-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adicionar Item Extra / Taxa</h3>
            
            <label className="flex flex-col">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Descrição</span>
              <input 
                autoFocus
                value={extraItemData.name}
                onChange={(e) => setExtraItemData({...extraItemData, name: e.target.value})}
                className="form-input rounded-lg border-gray-300 dark:border-gray-600 dark:bg-surface-dark dark:text-white" 
                placeholder="Ex: Taxa de Entrega"
              />
            </label>
            
            <div className="flex gap-4">
              <label className="flex flex-col flex-1">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Quantidade</span>
                <input 
                  type="number"
                  value={extraItemData.qty}
                  onChange={(e) => setExtraItemData({...extraItemData, qty: e.target.value})}
                  className="form-input rounded-lg border-gray-300 dark:border-gray-600 dark:bg-surface-dark dark:text-white" 
                  placeholder="1"
                />
              </label>
              <label className="flex flex-col flex-1">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Valor Unit. (R$)</span>
                <input 
                  type="number"
                  value={extraItemData.price}
                  onChange={(e) => setExtraItemData({...extraItemData, price: e.target.value})}
                  className="form-input rounded-lg border-gray-300 dark:border-gray-600 dark:bg-surface-dark dark:text-white" 
                  placeholder="0,00"
                />
              </label>
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setShowExtraItemModal(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-surface-dark text-slate-900 dark:text-white font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddExtraItem}
                className="flex-1 py-3 rounded-lg bg-primary text-background-dark font-bold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Stock */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Selecionar do Estoque</h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-500">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
               {inventoryList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Estoque vazio.</p>
                  </div>
               ) : (
                  inventoryList.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => addItemFromStock(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark text-left border-b border-gray-100 dark:border-white/5"
                    >
                      <img src={item.image || 'https://picsum.photos/100'} className="size-10 rounded-md object-cover" alt="" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                        <p className="text-xs text-primary font-bold">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <Icon name="add_circle" className="text-primary" />
                    </button>
                  ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Customers */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clientes Cadastrados</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-500">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
               {customersList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Nenhum cliente cadastrado.</p>
                  </div>
               ) : (
                  customersList.map(cust => (
                    <button 
                      key={cust.id}
                      onClick={() => { selectCustomer(cust); setShowCustomerModal(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark text-left border-b border-gray-100 dark:border-white/5"
                    >
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{cust.name.substring(0,2).toUpperCase()}</div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{cust.name}</p>
                        <p className="text-xs text-gray-500">{cust.contact.whatsapp}</p>
                      </div>
                      <Icon name="arrow_forward" className="text-gray-400" />
                    </button>
                  ))
               )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-white/10">
               <button 
                 onClick={() => { setShowCustomerModal(false); setClientType('Novo Cliente'); }}
                 className="w-full py-3 bg-gray-100 dark:bg-surface-dark text-slate-900 dark:text-white font-bold rounded-lg"
               >
                 Usar Novo Cliente
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
          </div>
        </div>
      )}

    </div>
  );
};

export default NewQuote;
