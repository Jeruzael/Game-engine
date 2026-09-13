import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Search, 
  Sun, 
  Camera, 
  Box, 
  Circle, 
  FolderTree, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { SceneNode, GeometryType } from '../types/engine';
import { soundFX } from '../engine/audio/SoundEffects';

interface SceneHierarchyProps {
  nodes: SceneNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onAddEntity: (type: GeometryType | 'light' | 'camera') => void;
}

export const SceneHierarchy: React.FC<SceneHierarchyProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onToggleVisibility,
  onDeleteNode,
  onAddEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const filteredNodes = nodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.geometry && node.geometry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getNodeIcon = (node: SceneNode) => {
    if (node.type === 'light') return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    if (node.type === 'camera') return <Camera className="w-3.5 h-3.5 text-sky-400" />;
    if (node.geometry === 'sphere') return <Circle className="w-3.5 h-3.5 text-emerald-400" />;
    return <Box className="w-3.5 h-3.5 text-cyan-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 select-none">
      {/* Header */}
      <div className="h-10 px-3 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
          <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scene Graph</span>
        </div>

        {/* Add Entity Button & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              soundFX.playClick();
              setShowAddMenu(!showAddMenu);
            }}
            className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs"
            title="Add Node to Scene"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-7 w-44 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl py-1 z-30 text-xs">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 font-semibold">3D Geometries</div>
              <button
                onClick={() => { onAddEntity('cube'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cube Box</span>
              </button>
              <button
                onClick={() => { onAddEntity('sphere'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
                <span>UV Sphere</span>
              </button>
              <button
                onClick={() => { onAddEntity('torus'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <span className="w-3.5 h-3.5 rounded-full border border-sky-400 inline-block" />
                <span>Torus Ring</span>
              </button>
              <button
                onClick={() => { onAddEntity('cylinder'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>Cylinder</span>
              </button>
              <button
                onClick={() => { onAddEntity('pyramid'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <span className="w-3.5 h-3.5 border-l-2 border-r-2 border-b-2 border-rose-400 inline-block rotate-45" />
                <span>Pyramid</span>
              </button>

              <div className="h-px bg-neutral-800 my-1" />
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 font-semibold">Lighting & Camera</div>
              <button
                onClick={() => { onAddEntity('light'); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800/80 text-neutral-200 flex items-center gap-2"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Point Light</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-2 border-b border-neutral-800">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 pl-7 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Tree list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 px-2 py-1">
          <ChevronDown className="w-3 h-3" />
          <span>Root World (SceneGraph)</span>
          <span className="ml-auto text-[10px] bg-neutral-800 px-1 rounded">{filteredNodes.length}</span>
        </div>

        <div className="pl-2 space-y-0.5 border-l border-neutral-800/80 ml-2.5">
          {filteredNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <div
                key={node.id}
                onClick={() => {
                  soundFX.playClick();
                  onSelectNode(node.id);
                }}
                className={`group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 font-medium'
                    : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  {getNodeIcon(node)}
                  <span className="truncate">{node.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 shrink-0">
                  {node.physics?.enabled && (
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      RB
                    </span>
                  )}
                  {node.script?.enabled && (
                    <span className="text-[9px] font-mono px-1 rounded bg-purple-950 text-purple-400 border border-purple-800/40">
                      C++
                    </span>
                  )}

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(node.id);
                    }}
                    className="p-1 hover:text-white text-neutral-400 rounded"
                    title="Toggle Visibility"
                  >
                    {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-neutral-600" />}
                  </button>

                  {/* Delete button (only if not root light or ground) */}
                  {node.id !== 'ground_floor' && node.id !== 'sun_light' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-1 hover:text-rose-400 text-neutral-500 rounded"
                      title="Delete Entity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
