import { SceneNode } from '../types/engine';

export const INITIAL_SCENE_NODES: SceneNode[] = [
  {
    id: 'sun_light',
    name: 'Directional Light (Sun)',
    type: 'light',
    visible: true,
    parentId: null,
    childrenIds: [],
    transform: {
      position: { x: 8, y: 14, z: 10 },
      rotation: { x: 45, y: -30, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    lightData: {
      type: 'directional',
      color: '#fffbeb',
      intensity: 1.2
    }
  },
  {
    id: 'main_camera',
    name: 'Main Viewport Camera',
    type: 'camera',
    visible: true,
    parentId: null,
    childrenIds: [],
    transform: {
      position: { x: 0, y: 4, z: 10 },
      rotation: { x: -18, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    }
  },
  {
    id: 'ground_floor',
    name: 'Ground Platform',
    type: 'mesh',
    visible: true,
    parentId: null,
    childrenIds: [],
    geometry: 'plane',
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 14, y: 1, z: 14 }
    },
    material: {
      id: 'mat_ground',
      name: 'Grid Surface',
      shaderId: 'phong',
      color: '#1a1f2c',
      metallic: 0.1,
      roughness: 0.8,
      wireframe: false,
      opacity: 0.95,
      emission: '#000000'
    },
    physics: {
      enabled: true,
      isStatic: true,
      mass: 0,
      restitution: 0.6,
      friction: 0.4,
      useGravity: false,
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      colliderType: 'box'
    }
  },
  {
    id: 'hero_torus',
    name: 'Quantum Reactor Ring',
    type: 'mesh',
    visible: true,
    selected: true,
    parentId: null,
    childrenIds: [],
    geometry: 'torus',
    transform: {
      position: { x: 0, y: 2.2, z: 0 },
      rotation: { x: 25, y: 45, z: 15 },
      scale: { x: 1.4, y: 1.4, z: 1.4 }
    },
    material: {
      id: 'mat_holo_ring',
      name: 'Holo Reactor Shader',
      shaderId: 'hologram',
      color: '#38bdf8',
      metallic: 0.8,
      roughness: 0.15,
      wireframe: false,
      opacity: 0.9,
      emission: '#0ea5e9'
    },
    script: {
      enabled: true,
      scriptName: 'RotatorScript.cpp',
      code: `// Aether Script Component
void OnUpdate(float dt) {
    GetTransform().Rotation.y += 35.0f * dt;
    GetTransform().Rotation.x += 15.0f * dt;
}`,
      parameters: { speed: 1.2, axis: 'Y' }
    }
  },
  {
    id: 'golden_sphere',
    name: 'Kinetic Golden Orb',
    type: 'mesh',
    visible: true,
    parentId: null,
    childrenIds: [],
    geometry: 'sphere',
    transform: {
      position: { x: -2.8, y: 4.5, z: -1.0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.1, y: 1.1, z: 1.1 }
    },
    material: {
      id: 'mat_gold',
      name: 'PBR Gold Metal',
      shaderId: 'pbr',
      color: '#fbbf24',
      metallic: 0.95,
      roughness: 0.2,
      wireframe: false,
      opacity: 1.0,
      emission: '#000000'
    },
    physics: {
      enabled: true,
      isStatic: false,
      mass: 2.5,
      restitution: 0.82,
      friction: 0.15,
      useGravity: true,
      velocity: { x: 0.2, y: 1.0, z: -0.1 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      colliderType: 'sphere'
    }
  },
  {
    id: 'emerald_cube',
    name: 'Dynamic Physics Cube',
    type: 'mesh',
    visible: true,
    parentId: null,
    childrenIds: [],
    geometry: 'cube',
    transform: {
      position: { x: 2.6, y: 3.2, z: 0.8 },
      rotation: { x: 15, y: 25, z: 10 },
      scale: { x: 1.2, y: 1.2, z: 1.2 }
    },
    material: {
      id: 'mat_emerald',
      name: 'Emerald Crystal',
      shaderId: 'phong',
      color: '#10b981',
      metallic: 0.4,
      roughness: 0.25,
      wireframe: false,
      opacity: 1.0,
      emission: '#059669'
    },
    physics: {
      enabled: true,
      isStatic: false,
      mass: 1.8,
      restitution: 0.65,
      friction: 0.3,
      useGravity: true,
      velocity: { x: -0.1, y: 0.5, z: 0.2 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      colliderType: 'box'
    }
  },
  {
    id: 'toon_pyramid',
    name: 'Cel Shaded Obelisk',
    type: 'mesh',
    visible: true,
    parentId: null,
    childrenIds: [],
    geometry: 'pyramid',
    transform: {
      position: { x: -2.2, y: 0.0, z: 3.0 },
      rotation: { x: 0, y: 30, z: 0 },
      scale: { x: 1.5, y: 2.4, z: 1.5 }
    },
    material: {
      id: 'mat_toon_stone',
      name: 'Toon Monolith',
      shaderId: 'toon',
      color: '#f43f5e',
      metallic: 0.05,
      roughness: 0.9,
      wireframe: false,
      opacity: 1.0,
      emission: '#000000'
    }
  },
  {
    id: 'fluid_water_pool',
    name: 'Displaced Wave Basin',
    type: 'mesh',
    visible: true,
    parentId: null,
    childrenIds: [],
    geometry: 'plane',
    transform: {
      position: { x: 2.8, y: 0.08, z: 2.8 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 3.5, y: 1.0, z: 3.5 }
    },
    material: {
      id: 'mat_water',
      name: 'Water Ripple',
      shaderId: 'water',
      color: '#0284c7',
      metallic: 0.1,
      roughness: 0.05,
      wireframe: false,
      opacity: 0.85,
      emission: '#0284c7'
    }
  }
];
