
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';

const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Pega o ID da URL se existir
  const isEditing = !!id;

  const [customerType, setCustomerType] = useState<'PF' | 'PJ'>('PF');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    cpf: '',
    cnpj: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    notes: ''
  });

  // Carregar dados se for edição
  useEffect(() => {
    if (isEditing) {
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        const customers = JSON.parse(storedCustomers);
        const customer = customers.find((c: any) => c.id === id);
        
        if (customer) {
          setCustomerType(customer.type as 'PF' | 'PJ');
          setFormData({
            id: customer.id,
            name: customer.name,
            cpf: customer.type === 'PF' ? customer.document : '',
            cnpj: customer.type === 'PJ' ? customer.document : '',
            whatsapp: customer.contact.whatsapp,
            email: customer.contact.email,
            address: customer.address.street,
            city: customer.address.city,
            state: customer.address.state,
            notes: customer.notes
          });
        }
      }
    }
  }, [id, isEditing]);

  // Masks
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede que sejam digitados mais caracteres
  };

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Apply masks based on field name
    if (name === 'cpf') value = maskCPF(value);
    if (name === 'cnpj') value = maskCNPJ(value);
    if (name === 'whatsapp') value = maskPhone(value);

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("O nome é obrigatório.");
      return;
    }

    setLoading(true);
    
    // Objeto do cliente formatado
    const payload = {
      id: isEditing ? formData.id : Date.now().toString(), // Gera ID se for novo
      type: customerType,
      name: formData.name,
      document: customerType === 'PF' ? formData.cpf : formData.cnpj,
      contact: {
        whatsapp: formData.whatsapp,
        email: formData.email,
      },
      address: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
      },
      notes: formData.notes,
    };

    // Simulação de salvamento no DB (localStorage)
    const storedCustomers = localStorage.getItem('customers');
    let customers = storedCustomers ? JSON.parse(storedCustomers) : [];

    if (isEditing) {
      // Atualiza existente
      customers = customers.map((c: any) => c.id === payload.id ? payload : c);
    } else {
      // Adiciona novo
      customers.push(payload);
    }

    localStorage.setItem('customers', JSON.stringify(customers));
    
    setTimeout(() => {
      setLoading(false);
      navigate('/customers');
    }, 500);
  };

  const handleNewSale = () => {
    // Navega para a tela de orçamento passando o ID do cliente
    navigate(`/quotes/new?customerId=${formData.id}`);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 pb-3 justify-between border-b border-gray-200/10 dark:border-white/10">
        <button onClick={() => navigate('/customers')} className="flex w-16 items-center">
          <p className="text-primary/70 dark:text-[#92c9c9] text-base font-medium leading-normal shrink-0">Voltar</p>
        </button>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
        <div className="flex w-16 items-center justify-end gap-3">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="text-primary dark:text-[#326767] text-base font-bold leading-normal tracking-[0.015em] shrink-0 disabled:opacity-50"
          >
            {loading ? '...' : 'Salvar'}
          </button>
        </div>
      </div>

      <main className="flex-1 pb-24 px-4 pt-4">
        
        {/* Customer Type Toggle */}
        <div className="flex mb-6">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-200 dark:bg-surface-dark p-1">
            <button
              onClick={() => setCustomerType('PF')}
              className={`flex h-full grow items-center justify-center rounded-md text-sm font-medium transition-all ${customerType === 'PF' ? 'bg-white text-slate-900 shadow-sm dark:bg-background-dark dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Pessoa Física
            </button>
            <button
              onClick={() => setCustomerType('PJ')}
              className={`flex h-full grow items-center justify-center rounded-md text-sm font-medium transition-all ${customerType === 'PJ' ? 'bg-white text-slate-900 shadow-sm dark:bg-background-dark dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        {/* Action Button for Sales (Only visible when editing) */}
        {isEditing && (
          <div className="mb-6">
             <button 
              onClick={handleNewSale}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary border border-primary/20 py-3 active:scale-95 transition-all"
            >
              <Icon name="receipt_long" className="text-xl" />
              <span className="font-bold">Iniciar Venda / Orçamento</span>
            </button>
          </div>
        )}

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Dados Pessoais</h2>
          
          <label className="flex flex-col w-full">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">Nome Completo</span>
            <input 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
              placeholder="Ex: Ana Silva" 
            />
          </label>

          {customerType === 'PF' ? (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">CPF</span>
              <input 
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                maxLength={14}
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
                placeholder="000.000.000-00" 
              />
            </label>
          ) : (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">CNPJ</span>
              <input 
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                maxLength={18}
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
                placeholder="00.000.000/0000-00" 
              />
            </label>
          )}
        </section>

        {/* Contact Info */}
        <section className="space-y-4 mt-6">
          <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Contato</h2>
          
          <label className="flex flex-col w-full">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">WhatsApp / Telefone</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="call" className="text-gray-400" />
              </div>
              <input 
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                maxLength={15}
                className="form-input w-full pl-10 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
                placeholder="(00) 00000-0000" 
              />
            </div>
          </label>

          <label className="flex flex-col w-full">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">E-mail</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="mail" className="text-gray-400" />
              </div>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input w-full pl-10 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
                placeholder="cliente@email.com" 
              />
            </div>
          </label>
        </section>

        {/* Address */}
        <section className="space-y-4 mt-6">
          <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Endereço de Entrega</h2>
          
          <label className="flex flex-col w-full">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">Logradouro</span>
            <input 
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
              placeholder="Rua, Número, Bairro" 
            />
          </label>

          <div className="flex gap-4">
            <label className="flex flex-col flex-1">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">Cidade</span>
              <input 
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12" 
                placeholder="Cidade" 
              />
            </label>
            <label className="flex flex-col w-24">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-1">Estado</span>
              <input 
                name="state"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 uppercase" 
                placeholder="UF" 
              />
            </label>
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-4 mt-6">
          <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Anotações</h2>
          <textarea 
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-textarea w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark/50 text-slate-900 dark:text-white focus:border-primary focus:ring-primary min-h-[120px]" 
            placeholder="Preferências do cliente, histórico, etc..." 
          />
        </section>

      </main>
    </div>
  );
};

export default NewCustomer;
