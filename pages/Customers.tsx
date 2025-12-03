
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

interface Customer {
  id: string;
  type: string;
  name: string;
  document: string;
  contact: {
    whatsapp: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
  };
  notes: string;
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Inicializar dados fictícios se o localStorage estiver vazio
  useEffect(() => {
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
      setCustomers(JSON.parse(storedCustomers));
    } else {
      // Dados Iniciais para teste
      const initialData: Customer[] = [
        { 
          id: '1', 
          type: 'PF', 
          name: "Ana Beatriz", 
          document: '123.456.789-00', 
          contact: { whatsapp: "+55 11 98765-4321", email: 'ana@example.com' },
          address: { street: 'Rua A', city: 'São Paulo', state: 'SP' },
          notes: 'Cliente VIP'
        },
        { 
          id: '2', 
          type: 'PF',
          name: "Carlos Eduardo", 
          document: '987.654.321-99',
          contact: { whatsapp: "+55 21 91234-5678", email: "carlos.edu@example.com" },
          address: { street: 'Rua B', city: 'Rio de Janeiro', state: 'RJ' },
          notes: ''
        },
        { 
          id: '3', 
          type: 'PF',
          name: "Daniela Ribeiro", 
          document: '111.222.333-44',
          contact: { whatsapp: "+55 31 99999-8888", email: 'dani@example.com' },
          address: { street: 'Rua C', city: 'Belo Horizonte', state: 'MG' },
          notes: ''
        }
      ];
      localStorage.setItem('customers', JSON.stringify(initialData));
      setCustomers(initialData);
    }
  }, []);

  // Filtragem funcional
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact.whatsapp.includes(searchTerm) ||
    customer.document.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 px-4 pt-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
        <button onClick={() => navigate('/')} className="flex size-12 items-center text-slate-800 dark:text-white" aria-label="Voltar ao Início">
          <Icon name="arrow_back_ios_new" className="text-2xl" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-slate-900 dark:text-white">Clientes</h1>
        <div className="flex size-12 items-center"></div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <label className="flex h-12 w-full flex-col">
          <div className="flex h-full w-full flex-1 items-stretch rounded-xl">
            <div className="flex items-center justify-center rounded-l-xl border-y border-l border-slate-300 bg-slate-100 pl-4 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <Icon name="search" className="text-2xl" />
            </div>
            <input 
              className="form-input h-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl border border-l-0 border-slate-300 bg-white px-4 text-base font-normal leading-normal text-slate-900 placeholder:text-slate-400 focus:border-primary/50 focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500" 
              placeholder="Buscar por nome, telefone ou CPF" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Customer List */}
      <main className="flex-grow space-y-px px-4 pb-24">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Icon name="person_off" className="text-4xl mb-2 opacity-50" />
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <button 
              key={customer.id} 
              onClick={() => navigate(`/customers/${customer.id}`)}
              className={`w-full flex min-h-[72px] items-center justify-between gap-4 bg-white px-4 py-2 dark:bg-slate-900 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-left ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredCustomers.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/20">
                  <span className="text-2xl font-medium">{getInitials(customer.name)}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-base font-medium leading-normal text-slate-900 line-clamp-1 dark:text-white">{customer.name}</p>
                  <p className="text-sm font-normal leading-normal text-slate-500 line-clamp-2 dark:text-slate-400">{customer.contact.whatsapp || customer.contact.email}</p>
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex size-7 items-center justify-center text-slate-400 dark:text-slate-500">
                  <Icon name="edit" className="text-xl" />
                </div>
              </div>
            </button>
          ))
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-20">
        <button 
          onClick={() => navigate('/customers/new')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-background-dark shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Adicionar Cliente"
        >
          <Icon name="add" className="text-3xl" />
        </button>
      </div>
    </div>
  );
};

export default Customers;
