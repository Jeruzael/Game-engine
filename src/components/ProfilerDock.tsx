import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  AlertOctagon, 
  Cpu, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ProfilerMetrics, EngineEvent, CrashReport } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';

interface ProfilerDockProps {
  metrics: ProfilerMetrics;
  events: EngineEvent[];
  onSimulateCrash: () => void;
  activeCrash: CrashReport | null;
  onResolveCrash: () => void;
  onClearEvents: () => void;
}

export const ProfilerDock: React.FC<ProfilerDockProps> = ({
  metrics,
  events,
  onSimulateCrash,
  activeCrash,
  onResolveCrash,
  onClearEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'profiler' | 'events' | 'crash'>('profiler');
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`border-t border-neutral-800 bg-neutral-900/95 flex flex-col shrink-0 select-none transition-all ${
      isExpanded ? 'h-52' : 'h-8'
    }`}>
      {/* Dock Bar Header */}
      <div className="h-8 px-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-neutral-400 hover:text-white rounded"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('profiler'); }}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeTab === 'profiler'
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Profiler & Metrics</span>
            </button>

            <button
              onClick={() => { soundFX.playClick(); setActiveTab('events'); }}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeTab === 'events'
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Event System Bus</span>
              <span className="text-[10px] bg-neutral-950 px-1 rounded text-neutral-400 font-normal">{events.length}</span>
            </button>

            <button
              onClick={() => { soundFX.playClick(); setActiveTab('crash'); }}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                activeTab === 'crash'
                  ? 'bg-neutral-800 text-rose-400 border border-neutral-700 font-semibold'
                  : activeCrash
                  ? 'text-rose-400 animate-pulse font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Crash & Assertions</span>
              {activeCrash && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </button>
          </div>
        </div>

        {/* Quick status on right */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-neutral-400">
            Draw: <strong className="text-neutral-200">{metrics.drawCalls}</strong>
          </span>
          <span className="text-neutral-400">
            Tris: <strong className="text-neutral-200">{metrics.triangleCount}</strong>
          </span>
          <span className={`font-bold ${metrics.fps >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.fps} FPS ({metrics.frameTimeMs}ms)
          </span>
        </div>
      </div>

      {/* Dock Content Body */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden p-3 bg-neutral-950">
          {/* TAB 1: PROFILER */}
          {activeTab === 'profiler' && (
            <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* FPS Real-time Bar History */}
              <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase text-neutral-400 font-semibold">FPS Frame Timing History</span>
                  <span className="text-emerald-400 text-xs font-bold">{metrics.fps} FPS</span>
                </div>
                <div className="flex-1 flex items-end gap-1 pt-2 pb-1">
                  {metrics.history.map((val, idx) => {
                    const heightPct = Math.min(100, Math.max(10, (val / 65) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-cyan-600/70 hover:bg-cyan-400 rounded-t transition-all"
                        style={{ height: `${heightPct}%` }}
                        title={`Frame ${idx}: ${val} FPS`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>-30 frames</span>
                  <span>Target: 60 FPS (16.6ms)</span>
                  <span>Now</span>
                </div>
              </div>

              {/* Engine CPU & GPU Pipeline Breakdown */}
              <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800 space-y-2">
                <span className="text-[11px] uppercase text-neutral-400 font-semibold block">Render Pass Breakdown</span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-neutral-400">Physics & Collision Euler Step:</span>
                      <span className="text-emerald-400 font-semibold">{metrics.physicsTimeMs} ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (metrics.physicsTimeMs / 16.6) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-neutral-400">Geometry & GLSL Draw Calls:</span>
                      <span className="text-sky-400 font-semibold">{metrics.renderTimeMs} ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.min(100, (metrics.renderTimeMs / 16.6) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-neutral-500 flex justify-between border-t border-neutral-800/80">
                  <span>Entities: {metrics.entityCount}</span>
                  <span>Vertices: {metrics.vertexCount.toLocaleString()}</span>
                  <span>VRAM: {metrics.vramUsageMB} MB</span>
                </div>
              </div>

              {/* Hardware & GL Context Details */}
              <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800 space-y-1.5">
                <span className="text-[11px] uppercase text-neutral-400 font-semibold block">Hardware Context</span>
                <div className="space-y-1 text-neutral-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">API:</span>
                    <span className="text-cyan-300">OpenGL ES 3.0 / WebGL 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">GLSL Version:</span>
                    <span className="text-neutral-300">GLSL 300 es</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Max Texture Size:</span>
                    <span className="text-neutral-300">16384 x 16384</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Max Vertex Attributes:</span>
                    <span className="text-neutral-300">16</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVENT BUS MONITOR */}
          {activeTab === 'events' && (
            <div className="h-full flex flex-col font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <span className="text-[11px] text-neutral-400">Live Engine Event Stream (Aether::EventDispatcher)</span>
                <button
                  onClick={onClearEvents}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear Log
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-1 space-y-1">
                {events.length === 0 ? (
                  <div className="text-neutral-600 italic text-center py-4">No events logged yet. Drop a cube or move the camera to trigger events.</div>
                ) : (
                  events.slice(-15).reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800/60 text-[11px]"
                    >
                      <span className="text-neutral-500">+{((Date.now() - ev.timestamp) / 1000).toFixed(1)}s</span>
                      <span className={`px-1 rounded text-[10px] font-semibold ${
                        ev.type === 'COLLISION' ? 'bg-emerald-950 text-emerald-400' :
                        ev.type === 'SHADER_COMPILE' ? 'bg-cyan-950 text-cyan-400' :
                        ev.type === 'PHYSICS_IMPULSE' ? 'bg-purple-950 text-purple-400' :
                        'bg-neutral-800 text-neutral-300'
                      }`}>
                        {ev.type}
                      </span>
                      <span className="text-cyan-400 font-medium">[{ev.source}]</span>
                      <span className="text-neutral-300 truncate">{ev.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CRASH REPORTING & ASSERTION INTROSPECTION */}
          {activeTab === 'crash' && (
            <div className="h-full flex flex-col font-mono text-xs">
              {!activeCrash ? (
                <div className="flex items-center justify-between h-full px-4 bg-neutral-900/60 rounded border border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Engine Core Running Healthy (0 Active Exceptions)</span>
                    </div>
                    <p className="text-neutral-400 text-xs max-w-xl">
                      Cross-platform crash interceptor active with automated POSIX signal handling (SIGSEGV, SIGABRT) and Windows SEH minidump generation.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      soundFX.playError();
                      onSimulateCrash();
                    }}
                    className="px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Simulate Assertion Failure</span>
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col bg-rose-950/20 border border-rose-900/60 rounded p-2.5 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 border-b border-rose-900/40">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <AlertOctagon className="w-4 h-4" />
                      <span>CRASH INTERCEPTED: {activeCrash.signal} in {activeCrash.functionName}</span>
                    </div>
                    <button
                      onClick={() => {
                        soundFX.playSuccess();
                        onResolveCrash();
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Recover & Restore State</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-1">Demangled C++ Call Stack:</span>
                      <pre className="bg-neutral-950 p-2 rounded border border-neutral-800 text-rose-300 space-y-0.5 overflow-x-auto">
                        {activeCrash.callStack.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </pre>
                    </div>

                    <div>
                      <span className="text-neutral-400 font-semibold block mb-1">CPU Registers (x86-64):</span>
                      <div className="bg-neutral-950 p-2 rounded border border-neutral-800 grid grid-cols-2 gap-x-2 gap-y-1 text-neutral-300">
                        {Object.entries(activeCrash.registers).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-neutral-500">{k}:</span>
                            <span className="text-amber-400">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-neutral-500">
                        Minidump saved to <code>/dumps/crash_aether_{activeCrash.id}.dmp</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
