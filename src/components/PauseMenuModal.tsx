/**
 * Modal de Pausa Profesional Estilo Cómic (PauseMenuModal.tsx)
 */

import React from 'react';
import { Play, RotateCcw, Settings, Home, Shield, Target, Clock, Zap } from 'lucide-react';
import { MatchStats, PlayerRole } from '../types';

interface PauseMenuModalProps {
  isOpen: boolean;
  stats: MatchStats | null;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onExitToMenu: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  isOpen,
  stats,
  onResume,
  onRestart,
  onOpenSettings,
  onExitToMenu,
}) => {
  if (!isOpen) return null;

  const isHunter = stats?.playerRole === PlayerRole.HUNTER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto select-none p-4">
      <div className="w-full max-w-md bg-slate-900 border-4 border-black rounded-3xl p-7 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.95)] flex flex-col gap-6 text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Cómic */}
        <div className="flex flex-col items-center text-center gap-1 border-b-2 border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 border-2 border-black text-slate-950 font-comic text-sm uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
            JUEGO EN PAUSA
          </div>
          <h2 className="text-4xl font-comic tracking-wide text-amber-400 mt-2">
            LABERINTO 3D
          </h2>
          <p className="font-hand text-sm text-slate-300">
            Tómate un respiro antes de volver a la acción
          </p>
        </div>

        {/* Resumen en Vivo del Partido */}
        {stats && (
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950 border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                TIEMPO
              </span>
              <span className="font-mono text-lg font-black text-amber-400 mt-0.5">
                {Math.floor(stats.elapsedTime / 60)}:{(stats.elapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
                {isHunter ? <Target className="w-3.5 h-3.5 text-amber-400" /> : <Shield className="w-3.5 h-3.5 text-cyan-400" />}
                ROL
              </span>
              <span className={`font-comic text-xs mt-1 px-2 py-0.5 rounded-lg border border-black ${isHunter ? 'bg-amber-400 text-slate-950 font-black' : 'bg-cyan-400 text-slate-950 font-black'}`}>
                {isHunter ? 'Cazador' : 'Corredor'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                IMPACTOS
              </span>
              <span className="font-mono text-lg font-black text-rose-400 mt-0.5">
                {stats.playerHits} - {stats.botHits}
              </span>
            </div>
          </div>
        )}

        {/* Botones de Acción Estilo Cómic */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-xl tracking-wider flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 stroke-[2.5]" />
            CONTINUAR PARTIDA (ESC)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-200 font-comic text-base tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            REINICIAR PARTIDA
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-200 font-comic text-base tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
            AJUSTES & CONTROLES
          </button>

          <button
            onClick={onExitToMenu}
            className="w-full py-3 px-4 rounded-2xl bg-rose-900/80 hover:bg-rose-800 border-2 border-black text-rose-200 font-comic text-base tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer mt-1"
          >
            <Home className="w-4 h-4 text-rose-300 stroke-[2.5]" />
            SALIR AL MENÚ PRINCIPAL
          </button>
        </div>

        {/* Pie de página con atajos */}
        <div className="text-center font-hand text-xs text-slate-400 border-t-2 border-slate-800 pt-3">
          Presiona <kbd className="px-2 py-0.5 rounded-lg bg-black text-amber-300 font-comic text-xs border border-slate-700">ESC</kbd> para volver al laberinto
        </div>
      </div>
    </div>
  );
};
