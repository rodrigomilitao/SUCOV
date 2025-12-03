import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

const Dashboard: React.FC = () => {
  // Estados para personalização com valores padrão
  const [atelieName, setAtelieName] = useState("Ateliê da Ana");
  const [atelieLogo, setAtelieLogo] = useState<string | null>(null);
  
  // Estado para controle de edição
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  
  // Ref para o input de arquivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados salvos ao iniciar
  useEffect(() => {
    const savedName = localStorage.getItem('atelie_name');
    const savedLogo = localStorage.getItem('atelie_logo');
    
    if (savedName) setAtelieName(savedName);
    if (savedLogo) setAtelieLogo(savedLogo);
  }, []);

  // Função para salvar o novo nome
  const handleNameSave = () => {
    if (tempName.trim()) {
      setAtelieName(tempName);
      localStorage.setItem('atelie_name', tempName);
    }
    setIsEditingName(false);
  };

  // Iniciar edição do nome
  const startEditing = () => {
    setTempName(atelieName);
    setIsEditingName(true);
  };

  // Manipular tecla Enter no input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    }
  };

  // Função para processar a troca de imagem
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Tenta salvar no localStorage (pode falhar se a imagem for muito grande)
        try {
          localStorage.setItem('atelie_logo', base64String);
          setAtelieLogo(base64String);
        } catch (error) {
          alert("A imagem selecionada é muito grande para ser salva localmente. Tente uma imagem menor.");
          // Ainda atualiza o estado para a sessão atual
          setAtelieLogo(base64String);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Acionar o input de arquivo oculto
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col w-full group/design-root overflow-x-hidden">
      {/* Header com avatar sincronizado */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
        <div className="flex size-12 shrink-0 items-center">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-primary/30 overflow-hidden" 
            style={{ 
              backgroundImage: atelieLogo ? `url("${atelieLogo}")` : 'url("https://picsum.photos/100/100")' 
            }}
          ></div>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Início</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-slate-900 dark:text-white gap-2 min-w-0 p-0">
            <Icon name="settings" className="text-2xl" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-4 pt-6 pb-4">
        <div className="relative group">
          {/* Container do Logo */}
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all">
            {atelieLogo ? (
              <img src={atelieLogo} alt="Logo do Ateliê" className="w-full h-full object-cover" />
            ) : (
              <Icon name="storefront" className="text-5xl text-slate-400 dark:text-slate-500" />
            )}
          </div>
          
          {/* Botão de Trocar Imagem */}
          <button 
            onClick={triggerFileSelect}
            className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white dark:text-background-dark shadow-lg hover:scale-110 transition-transform"
          >
            <Icon name="add_a_photo" className="text-lg" />
          </button>
          
          {/* Input oculto para seleção de arquivo */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="text-center w-full max-w-xs mx-auto">
          {isEditingName ? (
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleKeyDown}
              className="w-full text-center text-slate-900 dark:text-white text-2xl font-bold leading-tight bg-transparent border-b-2 border-primary focus:outline-none px-2 py-1"
            />
          ) : (
            <div className="flex items-center justify-center gap-2 group/name cursor-pointer" onClick={startEditing}>
              <h1 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{atelieName}</h1>
              <Icon name="edit" className="text-slate-400 text-lg opacity-50 group-hover/name:opacity-100 transition-opacity" />
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mt-1">Seja bem-vinda de volta!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        <Link to="/sales/new" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-surface-dark/50 border border-slate-200 dark:border-slate-800 text-center hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20">
            <Icon name="receipt_long" className="text-primary text-3xl" />
          </div>
          <span className="text-slate-900 dark:text-white font-semibold">Nova Venda</span>
        </Link>
        <Link to="/inventory" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-surface-dark/50 border border-slate-200 dark:border-slate-800 text-center hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20">
            <Icon name="inventory" className="text-primary text-3xl" />
          </div>
          <span className="text-slate-900 dark:text-white font-semibold">Estoque</span>
        </Link>
        <Link to="/customers" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-surface-dark/50 border border-slate-200 dark:border-slate-800 text-center hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20">
            <Icon name="groups" className="text-primary text-3xl" />
          </div>
          <span className="text-slate-900 dark:text-white font-semibold">Clientes</span>
        </Link>
        <Link to="/quotes/new" className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-surface-dark/50 border border-slate-200 dark:border-slate-800 text-center hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20">
            <Icon name="request_quote" className="text-primary text-3xl" />
          </div>
          <span className="text-slate-900 dark:text-white font-semibold">Orçamentos</span>
        </Link>
      </div>

      <div className="px-4 py-2">
        <hr className="border-slate-200 dark:border-slate-800" />
      </div>

      <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight px-4 pt-4 pb-2">Resumo Mensal</h3>
      <div className="flex flex-wrap gap-4 px-4">
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark/50">
          <p className="text-slate-600 dark:text-slate-300 text-base font-medium leading-normal">Vendas Totais</p>
          <p className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">R$ 4.850,00</p>
          <p className="text-green-500 dark:text-green-400 text-base font-medium leading-normal">+15%</p>
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark/50">
          <p className="text-slate-600 dark:text-slate-300 text-base font-medium leading-normal">Lucro</p>
          <p className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">R$ 1.230,00</p>
          <p className="text-green-500 dark:text-green-400 text-base font-medium leading-normal">+20%</p>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="flex flex-wrap gap-4 px-4 py-4 mb-20">
        <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-surface-dark/50">
          <p className="text-slate-600 dark:text-slate-300 text-base font-medium leading-normal">Visão Geral das Vendas</p>
          <p className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight truncate">R$ 1.570,00</p>
          <div className="flex gap-1 -mt-2">
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Últimos 7 dias</p>
            <p className="text-green-500 dark:text-green-400 text-base font-medium leading-normal">+8.5%</p>
          </div>
          <div className="grid min-h-[180px] grid-flow-col gap-4 grid-rows-[1fr_auto] items-end justify-items-center px-1">
            <div className="bg-primary/20 w-full rounded" style={{ height: "30%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">S</p>
            <div className="bg-primary/20 w-full rounded" style={{ height: "100%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">T</p>
            <div className="bg-primary/20 w-full rounded" style={{ height: "10%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">Q</p>
            <div className="bg-primary w-full rounded" style={{ height: "50%" }}></div>
            <p className="text-slate-900 dark:text-white text-[13px] font-bold leading-normal">Q</p>
            <div className="bg-primary/20 w-full rounded" style={{ height: "70%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">S</p>
            <div className="bg-primary/20 w-full rounded" style={{ height: "10%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">S</p>
            <div className="bg-primary/20 w-full rounded" style={{ height: "10%" }}></div>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold leading-normal">D</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;