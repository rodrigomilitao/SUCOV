
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';

interface InventoryItem {
  id: string;
  type: 'material' | 'product' | 'service';
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  image?: string;
  composition?: { itemId: string; qty: number; name: string; cost: number }[];
}

const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Pega ID da URL se existir
  const isEditing = !!id;

  const [activeType, setActiveType] = useState<'product' | 'material' | 'service'>('product');
  
  // Estado do Formulário
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number | string;
    cost: number | string;
    stock: number | string;
    composition: any[];
    image: string;
  }>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    stock: 0,
    composition: [],
    image: ''
  });

  const [margin, setMargin] = useState<number | string>(50); // Margem de lucro em %
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<InventoryItem[]>([]);

  // Carregar materiais disponíveis para composição
  useEffect(() => {
    const stored = localStorage.getItem('inventory');
    if (stored) {
      const items: InventoryItem[] = JSON.parse(stored);
      setAvailableMaterials(items.filter(i => i.type === 'material' && i.id !== id)); // Evita auto-referência
    }
  }, [id]);

  // Se for edição, carregar dados do item
  useEffect(() => {
    if (isEditing && id) {
      const stored = localStorage.getItem('inventory');
      if (stored) {
        const items: InventoryItem[] = JSON.parse(stored);
        const item = items.find(i => i.id === id);
        if (item) {
          setActiveType(item.type);
          setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            cost: item.cost,
            stock: item.stock,
            composition: item.composition || [],
            image: item.image || ''
          });
          
          // Calcular margem baseada no custo e preço salvo
          // Margem = ((Preço / Custo) - 1) * 100
          if (item.cost > 0) {
            const calculatedMargin = ((item.price / item.cost) - 1) * 100;
            setMargin(parseFloat(calculatedMargin.toFixed(2)));
          } else {
            setMargin(0);
          }
        }
      }
    }
  }, [id, isEditing]);

  // --- Funções Auxiliares de Cálculo ---

  const calculatePriceFromCostAndMargin = (cost: number, marginVal: number) => {
    const val = cost * (1 + marginVal / 100);
    return parseFloat(val.toFixed(2));
  };

  const calculateMarginFromCostAndPrice = (cost: number, price: number) => {
    if (cost <= 0) return 0;
    const val = ((price / cost) - 1) * 100;
    return parseFloat(val.toFixed(2));
  };

  // --- Handlers Específicos ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Para Estoque (Genérico)
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, stock: value === '' ? '' : parseFloat(value) }));
  };

  // 1. Alteração Manual do Custo (Apenas Matéria-Prima)
  // Atualiza Custo -> Recalcula Preço (Mantendo Margem)
  const handleManualCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newCost = val === '' ? '' : parseFloat(val);
    
    let updates: any = { cost: newCost };
    
    // Se temos um custo válido e uma margem válida, atualiza o preço
    if (typeof newCost === 'number' && typeof margin === 'number') {
      const newPrice = calculatePriceFromCostAndMargin(newCost, margin);
      updates.price = newPrice;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // 2. Alteração da Margem
  // Atualiza Margem -> Recalcula Preço (Mantendo Custo)
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newMargin = val === '' ? '' : parseFloat(val);
    setMargin(newMargin);

    const currentCost = typeof formData.cost === 'string' ? parseFloat(formData.cost) || 0 : formData.cost;
    
    if (typeof newMargin === 'number' && typeof currentCost === 'number') {
       const newPrice = calculatePriceFromCostAndMargin(currentCost, newMargin);
       setFormData(prev => ({ ...prev, price: newPrice }));
    }
  };

  // 3. Alteração do Preço
  // Atualiza Preço -> Recalcula Margem (Mantendo Custo)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newPrice = val === '' ? '' : parseFloat(val);
    
    setFormData(prev => ({ ...prev, price: newPrice }));

    const currentCost = typeof formData.cost === 'string' ? parseFloat(formData.cost) || 0 : formData.cost;

    if (typeof newPrice === 'number' && currentCost > 0) {
      const newMargin = calculateMarginFromCostAndPrice(currentCost, newPrice);
      setMargin(newMargin);
    }
  };

  // 4. Alteração na Composição (Produtos)
  // Atualiza Custo Total -> Recalcula Preço (Mantendo Margem)
  const updateCompositionAndPrice = (newComposition: any[]) => {
    const totalCost = newComposition.reduce((acc, item) => acc + (item.cost * item.qty), 0);
    const currentMargin = typeof margin === 'string' ? parseFloat(margin) || 0 : margin;
    
    // Se margem for válida, atualiza preço
    let newPrice = formData.price;
    if (typeof currentMargin === 'number') {
        newPrice = calculatePriceFromCostAndMargin(totalCost, currentMargin);
    }
    
    setFormData(prev => ({
      ...prev,
      composition: newComposition,
      cost: totalCost,
      price: newPrice
    }));
  };

  const addMaterialToComposition = (material: InventoryItem) => {
    const currentComposition = formData.composition || [];
    if (currentComposition.find(c => c.itemId === material.id)) return;

    const newComponent = {
      itemId: material.id,
      name: material.name,
      cost: material.cost,
      qty: 1
    };

    const newComposition = [...currentComposition, newComponent];
    updateCompositionAndPrice(newComposition);
    setShowMaterialPicker(false);
  };

  const updateMaterialQty = (index: number, newQty: number) => {
    if (!formData.composition) return;
    const newComposition = [...formData.composition];
    newComposition[index].qty = newQty;
    updateCompositionAndPrice(newComposition);
  };

  const removeMaterial = (index: number) => {
    if (!formData.composition) return;
    const newComposition = formData.composition.filter((_, i) => i !== index);
    updateCompositionAndPrice(newComposition);
  };

  // --- Salvar e Excluir ---

  const handleSave = () => {
    if (!formData.name) {
      alert("Nome é obrigatório");
      return;
    }

    const finalPrice = typeof formData.price === 'string' ? parseFloat(formData.price) || 0 : formData.price;
    const finalCost = typeof formData.cost === 'string' ? parseFloat(formData.cost) || 0 : formData.cost;
    const finalStock = typeof formData.stock === 'string' ? parseFloat(formData.stock) || 0 : formData.stock;

    const newItem: InventoryItem = {
      id: isEditing && id ? id : Date.now().toString(),
      type: activeType,
      name: formData.name,
      description: formData.description,
      price: finalPrice,
      cost: finalCost,
      stock: activeType === 'service' ? 9999 : finalStock,
      composition: activeType === 'product' ? formData.composition : [],
      image: formData.image || ("https://picsum.photos/100/100?random=" + Date.now())
    };

    const stored = localStorage.getItem('inventory');
    let inventory = stored ? JSON.parse(stored) : [];

    if (isEditing) {
      // Atualizar item existente
      inventory = inventory.map((item: InventoryItem) => item.id === id ? newItem : item);
    } else {
      // Criar novo
      inventory.push(newItem);
    }

    localStorage.setItem('inventory', JSON.stringify(inventory));
    navigate('/inventory');
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const stored = localStorage.getItem('inventory');
      if (stored) {
        const inventory = JSON.parse(stored);
        const newInventory = inventory.filter((i: InventoryItem) => i.id !== id);
        localStorage.setItem('inventory', JSON.stringify(newInventory));
        navigate('/inventory');
      }
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 pb-3 justify-between border-b border-gray-200/10 dark:border-white/10">
        <button onClick={() => navigate('/inventory')} className="flex w-16 items-center">
          <p className="text-primary/70 dark:text-[#92c9c9] text-base font-medium leading-normal shrink-0">Cancelar</p>
        </button>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {isEditing ? 'Editar Item' : 'Novo Item'}
        </h1>
        <div className="flex w-16 items-center justify-end gap-3">
          <button 
            onClick={handleSave}
            className="text-primary dark:text-[#326767] text-base font-bold leading-normal tracking-[0.015em] shrink-0"
          >
            Salvar
          </button>
        </div>
      </div>

      <main className="flex-1 pb-32">
        
        {/* Type Selector (Bloqueado na edição para não quebrar dependências, ou permitir se desejado. Bloquear é mais seguro) */}
        <div className="px-4 py-4">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-200 dark:bg-surface-dark p-1">
            <button 
              onClick={() => !isEditing && setActiveType('product')} 
              className={`flex-1 rounded-md text-sm font-medium transition-all h-full ${activeType === 'product' ? 'bg-white dark:bg-background-dark shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'} ${isEditing && activeType !== 'product' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Produto
            </button>
            <button 
              onClick={() => !isEditing && setActiveType('material')} 
              className={`flex-1 rounded-md text-sm font-medium transition-all h-full ${activeType === 'material' ? 'bg-white dark:bg-background-dark shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'} ${isEditing && activeType !== 'material' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Matéria-Prima
            </button>
            <button 
              onClick={() => !isEditing && setActiveType('service')} 
              className={`flex-1 rounded-md text-sm font-medium transition-all h-full ${activeType === 'service' ? 'bg-white dark:bg-background-dark shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'} ${isEditing && activeType !== 'service' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Serviço
            </button>
          </div>
          {isEditing && (
            <p className="text-xs text-orange-500 text-center mt-2">O tipo do item não pode ser alterado durante a edição.</p>
          )}
        </div>

        {/* Basic Info */}
        <section className="pt-2">
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">Nome</p>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border border-primary/50 bg-primary/5 dark:bg-[#193333] focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-[#92c9c9] p-[15px] text-base font-normal leading-normal" 
                placeholder={activeType === 'service' ? "Ex: Criação de Arte Digital" : "Ex: Vaso de Cerâmica"} 
              />
            </label>
          </div>
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">Descrição</p>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border border-primary/50 bg-primary/5 dark:bg-[#193333] focus:border-primary min-h-24 placeholder:text-slate-400 dark:placeholder:text-[#92c9c9] p-[15px] text-base font-normal leading-normal" 
                placeholder="Detalhes do item..."
              ></textarea>
            </label>
          </div>
        </section>

        {/* Composição (Only for Product) */}
        {activeType === 'product' && (
          <section className="pt-4 border-t border-gray-100 dark:border-white/5">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Composição (Receita)</h3>
            
            {(!formData.composition || formData.composition.length === 0) ? (
              <div className="px-4 py-3 text-center">
                <p className="text-slate-500 dark:text-[#92c9c9] text-sm">Adicione insumos para calcular o custo automaticamente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-4 pb-4">
                {formData.composition.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-surface-dark p-2 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">Custo un: R$ {item.cost.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Qtd:</span>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateMaterialQty(idx, parseFloat(e.target.value))}
                        className="w-16 h-8 text-sm rounded border-gray-300 dark:bg-background-dark dark:border-gray-600 dark:text-white"
                      />
                      <button onClick={() => removeMaterial(idx)} className="text-red-500">
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div 
              onClick={() => setShowMaterialPicker(true)}
              className="flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 min-h-14 justify-between border-y border-gray-200/10 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-white flex items-center justify-center rounded-lg bg-primary/20 shrink-0 size-10">
                  <Icon name="add" className="text-primary" />
                </div>
                <p className="text-primary text-base font-medium leading-normal flex-1 truncate">Adicionar Matéria-Prima</p>
              </div>
              <Icon name="chevron_right" className="text-slate-900 dark:text-white" />
            </div>

            <div className="px-4 py-4 flex justify-between items-center bg-gray-100 dark:bg-surface-dark mt-2">
              <p className="text-slate-900 dark:text-white text-base font-medium">Custo Total (Materiais)</p>
              <p className="text-slate-900 dark:text-white text-base font-bold">R$ {typeof formData.cost === 'number' ? formData.cost.toFixed(2) : formData.cost}</p>
            </div>
          </section>
        )}

        {/* Custo Manual (Only for Material) */}
        {activeType === 'material' && (
           <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">Custo de Compra (Unitário)</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#92c9c9] text-base">R$</span>
                <input 
                  name="cost"
                  type="number" 
                  value={formData.cost}
                  onChange={handleManualCostChange}
                  className="form-input flex w-full pl-10 rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border border-primary/50 bg-primary/5 dark:bg-[#193333] focus:border-primary h-14" 
                />
              </div>
            </label>
          </div>
        )}

        {/* Pricing Section */}
        <section className="pt-4 border-t border-gray-100 dark:border-white/5">
          <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Precificação</h3>
          
          {activeType !== 'service' && (
            <div className="px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">Margem de Lucro Sugerida (%)</p>
                <div className="relative">
                  <input 
                    type="number" 
                    value={margin}
                    onChange={handleMarginChange}
                    className="form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border border-primary/50 bg-primary/5 dark:bg-[#193333] focus:border-primary h-14 p-[15px]" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#92c9c9] text-base">%</span>
                </div>
              </label>
            </div>
          )}

          <div className="px-4 py-3">
             <label className="flex flex-col min-w-40 flex-1">
                <p className="text-slate-900 dark:text-white text-base font-medium leading-normal pb-2">Preço de Venda Final</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#92c9c9] text-base">R$</span>
                  <input 
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handlePriceChange}
                    className="form-input flex w-full pl-10 rounded-lg text-slate-900 dark:text-white font-bold text-lg focus:outline-0 focus:ring-0 border border-primary bg-white dark:bg-[#193333] focus:border-primary h-14" 
                  />
                </div>
              </label>
          </div>
        </section>

        {/* Stock Section (Not for Services) */}
        {activeType !== 'service' && (
          <section className="pt-4 border-t border-gray-100 dark:border-white/5">
             <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Estoque Inicial</h3>
             <div className="px-4 py-3">
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-surface-dark p-4 rounded-xl">
                  <p className="text-slate-900 dark:text-white flex-1">Quantidade Atual</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFormData(p => ({...p, stock: Math.max(0, (typeof p.stock === 'number' ? p.stock : 0) - 1)}))} className="size-10 rounded-full bg-gray-200 dark:bg-background-dark flex items-center justify-center text-xl font-bold">-</button>
                    <input 
                      name="stock"
                      type="number" 
                      value={formData.stock}
                      onChange={handleStockChange}
                      className="w-20 text-center bg-transparent border-none text-xl font-bold dark:text-white focus:ring-0"
                    />
                    <button onClick={() => setFormData(p => ({...p, stock: (typeof p.stock === 'number' ? p.stock : 0) + 1}))} className="size-10 rounded-full bg-primary text-background-dark flex items-center justify-center text-xl font-bold">+</button>
                  </div>
                </div>
             </div>
          </section>
        )}

        {/* Buttons Footer */}
        <div className="p-4 pt-6 flex flex-col gap-3">
          <button 
            onClick={handleSave}
            className="w-full bg-primary text-background-dark hover:bg-primary/90 font-bold text-lg h-14 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Icon name="save" />
            {isEditing ? 'Atualizar Item' : 'Salvar Item'}
          </button>
          
          {isEditing && (
             <button 
              onClick={handleDelete}
              className="w-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold text-lg h-14 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Icon name="delete" />
              Excluir Item
            </button>
          )}
        </div>

      </main>

      {/* Material Picker Modal */}
      {showMaterialPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-background-dark rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Selecionar Insumo</h3>
              <button onClick={() => setShowMaterialPicker(false)} className="text-gray-500">
                <Icon name="close" className="text-2xl" />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {availableMaterials.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Nenhuma matéria-prima disponível.</p>
                </div>
              ) : (
                availableMaterials.map(mat => (
                  <button 
                    key={mat.id}
                    onClick={() => addMaterialToComposition(mat)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark text-left border-b border-gray-100 dark:border-white/5"
                  >
                    <div className="size-10 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Icon name="extension" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{mat.name}</p>
                      <p className="text-xs text-gray-500">Custo: R$ {mat.cost.toFixed(2)}</p>
                    </div>
                    <Icon name="add_circle" className="text-primary" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProduct;
