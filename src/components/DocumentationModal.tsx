import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Code, 
  Terminal, 
  Layers, 
  Cpu, 
  Sparkles, 
  X,
  FileText,
  ExternalLink
} from 'lucide-react';
import { soundFX } from '../engine/audio/SoundEffects';

interface DocumentationModalProps {
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState('quickstart');
  const [search, setSearch] = useState('');

  const topics = [
    { id: 'quickstart', title: 'Engine Quickstart Guide', icon: <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'rendering', title: 'OpenGL 3.3 & GLSL Pipeline', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'scenegraph', title: 'Scene Graph & Transforms', icon: <Layers className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'physics', title: 'Physics & Collision System', icon: <Cpu className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'events', title: 'Event Dispatcher Architecture', icon: <Terminal className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'scripting', title: 'Modular Scripting API', icon: <Code className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Aether Engine Developer Manual & API Reference</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Topics Sidebar */}
          <div className="w-60 bg-neutral-950 border-r border-neutral-800 p-2 space-y-1 shrink-0 overflow-y-auto font-mono text-xs">
            <div className="text-[10px] text-neutral-500 uppercase px-2 py-1 font-semibold">Documentation Index</div>
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => { soundFX.playClick(); setSelectedTopic(t.id); }}
                className={`w-full text-left px-2.5 py-2 rounded flex items-center gap-2 transition-colors ${
                  selectedTopic === t.id
                    ? 'bg-neutral-800 text-cyan-400 font-semibold'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                {t.icon}
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>

          {/* Article Body */}
          <div className="flex-1 p-5 overflow-y-auto text-xs text-neutral-300 leading-relaxed space-y-4">
            {selectedTopic === 'quickstart' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Getting Started with Aether Game Engine</h3>
                <p>
                  Aether is a modular, high-performance 2D and 3D game engine written in ISO C++20 with modern OpenGL (Core Profile 3.3+) and WebGL 2.0 interoperability.
                </p>

                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-[11px] space-y-2">
                  <div className="text-neutral-400">// Minimal Engine Initialization in C++:</div>
                  <pre className="text-cyan-300">
{`#include <Aether/Window.hpp>
#include <Aether/SceneGraph.hpp>

int main() {
    auto window = Aether::Window::Create({ "My Game", 1920, 1080 });
    auto scene = std::make_shared<Aether::SceneNode>("WorldRoot");
    
    // Main Game Loop
    while (!window->ShouldClose()) {
        window->OnUpdate();
        scene->UpdateWorldTransform();
    }
    return 0;
}`}
                  </pre>
                </div>

                <h4 className="font-bold text-white pt-2">Key Core Features:</h4>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong>Cross-Platform Windowing:</strong> Abstracted GLFW / SDL2 layer with vsync control and multi-monitor detection.</li>
                  <li><strong>Real-Time GLSL Compilation:</strong> Edit shaders live with zero engine restarts.</li>
                  <li><strong>Physically-Based Scene Graph:</strong> Hierarchical node parenting with Euler and Quaternion rotation support.</li>
                  <li><strong>Integrated Profiler:</strong> In-depth frame timing breakdown and signal crash interception.</li>
                </ul>
              </div>
            )}

            {selectedTopic === 'rendering' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">OpenGL 3.3+ Rendering Pipeline</h3>
                <p>
                  The engine utilizes OpenGL Vertex Array Objects (VAO), Vertex Buffer Objects (VBO), and Index Buffer Objects (IBO) with standard uniform binding matrices.
                </p>
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-[11px]">
                  <div className="text-neutral-500 mb-1">// Standard Vertex Attributes layout:</div>
                  <div>Location 0: vec3 a_position (Model Coordinates)</div>
                  <div>Location 1: vec3 a_normal   (Surface Normal Vector)</div>
                  <div>Location 2: vec2 a_uv       (Texture Coordinates)</div>
                </div>
              </div>
            )}

            {selectedTopic === 'scenegraph' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Hierarchical Scene Graph System</h3>
                <p>
                  Every game entity is an instance of <code>Aether::SceneNode</code>. Transforms are computed lazily using a dirty-flag propagation system. When a parent node moves, all attached child entities automatically inherit the composite world matrix.
                </p>
              </div>
            )}

            {selectedTopic === 'physics' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Physics Engine & Collision Interactions</h3>
                <p>
                  Features semi-implicit Euler integration, AABB (Axis-Aligned Bounding Box) and sphere broadphase detection, coefficient of restitution (bounciness), and floor plane friction.
                </p>
              </div>
            )}

            {selectedTopic === 'events' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Custom Event Dispatcher Bus</h3>
                <p>
                  Zero-allocation typed event bus. Subsystem listeners can subscribe to <code>OnCollisionEnter</code>, <code>OnKeyDown</code>, or custom user gameplay events.
                </p>
              </div>
            )}

            {selectedTopic === 'scripting' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white">Modular Scripting API</h3>
                <p>
                  Attach C++ behavioral scripts directly to entities by inheriting from <code>Aether::ScriptableEntity</code> and overriding <code>OnStart()</code> and <code>OnUpdate(float dt)</code>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 px-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-neutral-500">API Version 2.4.1 (OpenGL 3.3 Core Spec)</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
