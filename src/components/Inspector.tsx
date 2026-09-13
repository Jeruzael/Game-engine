import React from 'react';
import { 
  Sliders, 
  Box, 
  RotateCw, 
  Activity, 
  Code, 
  Palette, 
  Flame, 
  Check, 
  Eye, 
  EyeOff,
  Zap
} from 'lucide-react';
import { SceneNode, GeometryType } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';

interface InspectorProps {
  node: SceneNode | null;
  onUpdateNode: (updated: SceneNode) => void;
  availableShaders: Array<{ id: string; name: string }>;
}

export const Inspector: React.FC<InspectorProps> = ({
  node,
  onUpdateNode,
  availableShaders,
}) => {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-neutral-500 bg-neutral-900 border-l border-neutral-800 select-none">
        <Sliders className="w-8 h-8 mb-2 text-neutral-600 stroke-[1.5]" />
        <span className="text-xs font-medium text-neutral-400">No Entity Selected</span>
        <span className="text-[11px] text-neutral-600 mt-1 max-w-[180px]">
          Click any 3D entity in the viewport or scene graph to inspect and edit components.
        </span>
      </div>
    );
  }

  // Transform modifiers
  const handlePosChange = (axis: 'x' | 'y' | 'z', val: number) => {
    const updated: SceneNode = {
      ...node,
      transform: {
        ...node.transform,
        position: { ...node.transform.position, [axis]: val }
      }
    };
    onUpdateNode(updated);
  };

  const handleRotChange = (axis: 'x' | 'y' | 'z', val: number) => {
    const updated: SceneNode = {
      ...node,
      transform: {
        ...node.transform,
        rotation: { ...node.transform.rotation, [axis]: val }
      }
    };
    onUpdateNode(updated);
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', val: number) => {
    const updated: SceneNode = {
      ...node,
      transform: {
        ...node.transform,
        scale: { ...node.transform.scale, [axis]: Math.max(0.01, val) }
      }
    };
    onUpdateNode(updated);
  };

  // Material modifiers
  const handleMaterialChange = (field: string, val: unknown) => {
    if (!node.material) return;
    const updated: SceneNode = {
      ...node,
      material: {
        ...node.material,
        [field]: val
      }
    };
    onUpdateNode(updated);
  };

  // Physics modifiers
  const handlePhysicsChange = (field: string, val: unknown) => {
    const currentPhys = node.physics || {
      enabled: true,
      isStatic: false,
      mass: 1.0,
      restitution: 0.5,
      friction: 0.2,
      useGravity: true,
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      colliderType: 'box'
    };

    const updated: SceneNode = {
      ...node,
      physics: {
        ...currentPhys,
        [field]: val
      }
    };
    onUpdateNode(updated);
  };

  const handleApplyImpulse = () => {
    soundFX.playImpulse();
    if (!node.physics) return;
    const updated: SceneNode = {
      ...node,
      physics: {
        ...node.physics,
        velocity: {
          x: node.physics.velocity.x + (Math.random() - 0.5) * 4,
          y: node.physics.velocity.y + 5.5,
          z: node.physics.velocity.z + (Math.random() - 0.5) * 4
        }
      }
    };
    onUpdateNode(updated);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-200 select-none overflow-y-auto">
      {/* Header */}
      <div className="h-10 px-3 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Entity Inspector</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
          ID: {node.id.slice(0, 8)}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Identity component */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-400 uppercase">Entity Name</span>
            <span className="text-[10px] font-mono px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              {node.type}
            </span>
          </div>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdateNode({ ...node, name: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Transform Component */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
              Transform Component
            </span>
            <button
              onClick={() => {
                soundFX.playClick();
                onUpdateNode({
                  ...node,
                  transform: {
                    position: { x: 0, y: 1, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                  }
                });
              }}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
              title="Reset Transform"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Position */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-neutral-400">Position (X, Y, Z)</div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-rose-400 font-bold mr-1 text-[10px]">X</span>
                <input
                  type="number"
                  step="0.2"
                  value={node.transform.position.x}
                  onChange={(e) => handlePosChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-emerald-400 font-bold mr-1 text-[10px]">Y</span>
                <input
                  type="number"
                  step="0.2"
                  value={node.transform.position.y}
                  onChange={(e) => handlePosChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-sky-400 font-bold mr-1 text-[10px]">Z</span>
                <input
                  type="number"
                  step="0.2"
                  value={node.transform.position.z}
                  onChange={(e) => handlePosChange('z', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-neutral-400">Rotation (Deg)</div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-rose-400 font-bold mr-1 text-[10px]">X</span>
                <input
                  type="number"
                  step="5"
                  value={node.transform.rotation.x}
                  onChange={(e) => handleRotChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-emerald-400 font-bold mr-1 text-[10px]">Y</span>
                <input
                  type="number"
                  step="5"
                  value={node.transform.rotation.y}
                  onChange={(e) => handleRotChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-sky-400 font-bold mr-1 text-[10px]">Z</span>
                <input
                  type="number"
                  step="5"
                  value={node.transform.rotation.z}
                  onChange={(e) => handleRotChange('z', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-neutral-400">Scale</div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-rose-400 font-bold mr-1 text-[10px]">X</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={node.transform.scale.x}
                  onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-emerald-400 font-bold mr-1 text-[10px]">Y</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={node.transform.scale.y}
                  onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                <span className="text-sky-400 font-bold mr-1 text-[10px]">Z</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={node.transform.scale.z}
                  onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                  className="w-full bg-transparent text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mesh & Material Component */}
        {node.type === 'mesh' && node.material && (
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                Mesh & GLSL Material
              </span>
            </div>

            {/* Geometry selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400">Geometry Type</label>
              <select
                value={node.geometry || 'cube'}
                onChange={(e) => {
                  soundFX.playClick();
                  onUpdateNode({ ...node, geometry: e.target.value as GeometryType });
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none font-mono"
              >
                <option value="cube">Cube (24 Vertices)</option>
                <option value="sphere">Sphere (UV Tessellated)</option>
                <option value="torus">Torus (Donut Ring)</option>
                <option value="cylinder">Cylinder (Prismatic)</option>
                <option value="pyramid">Pyramid (Apex 4-Sided)</option>
                <option value="plane">Plane (Subdivided Grid)</option>
              </select>
            </div>

            {/* Shader selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-neutral-400">GLSL Shader Program</label>
              <select
                value={node.material.shaderId}
                onChange={(e) => {
                  soundFX.playClick();
                  handleMaterialChange('shaderId', e.target.value);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none font-mono"
              >
                {availableShaders.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Albedo Color */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-neutral-400">Albedo Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={node.material.color}
                  onChange={(e) => handleMaterialChange('color', e.target.value)}
                  className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-neutral-300 uppercase">{node.material.color}</span>
              </div>
            </div>

            {/* Roughness Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Roughness</span>
                <span className="text-neutral-200">{node.material.roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={node.material.roughness}
                onChange={(e) => handleMaterialChange('roughness', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Metallic Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Metallic</span>
                <span className="text-neutral-200">{node.material.metallic.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={node.material.metallic}
                onChange={(e) => handleMaterialChange('metallic', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Wireframe toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-neutral-400">Wireframe Only</span>
              <input
                type="checkbox"
                checked={node.material.wireframe}
                onChange={(e) => handleMaterialChange('wireframe', e.target.checked)}
                className="rounded accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Physics RigidBody Component */}
        {node.type === 'mesh' && (
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                RigidBody Physics
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
                <input
                  type="checkbox"
                  checked={node.physics?.enabled ?? false}
                  onChange={(e) => handlePhysicsChange('enabled', e.target.checked)}
                  className="rounded accent-emerald-400"
                />
                <span className="text-neutral-400 text-[10px]">Active</span>
              </label>
            </div>

            {node.physics?.enabled && (
              <div className="space-y-2.5">
                {/* Static / Dynamic */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">Body Type</span>
                  <select
                    value={node.physics.isStatic ? 'static' : 'dynamic'}
                    onChange={(e) => handlePhysicsChange('isStatic', e.target.value === 'static')}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-200 font-mono"
                  >
                    <option value="dynamic">Dynamic (Moves)</option>
                    <option value="static">Static (Immovable)</option>
                  </select>
                </div>

                {/* Mass */}
                {!node.physics.isStatic && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400">Mass (kg)</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={node.physics.mass}
                      onChange={(e) => handlePhysicsChange('mass', parseFloat(e.target.value) || 1)}
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-neutral-200 font-mono text-right"
                    />
                  </div>
                )}

                {/* Restitution / Bounciness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Restitution (Bounce)</span>
                    <span className="text-neutral-200">{node.physics.restitution.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={node.physics.restitution}
                    onChange={(e) => handlePhysicsChange('restitution', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Gravity toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">Apply Gravity (-9.8m/s²)</span>
                  <input
                    type="checkbox"
                    checked={node.physics.useGravity}
                    onChange={(e) => handlePhysicsChange('useGravity', e.target.checked)}
                    className="rounded accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Impulse Kick Button */}
                {!node.physics.isStatic && (
                  <button
                    onClick={handleApplyImpulse}
                    className="w-full py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Apply Upward Impulse</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Script Component */}
        {node.script && (
          <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-sky-400" />
                Script Component
              </span>
              <span className="text-[10px] font-mono text-cyan-400">{node.script.scriptName}</span>
            </div>
            <pre className="text-[10px] font-mono bg-neutral-900 p-2 rounded text-neutral-300 overflow-x-auto border border-neutral-800">
              {node.script.code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

function RotateCcw(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
