import React, { useState, useRef } from 'react';
import { 
  Box, 
  Upload, 
  Sparkles, 
  Layers, 
  Check, 
  FileCode, 
  Flame, 
  Info, 
  Plus, 
  Download,
  AlertCircle
} from 'lucide-react';
import { EngineRenderer } from '../engine/webgl/Renderer';
import { SceneNode } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';
import { BUILTIN_OBJ_MODELS } from '../engine/models/objParser';

interface AssetPipelineModalProps {
  renderer: EngineRenderer;
  onClose: () => void;
  onSpawnNode: (node: SceneNode) => void;
}

export const AssetPipelineModal: React.FC<AssetPipelineModalProps> = ({
  renderer,
  onClose,
  onSpawnNode,
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'particles' | 'upload'>('models');
  const [customName, setCustomName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedVertexCount, setUploadedVertexCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Spawn a built-in or custom 3D model into the scene graph
  const handleSpawnModel = (key: string, name: string, colorHex: string = '#38bdf8') => {
    soundFX.playClick();
    const id = 'mesh_' + Date.now();
    const newNode: SceneNode = {
      id,
      name: name,
      type: 'custom_mesh',
      geometry: 'custom',
      customMeshKey: key,
      visible: true,
      selected: true,
      parentId: null,
      childrenIds: [],
      transform: {
        position: { x: (Math.random() - 0.5) * 3, y: 1.5, z: (Math.random() - 0.5) * 3 },
        rotation: { x: 0, y: Math.random() * 360, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      material: {
        id: 'mat_' + Date.now(),
        name: `${name} Material`,
        shaderId: 'phong',
        color: colorHex,
        metallic: 0.3,
        roughness: 0.4,
        wireframe: false,
        opacity: 1.0,
        emission: '#000000'
      },
      physics: {
        enabled: true,
        isStatic: false,
        mass: 1.5,
        restitution: 0.6,
        friction: 0.2,
        useGravity: true,
        velocity: { x: (Math.random() - 0.5) * 2, y: 2, z: (Math.random() - 0.5) * 2 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        colliderType: 'box'
      }
    };

    onSpawnNode(newNode);
    onClose();
  };

  // Spawn a Particle Emitter
  const handleSpawnParticleEmitter = (type: 'sparks' | 'fire' | 'magic' | 'dust') => {
    soundFX.playClick();
    const id = 'particle_' + Date.now();
    const colorMap = {
      sparks: '#fbbf24',
      fire: '#f97316',
      magic: '#a855f7',
      dust: '#38bdf8'
    };

    const newNode: SceneNode = {
      id,
      name: `${type.toUpperCase()} Emitter`,
      type: 'particle',
      visible: true,
      selected: true,
      parentId: null,
      childrenIds: [],
      transform: {
        position: { x: (Math.random() - 0.5) * 4, y: 1.0, z: (Math.random() - 0.5) * 4 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 }
      },
      material: {
        id: 'mat_' + Date.now(),
        name: 'Emitter Core',
        shaderId: 'unlit',
        color: colorMap[type],
        metallic: 0,
        roughness: 1,
        wireframe: false,
        opacity: 0.8,
        emission: colorMap[type]
      },
      particleEmitter: {
        enabled: true,
        count: 150,
        rate: 25,
        color: colorMap[type],
        speed: 1.2,
        lifetime: 2.0,
        gravityModifier: type === 'fire' ? -0.4 : 0.6,
        spread: 0.8
      }
    };

    onSpawnNode(newNode);
    renderer.particleSystem.seedParticles(newNode.transform.position, colorMap[type], 80);
    onClose();
  };

  // Handle user uploaded Wavefront OBJ file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const key = 'custom_' + Date.now();
      const modelName = customName.trim() || file.name.replace(/\.[^/.]+$/, '');
      const success = renderer.loadCustomOBJ(key, modelName, content);

      if (success) {
        soundFX.playClick();
        const meshData = renderer.customMeshes.get(key);
        setUploadedVertexCount(meshData?.vertexCount || 0);
        setUploadStatus(`Successfully parsed "${modelName}" (${meshData?.vertexCount || 0} vertices).`);
        handleSpawnModel(key, modelName, '#10b981');
      } else {
        setUploadStatus('Error: Failed to parse OBJ file structure.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                Asset Pipeline & 3D Model Importer
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Wavefront OBJ Parser, Real-Time Meshing, and GPU Particle Emitters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'models'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Model Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('particles')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'particles'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Particle Emitters</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Custom OBJ</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(BUILTIN_OBJ_MODELS).map(([key, model]) => {
                  const meshData = renderer.customMeshes.get(key);
                  return (
                    <div
                      key={key}
                      className="bg-neutral-950 border border-neutral-800 hover:border-cyan-800/80 rounded-xl p-4 flex flex-col justify-between group transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-200 group-hover:text-cyan-400 transition-colors">
                            {model.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            OBJ
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-500">
                          {meshData ? `${meshData.vertexCount} verts` : 'Loaded'}
                        </span>
                        <button
                          onClick={() => handleSpawnModel(key, model.name)}
                          className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-medium border border-cyan-500/40 flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Spawn</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  All models are compiled into WebGL attribute buffers (positions, normal vectors, and UV mappings) and integrate seamlessly with dynamic physics and GLSL shaders.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'particles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/50">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200">High-Voltage Sparks</h4>
                      <p className="text-[11px] text-neutral-400">Golden kinetic ricochet sparks</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpawnParticleEmitter('sparks')}
                    className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-medium border border-amber-500/40 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spawn</span>
                  </button>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-800/50">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200">Thruster Plasma Fire</h4>
                      <p className="text-[11px] text-neutral-400">Upward buoyancy exhaust plume</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpawnParticleEmitter('fire')}
                    className="px-3 py-1.5 rounded bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-xs font-medium border border-orange-500/40 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spawn</span>
                  </button>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/50">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200">Arcane Magic Energy</h4>
                      <p className="text-[11px] text-neutral-400">Luminous purple energy aura</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpawnParticleEmitter('magic')}
                    className="px-3 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-medium border border-purple-500/40 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spawn</span>
                  </button>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-200">Ambient Atmospheric Dust</h4>
                      <p className="text-[11px] text-neutral-400">Cyan floating bioluminescent motes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpawnParticleEmitter('dust')}
                    className="px-3 py-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-medium border border-cyan-500/40 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spawn</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-cyan-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-neutral-950/50 hover:bg-neutral-950 transition-colors text-center"
              >
                <div className="p-3 rounded-full bg-neutral-900 text-cyan-400 mb-3 border border-neutral-800">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-200 mb-1">
                  Click to select or drag & drop a .OBJ file
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Supports standard Wavefront geometric vertices (v), vertex normals (vn), texture coordinates (vt), and polygonal faces (f).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".obj"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-neutral-400 block mb-1">
                  Optional Custom Mesh Label
                </label>
                <input
                  type="text"
                  placeholder="e.g., SpaceStation_Hull"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                  uploadStatus.startsWith('Error') 
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' 
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                }`}>
                  {uploadStatus.startsWith('Error') ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-[11px] font-mono text-neutral-500">
            Active Mesh Cache: {renderer.meshCache.size} geometries
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
