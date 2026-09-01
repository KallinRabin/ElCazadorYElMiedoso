/**
 * Modal de Fin de Partida Estilo Cómic (GameOverModal.tsx)
 */

import React, { useEffect } from 'react';
import { MatchStats } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Home, Clock, Target, Activity } from 'lucide-react';

interface GameOverModalProps {
  stats: MatchStats | null;
  onRematch: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRematch, onReturnToMenu }) => {
  if (!stats || !stats.winner) return null;

  const isPlayerWinner = stats.winner === 'PLAYER';

  useEffect(() => {
    if (isPlayerWinner) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isPlayerWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-4 border-black rounded-3xl max-w-md w-full p-8 flex flex-col items-center text-center shadow-[10px_10px_0px_0px_rgba(0,0,0,0.95)] text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Icono de Resultado */}
        <div
          className={`w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_#000] ${
            isPlayerWinner
              ? 'bg-amber-400 text-slate-950 animate-bounce'
              : 'bg-rose-600 text-white'
          }`}
        >
          {isPlayerWinner ? <Trophy className="w-12 h-12 stroke-[2.5]" /> : <Skull className="w-12 h-12 stroke-[2.5]" />}
        </div>

        {/* Título de Resultado */}
        <h2 className="text-4xl font-comic tracking-wider text-amber-400 drop-shadow-[2px_2px_0px_#000] mb-1">
          {isPlayerWinner ? '¡VICTORIA ÉPICA!' : 'DERROTA'}
        </h2>
        <p className="font-hand text-sm text-slate-300 mb-6">{stats.winReason}</p>

        {/* Estadísticas de la Partida */}
        <div className="w-full grid grid-cols-3 gap-2.5 bg-slate-950 p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] mb-6 text-center">
          <div className="flex flex-col items-center">
            <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              TIEMPO
            </span>
            <span className="font-mono text-base font-bold text-slate-200 mt-0.5">{stats.elapsedTime}s</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              ROLES
            </span>
            <span className="font-mono text-base font-bold text-amber-400 mt-0.5">{stats.roleSwitchCount}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-comic text-xs text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              IMPACTOS
            </span>
            <span className="font-mono text-base font-bold text-rose-400 mt-0.5">
              {stats.playerHits} - {stats.botHits}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onRematch}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-2xl tracking-wider flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <RotateCcw className="w-6 h-6 stroke-[3]" />
            ¡REVANCHA!
          </button>
          
          <button
            onClick={onReturnToMenu}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 font-comic text-base tracking-wide flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};
