import React, { useState } from 'react';
import { 
  Code, 
  Folder, 
  FileCode, 
  Play, 
  CheckCircle, 
  Copy, 
  Terminal, 
  Check, 
  Cpu,
  Layers,
  Activity,
  Sparkles
} from 'lucide-react';
import { CPP_ENGINE_SOURCE_FILES, CppFile } from '../engine/cppSourceFiles';
import { soundFX } from '../engine/audio/SoundEffects';

export const CppCodeBrowser: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CppFile>(CPP_ENGINE_SOURCE_FILES[0]);
  const [files, setFiles] = useState<CppFile[]>(CPP_ENGINE_SOURCE_FILES);
  const [copied, setCopied] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([
    '[CMake] Generator: Ninja Multi-Config (Clang 18.1.2)',
    '[Target: AetherEngine_Static] Building CXX object CMakeFiles/AetherEngine.dir/src/main.cpp.o',
    '[Linking CXX executable bin/AetherStudio] Built target AetherEngine_App (OK)'
  ]);
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuild = () => {
    soundFX.playClick();
    setIsBuilding(true);
    setBuildLogs(prev => [
      `[CMake] Triggering incremental build target: ${selectedFile.name}...`,
      ...prev
    ]);

    setTimeout(() => {
      soundFX.playSuccess();
      setIsBuilding(false);
      setBuildLogs(prev => [
        `[Build Success] Built libAetherEngine.a (0 errors, 0 warnings) in 184ms`,
        `[Symbols] Exported 42 C++ symbols into dynamic registry`,
        ...prev
      ]);
    }, 450);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    soundFX.playClick();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFileChange = (newContent: string) => {
    const updated = files.map(f => f.path === selectedFile.path ? { ...f, content: newContent } : f);
    setFiles(updated);
    setSelectedFile({ ...selectedFile, content: newContent });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 select-none overflow-hidden">
      {/* Top Bar */}
      <div className="h-11 px-3 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-neutral-200">C++20 & OpenGL Engine Architecture</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
            {selectedFile.path}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-neutral-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy C++ Header'}</span>
          </button>

          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isBuilding ? 'Compiling...' : 'Build C++ Target'}</span>
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0">
          <div className="p-2.5 border-b border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center gap-2 uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engine Source Tree</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[11px] font-mono text-neutral-500 px-2 py-0.5">include/Aether/</div>
            {files.filter(f => f.path.startsWith('include')).map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedFile(file);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-medium'
                      : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}

            <div className="text-[11px] font-mono text-neutral-500 px-2 py-0.5 pt-2">src/</div>
            {files.filter(f => f.path.startsWith('src')).map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedFile(file);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-medium'
                      : 'text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* C++ Subsystems badge indicator */}
          <div className="p-2 border-t border-neutral-800 text-[11px] font-mono text-neutral-500 space-y-1">
            <div className="flex justify-between">
              <span>Standard:</span>
              <span className="text-cyan-400">ISO C++20</span>
            </div>
            <div className="flex justify-between">
              <span>Math Lib:</span>
              <span className="text-neutral-300">GLM (OpenGL Math)</span>
            </div>
            <div className="flex justify-between">
              <span>Loader:</span>
              <span className="text-neutral-300">GLAD Core 3.3+</span>
            </div>
          </div>
        </div>

        {/* Center: Code View & Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex relative overflow-hidden">
            {/* Line numbers */}
            <div className="w-10 bg-neutral-900/40 border-r border-neutral-800/60 p-2 font-mono text-xs text-neutral-600 select-none text-right space-y-0.5 leading-5">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code textarea */}
            <textarea
              spellCheck={false}
              value={selectedFile.content}
              onChange={(e) => handleFileChange(e.target.value)}
              className="flex-1 bg-transparent p-2 text-xs font-mono text-neutral-100 resize-none focus:outline-none leading-5 selection:bg-cyan-900/60 overflow-y-auto"
            />
          </div>

          {/* Bottom CMake & Clang Output Terminal */}
          <div className="h-28 border-t border-neutral-800 bg-neutral-900/95 flex flex-col shrink-0">
            <div className="h-7 px-3 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Compiler & Linker Terminal</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Ready</span>
            </div>
            <div className="flex-1 p-2 font-mono text-[11px] text-neutral-400 overflow-y-auto space-y-0.5">
              {buildLogs.map((log, idx) => (
                <div key={idx} className={log.includes('Success') ? 'text-emerald-400 font-semibold' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
