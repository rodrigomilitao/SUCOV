import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

const ProductionPlanner: React.FC = () => {
  const [view, setView] = useState('Calendário');
  const navigate = useNavigate();

  // Helper to render calendar days
  const renderCalendarDays = () => {
    const days = [];
    // Just a visual representation based on the static HTML provided
    for (let i = 1; i <= 30; i++) {
      let content = <div className="flex size-full items-center justify-center rounded-full">{i}</div>;
      let className = "h-12 w-full text-white text-sm font-medium leading-normal";
      
      if (i === 1 || i === 2) className = "h-12 w-full text-white/50 text-sm font-medium leading-normal"; // Prev month dimming visual
      if (i === 5) {
        className = "h-12 w-full text-[#112222] text-sm font-medium leading-normal";
        content = <div className="flex size-full items-center justify-center rounded-full bg-primary relative"><span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-current"></span>{i}</div>;
      }
      if ([12, 18, 25].includes(i)) {
         content = <div className="flex size-full items-center justify-center rounded-full relative"><span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary"></span>{i}</div>;
      }

      days.push(<button key={i} className={className}>{content}</button>);
    }
    return days;
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark group/design-root overflow-x-hidden pb-20">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="flex size-12 shrink-0 items-center justify-start" aria-label="Voltar ao Início">
          <Icon name="arrow_back_ios_new" className="text-white text-2xl" />
        </button>
        <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Planner de Produção</h1>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-white gap-2 min-w-0 p-0">
            <Icon name="tune" className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Segmented Buttons */}
      <div className="flex px-4 py-3">
        <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#234848] p-1">
          {['Calendário', 'Lista', 'Concluídas'].map((v) => (
            <label key={v} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 ${view === v ? 'bg-[#112222] shadow-[0_0_4px_rgba(0,0,0,0.1)] text-white' : 'text-[#92c9c9]'} transition-all text-sm font-medium leading-normal`}>
              <span className="truncate">{v}</span>
              <input type="radio" name="view-toggle" value={v} checked={view === v} onChange={() => setView(v)} className="invisible w-0" />
            </label>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {view === 'Calendário' && (
        <div className="flex flex-wrap items-center justify-center gap-6 p-4">
          <div className="flex min-w-72 max-w-[336px] flex-1 flex-col gap-0.5">
            <div className="flex items-center p-1 justify-between">
              <button className="text-white flex size-10 items-center justify-center">
                <Icon name="chevron_left" className="text-lg" />
              </button>
              <p className="text-white text-base font-bold leading-tight flex-1 text-center">Junho 2024</p>
              <button className="text-white flex size-10 items-center justify-center">
                <Icon name="chevron_right" className="text-lg" />
              </button>
            </div>
            <div className="grid grid-cols-7">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <p key={i} className="text-white/70 text-[13px] font-bold leading-normal tracking-[0.015em] flex h-12 w-full items-center justify-center pb-0.5">{d}</p>
              ))}
              {/* Spacer for start of month logic if needed, simplifed here */}
              <div className="col-span-6"></div> 
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-white text-base font-bold">Tarefas de Hoje</h2>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-px">
        {[
          { icon: "factory", title: "Produção - Pedido #1024", due: "Vencimento: 25 de Junho", status: "Em Andamento", statusColor: "text-orange-400", progress: 60 },
          { icon: "shopping_bag", title: "Compras - Pedido #1022", due: "Vencimento: 18 de Junho", status: "Concluído", statusColor: "text-green-400", progress: 100 },
          { icon: "local_shipping", title: "Envio - Pedido #1020", due: "Vencimento: 12 de Junho", status: "Pendente", statusColor: "text-red-400", progress: 0 },
        ].map((task, i) => (
          <div key={i} className="flex gap-4 bg-background-dark px-4 py-3 justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="text-white flex items-center justify-center rounded-lg bg-[#234848] shrink-0 size-12">
                <Icon name={task.icon} />
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-white text-base font-medium leading-normal">{task.title}</p>
                <p className="text-[#92c9c9] text-sm font-normal leading-normal">{task.due}</p>
                <p className={`${task.statusColor} text-sm font-normal leading-normal`}>{task.status}</p>
              </div>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-[88px] overflow-hidden rounded-full bg-[#326767] h-1.5">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${task.progress}%` }}></div>
                </div>
                <p className="text-white text-sm font-medium leading-normal w-6 text-right">{task.progress}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-background-dark shadow-lg">
        <Icon name="add" className="text-3xl" />
      </button>
    </div>
  );
};

export default ProductionPlanner;