import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from './game/GameManager';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseMenuModal } from './components/PauseMenuModal';
import { ControlsGuide } from './components/ControlsGuide';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { GameConfig, GameState, LobbyRoomState, MatchStats, PlayerRole, PlayerStats, DEFAULT_CONFIG } from './types';
import { Lock, MousePointer } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameManagerRef = useRef<GameManager | null>(null);

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const gameStateRef = useRef<GameState>(GameState.MENU);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [roleAlert, setRoleAlert] = useState<{ role: PlayerRole; message: string } | null>(null);
  const [mapAlert, setMapAlert] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const [hitMarker, setHitMarker] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const justResumedRef = useRef<boolean>(false);

  // Helper para cambiar estado de forma síncrona en ref y state
  const changeGameState = (newState: GameState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  };

  // 1. Inicialización de GameManager
  useEffect(() => {
    const gm = new GameManager(config);
    gameManagerRef.current = gm;

    if (canvasRef.current) {
      gm.initRenderer(canvasRef.current);
    }

    // Callbacks de eventos
    gm.onStateChange((newState, stats) => {
      changeGameState(newState);
      setMatchStats(stats);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    });

    gm.onRoleAlert((role, message) => {
      setRoleAlert({ role, message });
      setTimeout(() => setRoleAlert(null), 3500);
    });

    gm.onMapShiftAlert((message) => {
      setMapAlert(message);
      setTimeout(() => setMapAlert(null), 4000);
    });

    gm.onHitEffect((type) => {
      if (type === 'damage') {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 200);
      } else {
        setHitMarker(true);
        setTimeout(() => setHitMarker(false), 150);
      }
    });

    // Bucle de sincronización de estadísticas React (60fps)
    const statsInterval = setInterval(() => {
      if (gm.gameState === GameState.PLAYING) {
        setPlayerStats(gm.player.getStats());
        setMatchStats(gm.getMatchStats());
        const target = gm.player.interactionSystem.getCurrentTarget();
        setInteractionPrompt(target ? target.getPrompt() : null);
      }
    }, 1000 / 60);

    return () => {
      clearInterval(statsInterval);
      gm.destroy();
    };
  }, []);

  // 2. Control de Pointer Lock y Eventos de Ratón / Teclado
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = !!document.pointerLockElement;
      setIsPointerLocked(locked);

      // Si el navegador desbloquea el ratón mientras estábamos jugando:
      // Solo pausar si el juego está en curso y NO ha terminado en GAME_OVER ni estamos en menú
      if (!locked && gameStateRef.current === GameState.PLAYING && !justResumedRef.current) {
        changeGameState(GameState.PAUSED);
        if (gameManagerRef.current) {
          gameManagerRef.current.gameState = GameState.PAUSED;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si la partida terminó (GAME_OVER) o estamos en el Menú (MENU), bloquear tecla ESC o teclas de juego
      if (gameStateRef.current === GameState.GAME_OVER || gameStateRef.current === GameState.MENU) {
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (gameStateRef.current === GameState.PLAYING) {
          // Abrir menú de pausa y liberar ratón
          changeGameState(GameState.PAUSED);
          if (gameManagerRef.current) {
            gameManagerRef.current.gameState = GameState.PAUSED;
          }
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
          return;
        } else if (gameStateRef.current === GameState.PAUSED) {
          // Cerrar menú de pausa y volver al juego
          handleResumeMatch();
          return;
        }
      }

      if (gameStateRef.current === GameState.PLAYING) {
        if (!document.pointerLockElement) {
          requestPointerLock();
        }
        gameManagerRef.current?.player.onKeyDown(e);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameStateRef.current === GameState.PLAYING) {
        gameManagerRef.current?.player.onKeyUp(e);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameStateRef.current === GameState.PLAYING) {
        gameManagerRef.current?.player.onMouseMove(e.movementX, e.movementY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStateRef.current === GameState.PLAYING) {
        if (!document.pointerLockElement) {
          requestPointerLock();
        }
        gameManagerRef.current?.player.onMouseDown(e.button);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameStateRef.current === GameState.PLAYING) {
        gameManagerRef.current?.player.onMouseUp(e.button, (arrow) => {
          gameManagerRef.current?.shootPlayerArrow(arrow);
        });
      }
    };

    const handleWindowClick = () => {
      if (gameStateRef.current === GameState.PLAYING && !document.pointerLockElement) {
        requestPointerLock();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleWindowClick);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [gameState]);

  const requestPointerLock = () => {
    try {
      if (canvasRef.current && document.pointerLockElement !== canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    } catch {}
  };

  const handleStartMatch = (customConfig?: Partial<GameConfig>) => {
    justResumedRef.current = true;
    setTimeout(() => {
      justResumedRef.current = false;
    }, 450);

    const randomSeed = customConfig?.mazeSeed !== undefined ? customConfig.mazeSeed : Math.floor(Math.random() * 9999999) + 1;
    const merged = { ...config, ...(customConfig || {}), mazeSeed: randomSeed };
    setConfig(merged);
    gameManagerRef.current?.startMatch(merged);
    changeGameState(GameState.PLAYING);
    requestPointerLock();
  };

  const handleStartMultiplayerMatch = (lobby: LobbyRoomState) => {
    setIsMultiplayerOpen(false);
    justResumedRef.current = true;
    setTimeout(() => {
      justResumedRef.current = false;
    }, 450);

    gameManagerRef.current?.startMultiplayerMatch(lobby);
    changeGameState(GameState.PLAYING);
    requestPointerLock();
  };

  const handleResumeMatch = () => {
    justResumedRef.current = true;
    setTimeout(() => {
      justResumedRef.current = false;
    }, 450);

    if (gameManagerRef.current) {
      gameManagerRef.current.gameState = GameState.PLAYING;
    }
    changeGameState(GameState.PLAYING);
    requestPointerLock();
  };

  const handleExitToMenu = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.gameState = GameState.MENU;
    }
    changeGameState(GameState.MENU);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  const handleRestartMatch = () => {
    justResumedRef.current = true;
    setTimeout(() => {
      justResumedRef.current = false;
    }, 450);

    const newSeed = Math.floor(Math.random() * 9999999) + 1;
    const updatedConfig = { ...config, mazeSeed: newSeed };
    setConfig(updatedConfig);
    gameManagerRef.current?.startMatch(updatedConfig);
    changeGameState(GameState.PLAYING);
    requestPointerLock();
  };

  const handleApplySettings = (newConfig: GameConfig) => {
    setConfig(newConfig);
    if (gameManagerRef.current) {
      gameManagerRef.current.config = newConfig;
      gameManagerRef.current.player.configure(newConfig);
      gameManagerRef.current.roleManager.configure(newConfig.roleSwitchTime);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">
      {/* Canvas 3D de Three.js */}
      <canvas
        ref={canvasRef}
        onClick={() => {
          if (gameState === GameState.PLAYING) {
            requestPointerLock();
          }
        }}
        className="w-full h-full block cursor-crosshair focus:outline-none"
      />

      {/* Alerta de Terremoto / Cambio de Mapa */}
      {mapAlert && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-400 border-3 border-black text-slate-950 px-6 py-2.5 rounded-2xl font-comic text-lg shadow-[6px_6px_0px_0px_#000] animate-bounce">
          {mapAlert}
        </div>
      )}

      {/* Botón flotante de controles y ajustes */}
      {gameState === GameState.PLAYING && (
        <ControlsGuide onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      {/* HUD del Juego */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <HUD
          playerStats={playerStats}
          matchStats={matchStats}
          interactionPrompt={interactionPrompt}
          roleAlert={roleAlert}
          damageFlash={damageFlash}
          hitMarker={hitMarker}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Pantalla de Inicio / Menú */}
      {gameState === GameState.MENU && (
        <StartScreen
          config={config}
          onStartMatch={handleStartMatch}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Modal de Lobby Multijugador */}
      <MultiplayerLobbyModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        onStartGame={handleStartMultiplayerMatch}
      />

      {/* Modal de Pausa (ESC) */}
      <PauseMenuModal
        isOpen={gameState === GameState.PAUSED}
        stats={matchStats}
        onResume={handleResumeMatch}
        onRestart={() => handleStartMatch()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExitToMenu={handleExitToMenu}
      />

      {/* Modal de Fin de Partida (Victoria / Derrota) */}
      {gameState === GameState.GAME_OVER && (
        <GameOverModal
          stats={matchStats}
          onRematch={() => handleStartMatch()}
          onReturnToMenu={handleExitToMenu}
        />
      )}

      {/* Modal de Configuración & Documentación */}
      <SettingsModal
        config={config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveConfig={handleApplySettings}
      />
    </div>
  );
}
