import React, { useState } from 'react';
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  Cloud, 
  Wifi, 
  Server, 
  Layers, 
  HardDrive, 
  Cpu, 
  Globe, 
  Check, 
  Lock,
  X
} from 'lucide-react';
import { MultiplayerPeer } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';

interface MultiplayerAnalyticsProps {
  onClose: () => void;
}

export const MultiplayerAnalyticsModal: React.FC<MultiplayerAnalyticsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'world' | 'analytics' | 'rbac'>('world');

  const [peers] = useState<MultiplayerPeer[]>([
    { id: 'peer-1', name: 'Dev_Alice (Graphics)', role: 'Graphics Dev', pingMs: 18, position: { x: 4.2, y: 1.0, z: -2.5 }, color: '#38bdf8', lastPacketBytes: 512 },
    { id: 'peer-2', name: 'Marcus_V (Tech Artist)', role: 'Tech Artist', pingMs: 24, position: { x: -3.1, y: 2.0, z: 1.8 }, color: '#fbbf24', lastPacketBytes: 1024 },
    { id: 'peer-3', name: 'Elena_R (Gameplay)', role: 'Gameplay Scripter', pingMs: 32, position: { x: 0.5, y: 0.8, z: 4.2 }, color: '#10b981', lastPacketBytes: 256 },
    { id: 'peer-4', name: 'You (Lead Architect)', role: 'Admin', pingMs: 12, position: { x: 0.0, y: 3.5, z: 8.0 }, color: '#a855f7', lastPacketBytes: 2048 },
  ]);

  const [rbacUsers] = useState([
    { name: 'jeruzael.d@gmail.com', role: 'Lead Architect', permissions: ['Full Engine Admin', 'Shader Compile', 'C++ Commit', 'Asset Release', 'Server Ops'] },
    { name: 'graphics_team@studio.internal', role: 'Core Graphics Dev', permissions: ['Shader Compile', 'C++ Commit', 'Render Pipeline Tuning'] },
    { name: 'artists_team@studio.internal', role: 'Technical Artist', permissions: ['Asset Import', 'Material Tweaking', 'Level Design'] },
    { name: 'scripters@studio.internal', role: 'Gameplay Programmer', permissions: ['C++ Script Edit', 'Physics Tuning'] },
    { name: 'qa_auto@studio.internal', role: 'QA Automation', permissions: ['Run Test Suites', 'Read Profiler Telemetry'] },
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Multiplayer Cloud Sync & Enterprise Telemetry</h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded border border-neutral-800 text-xs">
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('world'); }}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'world' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Open-World Peers
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('analytics'); }}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'analytics' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Hardware Analytics
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('rbac'); }}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'rbac' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              RBAC Security
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-xs">
          {/* TAB 1: MULTIPLAYER OPEN-WORLD SYNC */}
          {activeTab === 'world' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Server Tickrate</span>
                  <span className="text-lg font-bold text-emerald-400">60.00 Hz</span>
                  <span className="text-[10px] text-neutral-400">Authoritative Delta Time</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Network RTT (Ping)</span>
                  <span className="text-lg font-bold text-cyan-400">18.4 ms</span>
                  <span className="text-[10px] text-neutral-400">Jitter: &lt;1.2ms</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Spatial Partition</span>
                  <span className="text-lg font-bold text-purple-400">Octree L4</span>
                  <span className="text-[10px] text-neutral-400">64 Active World Cells</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Replication Loss</span>
                  <span className="text-lg font-bold text-emerald-400">0.00 %</span>
                  <span className="text-[10px] text-neutral-400">UDP Reliable Channel</span>
                </div>
              </div>

              {/* Peer Developers in Scene */}
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Connected Engine Collaborators ({peers.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>P2P Mesh + Relay Synchronized</span>
                  </span>
                </div>

                <div className="divide-y divide-neutral-800/80">
                  {peers.map((peer) => (
                    <div key={peer.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: peer.color }} />
                        <div>
                          <span className="text-neutral-100 font-medium">{peer.name}</span>
                          <span className="text-[10px] text-neutral-500 ml-2">[{peer.role}]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
                        <span>Pos: ({peer.position.x}, {peer.position.y}, {peer.position.z})</span>
                        <span className="text-emerald-400">{peer.pingMs}ms</span>
                        <span className="text-neutral-500">{peer.lastPacketBytes} B/pkt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE & PLAYER ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Crash-Free Rate</span>
                  <span className="text-xl font-bold text-emerald-400">99.94%</span>
                  <span className="text-[10px] text-neutral-400">Last 100,000 player hours</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Median Client FPS</span>
                  <span className="text-xl font-bold text-cyan-400">61.2 FPS</span>
                  <span className="text-[10px] text-neutral-400">Low 1% = 54.8 FPS</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-500 font-semibold block uppercase">Average VRAM Footprint</span>
                  <span className="text-xl font-bold text-amber-400">18.4 MB</span>
                  <span className="text-[10px] text-neutral-400">Ultra-lightweight footprint</span>
                </div>
              </div>

              {/* GPU Hardware Vendor Telemetry */}
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                <span className="font-semibold text-neutral-200 block">GPU Architecture Distribution Telemetry</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">NVIDIA GeForce / RTX (DirectX 12 / Vulkan / OpenGL)</span>
                      <span className="text-emerald-400 font-semibold">58%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '58%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">Apple Silicon Metal (M1 / M2 / M3 / M4 / iOS)</span>
                      <span className="text-sky-400 font-semibold">22%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: '22%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">AMD Radeon / RDNA 3</span>
                      <span className="text-rose-400 font-semibold">14%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: '14%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-neutral-300">Intel Arc & Mobile Mali/Adreno</span>
                      <span className="text-amber-400 font-semibold">6%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '6%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROLE-BASED ACCESS CONTROL (RBAC) */}
          {activeTab === 'rbac' && (
            <div className="space-y-3">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Enterprise Role-Based Access Controls</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                    OAuth 2.0 / SAML Enforced
                  </span>
                </div>

                <div className="space-y-2">
                  {rbacUsers.map((user, idx) => (
                    <div key={idx} className="p-2.5 bg-neutral-900 rounded border border-neutral-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-neutral-200">{user.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                          {user.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {user.permissions.map((perm, pIdx) => (
                          <span key={pIdx} className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                            ✓ {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-10 px-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automatic cloud backups enabled (Every 60s)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
