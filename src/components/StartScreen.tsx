/**
 * Pantalla de Inicio / Menú Principal Clásico Estilo Cómic (StartScreen.tsx)
 * Interfaz limpia, clásica y estilizada con botón JUGAR, Configuración de Mapa, Cómo Jugar y Ajustes.
 */

import React, { useState } from 'react';
import { GameConfig, WinConditionType } from '../types';
import { Play, Map, HelpCircle, Settings, Sparkles, X, Target, Shield, Zap, Dice5, Check, Users } from 'lucide-react';

interface StartScreenProps {
  config: GameConfig;
  onStartMatch: (customConfig?: Partial<GameConfig>) => void;
  onOpenMultiplayer: () => void;
  onOpenSettings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ config, onStartMatch, onOpenMultiplayer, onOpenSettings }) => {
  const [seed, setSeed] = useState(config.mazeSeed);
  const [size, setSize] = useState(config.mazeSize);
  const [switchTime, setSwitchTime] = useState(config.roleSwitchTime);
  const [winCondition, setWinCondition] = useState<WinConditionType>(config.winCondition);
  const [botDifficulty, setBotDifficulty] = useState(config.botDifficulty);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  const handleLaunch = () => {
    onStartMatch({
      mazeSeed: seed,
      mazeSize: size,
      roleSwitchTime: switchTime,
      winCondition,
      botDifficulty,
    });
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 999999));
  };

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      
      {/* TARJETA PRINCIPAL DEL MENÚ (ESTILO CÓMIC) */}
      <div className="max-w-md w-full bg-slate-900 border-4 border-black rounded-3xl p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.95)] flex flex-col items-center gap-6 text-slate-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabecera / Título */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 border-2 border-black text-slate-950 font-comic text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            Acción &amp; Sigilo 3D
          </div>

          <h1 className="text-5xl md:text-6xl font-comic tracking-wider text-amber-400 drop-shadow-[4px_4px_0px_#000] mt-1">
            LABERINTO <span className="text-cyan-400">3D</span>
          </h1>

          <p className="font-hand text-slate-300 text-sm max-w-xs mt-0.5">
            Caza a tus rivales o escapa con vida en solitario o con amigos
          </p>
        </div>

        {/* BOTONES PRINCIPALES */}
        <div className="w-full flex flex-col gap-3">
          
          {/* Botón 1: JUGAR VS BOT (SOLO) */}
          <button
            onClick={handleLaunch}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-2xl tracking-wider flex items-center justify-center gap-2.5 shadow-[5px_5px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950 stroke-[2.5]" />
            JUGAR VS BOT (SOLO)
          </button>

          {/* Botón 2: MULTIJUGADOR ONLINE (1v1, 1v1v1, FFA, 2v2) */}
          <button
            onClick={onOpenMultiplayer}
            className="w-full py-3.5 px-5 rounded-2xl bg-sky-400 hover:bg-sky-300 border-3 border-black text-slate-950 font-comic text-xl tracking-wider flex items-center justify-center gap-2.5 shadow-[5px_5px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer"
          >
            <Users className="w-6 h-6 stroke-[2.5]" />
            MULTIJUGADOR ONLINE
          </button>

          {/* Botón 3: CONFIGURAR MAPA */}
          <button
            onClick={() => setIsMapModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-200 font-comic text-base tracking-wide flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Map className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            CONFIGURACIÓN DE MAPA
          </button>

          {/* Botón 4: CÓMO JUGAR & ROLES */}
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-200 font-comic text-base tracking-wide flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
            CÓMO JUGAR &amp; ROLES
          </button>

          {/* Botón 5: AJUSTES */}
          <button
            onClick={onOpenSettings}
            className="w-full py-2 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 font-comic text-sm tracking-wide flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            AJUSTES
          </button>
        </div>

        {/* Pie de pantalla */}
        <div className="font-hand text-[11px] text-slate-400 text-center">
          Selecciona <span className="text-amber-400 font-bold">SOLO</span> o crea una sala en <span className="text-sky-400 font-bold">MULTIJUGADOR</span>.
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE CONFIGURACIÓN DE MAPA & PARTIDA (ESTILO CÓMIC) */}
      {/* ============================================================ */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-slate-900 border-4 border-black rounded-3xl p-7 shadow-[8px_8px_0px_0px_#000] flex flex-col gap-5 text-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Map className="w-6 h-6 text-amber-400 stroke-[2.5]" />
                <h3 className="text-2xl font-comic text-amber-400 tracking-wide">CONFIGURACIÓN DE MAPA</h3>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            <div className="flex flex-col gap-4 font-comic">
              {/* Semilla */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Semilla del Laberinto:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="w-full bg-slate-950 border-2 border-black rounded-xl px-3 py-2 font-mono text-amber-300 text-base shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRandomSeed}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-comic rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Dice5 className="w-4 h-4" />
                    Azar
                  </button>
                </div>
              </div>

              {/* Tamaño del Laberinto */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Tamaño del Laberinto:</label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="bg-slate-950 border-2 border-black rounded-xl px-3 py-2 text-base text-slate-200 shadow-[2px_2px_0px_0px_#000] focus:outline-none cursor-pointer"
                >
                  <option value={15}>15 x 15 (Estándar - 4 Habitaciones)</option>
                  <option value={17}>17 x 17 (Grande - Más Pasillos)</option>
                  <option value={19}>19 x 19 (Enorme - Exploración Total)</option>
                </select>
              </div>

              {/* Tiempo de Intercambio de Rol */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Tiempo de Cambio de Rol:</label>
                <select
                  value={switchTime}
                  onChange={(e) => setSwitchTime(Number(e.target.value))}
                  className="bg-slate-950 border-2 border-black rounded-xl px-3 py-2 text-base text-slate-200 shadow-[2px_2px_0px_0px_#000] focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 Segundos (Frenético)</option>
                  <option value={15}>15 Segundos (Estándar)</option>
                  <option value={20}>20 Segundos (Táctico)</option>
                  <option value={30}>30 Segundos (Largo)</option>
                </select>
              </div>

              {/* Dificultad IA */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Dificultad del Rival IA:</label>
                <select
                  value={botDifficulty}
                  onChange={(e) => setBotDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                  className="bg-slate-950 border-2 border-black rounded-xl px-3 py-2 text-base text-slate-200 shadow-[2px_2px_0px_0px_#000] focus:outline-none cursor-pointer"
                >
                  <option value="EASY">Fácil (Principiante)</option>
                  <option value="MEDIUM">Medio (Desafiante)</option>
                  <option value="HARD">Difícil (Experto)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsMapModalOpen(false)}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-xl rounded-2xl shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              GUARDAR Y VOLVER
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE CÓMO JUGAR & ROLES (ESTILO CÓMIC) */}
      {/* ============================================================ */}
      {isHowToPlayOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-slate-900 border-4 border-black rounded-3xl p-7 shadow-[8px_8px_0px_0px_#000] flex flex-col gap-5 text-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
                <h3 className="text-2xl font-comic text-cyan-400 tracking-wide">CÓMO JUGAR &amp; ROLES</h3>
              </div>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-hand text-sm">
              <div className="p-3.5 bg-slate-950 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col gap-1">
                <div className="flex items-center gap-2 font-comic text-amber-400 text-lg">
                  <Target className="w-5 h-5 stroke-[2.5]" />
                  CUANDO ERES EL CAZADOR:
                </div>
                <p className="text-slate-300">
                  Llevas el arco preparado. Mantén presionado el <strong className="text-white font-comic">Click Izquierdo</strong> para tensar la cuerda y suelta para disparar flechas físicas. ¡Caza al rival antes de que cambie el rol!
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col gap-1">
                <div className="flex items-center gap-2 font-comic text-cyan-400 text-lg">
                  <Shield className="w-5 h-5 stroke-[2.5]" />
                  CUANDO ERES EL CORREDOR:
                </div>
                <p className="text-slate-300">
                  No tienes arco. Tu misión es sobrevivir. Usa las <strong className="text-white font-comic">Puertas con [E]</strong>, busca <strong className="text-white font-comic">Trampillas de escape</strong> y agáchate con <strong className="text-white font-comic">[C] o [Ctrl]</strong> para cruzar zonas bajas de gateo.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-400">
                ⭐ <strong className="text-slate-200">Tip:</strong> Las 4 habitaciones temáticas del laberinto tienen puertas de Entrada y Salida para que puedas cortar camino y despistar a tu rival.
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              className="w-full mt-1 py-3 bg-cyan-400 hover:bg-cyan-300 border-3 border-black text-slate-950 font-comic text-xl rounded-2xl shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              ¡ENTENDIDO!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
