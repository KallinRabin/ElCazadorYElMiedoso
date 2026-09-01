/**
 * HUD principal del juego en primera persona
 * Muestra Rol actual, Temporizador de cambio de rol, Barra de Stamina, Salud, Flechas e Interacción
 */

import React, { useState, useEffect } from 'react';
import { PlayerStats, MatchStats, PlayerRole } from '../types';
import { Shield, Target, Crosshair, Zap, Heart, AlertTriangle, Key, Flame } from 'lucide-react';

interface HUDProps {
  playerStats: PlayerStats | null;
  matchStats: MatchStats | null;
  interactionPrompt: string | null;
  roleAlert: { role: PlayerRole; message: string } | null;
  damageFlash: boolean;
  hitMarker: boolean;
  onOpenSettings: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerStats,
  matchStats,
  interactionPrompt,
  roleAlert,
  damageFlash,
  hitMarker,
  onOpenSettings,
}) => {
  if (!playerStats || !matchStats) return null;

  const isHunter = playerStats.role === PlayerRole.HUNTER;
  const timer = Math.ceil(matchStats.currentRoleTimer);
  const isTimerCritical = timer <= 4;
  const staminaPercent = Math.max(0, Math.min(100, (playerStats.stamina / playerStats.maxStamina) * 100));
  const healthPercent = Math.max(0, Math.min(100, (playerStats.health / playerStats.maxHealth) * 100));

  // Temporizador general de partida (3:00 min)
  const matchRemaining = Math.max(0, 180 - matchStats.elapsedTime);
  const matchMin = Math.floor(matchRemaining / 60);
  const matchSec = matchRemaining % 60;
  const matchTimeFormatted = `${matchMin}:${matchSec < 10 ? '0' : ''}${matchSec}`;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-6 z-20">
      {/* 1. EFECTOS DE PANTALLA (Daño y Hit Marker) */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/35 animate-pulse pointer-events-none transition-opacity duration-150" />
      )}

      {/* 2. PARTE SUPERIOR: TEMPORIZADORES ESTILO CÓMIC */}
      <div className="w-full flex flex-col items-center justify-start gap-2">
        <div className="flex items-center gap-4">
          {/* Temporizador General de Partida (3:00) */}
          <div className="flex items-center gap-2.5 px-5 py-2 rounded-2xl border-2 border-slate-700 bg-slate-900/95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] backdrop-blur-md">
            <span className="text-xs font-black tracking-wider uppercase text-slate-300">
              Partida:
            </span>
            <span className="font-mono text-xl font-black text-amber-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
              {matchTimeFormatted}
            </span>
          </div>

          {/* Temporizador de Cambio de Rol */}
          <div
            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border-2 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] backdrop-blur-md ${
              isTimerCritical
                ? 'bg-rose-950 border-rose-500 text-rose-100 scale-105 animate-bounce'
                : 'bg-slate-900/95 border-amber-400/80 text-slate-100'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full border-2 border-black ${isTimerCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-xs md:text-sm font-black tracking-wider uppercase text-slate-200">
              Cambio de Rol:
            </span>
            <span
              className={`font-mono text-xl md:text-2xl font-black px-2.5 py-0.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] ${
                isTimerCritical ? 'text-white bg-rose-600' : 'text-slate-950 bg-amber-400'
              }`}
            >
              {timer < 10 ? `0${timer}` : timer}s
            </span>
          </div>
        </div>

        {/* Notificación cinemática de cambio de rol */}
        {roleAlert && (
          <div
            className={`mt-3 px-6 py-3 rounded-2xl border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] backdrop-blur-lg animate-in fade-in zoom-in duration-200 flex items-center gap-3 ${
              roleAlert.role === PlayerRole.HUNTER
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-cyan-500 text-slate-950 font-black'
            }`}
          >
            {roleAlert.role === PlayerRole.HUNTER ? (
              <Target className="w-6 h-6 stroke-[3] text-slate-950 animate-spin" />
            ) : (
              <Shield className="w-6 h-6 stroke-[3] text-slate-950 animate-pulse" />
            )}
            <span className="font-black text-sm md:text-base tracking-wide uppercase">{roleAlert.message}</span>
          </div>
        )}
      </div>

      {/* 3. CENTRO: RETÍCULA DINÁMICA & PROMPT DE INTERACCIÓN */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Crosshair */}
        <div className="relative flex items-center justify-center">
          {hitMarker && (
            <div className="absolute w-8 h-8 border-2 border-red-500 rotate-45 animate-ping opacity-90" />
          )}

          {isHunter ? (
            // Retícula de tiro con arco
            <div
              className={`relative transition-all duration-100 ${
                playerStats.isChargingBow ? 'scale-75 rotate-45' : 'scale-100'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              {/* Anillo de carga de flecha */}
              {playerStats.isChargingBow && (
                <svg className="absolute -top-4 -left-4 w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray={88}
                    strokeDashoffset={88 - 88 * playerStats.bowChargeProgress}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          ) : (
            // Retícula circular de sigilo/corredor
            <div className="w-2 h-2 rounded-full border border-cyan-400 bg-cyan-400/40 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          )}
        </div>

        {/* Prompt de Interacción cuando mira una puerta, trampilla o carcaj */}
        {interactionPrompt && (
          <div className="mt-8 px-5 py-2.5 rounded-2xl bg-amber-400 border-3 border-black text-slate-950 font-comic text-lg font-black tracking-wider uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] flex items-center gap-2 animate-bounce">
            <Key className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span>{interactionPrompt}</span>
          </div>
        )}
      </div>

      {/* 4. PARTE INFERIOR: ESTADO DEL JUGADOR, STAMINA Y ARCO ESTILO CÓMIC */}
      <div className="w-full flex flex-col md:flex-row items-end justify-between gap-4">
        {/* Lado Izquierdo: Rol y Salud */}
        <div className="flex flex-col gap-2 bg-slate-900/95 p-4 rounded-3xl border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] backdrop-blur-md min-w-[250px]">
          {/* Badge de Rol Actual */}
          <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-800">
            <div className="flex items-center gap-2">
              {isHunter ? (
                <Target className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              ) : (
                <Shield className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
              )}
              <span className="font-comic text-sm tracking-wider text-slate-300">TU ROL:</span>
            </div>
            <span
              className={`font-comic text-base px-2.5 py-0.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] ${
                isHunter
                  ? 'text-slate-950 bg-amber-400 font-black'
                  : 'text-slate-950 bg-cyan-400 font-black'
              }`}
            >
              {isHunter ? 'CAZADOR' : 'CORREDOR'}
            </span>
          </div>

          {/* Barra de Salud */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400 font-comic text-sm tracking-wider">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-600" />
                VIDA
              </span>
              <span className="font-mono font-black text-slate-200">
                {Math.round(playerStats.health)} / {playerStats.maxHealth}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border-2 border-black">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 rounded-full transition-all duration-200"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lado Centro: Barra de Stamina */}
        <div className="flex flex-col items-center gap-1.5 bg-slate-900/95 px-6 py-3.5 rounded-3xl border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] backdrop-blur-md min-w-[280px]">
          <div className="w-full flex justify-between items-center text-xs font-black tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400 font-comic text-sm">
              <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
              STAMINA
            </span>
            <span className="font-comic text-xs tracking-wider text-slate-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              {playerStats.isCrouched ? 'AGACHADO' : playerStats.isSprinting ? 'CORRIENDO' : 'CAMINANDO'}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border-2 border-black">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                staminaPercent <= 20
                  ? 'bg-rose-500 animate-pulse'
                  : staminaPercent < 50
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>

        {/* Lado Derecho: Flechas o Sigilo */}
        <div className="flex flex-col gap-2 bg-slate-900/95 p-4 rounded-3xl border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] backdrop-blur-md min-w-[220px]">
          {isHunter ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-comic text-base text-amber-400 tracking-wider">FLECHAS:</span>
                <span className="font-comic text-2xl font-black text-slate-950 px-3 py-0.5 bg-amber-400 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
                  {playerStats.arrows}
                </span>
              </div>
              <div className="font-hand text-xs text-slate-300 mt-1">
                {playerStats.canShoot ? 'Mantén Click Izq. para tensar' : '⚡ Recarga rápida...'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="font-comic text-sm text-cyan-400 tracking-wider">SIGILO & HUIDA:</span>
              <span className="font-hand text-xs text-slate-300">Usa trampillas, puertas y pasajes bajos con [C] o [Ctrl]</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
