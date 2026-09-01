/**
 * Modal de Lobby Multijugador Estilo Cómic (MultiplayerLobbyModal.tsx)
 * Permite crear salas con código, unirse, elegir modos (1v1, 1v1v1, FFA, 2v2) y configurar el mapa dinámico.
 */

import React, { useState, useEffect } from 'react';
import { GameMode, LobbyRoomState } from '../types';
import { multiplayerManager } from '../network/MultiplayerManager';
import { Users, Swords, Shield, Copy, Check, Play, ArrowLeft, RefreshCw, Zap, Flame, UserCheck } from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (lobby: LobbyRoomState) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  const [tab, setTab] = useState<'SELECT' | 'CREATE' | 'JOIN' | 'LOBBY'>('SELECT');
  const [playerName, setPlayerName] = useState('Arquero_' + Math.floor(Math.random() * 900 + 100));
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('1v1');
  const [mapShift, setMapShift] = useState<number>(30); // 30s
  
  const [lobbyState, setLobbyState] = useState<LobbyRoomState | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    multiplayerManager.onLobbyUpdate = (lobby) => {
      setLobbyState({ ...lobby });
    };

    multiplayerManager.onGameStart = (lobby) => {
      onStartGame(lobby);
    };

    return () => {
      multiplayerManager.onLobbyUpdate = null;
      multiplayerManager.onGameStart = null;
    };
  }, [onStartGame]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const code = await multiplayerManager.createRoom(playerName, selectedMode, mapShift);
      if (multiplayerManager.currentLobby) {
        setLobbyState({ ...multiplayerManager.currentLobby });
        setTab('LOBBY');
      }
    } catch (err: any) {
      setErrorMessage('Error al crear sala: ' + (err?.message || 'Inténtalo de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setErrorMessage('Por favor introduce un código de sala.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const lobby = await multiplayerManager.joinRoom(joinCode, playerName);
      setLobbyState({ ...lobby });
      setTab('LOBBY');
    } catch (err: any) {
      setErrorMessage('No se pudo conectar a la sala. Verifica el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (lobbyState?.roomId) {
      navigator.clipboard.writeText(lobbyState.roomId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleLaunchGame = () => {
    multiplayerManager.startGame();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-4 border-black rounded-3xl max-w-xl w-full p-7 flex flex-col items-center shadow-[10px_10px_0px_0px_rgba(0,0,0,0.95)] text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="w-full flex items-center justify-between mb-5 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-comic tracking-wider text-amber-400 drop-shadow-[2px_2px_0px_#000]">
                MULTIJUGADOR ONLINE
              </h2>
              <p className="font-hand text-xs text-slate-400">Juega en tiempo real con amigos mediante WebRTC</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              multiplayerManager.disconnect();
              setTab('SELECT');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* PANTALLA 1: SELECCIONAR ACCIÓN */}
        {tab === 'SELECT' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-comic text-xs text-slate-400">TU NOMBRE DE JUGADOR</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                className="w-full bg-slate-950 border-2 border-black rounded-xl p-3 text-slate-100 font-comic text-lg focus:outline-none focus:border-amber-400 shadow-[3px_3px_0px_0px_#000]"
                placeholder="Nombre del Arquero"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => setTab('CREATE')}
                className="py-6 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic flex flex-col items-center gap-2.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Flame className="w-8 h-8 stroke-[2.5]" />
                <span className="text-xl tracking-wider">CREAR SALA</span>
                <span className="text-[11px] font-hand font-normal opacity-85">Tú configuras el modo y mapa</span>
              </button>

              <button
                onClick={() => setTab('JOIN')}
                className="py-6 px-4 rounded-2xl bg-sky-400 hover:bg-sky-300 border-3 border-black text-slate-950 font-comic flex flex-col items-center gap-2.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <UserCheck className="w-8 h-8 stroke-[2.5]" />
                <span className="text-xl tracking-wider">UNIRSE A SALA</span>
                <span className="text-[11px] font-hand font-normal opacity-85">Ingresa el código de un amigo</span>
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 2: CREAR SALA */}
        {tab === 'CREATE' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTab('SELECT')}
                className="font-comic text-xs text-slate-400 flex items-center gap-1 hover:text-amber-400 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <span className="font-comic text-xs text-amber-400">CONFIGURACIÓN DE SALA</span>
            </div>

            {/* Selector de Modo */}
            <div className="flex flex-col gap-1.5">
              <label className="font-comic text-xs text-slate-400">MODO DE JUEGO</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: '1v1', label: '1 vs 1', desc: 'Duelo Cazador vs Corredor', icon: Swords },
                  { id: '1v1v1', label: '1 vs 1 vs 1', desc: 'Triángulo Mortal (3 Jugadores)', icon: Zap },
                  { id: 'FFA', label: 'Todos vs Todos', desc: 'Batalla Libre (4 Jugadores)', icon: Flame },
                  { id: '2v2', label: 'Equipos 2 vs 2', desc: 'Equipo Azul vs Rojo', icon: Shield },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id as GameMode)}
                      className={`p-3 rounded-xl border-2 border-black flex flex-col text-left transition-all cursor-pointer ${
                        isSel
                          ? 'bg-amber-400 text-slate-950 shadow-[3px_3px_0px_0px_#000]'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 stroke-[2.5]" />
                        <span className="font-comic text-sm tracking-wide">{m.label}</span>
                      </div>
                      <span className="font-hand text-[11px] opacity-80 mt-0.5">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Cambio de Mapa Dinámico */}
            <div className="flex flex-col gap-1.5">
              <label className="font-comic text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                CAMBIO DINÁMICO DE MAPA (TERREMOTO)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: 0, label: 'Sin Cambio' },
                  { val: 20, label: 'Cada 20s' },
                  { val: 30, label: 'Cada 30s' },
                  { val: 45, label: 'Cada 45s' },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => setMapShift(s.val)}
                    className={`py-2 px-1 rounded-xl font-comic text-xs border-2 border-black text-center transition-all cursor-pointer ${
                      mapShift === s.val
                        ? 'bg-amber-400 text-slate-950 shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && <p className="font-comic text-xs text-rose-400">{errorMessage}</p>}

            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-xl tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Flame className="w-5 h-5" />
              {isLoading ? 'GENERANDO SALA...' : 'CREAR Y ABRIR SALA'}
            </button>
          </div>
        )}

        {/* PANTALLA 3: UNIRSE A SALA */}
        {tab === 'JOIN' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTab('SELECT')}
                className="font-comic text-xs text-slate-400 flex items-center gap-1 hover:text-amber-400 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <span className="font-comic text-xs text-sky-400">UNIRSE A SALA</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-comic text-xs text-slate-400">CÓDIGO DE SALA (EJ: LAB-8391)</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full bg-slate-950 border-2 border-black rounded-xl p-3 text-center text-amber-400 font-comic text-2xl tracking-widest focus:outline-none focus:border-sky-400 shadow-[3px_3px_0px_0px_#000]"
                placeholder="LAB-XXXX"
              />
            </div>

            {errorMessage && <p className="font-comic text-xs text-rose-400">{errorMessage}</p>}

            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-sky-400 hover:bg-sky-300 border-3 border-black text-slate-950 font-comic text-xl tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-5 h-5" />
              {isLoading ? 'CONECTANDO...' : 'CONECTARSE A LA SALA'}
            </button>
          </div>
        )}

        {/* PANTALLA 4: LOBBY DE ESPERA */}
        {tab === 'LOBBY' && lobbyState && (
          <div className="w-full flex flex-col gap-5">
            {/* Banner con Código de Sala */}
            <div className="w-full bg-slate-950 border-3 border-black rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#000]">
              <div className="flex flex-col">
                <span className="font-comic text-xs text-slate-400">CÓDIGO DE SALA:</span>
                <span className="font-comic text-3xl text-amber-400 tracking-widest">{lobbyState.roomId}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-black text-slate-950 font-comic text-sm tracking-wide flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {isCopied ? '¡COPIADO!' : 'COPIAR'}
              </button>
            </div>

            {/* Info de Modo */}
            <div className="flex items-center justify-between px-2 font-comic text-xs text-slate-300">
              <span>MODO: <b className="text-amber-400">{lobbyState.mode}</b></span>
              <span>CAMBIO DE MAPA: <b className="text-sky-400">{lobbyState.mapShiftInterval > 0 ? `${lobbyState.mapShiftInterval}s` : 'Desactivado'}</b></span>
            </div>

            {/* Lista de Jugadores en Sala */}
            <div className="flex flex-col gap-2">
              <label className="font-comic text-xs text-slate-400">JUGADORES CONECTADOS ({lobbyState.players.length})</label>
              <div className="grid grid-cols-2 gap-2.5">
                {lobbyState.players.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="bg-slate-950 border-2 border-black rounded-xl p-3 flex items-center justify-between shadow-[2px_2px_0px_0px_#000]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]"
                        style={{ backgroundColor: p.color || '#38bdf8' }}
                      />
                      <span className="font-comic text-sm text-slate-100">{p.name}</span>
                    </div>
                    {p.isHost && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 text-[10px] font-comic">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Inicio (Host) o Mensaje de Espera (Cliente) */}
            {multiplayerManager.isHost ? (
              <button
                onClick={handleLaunchGame}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 border-3 border-black text-slate-950 font-comic text-2xl tracking-wider flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                ¡INICIAR PARTIDA!
              </button>
            ) : (
              <div className="w-full py-3 bg-slate-950 border-2 border-black rounded-2xl text-center font-comic text-sm text-slate-400 animate-pulse">
                Esperando a que el Anfitrión inicie la partida...
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
