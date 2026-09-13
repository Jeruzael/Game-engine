import React, { useRef, useEffect, useState } from 'react';
import { 
  Eye, 
  Move, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Grid, 
  Camera, 
  Sparkles, 
  MousePointer, 
  Layers, 
  Info,
  Maximize,
  Sliders,
  Box,
  Palette
} from 'lucide-react';
import { EngineRenderer } from '../engine/webgl/Renderer';
import { SceneNode, ViewportMode, CameraType, ToolMode, PostProcessSettings } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';
import { PostProcessPanel } from './PostProcessPanel';

interface ViewportProps {
  renderer: EngineRenderer;
  nodes: SceneNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  toolMode: ToolMode;
  setToolMode: (m: ToolMode) => void;
  viewportMode: ViewportMode;
  setViewportMode: (m: ViewportMode) => void;
  onDropBody: (type: 'cube' | 'sphere') => void;
  onOpenAssetPipeline?: () => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  renderer,
  nodes,
  selectedNodeId,
  onSelectNode,
  toolMode,
  setToolMode,
  viewportMode,
  setViewportMode,
  onDropBody,
  onOpenAssetPipeline,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isOrbiting, setIsOrbiting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cameraType, setCameraType] = useState<CameraType>('perspective');
  const [showGrid, setShowGrid] = useState(true);
  const [showPostProcess, setShowPostProcess] = useState(false);
  const [postSettings, setPostSettings] = useState<PostProcessSettings>(renderer.postProcessor.settings);

  // Initialize WebGL
  useEffect(() => {
    if (!canvasRef.current) return;
    renderer.init(canvasRef.current);
  }, [renderer]);

  // Sync viewport mode & grid
  useEffect(() => {
    renderer.viewportMode = viewportMode;
  }, [renderer, viewportMode]);

  useEffect(() => {
    renderer.showGrid = showGrid;
  }, [renderer, showGrid]);

  useEffect(() => {
    renderer.cameraType = cameraType;
  }, [renderer, cameraType]);

  // Mouse camera navigation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (e.button === 0) {
      if (e.altKey) {
        setIsPanning(true);
      } else {
        setIsOrbiting(true);
      }
    } else if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (isOrbiting) {
      renderer.cameraYaw += dx * 0.008;
      renderer.cameraPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, renderer.cameraPitch + dy * 0.008));
    } else if (isPanning) {
      const panSpeed = 0.015 * (renderer.cameraDist / 10);
      const cosYaw = Math.cos(renderer.cameraYaw);
      const sinYaw = Math.sin(renderer.cameraYaw);

      renderer.cameraTarget[0] -= (cosYaw * dx - sinYaw * 0) * panSpeed;
      renderer.cameraTarget[1] += dy * panSpeed;
      renderer.cameraTarget[2] -= (-sinYaw * dx - cosYaw * 0) * panSpeed;
    }
  };

  const handleMouseUp = () => {
    setIsOrbiting(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.005;
    renderer.cameraDist = Math.max(1.5, Math.min(60, renderer.cameraDist + zoomDelta));
  };

  // Reset Camera View
  const handleResetCamera = () => {
    soundFX.playClick();
    renderer.cameraTarget = [0, 1, 0];
    renderer.cameraPitch = -0.3;
    renderer.cameraYaw = 0.0;
    renderer.cameraDist = 10.0;
  };

  // Quick raycast selection click simulation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If not dragging, select node closest to click or cycle
    if (Math.abs(e.clientX - lastMousePos.current.x) > 4 || Math.abs(e.clientY - lastMousePos.current.y) > 4) {
      return;
    }
    const meshNodes = nodes.filter(n => n.type === 'mesh');
    if (meshNodes.length === 0) return;

    // Cycle selection or toggle
    const currentIndex = meshNodes.findIndex(n => n.id === selectedNodeId);
    const nextIndex = (currentIndex + 1) % (meshNodes.length + 1);
    if (nextIndex < meshNodes.length) {
      onSelectNode(meshNodes[nextIndex].id);
      soundFX.playClick(1.2);
    } else {
      onSelectNode(null);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-neutral-950 overflow-hidden flex flex-col">
      {/* Top Floating Viewport Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-2 py-1.5 rounded-lg shadow-xl">
        {/* Transform tool modes */}
        <div className="flex items-center gap-0.5 bg-neutral-950 p-0.5 rounded border border-neutral-800">
          <button
            onClick={() => { soundFX.playClick(); setToolMode('select'); }}
            className={`p-1.5 rounded text-xs transition-colors ${
              toolMode === 'select' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Select Mode (Q)"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { soundFX.playClick(); setToolMode('translate'); }}
            className={`p-1.5 rounded text-xs transition-colors ${
              toolMode === 'translate' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Translate Gizmo (W)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { soundFX.playClick(); setToolMode('rotate'); }}
            className={`p-1.5 rounded text-xs transition-colors ${
              toolMode === 'rotate' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Rotate Gizmo (E)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { soundFX.playClick(); setToolMode('scale'); }}
            className={`p-1.5 rounded text-xs transition-colors ${
              toolMode === 'scale' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Scale Gizmo (R)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        {/* Shading / Viewport Display Mode */}
        <div className="flex items-center gap-1">
          <select
            value={viewportMode}
            onChange={(e) => {
              soundFX.playClick();
              setViewportMode(e.target.value as ViewportMode);
            }}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="lit">Lit (OpenGL Shaders)</option>
            <option value="wireframe">Wireframe (gl.LINES)</option>
            <option value="normals">Normal Vectors</option>
            <option value="depth">Depth Buffer (Z)</option>
            <option value="unlit">Unlit (Albedo Flat)</option>
          </select>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        {/* Camera projection switch */}
        <button
          onClick={() => {
            soundFX.playClick();
            setCameraType(cameraType === 'perspective' ? 'orthographic' : 'perspective');
          }}
          className={`px-2 py-1 rounded text-xs font-mono border transition-colors flex items-center gap-1 ${
            cameraType === 'perspective' 
              ? 'bg-neutral-950 text-cyan-400 border-neutral-800' 
              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
          }`}
          title="Toggle Perspective / Orthographic"
        >
          <Camera className="w-3 h-3" />
          <span className="uppercase text-[10px]">{cameraType === 'perspective' ? 'Persp' : 'Ortho'}</span>
        </button>

        {/* Grid toggle */}
        <button
          onClick={() => {
            soundFX.playClick();
            setShowGrid(!showGrid);
          }}
          className={`p-1.5 rounded text-xs transition-colors ${
            showGrid ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
          }`}
          title="Toggle Ground Grid Plane"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Reset Camera button */}
        <button
          onClick={handleResetCamera}
          className="p-1.5 rounded text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Recenter Camera to Origin"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-neutral-800" />

        {/* Post-Processing FX Stack button */}
        <button
          onClick={() => {
            soundFX.playClick();
            setShowPostProcess(!showPostProcess);
          }}
          className={`px-2 py-1 rounded text-xs font-mono border transition-all flex items-center gap-1.5 ${
            showPostProcess 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-950/50' 
              : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-cyan-800/80 hover:text-white'
          }`}
          title="Open Post-Processing FBO Stack (Bloom, Tone Mapping, SSAO, Vignette)"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium">FX Shaders</span>
          {renderer.postProcessor.settings.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {/* Asset Pipeline / 3D Models button */}
        {onOpenAssetPipeline && (
          <button
            onClick={() => {
              soundFX.playClick();
              onOpenAssetPipeline();
            }}
            className="px-2 py-1 rounded text-xs font-mono bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-cyan-800/80 hover:text-white transition-colors flex items-center gap-1.5"
            title="Open Asset Pipeline & 3D Model Importer (OBJ, Particles)"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-medium">3D Assets</span>
          </button>
        )}
      </div>

      {/* Post Process Panel Popover */}
      {showPostProcess && (
        <PostProcessPanel
          settings={postSettings}
          onChange={(newSettings) => {
            setPostSettings(newSettings);
            renderer.postProcessor.settings = newSettings;
          }}
          onClose={() => setShowPostProcess(false)}
        />
      )}

      {/* Top-Right Performance Diagnostics Overlay HUD */}
      <div className="absolute top-2 right-2 z-10 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-3 py-2 rounded-lg shadow-xl pointer-events-none select-none text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">OpenGL Context</span>
          <span className={`text-xs font-mono font-bold ${renderer.metrics.fps >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {renderer.metrics.fps} FPS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono text-neutral-400">
          <span className="text-left text-neutral-500">Frame Time:</span>
          <span className="text-neutral-200">{renderer.metrics.frameTimeMs} ms</span>
          <span className="text-left text-neutral-500">Draw Calls:</span>
          <span className="text-neutral-200">{renderer.metrics.drawCalls}</span>
          <span className="text-left text-neutral-500">Triangles:</span>
          <span className="text-neutral-200">{renderer.metrics.triangleCount.toLocaleString()}</span>
          <span className="text-left text-neutral-500">Vertices:</span>
          <span className="text-neutral-200">{renderer.metrics.vertexCount.toLocaleString()}</span>
          <span className="text-left text-neutral-500">VRAM Est:</span>
          <span className="text-neutral-200">{renderer.metrics.vramUsageMB} MB</span>
        </div>
      </div>

      {/* Interactive WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Bottom Selected Entity Quick Pill */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-neutral-900/95 backdrop-blur-md border border-cyan-800/60 px-3 py-1.5 rounded-lg shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-neutral-200">{selectedNode.name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-cyan-300">
            {selectedNode.geometry || selectedNode.type}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Pos: [{selectedNode.transform.position.x.toFixed(1)}, {selectedNode.transform.position.y.toFixed(1)}, {selectedNode.transform.position.z.toFixed(1)}]
          </span>
        </div>
      )}

      {/* Bottom Right Controls Help tip */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 text-[10px] font-mono text-neutral-500 bg-neutral-950/75 px-2 py-1 rounded border border-neutral-900">
        <span>L-Click: Orbit / Select</span>
        <span>•</span>
        <span>R-Click / Alt: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
      </div>
    </div>
  );
};
