import React from 'react';
import { 
  Sliders, 
  Sparkles, 
  Eye, 
  Sun, 
  Contrast, 
  Layers, 
  RotateCcw, 
  Film,
  Zap,
  Check
} from 'lucide-react';
import { PostProcessSettings } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';

interface PostProcessPanelProps {
  settings: PostProcessSettings;
  onChange: (settings: PostProcessSettings) => void;
  onClose: () => void;
}

export const PostProcessPanel: React.FC<PostProcessPanelProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  const updateSetting = <K extends keyof PostProcessSettings>(key: K, value: PostProcessSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const applyPreset = (preset: 'cinematic' | 'retro' | 'studio' | 'vibrant') => {
    soundFX.playClick();
    if (preset === 'cinematic') {
      onChange({
        ...settings,
        enabled: true,
        bloom: true,
        bloomIntensity: 1.2,
        bloomThreshold: 0.65,
        toneMapping: 'aces',
        exposure: 1.25,
        gamma: 2.2,
        vignette: true,
        vignetteStrength: 0.45,
        chromaticAberration: true,
        aberrationOffset: 0.004,
        ssao: true,
        ssaoIntensity: 0.7,
      });
    } else if (preset === 'retro') {
      onChange({
        ...settings,
        enabled: true,
        bloom: true,
        bloomIntensity: 1.8,
        bloomThreshold: 0.5,
        toneMapping: 'reinhard',
        exposure: 1.4,
        gamma: 2.0,
        vignette: true,
        vignetteStrength: 0.7,
        chromaticAberration: true,
        aberrationOffset: 0.009,
        ssao: false,
        ssaoIntensity: 0.0,
      });
    } else if (preset === 'studio') {
      onChange({
        ...settings,
        enabled: true,
        bloom: false,
        bloomIntensity: 0.2,
        bloomThreshold: 0.8,
        toneMapping: 'reinhard',
        exposure: 1.0,
        gamma: 2.2,
        vignette: false,
        vignetteStrength: 0.1,
        chromaticAberration: false,
        aberrationOffset: 0.0,
        ssao: true,
        ssaoIntensity: 0.5,
      });
    } else if (preset === 'vibrant') {
      onChange({
        ...settings,
        enabled: true,
        bloom: true,
        bloomIntensity: 1.5,
        bloomThreshold: 0.6,
        toneMapping: 'aces',
        exposure: 1.35,
        gamma: 2.3,
        vignette: true,
        vignetteStrength: 0.35,
        chromaticAberration: true,
        aberrationOffset: 0.005,
        ssao: true,
        ssaoIntensity: 0.8,
      });
    }
  };

  const handleResetDefaults = () => {
    soundFX.playClick();
    onChange({
      enabled: true,
      bloom: true,
      bloomIntensity: 0.85,
      bloomThreshold: 0.7,
      toneMapping: 'aces',
      exposure: 1.15,
      gamma: 2.2,
      vignette: true,
      vignetteStrength: 0.4,
      chromaticAberration: true,
      aberrationOffset: 0.0035,
      ssao: true,
      ssaoIntensity: 0.5,
      shadows: true,
      shadowSoftness: 1.5,
    });
  };

  return (
    <div className="absolute top-12 left-3 z-30 w-84 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl p-4 text-neutral-200 font-sans select-none max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">Post-Process Stack</h3>
            <p className="text-[10px] text-neutral-400 font-mono">FBO Color Grading & Shaders</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundFX.playClick();
              updateSetting('enabled', !settings.enabled);
            }}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
              settings.enabled 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            {settings.enabled ? 'ACTIVE' : 'BYPASS'}
          </button>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick FX Presets */}
      <div className="mb-4">
        <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1.5">Cinematic Presets</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => applyPreset('cinematic')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-950/80 hover:bg-cyan-950/50 border border-neutral-800 hover:border-cyan-700/60 text-xs text-neutral-300 transition-colors text-left"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">ACES Sci-Fi</span>
          </button>
          <button
            onClick={() => applyPreset('vibrant')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-950/80 hover:bg-emerald-950/50 border border-neutral-800 hover:border-emerald-700/60 text-xs text-neutral-300 transition-colors text-left"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Vibrant Neon</span>
          </button>
          <button
            onClick={() => applyPreset('retro')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-950/80 hover:bg-amber-950/50 border border-neutral-800 hover:border-amber-700/60 text-xs text-neutral-300 transition-colors text-left"
          >
            <Contrast className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Retro CRT</span>
          </button>
          <button
            onClick={() => applyPreset('studio')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 transition-colors text-left"
          >
            <Sun className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">Neutral Clean</span>
          </button>
        </div>
      </div>

      {/* Detailed Controls */}
      <div className="space-y-3.5 text-xs">
        {/* Bloom */}
        <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-neutral-200">Bloom Glow</span>
            </div>
            <input
              type="checkbox"
              checked={settings.bloom}
              onChange={(e) => updateSetting('bloom', e.target.checked)}
              className="accent-cyan-500 rounded cursor-pointer"
            />
          </div>
          {settings.bloom && (
            <div className="space-y-2 mt-2 pt-2 border-t border-neutral-850">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>Intensity</span>
                  <span className="text-cyan-400 font-bold">{settings.bloomIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={settings.bloomIntensity}
                  onChange={(e) => updateSetting('bloomIntensity', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>Threshold</span>
                  <span className="text-cyan-400 font-bold">{settings.bloomThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={settings.bloomThreshold}
                  onChange={(e) => updateSetting('bloomThreshold', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tone Mapping & Exposure */}
        <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center gap-1.5 mb-2">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-neutral-200">Tone Mapping & Exposure</span>
          </div>

          <div className="grid grid-cols-3 gap-1 mb-2.5">
            {(['aces', 'reinhard', 'none'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSetting('toneMapping', t)}
                className={`py-1 text-[10px] font-mono uppercase rounded transition-colors border ${
                  settings.toneMapping === t
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Exposure</span>
                <span className="text-amber-400 font-bold">{settings.exposure.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.05"
                value={settings.exposure}
                onChange={(e) => updateSetting('exposure', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Gamma Correction</span>
                <span className="text-amber-400 font-bold">{settings.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.4"
                max="2.6"
                step="0.05"
                value={settings.gamma}
                onChange={(e) => updateSetting('gamma', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Chromatic Aberration (Lens Refraction) */}
        <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-neutral-200">Chromatic Aberration</span>
            </div>
            <input
              type="checkbox"
              checked={settings.chromaticAberration}
              onChange={(e) => updateSetting('chromaticAberration', e.target.checked)}
              className="accent-rose-500 rounded cursor-pointer"
            />
          </div>
          {settings.chromaticAberration && (
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Radial Offset</span>
                <span className="text-rose-400 font-bold">{(settings.aberrationOffset * 1000).toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0.0005"
                max="0.012"
                step="0.0005"
                value={settings.aberrationOffset}
                onChange={(e) => updateSetting('aberrationOffset', parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          )}
        </div>

        {/* Vignette */}
        <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-neutral-200">Lens Vignette</span>
            </div>
            <input
              type="checkbox"
              checked={settings.vignette}
              onChange={(e) => updateSetting('vignette', e.target.checked)}
              className="accent-indigo-500 rounded cursor-pointer"
            />
          </div>
          {settings.vignette && (
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Edge Falloff</span>
                <span className="text-indigo-400 font-bold">{(settings.vignetteStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.9"
                step="0.05"
                value={settings.vignetteStrength}
                onChange={(e) => updateSetting('vignetteStrength', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          )}
        </div>

        {/* SSAO Crevice Shading */}
        <div className="bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-neutral-200">SSAO Crevice Shading</span>
            </div>
            <input
              type="checkbox"
              checked={settings.ssao}
              onChange={(e) => updateSetting('ssao', e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
          </div>
          {settings.ssao && (
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Occlusion Factor</span>
                <span className="text-emerald-400 font-bold">{settings.ssaoIntensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={settings.ssaoIntensity}
                onChange={(e) => updateSetting('ssaoIntensity', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Reset */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center">
        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
        <span className="text-[10px] font-mono text-neutral-500">GLSL Post FBO Stack</span>
      </div>
    </div>
  );
};
