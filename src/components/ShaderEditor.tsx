import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Copy, 
  RotateCcw,
  Layers,
  FileCode,
  Terminal
} from 'lucide-react';
import { ShaderPreset } from '../types/engine';
import { EngineRenderer } from '../engine/webgl/Renderer';
import { soundFX } from '../engine/audio/SoundEffects';

interface ShaderEditorProps {
  presets: ShaderPreset[];
  renderer: EngineRenderer;
  onShaderUpdated: (preset: ShaderPreset) => void;
}

export const ShaderEditor: React.FC<ShaderEditorProps> = ({
  presets,
  renderer,
  onShaderUpdated,
}) => {
  const [selectedShaderId, setSelectedShaderId] = useState<string>(presets[0]?.id || 'phong');
  const [activeTab, setActiveTab] = useState<'fragment' | 'vertex'>('fragment');
  const [copied, setCopied] = useState(false);

  // Local editable code state
  const currentPreset = presets.find(p => p.id === selectedShaderId) || presets[0];
  const [vertCode, setVertCode] = useState(currentPreset?.vertexShader || '');
  const [fragCode, setFragCode] = useState(currentPreset?.fragmentShader || '');
  const [compileStatus, setCompileStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
    compileTimeMs?: number;
  }>({ status: 'idle' });

  // Switch preset
  const handleSelectPreset = (id: string) => {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    setSelectedShaderId(id);
    setVertCode(p.vertexShader);
    setFragCode(p.fragmentShader);
    setCompileStatus({ status: 'idle' });
    soundFX.playClick();
  };

  // Live Recompile into WebGL
  const handleCompile = () => {
    const t0 = performance.now();
    const result = renderer.compileCustomShader(selectedShaderId, vertCode, fragCode);
    const compileTime = +(performance.now() - t0).toFixed(2);

    if (result.success) {
      soundFX.playSuccess();
      setCompileStatus({
        status: 'success',
        message: `Compiled successfully into OpenGL program ID [${selectedShaderId}] in ${compileTime}ms.`,
        compileTimeMs: compileTime
      });
      onShaderUpdated({
        ...currentPreset,
        vertexShader: vertCode,
        fragmentShader: fragCode
      });
    } else {
      soundFX.playError();
      setCompileStatus({
        status: 'error',
        message: result.error || 'Unknown GLSL compilation error.'
      });
    }
  };

  const handleCopyCode = () => {
    const codeToCopy = activeTab === 'fragment' ? fragCode : vertCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    soundFX.playClick();
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-11 px-3 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>GLSL Shader Pipeline</span>
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Preset selector */}
          <select
            value={selectedShaderId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-neutral-700/60"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleCompile}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Hot Reload GLSL</span>
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor Pane */}
        <div className="flex-1 flex flex-col border-r border-neutral-800 min-w-0">
          {/* Tabs for Vertex vs Fragment */}
          <div className="h-9 px-3 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { soundFX.playClick(); setActiveTab('fragment'); }}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  activeTab === 'fragment'
                    ? 'bg-neutral-800 text-cyan-400 border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{currentPreset.id}.frag (Fragment GLSL)</span>
              </button>

              <button
                onClick={() => { soundFX.playClick(); setActiveTab('vertex'); }}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  activeTab === 'vertex'
                    ? 'bg-neutral-800 text-cyan-400 border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{currentPreset.id}.vert (Vertex GLSL)</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-neutral-500">OpenGL ES 2.0 / GLSL 1.00 Compatible</span>
          </div>

          {/* Text Editor Area */}
          <div className="flex-1 relative flex">
            {/* Line numbers dummy column */}
            <div className="w-10 bg-neutral-900/40 border-r border-neutral-800/60 p-2 font-mono text-xs text-neutral-600 select-none text-right space-y-0.5 leading-5">
              {Array.from({ length: 45 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable code text area */}
            <textarea
              spellCheck={false}
              value={activeTab === 'fragment' ? fragCode : vertCode}
              onChange={(e) => {
                if (activeTab === 'fragment') {
                  setFragCode(e.target.value);
                } else {
                  setVertCode(e.target.value);
                }
              }}
              className="flex-1 bg-transparent p-2 text-xs font-mono text-neutral-100 resize-none focus:outline-none leading-5 selection:bg-cyan-900/60 overflow-y-auto"
            />
          </div>

          {/* Bottom Compiler Console */}
          <div className="h-32 border-t border-neutral-800 bg-neutral-900/90 flex flex-col shrink-0">
            <div className="h-7 px-3 border-b border-neutral-800/70 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>GLSL Compiler Output</span>
              </div>

              {compileStatus.status === 'success' && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Program Linked</span>
                </span>
              )}
              {compileStatus.status === 'error' && (
                <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Compilation Error</span>
                </span>
              )}
            </div>

            <div className="flex-1 p-2 font-mono text-xs overflow-y-auto">
              {compileStatus.status === 'idle' && (
                <div className="text-neutral-500 italic">
                  Click &ldquo;Hot Reload GLSL&rdquo; or press compile to build and bind this shader to active scene meshes.
                </div>
              )}
              {compileStatus.status === 'success' && (
                <div className="text-emerald-400 space-y-0.5">
                  <p className="font-semibold">{compileStatus.message}</p>
                  <p className="text-neutral-400 text-[11px]">• Attached to mesh renderer instances with matching shaderId &lsquo;{selectedShaderId}&rsquo;</p>
                  <p className="text-neutral-400 text-[11px]">• Vertex attributes: a_position, a_normal, a_uv validated</p>
                </div>
              )}
              {compileStatus.status === 'error' && (
                <div className="text-rose-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Shader compilation failed:</span>
                  </div>
                  <pre className="text-[11px] bg-rose-950/30 p-1.5 rounded border border-rose-900/50 text-rose-300 whitespace-pre-wrap">
                    {compileStatus.message}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Info & Documentation Sidebar */}
        <div className="w-80 p-3 bg-neutral-900 border-l border-neutral-800 space-y-4 overflow-y-auto hidden md:block">
          <div>
            <h3 className="text-xs font-semibold text-neutral-100 mb-1">{currentPreset.name}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">{currentPreset.description}</p>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 space-y-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">Active Uniforms</span>
            <div className="space-y-1 text-xs font-mono text-neutral-300">
              <div className="flex justify-between">
                <span className="text-cyan-400">u_model</span>
                <span className="text-neutral-500">mat4 (Object Space)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_view</span>
                <span className="text-neutral-500">mat4 (Camera Space)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_projection</span>
                <span className="text-neutral-500">mat4 (Clip Space)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_normalMatrix</span>
                <span className="text-neutral-500">mat3 (Inv Transpose)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_lightPos</span>
                <span className="text-neutral-500">vec3 (World Light)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_baseColor</span>
                <span className="text-neutral-500">vec4 (RGBA)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">u_time</span>
                <span className="text-neutral-500">float (Seconds)</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 space-y-2">
            <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">Shader Pipeline Tips</span>
            <ul className="text-xs text-neutral-400 space-y-1.5 list-disc pl-4">
              <li>Edit vertex calculations (e.g. wave displacement) to dynamically alter 3D geometries in real-time.</li>
              <li>Edit fragment color formulas (e.g. fresnel rims, specular powers) to create custom materials.</li>
              <li>Instant feedback: updates immediately reflect in the 3D Viewport when compiled.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
