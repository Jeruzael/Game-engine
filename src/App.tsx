import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { EngineRenderer } from './engine/webgl/Renderer';
import { INITIAL_SCENE_NODES } from './engine/initialScene';
import { DEFAULT_SHADERS } from './engine/shaders/glslLibrary';
import { 
  SceneNode, 
  ViewportMode, 
  ToolMode, 
  GeometryType, 
  EngineEvent, 
  CrashReport, 
  ShaderPreset 
} from './types/engine';
import { HeaderBar } from './components/HeaderBar';
import { Viewport } from './components/Viewport';
import { SceneHierarchy } from './components/SceneHierarchy';
import { Inspector } from './components/Inspector';
import { ShaderEditor } from './components/ShaderEditor';
import { CppCodeBrowser } from './components/CppCodeBrowser';
import { ProfilerDock } from './components/ProfilerDock';
import { MultiplayerAnalyticsModal } from './components/MultiplayerAnalyticsModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { DocumentationModal } from './components/DocumentationModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { AssetPipelineModal } from './components/AssetPipelineModal';
import { soundFX } from './engine/audio/SoundEffects';

export default function App() {
  // Core Engine Renderer Instance
  const renderer = useMemo(() => new EngineRenderer(), []);

  // Application States
  const [nodes, setNodes] = useState<SceneNode[]>(INITIAL_SCENE_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('hero_torus');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('lit');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activeTab, setActiveTab] = useState<'viewport' | 'shaders' | 'cpp' | 'analytics' | 'tests' | 'docs'>('viewport');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [shaders, setShaders] = useState<ShaderPreset[]>(DEFAULT_SHADERS);

  // Modals & Tour
  const [showTour, setShowTour] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showTestsModal, setShowTestsModal] = useState<boolean>(false);
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [showAssetPipeline, setShowAssetPipeline] = useState<boolean>(false);

  // Event Bus & Crash Reporter
  const [events, setEvents] = useState<EngineEvent[]>([
    {
      id: 'e-init',
      timestamp: Date.now() - 3000,
      type: 'SCENE_GRAPH',
      source: 'SceneGraph::Load',
      message: 'Initialized root scene graph with 7 entities and GLSL pipelines.',
      severity: 'info'
    },
    {
      id: 'e-gl',
      timestamp: Date.now() - 2500,
      type: 'SHADER_COMPILE',
      source: 'OpenGL::Context',
      message: 'Compiled Blinn-Phong, PBR, Hologram, and Cel Shaders successfully.',
      severity: 'success'
    }
  ]);
  const [activeCrash, setActiveCrash] = useState<CrashReport | null>(null);

  // Sync Audio Setting
  useEffect(() => {
    soundFX.enabled = audioEnabled;
  }, [audioEnabled]);

  // Handle Tab Switch
  const handleTabSwitch = (tab: 'viewport' | 'shaders' | 'cpp' | 'analytics' | 'tests' | 'docs') => {
    if (tab === 'analytics') {
      setShowAnalyticsModal(true);
    } else if (tab === 'tests') {
      setShowTestsModal(true);
    } else if (tab === 'docs') {
      setShowDocsModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Add Log Event Helper
  const logEvent = useCallback((type: EngineEvent['type'], source: string, message: string, severity: EngineEvent['severity'] = 'info') => {
    setEvents(prev => [
      ...prev.slice(-30),
      {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        type,
        source,
        message,
        severity
      }
    ]);
  }, []);

  // Main Simulation & Render Loop
  const reqRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    renderer.simulationRunning = isPlaying && !activeCrash;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      if (renderer.simulationRunning) {
        // Step Physics on dynamic nodes
        renderer.stepPhysics(nodes, dt);

        // Update scripted entities (e.g. rotating ring)
        for (const node of nodes) {
          if (node.script && node.script.enabled && node.geometry === 'torus') {
            node.transform.rotation.y = (node.transform.rotation.y + 35 * dt) % 360;
            node.transform.rotation.x = (node.transform.rotation.x + 15 * dt) % 360;
          }
        }
      }

      // Draw Viewport if visible
      renderer.render(nodes, currentTime);

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [renderer, isPlaying, nodes, activeCrash]);

  // Drop Dynamic Physics Body
  const handleDropPhysicsBody = (type: 'cube' | 'sphere') => {
    soundFX.playClick(1.2);
    const id = `phys_${type}_${Date.now()}`;
    const colors = ['#38bdf8', '#f59e0b', '#ec4899', '#10b981', '#a855f7', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const spawnX = (Math.random() - 0.5) * 4;
    const spawnZ = (Math.random() - 0.5) * 4;

    const newNode: SceneNode = {
      id,
      name: `${type === 'cube' ? 'Dynamic Box' : 'Dynamic Sphere'} [${id.slice(-4)}]`,
      type: 'mesh',
      visible: true,
      parentId: null,
      childrenIds: [],
      geometry: type,
      transform: {
        position: { x: spawnX, y: 7 + Math.random() * 2, z: spawnZ },
        rotation: { x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 },
        scale: { x: 1, y: 1, z: 1 }
      },
      material: {
        id: `mat_${id}`,
        name: `${type} Material`,
        shaderId: Math.random() > 0.5 ? 'pbr' : 'phong',
        color: randomColor,
        metallic: 0.6,
        roughness: 0.25,
        wireframe: false,
        opacity: 1.0,
        emission: '#000000'
      },
      physics: {
        enabled: true,
        isStatic: false,
        mass: 1.5,
        restitution: 0.75,
        friction: 0.2,
        useGravity: true,
        velocity: { x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        colliderType: type === 'cube' ? 'box' : 'sphere'
      }
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    logEvent('PHYSICS_IMPULSE', 'PhysicsEngine::Spawn', `Spawned dynamic ${type} with mass 1.5kg at Y=7.5m`, 'info');
  };

  // Add entity from hierarchy
  const handleAddEntity = (type: GeometryType | 'light' | 'camera') => {
    soundFX.playClick(1.1);
    const id = `entity_${type}_${Date.now()}`;
    let newNode: SceneNode;

    if (type === 'light') {
      newNode = {
        id,
        name: `Point Light [${id.slice(-4)}]`,
        type: 'light',
        visible: true,
        parentId: null,
        childrenIds: [],
        transform: {
          position: { x: 0, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        lightData: {
          type: 'point',
          color: '#38bdf8',
          intensity: 1.5,
          range: 15
        }
      };
    } else {
      newNode = {
        id,
        name: `New ${type.toUpperCase()} [${id.slice(-4)}]`,
        type: 'mesh',
        visible: true,
        parentId: null,
        childrenIds: [],
        geometry: type as GeometryType,
        transform: {
          position: { x: 0, y: 3, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        material: {
          id: `mat_${id}`,
          name: 'Default Shader Material',
          shaderId: 'phong',
          color: '#38bdf8',
          metallic: 0.2,
          roughness: 0.4,
          wireframe: false,
          opacity: 1.0,
          emission: '#000000'
        },
        physics: {
          enabled: true,
          isStatic: false,
          mass: 1.0,
          restitution: 0.6,
          friction: 0.3,
          useGravity: true,
          velocity: { x: 0, y: 0, z: 0 },
          angularVelocity: { x: 0, y: 0, z: 0 },
          colliderType: 'box'
        }
      };
    }

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    logEvent('SCENE_GRAPH', 'Scene::CreateEntity', `Created new entity node: ${newNode.name}`, 'info');
  };

  // Delete Entity
  const handleDeleteNode = (id: string) => {
    soundFX.playClick();
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    logEvent('SCENE_GRAPH', 'Scene::DestroyEntity', `Destroyed entity ID ${id.slice(0, 8)}`, 'warning');
  };

  // Toggle Node Visibility
  const handleToggleVisibility = (id: string) => {
    soundFX.playClick();
    setNodes(prev => prev.map(n => n.id === id ? { ...n, visible: !n.visible } : n));
  };

  // Update Node Component
  const handleUpdateNode = (updated: SceneNode) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  // Trigger Physical Explosion Impulse
  const handleTriggerImpulse = () => {
    renderer.applyExplosionImpulse(nodes);
    logEvent('PHYSICS_IMPULSE', 'PhysicsEngine::Impulse', 'Applied radial shockwave impulse to all dynamic rigid bodies', 'success');
  };

  // Reset Scene
  const handleResetScene = () => {
    soundFX.playSuccess();
    setNodes(INITIAL_SCENE_NODES);
    setSelectedNodeId('hero_torus');
    logEvent('SCENE_GRAPH', 'Scene::Reset', 'Restored pristine initial scene graph hierarchy', 'info');
  };

  // Spawn Custom Model / Particle Node from Asset Pipeline
  const handleSpawnCustomNode = (node: SceneNode) => {
    soundFX.playSuccess();
    setNodes(prev => [...prev, node]);
    setSelectedNodeId(node.id);
    logEvent('SCENE_GRAPH', 'AssetPipeline', `Imported & spawned entity '${node.name}' into 3D world.`, 'success');
  };

  // Crash Simulation
  const handleSimulateCrash = () => {
    const report: CrashReport = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      signal: 'SIGSEGV (Signal 11: Segmentation Violation)',
      functionName: 'Aether::SceneNode::UpdateWorldTransform(glm::mat4 const&)',
      fileLocation: 'src/scene/SceneGraph.cpp:84',
      callStack: [
        '#0  0x00007fffa9b42c81 in Aether::SceneNode::UpdateWorldTransform(glm::mat4 const&) at SceneGraph.cpp:84',
        '#1  0x00007fffa9b431a4 in Aether::Scene::Traverse(std::shared_ptr<Aether::SceneNode>) at Scene.cpp:142',
        '#2  0x00007fffa9b50f90 in Aether::Application::OnUpdate(float deltaTime) at Application.cpp:210',
        '#3  0x00007fffa9b51820 in main(int argc, char** argv) at main.cpp:48'
      ],
      registers: {
        RAX: '0x0000000000000000',
        RBX: '0x00007ffe3492bd80',
        RCX: '0x000000003f800000',
        RDX: '0x00007ffe3492bc40',
        RSI: '0x000055c82a391e40',
        RDI: '0x0000000000000000',
        RSP: '0x00007ffe3492bb90',
        RIP: '0x00007fffa9b42c81'
      },
      resolved: false
    };
    setActiveCrash(report);
    logEvent('CRASH_ASSERT', 'SignalHandler::POSIX', 'SIGSEGV intercepted! Caught null memory dereference in SceneGraph.cpp:84', 'error');
  };

  const handleResolveCrash = () => {
    setActiveCrash(null);
    logEvent('CRASH_ASSERT', 'CrashReporter::Recover', 'State restored and memory pointer re-validated cleanly.', 'success');
  };

  // Selected Node reference
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* 1. Header Bar */}
      <HeaderBar
        isPlaying={isPlaying}
        onTogglePlay={() => {
          soundFX.playClick();
          setIsPlaying(!isPlaying);
        }}
        onResetScene={handleResetScene}
        onDropPhysicsBody={handleDropPhysicsBody}
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        onOpenTour={() => setShowTour(true)}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onTriggerImpulse={handleTriggerImpulse}
      />

      {/* 2. Main Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'viewport' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Scene Graph Tree */}
            <div className="w-64 border-r border-neutral-800 shrink-0">
              <SceneHierarchy
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onToggleVisibility={handleToggleVisibility}
                onDeleteNode={handleDeleteNode}
                onAddEntity={handleAddEntity}
              />
            </div>

            {/* Center: Interactive 3D OpenGL Viewport */}
            <div className="flex-1 flex flex-col min-w-0">
              <Viewport
                renderer={renderer}
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                toolMode={toolMode}
                setToolMode={setToolMode}
                viewportMode={viewportMode}
                setViewportMode={setViewportMode}
                onDropBody={handleDropPhysicsBody}
                onOpenAssetPipeline={() => setShowAssetPipeline(true)}
              />
            </div>

            {/* Right: Entity Component Inspector */}
            <div className="w-80 border-l border-neutral-800 shrink-0">
              <Inspector
                node={selectedNode}
                onUpdateNode={handleUpdateNode}
                availableShaders={shaders.map(s => ({ id: s.id, name: s.name }))}
              />
            </div>
          </div>
        )}

        {/* GLSL Shader Pipeline Tab */}
        {activeTab === 'shaders' && (
          <div className="flex-1">
            <ShaderEditor
              presets={shaders}
              renderer={renderer}
              onShaderUpdated={(updated) => {
                setShaders(prev => prev.map(s => s.id === updated.id ? updated : s));
                logEvent('SHADER_COMPILE', 'GLSLCompiler', `Recompiled shader '${updated.name}' into active GPU cache.`, 'success');
              }}
            />
          </div>
        )}

        {/* C++ Engine Source Tab */}
        {activeTab === 'cpp' && (
          <div className="flex-1">
            <CppCodeBrowser />
          </div>
        )}
      </div>

      {/* 3. Bottom Profiler & Event Bus & Crash Reporter Dock */}
      <ProfilerDock
        metrics={renderer.metrics}
        events={events}
        onSimulateCrash={handleSimulateCrash}
        activeCrash={activeCrash}
        onResolveCrash={handleResolveCrash}
        onClearEvents={() => setEvents([])}
      />

      {/* Modal: Multiplayer & Hardware Analytics */}
      {showAnalyticsModal && (
        <MultiplayerAnalyticsModal onClose={() => setShowAnalyticsModal(false)} />
      )}

      {/* Modal: Automated Tests & CI/CD */}
      {showTestsModal && (
        <TestRunnerModal onClose={() => setShowTestsModal(false)} />
      )}

      {/* Modal: Engine Developer Documentation */}
      {showDocsModal && (
        <DocumentationModal onClose={() => setShowDocsModal(false)} />
      )}

      {/* Modal: Asset Pipeline & 3D Model Importer */}
      {showAssetPipeline && (
        <AssetPipelineModal
          renderer={renderer}
          onClose={() => setShowAssetPipeline(false)}
          onSpawnNode={handleSpawnCustomNode}
        />
      )}

      {/* Guided Onboarding Tour */}
      {showTour && (
        <OnboardingGuide
          onClose={() => setShowTour(false)}
          onJumpToTab={(tab) => {
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
}
