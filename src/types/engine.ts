export type NodeType = 'mesh' | 'light' | 'camera' | 'particle' | 'empty' | 'sprite2d' | 'custom_mesh';
export type GeometryType = 'cube' | 'sphere' | 'torus' | 'cylinder' | 'plane' | 'pyramid' | 'custom';
export type ViewportMode = 'lit' | 'wireframe' | 'normals' | 'depth' | 'unlit';
export type CameraType = 'perspective' | 'orthographic';
export type ToolMode = 'select' | 'translate' | 'rotate' | 'scale';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Vector3D;
  rotation: Vector3D; // in degrees
  scale: Vector3D;
}

export interface MaterialData {
  id: string;
  name: string;
  shaderId: string;
  color: string; // hex
  metallic: number;
  roughness: number;
  wireframe: boolean;
  opacity: number;
  emission: string;
}

export interface PhysicsComponent {
  enabled: boolean;
  isStatic: boolean;
  mass: number;
  restitution: number; // bounciness (0-1)
  friction: number;
  useGravity: boolean;
  velocity: Vector3D;
  angularVelocity: Vector3D;
  colliderType: 'box' | 'sphere' | 'capsule';
}

export interface ScriptComponent {
  enabled: boolean;
  scriptName: string;
  code: string;
  parameters: Record<string, number | string | boolean>;
}

export interface ParticleEmitterComponent {
  enabled: boolean;
  count: number;
  rate: number;
  color: string;
  speed: number;
  lifetime: number;
  gravityModifier: number;
  spread: number;
}

export interface PostProcessSettings {
  enabled: boolean;
  bloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  toneMapping: 'aces' | 'reinhard' | 'none';
  exposure: number;
  gamma: number;
  vignette: boolean;
  vignetteStrength: number;
  chromaticAberration: boolean;
  aberrationOffset: number;
  ssao: boolean;
  ssaoIntensity: number;
  shadows: boolean;
  shadowSoftness: number;
}

export interface SceneNode {
  id: string;
  name: string;
  type: NodeType;
  visible: boolean;
  selected?: boolean;
  parentId: string | null;
  childrenIds: string[];
  transform: Transform;
  geometry?: GeometryType;
  customMeshKey?: string;
  material?: MaterialData;
  physics?: PhysicsComponent;
  script?: ScriptComponent;
  particleEmitter?: ParticleEmitterComponent;
  lightData?: {
    type: 'directional' | 'point' | 'spot';
    color: string;
    intensity: number;
    range?: number;
    castShadow?: boolean;
  };
}

export interface ShaderPreset {
  id: string;
  name: string;
  description: string;
  vertexShader: string;
  fragmentShader: string;
}

export interface EngineEvent {
  id: string;
  timestamp: number;
  type: 'COLLISION' | 'INPUT_KEY' | 'INPUT_MOUSE' | 'SCENE_GRAPH' | 'PHYSICS_IMPULSE' | 'SHADER_COMPILE' | 'CRASH_ASSERT';
  source: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ProfilerMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangleCount: number;
  vertexCount: number;
  entityCount: number;
  physicsTimeMs: number;
  renderTimeMs: number;
  vramUsageMB: number;
  history: number[]; // past 30 frames fps
}

export interface MultiplayerPeer {
  id: string;
  name: string;
  role: 'Admin' | 'Graphics Dev' | 'Tech Artist' | 'Gameplay Scripter' | 'Player';
  pingMs: number;
  position: Vector3D;
  color: string;
  lastPacketBytes: number;
}

export interface CrashReport {
  id: string;
  timestamp: string;
  signal: string;
  functionName: string;
  fileLocation: string;
  callStack: string[];
  registers: Record<string, string>;
  resolved: boolean;
}
