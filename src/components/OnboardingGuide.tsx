import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Code, 
  Activity, 
  Check, 
  X, 
  Box, 
  Flame,
  HelpCircle
} from 'lucide-react';
import { soundFX } from '../engine/audio/SoundEffects';

interface OnboardingGuideProps {
  onClose: () => void;
  onJumpToTab: (tab: 'viewport' | 'shaders' | 'cpp' | 'analytics' | 'tests' | 'docs') => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onClose, onJumpToTab }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Aether Engine Studio',
      subtitle: 'Modern C++20 & OpenGL 2D/3D Game Engine IDE',
      description: 'Aether gives you an interactive OpenGL runtime environment inside your browser, backed by production-grade C++ engine architecture, scene graphs, GLSL shader compilation, and physical simulation.',
      icon: <Box className="w-8 h-8 text-cyan-400" />,
      actionLabel: 'Explore Viewport',
      onAction: () => onJumpToTab('viewport')
    },
    {
      title: 'Interactive 3D Viewport & Scene Graph',
      subtitle: 'Orbit, Inspect, and Manipulate Entities',
      description: 'Drag with left-click to orbit, right-click to pan, and wheel to zoom. Click any object in the viewport or tree to inspect its Transform, Material, and Physics RigidBody components.',
      icon: <Layers className="w-8 h-8 text-emerald-400" />,
      actionLabel: 'Go to Viewport',
      onAction: () => onJumpToTab('viewport')
    },
    {
      title: 'Live GLSL Shader Pipeline',
      subtitle: 'Hot-Reload Shaders on the GPU with Zero Restarts',
      description: 'Hop into the GLSL Shaders tab to edit Vertex and Fragment shaders in real-time. Test Blinn-Phong, PBR, Hologram wireframe, and dynamic sinusoidal water waves with immediate visual feedback.',
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      actionLabel: 'Open Shader Lab',
      onAction: () => onJumpToTab('shaders')
    },
    {
      title: 'C++ Engine Core Architecture',
      subtitle: 'Browse & Compile Real C++20 Subsystems',
      description: 'Examine cross-platform window abstractions, GLSL shader compiler wrappers, hierarchical scene graphs, and the typed event bus in the C++ Source Core tab.',
      icon: <Code className="w-8 h-8 text-sky-400" />,
      actionLabel: 'Inspect C++ Code',
      onAction: () => onJumpToTab('cpp')
    },
    {
      title: 'Physics, Observability & Analytics',
      subtitle: 'RigidBody Collisions, Profiler, and Multiplayer Telemetry',
      description: 'Drop dynamic cubes and spheres from the header bar, apply explosion impulses, monitor real-time FPS frame time breakdowns, and inspect multiplayer open-world replication.',
      icon: <Activity className="w-8 h-8 text-purple-400" />,
      actionLabel: 'Finish Onboarding',
      onAction: () => onClose()
    }
  ];

  const current = steps[step];

  const handleNext = () => {
    soundFX.playClick();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      soundFX.playSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 flex flex-col text-neutral-200">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
              STEP {step + 1} OF {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Visual */}
        <div className="flex items-center justify-center p-6 bg-neutral-950 rounded-xl border border-neutral-800 mb-5">
          {current.icon}
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-white mb-1">{current.title}</h3>
        <p className="text-xs font-mono text-cyan-400 mb-3">{current.subtitle}</p>
        <p className="text-xs text-neutral-300 leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === step ? 'w-5 bg-cyan-400' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (current.onAction) current.onAction();
                handleNext();
              }}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
            >
              <span>{step === steps.length - 1 ? 'Start Engine' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
