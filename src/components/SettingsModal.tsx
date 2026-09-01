/**
 * Modal de Configuración y Documentación de Arquitectura
 * Permite modificar en tiempo real todas las variables del juego (roles, stamina, velocidades, arco, salud)
 */

import React, { useState } from 'react';
import { GameConfig, DEFAULT_CONFIG } from '../types';
import { audioManager } from '../audio/AudioManager';
import { X, Sliders, BookOpen, RotateCcw, Volume2, Shield, Target, Zap, Activity } from 'lucide-react';

interface SettingsModalProps {
  config: GameConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (newConfig: GameConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, isOpen, onClose, onSaveConfig }) => {
  const [activeTab, setActiveTab] = useState<'gameplay' | 'audio' | 'architecture'>('gameplay');
  const [formConfig, setFormConfig] = useState<GameConfig>({ ...config });
  const [masterVol, setMasterVol] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen) return null;

  const handleChange = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => {
    setFormConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleResetDefaults = () => {
    setFormConfig({ ...DEFAULT_CONFIG });
  };

  const handleSave = () => {
    onSaveConfig(formConfig);
    onClose();
  };

  const handleVolumeChange = (vol: number) => {
    setMasterVol(vol);
    audioManager.setMasterVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioManager.setMuted(nextMute);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Configuración &amp; Arquitectura</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('gameplay')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'gameplay'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ajustes de Juego
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'audio'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audio &amp; Sensibilidad
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
              activeTab === 'architecture'
                ? 'border-amber-400 text-amber-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Documentación Arquitectura
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {activeTab === 'gameplay' && (
            <div className="flex flex-col gap-6">
              {/* 1. Sistema de Roles */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  Sistema de Roles (RoleSwitchTime)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Intervalo de Cambio de Rol:</span>
                      <span className="font-mono text-amber-400">{formConfig.roleSwitchTime}s</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={1}
                      value={formConfig.roleSwitchTime}
                      onChange={(e) => handleChange('roleSwitchTime', Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <span className="text-[11px] text-slate-500">Tiempo antes de que Cazador y Corredor se intercambien.</span>
                  </div>
                </div>
              </div>

              {/* 2. Movimiento & Velocidades */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  Velocidades del Personaje
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Caminar (WalkSpeed):</span>
                      <span className="font-mono text-cyan-400">{formConfig.playerWalkSpeed} m/s</span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={10}
                      step={0.5}
                      value={formConfig.playerWalkSpeed}
                      onChange={(e) => handleChange('playerWalkSpeed', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Correr (RunSpeed):</span>
                      <span className="font-mono text-cyan-400">{formConfig.playerRunSpeed} m/s</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={16}
                      step={0.5}
                      value={formConfig.playerRunSpeed}
                      onChange={(e) => handleChange('playerRunSpeed', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Agachado (CrouchSpeed):</span>
                      <span className="font-mono text-cyan-400">{formConfig.playerCrouchSpeed} m/s</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.2}
                      value={formConfig.playerCrouchSpeed}
                      onChange={(e) => handleChange('playerCrouchSpeed', Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Stamina */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  Sistema de Stamina
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Stamina Máxima:</span>
                      <span className="font-mono text-emerald-400">{formConfig.maxStamina}</span>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={10}
                      value={formConfig.maxStamina}
                      onChange={(e) => handleChange('maxStamina', Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Consumo (Drain/s):</span>
                      <span className="font-mono text-emerald-400">{formConfig.staminaDrainRate}/s</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={2}
                      value={formConfig.staminaDrainRate}
                      onChange={(e) => handleChange('staminaDrainRate', Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Recuperación (Regen/s):</span>
                      <span className="font-mono text-emerald-400">{formConfig.staminaRecoveryRate}/s</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={2}
                      value={formConfig.staminaRecoveryRate}
                      onChange={(e) => handleChange('staminaRecoveryRate', Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Combate & Arco */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  Arco, Flechas &amp; Salud
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Daño Flecha (ArrowDamage):</span>
                      <span className="font-mono text-rose-400">{formConfig.arrowDamage} HP</span>
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={5}
                      value={formConfig.arrowDamage}
                      onChange={(e) => handleChange('arrowDamage', Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Tiempo Recarga (Reload):</span>
                      <span className="font-mono text-rose-400">{formConfig.arrowReloadTime}s</span>
                    </label>
                    <input
                      type="range"
                      min={0.4}
                      max={3.0}
                      step={0.1}
                      value={formConfig.arrowReloadTime}
                      onChange={(e) => handleChange('arrowReloadTime', Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                      <span>Vida Máxima (MaxHealth):</span>
                      <span className="font-mono text-rose-400">{formConfig.playerMaxHealth} HP</span>
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={10}
                      value={formConfig.playerMaxHealth}
                      onChange={(e) => handleChange('playerMaxHealth', Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex flex-col gap-6">
              {/* Audio Controls */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Volume2 className="w-4 h-4" />
                    Sonido &amp; Efectos
                  </div>
                  <button
                    onClick={handleToggleMute}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isMuted ? 'Silenciado (Muted)' : 'Activo'}
                  </button>
                </div>

                <div>
                  <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Volumen Maestro:</span>
                    <span className="font-mono text-amber-400">{Math.round(masterVol * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={masterVol}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Sensibilidad de Ratón */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Control de Cámara</div>
                <div>
                  <label className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Sensibilidad del Ratón:</span>
                    <span className="font-mono text-amber-400">{formConfig.mouseSensitivity}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    value={formConfig.mouseSensitivity}
                    onChange={(e) => handleChange('mouseSensitivity', Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="headBobCheck"
                    checked={formConfig.headBobEnabled}
                    onChange={(e) => handleChange('headBobEnabled', e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <label htmlFor="headBobCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Activar balanceo de cabeza al caminar/correr (Head Bobbing)
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                Guía de Arquitectura Modular del Proyecto
              </div>

              <p>
                El juego ha sido estructurado en módulos desacoplados listos para multijugador y expansión futura:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 font-mono text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold">RoleManager:</span> Controla el temporizador de 15s y la inversión de roles (Cazador/Corredor).
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold">PlayerController:</span> Integra cámara en 1ra persona, movimiento con colisiones, stamina y salud.
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-rose-400 font-bold">BowSystem &amp; Arrow:</span> Simulación física balística con gravedad, tensado de cuerda y daño.
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-emerald-400 font-bold">Door &amp; HiddenPassage:</span> Puertas con bisagra animada y trampillas de atajo secreto.
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-purple-400 font-bold">MazeGenerator:</span> Generación procedural con semilla (seed), pasillos, salas y zonas bajas.
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-blue-400 font-bold">BotController:</span> IA rival que persigue como cazador o huye y se oculta como corredor.
                </div>
              </div>

              <div className="mt-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200">
                <strong>¿Cómo modificar los valores principales en código?</strong>
                <br />
                En <code className="text-amber-300">src/types.ts</code> en el objeto <code className="text-amber-300">DEFAULT_CONFIG</code> o directamente en vivo desde esta ventana de configuración.
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Valores por Defecto
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
