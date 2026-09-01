/**
 * Guía de Controles Flotante
 */

import React, { useState } from 'react';
import { HelpCircle, X, Keyboard, MousePointer, Settings as SettingsIcon } from 'lucide-react';

interface ControlsGuideProps {
  onOpenSettings: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
      <div className="flex gap-2">
        <button
          onClick={onOpenSettings}
          title="Abrir Ajustes"
          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 backdrop-blur-md transition-all shadow-lg cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Ver Controles"
          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 backdrop-blur-md transition-all shadow-lg cursor-pointer"
        >
          {isOpen ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md text-xs text-slate-300 shadow-2xl flex flex-col gap-2.5 max-w-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="font-bold text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            Controles del Juego
          </div>

          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
            <span className="text-slate-400">WASD / Flechas:</span>
            <span className="font-semibold text-slate-200">Moverse</span>

            <span className="text-slate-400">Shift:</span>
            <span className="font-semibold text-slate-200">Correr (Sprint)</span>

            <span className="text-slate-400">Ctrl / C:</span>
            <span className="font-semibold text-slate-200">Agacharse / Gatear</span>

            <span className="text-slate-400">Espacio:</span>
            <span className="font-semibold text-slate-200">Saltar</span>

            <span className="text-slate-400">Click Izquierdo:</span>
            <span className="font-semibold text-amber-300">Tensar / Disparar Arco</span>

            <span className="text-slate-400">Tecla E:</span>
            <span className="font-semibold text-cyan-300">Interactuar (Puerta/Atajo)</span>

            <span className="text-slate-400">Tecla F:</span>
            <span className="font-semibold text-amber-200">Linterna / Farol</span>

            <span className="text-slate-400">ESC:</span>
            <span className="font-semibold text-slate-200">Liberar Ratón</span>
          </div>

          <div className="pt-1.5 text-[10px] text-slate-500 border-t border-slate-800">
            Haz click sobre la pantalla 3D para activar el ratón en primera persona.
          </div>
        </div>
      )}
    </div>
  );
};
