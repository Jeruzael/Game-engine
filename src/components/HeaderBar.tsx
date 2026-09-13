import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Box, 
  Sparkles, 
  Code, 
  Flame, 
  Volume2, 
  VolumeX, 
  Layers, 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle,
  Cloud,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { soundFX } from '../engine/audio/SoundEffects';

interface HeaderBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetScene: () => void;
  onDropPhysicsBody: (type: 'cube' | 'sphere') => void;
  activeTab: 'viewport' | 'shaders' | 'cpp' | 'analytics' | 'tests' | 'docs';
  setActiveTab: (tab: 'viewport' | 'shaders' | 'cpp' | 'analytics' | 'tests' | 'docs') => void;
  onOpenTour: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  onTriggerImpulse: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isPlaying,
  onTogglePlay,
  onResetScene,
  onDropPhysicsBody,
  activeTab,
  setActiveTab,
  onOpenTour,
  audioEnabled,
  setAudioEnabled,
  onTriggerImpulse,
}) => {
  return (
    <header className="h-12 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none z-30">
      {/* Left branding & Workspace switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-sm">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-bold text-sm text-neutral-100 tracking-tight">AETHER</span>
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">C++ / GL 3.3</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1">
          <button
            id="tab-viewport-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('viewport'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'viewport'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Viewport</span>
          </button>

          <button
            id="tab-shaders-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('shaders'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'shaders'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>GLSL Shaders</span>
          </button>

          <button
            id="tab-cpp-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('cpp'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'cpp'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>C++ Engine Core</span>
          </button>

          <button
            id="tab-analytics-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('analytics'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Cloud & Analytics</span>
          </button>

          <button
            id="tab-tests-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('tests'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'tests'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CI/CD & Tests</span>
          </button>

          <button
            id="tab-docs-btn"
            onClick={() => { soundFX.playClick(); setActiveTab('docs'); }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'docs'
                ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </button>
        </nav>
      </div>

      {/* Center Playback & Simulation controls */}
      <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded-md border border-neutral-800">
        <button
          id="play-pause-btn"
          onClick={onTogglePlay}
          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
          }`}
          title={isPlaying ? 'Pause Simulation Engine' : 'Resume Simulation Engine'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          id="reset-scene-btn"
          onClick={onResetScene}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
          title="Reset Simulation State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-neutral-800 mx-0.5" />

        {/* Quick Drop Physics Entity */}
        <button
          onClick={() => onDropPhysicsBody('cube')}
          className="px-2 py-0.5 text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 rounded border border-neutral-700/60 flex items-center gap-1 transition-all"
          title="Drop Physics Cube into Scene"
        >
          <Box className="w-3 h-3 text-emerald-400" />
          <span>+Cube</span>
        </button>

        <button
          onClick={() => onDropPhysicsBody('sphere')}
          className="px-2 py-0.5 text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800/70 hover:bg-neutral-800 rounded border border-neutral-700/60 flex items-center gap-1 transition-all"
          title="Drop Physics Sphere into Scene"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>+Sphere</span>
        </button>

        <button
          onClick={onTriggerImpulse}
          className="px-2 py-0.5 text-[11px] font-medium text-purple-300 hover:text-purple-100 bg-purple-950/40 hover:bg-purple-900/60 rounded border border-purple-800/50 flex items-center gap-1 transition-all"
          title="Trigger Physical Explosion Impulse"
        >
          <Flame className="w-3 h-3 text-purple-400" />
          <span>Impulse</span>
        </button>
      </div>

      {/* Right User & Cloud Sync Info */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-1.5 rounded transition-colors ${
            audioEnabled ? 'text-cyan-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-800'
          }`}
          title={audioEnabled ? 'Audio FX Enabled' : 'Audio FX Muted'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenTour}
          className="px-2 py-1 rounded text-xs text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 flex items-center gap-1 transition-colors"
          title="Interactive Engine Guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Guide</span>
        </button>

        <div className="h-4 w-px bg-neutral-800" />

        <div className="flex items-center gap-2 pl-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 hidden sm:inline">60Hz Tick</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-[11px] text-neutral-300 font-medium">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">Architect</span>
          </div>
        </div>
      </div>
    </header>
  );
};
