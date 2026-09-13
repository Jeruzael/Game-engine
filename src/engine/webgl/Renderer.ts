import { SceneNode, ViewportMode, CameraType, ProfilerMetrics, Vector3D } from '../../types/engine';
import { DEFAULT_SHADERS } from '../shaders/glslLibrary';
import { soundFX } from '../audio/SoundEffects';
import { PostProcessor } from './PostProcessor';
import { ParticleSystem } from '../particles/ParticleSystem';
import { parseOBJ, BUILTIN_OBJ_MODELS } from '../models/objParser';

// Matrix 4x4 and Vector math helpers
export class Mat4 {
  public data: Float32Array;

  constructor() {
    this.data = new Float32Array(16);
    this.identity();
  }

  identity(): Mat4 {
    const d = this.data;
    d.fill(0);
    d[0] = 1; d[5] = 1; d[10] = 1; d[15] = 1;
    return this;
  }

  static perspective(fovyRad: number, aspect: number, near: number, far: number): Mat4 {
    const out = new Mat4();
    const f = 1.0 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    out.data[0] = f / aspect;
    out.data[5] = f;
    out.data[10] = (far + near) * nf;
    out.data[11] = -1;
    out.data[14] = (2 * far * near) * nf;
    out.data[15] = 0;
    return out;
  }

  static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    const out = new Mat4();
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    out.data[0] = -2 * lr;
    out.data[5] = -2 * bt;
    out.data[10] = 2 * nf;
    out.data[12] = (left + right) * lr;
    out.data[13] = (top + bottom) * bt;
    out.data[14] = (far + near) * nf;
    out.data[15] = 1;
    return out;
  }

  static lookAt(eye: [number, number, number], target: [number, number, number], up: [number, number, number]): Mat4 {
    const out = new Mat4();
    let z0 = eye[0] - target[0];
    let z1 = eye[1] - target[1];
    let z2 = eye[2] - target[2];
    let len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len; z1 *= len; z2 *= len;

    let x0 = up[1] * z2 - up[2] * z1;
    let x1 = up[2] * z0 - up[0] * z2;
    let x2 = up[0] * z1 - up[1] * z0;
    len = Math.hypot(x0, x1, x2);
    if (!len) {
      x0 = 0; x1 = 0; x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len; x1 *= len; x2 *= len;
    }

    let y0 = z1 * x2 - z2 * x1;
    let y1 = z2 * x0 - z0 * x2;
    let y2 = z0 * x1 - z1 * x0;
    len = Math.hypot(y0, y1, y2);
    if (len) {
      len = 1 / len;
      y0 *= len; y1 *= len; y2 *= len;
    }

    out.data[0] = x0; out.data[1] = y0; out.data[2] = z0; out.data[3] = 0;
    out.data[4] = x1; out.data[5] = y1; out.data[6] = z1; out.data[7] = 0;
    out.data[8] = x2; out.data[9] = y2; out.data[10] = z2; out.data[11] = 0;
    out.data[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out.data[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out.data[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out.data[15] = 1;
    return out;
  }

  static fromRotationTranslationScale(pos: Vector3D, rotDeg: Vector3D, scale: Vector3D): Mat4 {
    const out = new Mat4();
    // Translation
    const radX = (rotDeg.x * Math.PI) / 180;
    const radY = (rotDeg.y * Math.PI) / 180;
    const radZ = (rotDeg.z * Math.PI) / 180;

    const cx = Math.cos(radX), sx = Math.sin(radX);
    const cy = Math.cos(radY), sy = Math.sin(radY);
    const cz = Math.cos(radZ), sz = Math.sin(radZ);

    // Composite Euler XYZ rotation matrix scaled
    out.data[0] = (cy * cz) * scale.x;
    out.data[1] = (cy * sz) * scale.x;
    out.data[2] = (-sy) * scale.x;
    out.data[3] = 0;

    out.data[4] = (sx * sy * cz - cx * sz) * scale.y;
    out.data[5] = (sx * sy * sz + cx * cz) * scale.y;
    out.data[6] = (sx * cy) * scale.y;
    out.data[7] = 0;

    out.data[8] = (cx * sy * cz + sx * sz) * scale.z;
    out.data[9] = (cx * sy * sz - sx * cz) * scale.z;
    out.data[10] = (cx * cy) * scale.z;
    out.data[11] = 0;

    out.data[12] = pos.x;
    out.data[13] = pos.y;
    out.data[14] = pos.z;
    out.data[15] = 1;

    return out;
  }

  static getNormalMatrix(mat: Mat4): Float32Array {
    // 3x3 normal matrix from upper 3x3 of inverse transpose
    const a = mat.data;
    const m00 = a[0], m01 = a[1], m02 = a[2];
    const m10 = a[4], m11 = a[5], m12 = a[6];
    const m20 = a[8], m21 = a[9], m22 = a[10];

    const det = m00 * (m11 * m22 - m12 * m21) -
                m01 * (m10 * m22 - m12 * m20) +
                m02 * (m10 * m21 - m11 * m20);

    const out = new Float32Array(9);
    if (Math.abs(det) < 0.000001) {
      out[0] = 1; out[4] = 1; out[8] = 1;
      return out;
    }
    const invDet = 1.0 / det;

    out[0] = (m11 * m22 - m12 * m21) * invDet;
    out[1] = (m02 * m21 - m01 * m22) * invDet;
    out[2] = (m01 * m12 - m02 * m11) * invDet;

    out[3] = (m12 * m20 - m10 * m22) * invDet;
    out[4] = (m00 * m22 - m02 * m20) * invDet;
    out[5] = (m02 * m10 - m00 * m12) * invDet;

    out[6] = (m10 * m21 - m11 * m20) * invDet;
    out[7] = (m01 * m20 - m00 * m21) * invDet;
    out[8] = (m00 * m11 - m01 * m10) * invDet;

    return out;
  }
}

interface MeshBuffer {
  vao?: WebGLVertexArrayObject | null;
  posBuffer: WebGLBuffer;
  normBuffer: WebGLBuffer;
  uvBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  wireIndexBuffer: WebGLBuffer;
  indexCount: number;
  wireIndexCount: number;
  vertexCount: number;
}

export class EngineRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private programCache: Map<string, WebGLProgram> = new Map();
  public meshCache: Map<string, MeshBuffer> = new Map();
  public customMeshes: Map<string, { name: string; vertexCount: number }> = new Map();
  private gridBuffer: { posBuffer: WebGLBuffer; count: number } | null = null;
  private gridProgram: WebGLProgram | null = null;
  private debugNormalsProgram: WebGLProgram | null = null;
  private debugDepthProgram: WebGLProgram | null = null;
  private debugUnlitProgram: WebGLProgram | null = null;

  public postProcessor: PostProcessor = new PostProcessor();
  public particleSystem: ParticleSystem = new ParticleSystem();

  public cameraPos: [number, number, number] = [0, 4, 10];
  public cameraTarget: [number, number, number] = [0, 1, 0];
  public cameraPitch: number = -0.3;
  public cameraYaw: number = 0.0;
  public cameraDist: number = 10.0;
  public cameraFov: number = 45;
  public cameraType: CameraType = 'perspective';
  public viewportMode: ViewportMode = 'lit';
  public showGrid: boolean = true;
  public showWireframeOverlay: boolean = false;
  public simulationRunning: boolean = true;
  public activeCustomShaders: Map<string, { vs: string; fs: string }> = new Map();

  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsAccumulator: number = 0;
  private fpsTimer: number = 0;
  public metrics: ProfilerMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangleCount: 0,
    vertexCount: 0,
    entityCount: 0,
    physicsTimeMs: 0,
    renderTimeMs: 0,
    vramUsageMB: 18.4,
    history: new Array(30).fill(60)
  };

  constructor() {}

  public init(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }
    this.gl = gl;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.initDefaultShaders();
    this.initPrimitiveMeshes();
    this.initGrid();

    // Initialize Post-Processor & Particle System
    this.postProcessor.init(gl as WebGLRenderingContext, canvas.width || 800, canvas.height || 600);
    this.particleSystem.init(gl as WebGLRenderingContext);

    return true;
  }

  public loadCustomOBJ(key: string, name: string, objData: string): boolean {
    if (!this.gl) return false;
    try {
      const parsed = parseOBJ(objData);
      const meshBuffer = this.buildMeshBuffer(
        parsed.positions,
        parsed.normals,
        parsed.uvs,
        parsed.indices,
        parsed.wireIndices
      );
      this.meshCache.set(key, meshBuffer);
      this.customMeshes.set(key, { name, vertexCount: parsed.positions.length / 3 });
      return true;
    } catch (e) {
      console.error('Failed to parse OBJ file', e);
      return false;
    }
  }

  public compileCustomShader(id: string, vsSource: string, fsSource: string): { success: boolean; error?: string } {
    if (!this.gl) return { success: false, error: 'No GL context' };
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return { success: false, error: 'Could not create vertex shader' };
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(vs) || 'Vertex Shader Compile Error';
      gl.deleteShader(vs);
      return { success: false, error: info };
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) {
      gl.deleteShader(vs);
      return { success: false, error: 'Could not create fragment shader' };
    }
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(fs) || 'Fragment Shader Compile Error';
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return { success: false, error: info };
    }

    const prog = gl.createProgram();
    if (!prog) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return { success: false, error: 'Could not create GL program' };
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog) || 'Program Link Error';
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return { success: false, error: info };
    }

    this.programCache.set(id, prog);
    this.activeCustomShaders.set(id, { vs: vsSource, fs: fsSource });
    return { success: true };
  }

  private initDefaultShaders() {
    for (const preset of DEFAULT_SHADERS) {
      this.compileCustomShader(preset.id, preset.vertexShader, preset.fragmentShader);
    }

    // Diagnostic shaders
    const vsDebug = `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
varying vec3 v_normal;
varying vec4 v_projPos;
void main() {
    v_normal = a_normal;
    v_projPos = u_projection * u_view * u_model * vec4(a_position, 1.0);
    gl_Position = v_projPos;
}`;

    // Normal visualizer
    const fsNormals = `precision mediump float;
varying vec3 v_normal;
void main() {
    vec3 n = normalize(v_normal) * 0.5 + 0.5;
    gl_FragColor = vec4(n, 1.0);
}`;
    const pNormals = this.createGLProgram(vsDebug, fsNormals);
    if (pNormals) this.debugNormalsProgram = pNormals;

    // Depth buffer visualizer
    const fsDepth = `precision mediump float;
varying vec4 v_projPos;
void main() {
    float depth = (v_projPos.z / v_projPos.w) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(depth), 1.0);
}`;
    const pDepth = this.createGLProgram(vsDebug, fsDepth);
    if (pDepth) this.debugDepthProgram = pDepth;

    // Unlit flat color
    const fsUnlit = `precision mediump float;
uniform vec4 u_baseColor;
void main() {
    gl_FragColor = u_baseColor;
}`;
    const pUnlit = this.createGLProgram(vsDebug, fsUnlit);
    if (pUnlit) this.debugUnlitProgram = pUnlit;
  }

  private createGLProgram(vsSrc: string, fsSrc: string): WebGLProgram | null {
    if (!this.gl) return null;
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
  }

  private initPrimitiveMeshes() {
    if (!this.gl) return;
    this.meshCache.set('cube', this.createCubeMesh());
    this.meshCache.set('sphere', this.createSphereMesh(24, 24));
    this.meshCache.set('torus', this.createTorusMesh(0.8, 0.28, 24, 32));
    this.meshCache.set('cylinder', this.createCylinderMesh(0.7, 1.5, 24));
    this.meshCache.set('pyramid', this.createPyramidMesh());
    this.meshCache.set('plane', this.createPlaneMesh(10, 10));

    // Load built-in iconic 3D models via Wavefront OBJ pipeline
    for (const [key, model] of Object.entries(BUILTIN_OBJ_MODELS)) {
      this.loadCustomOBJ(key, model.name, model.objData);
    }
  }

  private createCubeMesh(): MeshBuffer {
    const gl = this.gl!;
    // 6 faces * 4 vertices = 24 vertices
    const positions = new Float32Array([
      // Front
      -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
      // Back
      -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
      // Top
      -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
      // Bottom
      -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
      // Right
       0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
      // Left
      -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    ]);

    const normals = new Float32Array([
      // Front
       0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
      // Back
       0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
      // Top
       0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
      // Bottom
       0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
      // Right
       1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
      // Left
      -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
    ]);

    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,  0, 1,
    ]);

    const indices = new Uint16Array([
       0,  1,  2,   0,  2,  3,  // Front
       4,  5,  6,   4,  6,  7,  // Back
       8,  9, 10,   8, 10, 11,  // Top
      12, 13, 14,  12, 14, 15,  // Bottom
      16, 17, 18,  16, 18, 19,  // Right
      20, 21, 22,  20, 22, 23   // Left
    ]);

    // Wireframe indices
    const wireIndices = new Uint16Array([
      0,1, 1,2, 2,3, 3,0,
      4,5, 5,6, 6,7, 7,4,
      0,7, 1,6, 2,5, 3,4
    ]);

    return this.buildMeshBuffer(positions, normals, uvs, indices, wireIndices);
  }

  private createSphereMesh(latBands: number, longBands: number): MeshBuffer {
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const wireIndices: number[] = [];

    const radius = 0.65;
    for (let lat = 0; lat <= latBands; lat++) {
      const theta = (lat * Math.PI) / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= longBands; lon++) {
        const phi = (lon * 2 * Math.PI) / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        const u = 1 - lon / longBands;
        const v = 1 - lat / latBands;

        norm.push(x, y, z);
        uvs.push(u, v);
        pos.push(radius * x, radius * y, radius * z);
      }
    }

    for (let lat = 0; lat < latBands; lat++) {
      for (let lon = 0; lon < longBands; lon++) {
        const first = lat * (longBands + 1) + lon;
        const second = first + longBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);

        wireIndices.push(first, first + 1, first, second);
      }
    }

    return this.buildMeshBuffer(
      new Float32Array(pos),
      new Float32Array(norm),
      new Float32Array(uvs),
      new Uint16Array(indices),
      new Uint16Array(wireIndices)
    );
  }

  private createTorusMesh(R: number, r: number, rings: number, sides: number): MeshBuffer {
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const wireIndices: number[] = [];

    for (let i = 0; i <= rings; i++) {
      const u = (i / rings) * Math.PI * 2;
      const cu = Math.cos(u);
      const su = Math.sin(u);

      for (let j = 0; j <= sides; j++) {
        const v = (j / sides) * Math.PI * 2;
        const cv = Math.cos(v);
        const sv = Math.sin(v);

        const x = (R + r * cv) * cu;
        const y = r * sv;
        const z = (R + r * cv) * su;

        const nx = cv * cu;
        const ny = sv;
        const nz = cv * su;

        pos.push(x, y, z);
        norm.push(nx, ny, nz);
        uvs.push(i / rings, j / sides);
      }
    }

    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sides; j++) {
        const a = i * (sides + 1) + j;
        const b = (i + 1) * (sides + 1) + j;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
        wireIndices.push(a, a + 1, a, b);
      }
    }

    return this.buildMeshBuffer(
      new Float32Array(pos),
      new Float32Array(norm),
      new Float32Array(uvs),
      new Uint16Array(indices),
      new Uint16Array(wireIndices)
    );
  }

  private createCylinderMesh(radius: number, height: number, segments: number): MeshBuffer {
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const wireIndices: number[] = [];

    const halfH = height / 2;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      // Top vertex
      pos.push(ca * radius, halfH, sa * radius);
      norm.push(ca, 0, sa);
      uvs.push(i / segments, 1);

      // Bottom vertex
      pos.push(ca * radius, -halfH, sa * radius);
      norm.push(ca, 0, sa);
      uvs.push(i / segments, 0);
    }

    for (let i = 0; i < segments; i++) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
      wireIndices.push(idx, idx + 2, idx, idx + 1);
    }

    return this.buildMeshBuffer(
      new Float32Array(pos),
      new Float32Array(norm),
      new Float32Array(uvs),
      new Uint16Array(indices),
      new Uint16Array(wireIndices)
    );
  }

  private createPyramidMesh(): MeshBuffer {
    const pos = new Float32Array([
      // Base
      -0.6, 0.0, -0.6,   0.6, 0.0, -0.6,   0.6, 0.0,  0.6,  -0.6, 0.0,  0.6,
      // Apex triangles
      -0.6, 0.0,  0.6,   0.6, 0.0,  0.6,   0.0, 1.0,  0.0, // Front
       0.6, 0.0,  0.6,   0.6, 0.0, -0.6,   0.0, 1.0,  0.0, // Right
       0.6, 0.0, -0.6,  -0.6, 0.0, -0.6,   0.0, 1.0,  0.0, // Back
      -0.6, 0.0, -0.6,  -0.6, 0.0,  0.6,   0.0, 1.0,  0.0  // Left
    ]);

    const norm = new Float32Array([
       0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
       0, 0.6, 0.8, 0, 0.6, 0.8, 0, 0.6, 0.8,
       0.8, 0.6, 0, 0.8, 0.6, 0, 0.8, 0.6, 0,
       0, 0.6, -0.8, 0, 0.6, -0.8, 0, 0.6, -0.8,
      -0.8, 0.6, 0, -0.8, 0.6, 0, -0.8, 0.6, 0
    ]);

    const uvs = new Float32Array(pos.length * 2 / 3).fill(0.5);
    const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3,
      4, 5, 6,
      7, 8, 9,
      10, 11, 12,
      13, 14, 15
    ]);
    const wireIndices = new Uint16Array([
      0,1, 1,2, 2,3, 3,0,
      4,6, 5,6, 7,9, 10,12, 13,15
    ]);

    return this.buildMeshBuffer(pos, norm, uvs, indices, wireIndices);
  }

  private createPlaneMesh(width: number, depth: number): MeshBuffer {
    const halfW = width / 2;
    const halfD = depth / 2;
    const pos = new Float32Array([
      -halfW, 0, -halfD,
       halfW, 0, -halfD,
       halfW, 0,  halfD,
      -halfW, 0,  halfD
    ]);
    const norm = new Float32Array([
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0
    ]);
    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,  0, 1
    ]);
    const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3
    ]);
    const wireIndices = new Uint16Array([
      0,1, 1,2, 2,3, 3,0
    ]);

    return this.buildMeshBuffer(pos, norm, uvs, indices, wireIndices);
  }

  private buildMeshBuffer(positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array, wireIndices: Uint16Array): MeshBuffer {
    const gl = this.gl!;
    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const wireIndexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireIndices, gl.STATIC_DRAW);

    return {
      posBuffer,
      normBuffer,
      uvBuffer,
      indexBuffer,
      wireIndexBuffer,
      indexCount: indices.length,
      wireIndexCount: wireIndices.length,
      vertexCount: positions.length / 3
    };
  }

  private initGrid() {
    if (!this.gl) return;
    const gl = this.gl;
    const lines: number[] = [];
    const size = 16;
    const step = 1;

    for (let i = -size; i <= size; i += step) {
      // Along Z
      lines.push(i, 0, -size, i, 0, size);
      // Along X
      lines.push(-size, 0, i, size, 0, i);
    }

    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    this.gridBuffer = { posBuffer, count: lines.length / 3 };

    // Simple grid shader
    const vs = `precision mediump float;
attribute vec3 a_position;
uniform mat4 u_view;
uniform mat4 u_projection;
void main() {
    gl_Position = u_projection * u_view * vec4(a_position, 1.0);
}`;
    const fs = `precision mediump float;
void main() {
    gl_FragColor = vec4(0.22, 0.25, 0.32, 0.45);
}`;
    this.gridProgram = this.createGLProgram(vs, fs);
  }

  // Real-time Physics Simulation Loop
  public stepPhysics(nodes: SceneNode[], dt: number) {
    if (!this.simulationRunning) return;
    const t0 = performance.now();
    const gravity = -9.81;

    for (const node of nodes) {
      if (!node.physics || !node.physics.enabled || node.physics.isStatic) continue;

      const p = node.physics;
      const trans = node.transform;

      // Apply Gravity
      if (p.useGravity) {
        p.velocity.y += gravity * dt;
      }

      // Linear damping / air drag
      p.velocity.x *= 0.995;
      p.velocity.z *= 0.995;

      // Position update
      trans.position.x += p.velocity.x * dt;
      trans.position.y += p.velocity.y * dt;
      trans.position.z += p.velocity.z * dt;

      // Ground floor plane collision (y = 0 or half-height)
      const floorThreshold = (node.geometry === 'sphere' ? 0.4 : 0.5) * trans.scale.y;
      if (trans.position.y <= floorThreshold) {
        trans.position.y = floorThreshold;
        if (Math.abs(p.velocity.y) > 0.4) {
          p.velocity.y = -p.velocity.y * p.restitution;
          soundFX.playCollision(Math.min(Math.abs(p.velocity.y) / 5, 1));
        } else {
          p.velocity.y = 0;
        }
        // Friction on floor
        p.velocity.x *= (1 - p.friction);
        p.velocity.z *= (1 - p.friction);
      }

      // Rotation spin based on velocity
      trans.rotation.y += p.velocity.x * 20 * dt;
      trans.rotation.x += p.velocity.z * 20 * dt;

      // Inter-entity simple AABB/distance collision resolution
      for (const other of nodes) {
        if (other.id === node.id || !other.physics || !other.physics.enabled) continue;
        const dx = trans.position.x - other.transform.position.x;
        const dy = trans.position.y - other.transform.position.y;
        const dz = trans.position.z - other.transform.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minRadius = 0.9;

        if (distSq < minRadius * minRadius && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = minRadius - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          trans.position.x += nx * overlap * 0.5;
          trans.position.y += ny * overlap * 0.5;
          trans.position.z += nz * overlap * 0.5;

          const impulse = (p.velocity.x * nx + p.velocity.y * ny + p.velocity.z * nz);
          if (impulse < 0) {
            p.velocity.x -= (1 + p.restitution) * impulse * nx;
            p.velocity.y -= (1 + p.restitution) * impulse * ny;
            p.velocity.z -= (1 + p.restitution) * impulse * nz;
            soundFX.playCollision(0.4);
          }
        }
      }
    }

    // Step dynamic GPU/CPU particle system
    const particleNode = nodes.find(n => n.type === 'particle');
    if (particleNode && particleNode.visible) {
      this.particleSystem.update(dt, particleNode.transform.position, particleNode.material?.color || '#38bdf8');
    } else {
      this.particleSystem.update(dt);
    }

    this.metrics.physicsTimeMs = +(performance.now() - t0).toFixed(2);
  }

  // Interactive impulse spawner
  public applyExplosionImpulse(nodes: SceneNode[]) {
    soundFX.playImpulse();
    for (const node of nodes) {
      if (node.physics && node.physics.enabled && !node.physics.isStatic) {
        node.physics.velocity.x += (Math.random() - 0.5) * 8;
        node.physics.velocity.y += 6 + Math.random() * 6;
        node.physics.velocity.z += (Math.random() - 0.5) * 8;
      }
    }
  }

  public render(nodes: SceneNode[], currentTime: number) {
    if (!this.gl || !this.canvas) return;
    const gl = this.gl;
    const renderStart = performance.now();

    // Resize canvas buffer if needed
    const displayWidth = this.canvas.clientWidth * window.devicePixelRatio;
    const displayHeight = this.canvas.clientHeight * window.devicePixelRatio;
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }

    // Update Post-Processor viewport dimensions and bind offscreen FBO
    this.postProcessor.resize(this.canvas.width, this.canvas.height);
    this.postProcessor.bindFBO();

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Dark engine clear color
    gl.clearColor(0.063, 0.067, 0.082, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute Camera Matrices
    const aspect = this.canvas.width / (this.canvas.height || 1);
    const projMatrix = this.cameraType === 'perspective'
      ? Mat4.perspective((this.cameraFov * Math.PI) / 180, aspect, 0.1, 1000.0)
      : Mat4.orthographic(-this.cameraDist * aspect, this.cameraDist * aspect, -this.cameraDist, this.cameraDist, 0.1, 1000.0);

    // Orbit Camera position
    const eyeX = this.cameraTarget[0] + this.cameraDist * Math.cos(this.cameraPitch) * Math.sin(this.cameraYaw);
    const eyeY = this.cameraTarget[1] + this.cameraDist * Math.sin(-this.cameraPitch);
    const eyeZ = this.cameraTarget[2] + this.cameraDist * Math.cos(this.cameraPitch) * Math.cos(this.cameraYaw);
    this.cameraPos = [eyeX, eyeY, eyeZ];

    const viewMatrix = Mat4.lookAt(this.cameraPos, this.cameraTarget, [0, 1, 0]);

    let drawCalls = 0;
    let triangles = 0;
    let vertices = 0;

    // 1. Draw Coordinate Grid
    if (this.showGrid && this.gridProgram && this.gridBuffer) {
      gl.useProgram(this.gridProgram);
      const uView = gl.getUniformLocation(this.gridProgram, 'u_view');
      const uProj = gl.getUniformLocation(this.gridProgram, 'u_projection');
      gl.uniformMatrix4fv(uView, false, viewMatrix.data);
      gl.uniformMatrix4fv(uProj, false, projMatrix.data);

      const aPos = gl.getAttribLocation(this.gridProgram, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer.posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, this.gridBuffer.count);
      drawCalls++;
      vertices += this.gridBuffer.count;
    }

    // Light position from directional light or default
    const lightNode = nodes.find(n => n.type === 'light');
    const lightPos = lightNode
      ? [lightNode.transform.position.x, lightNode.transform.position.y, lightNode.transform.position.z]
      : [10, 15, 12];
    const lightColor = [1.0, 0.98, 0.92];

    // 2. Render Scene Nodes
    for (const node of nodes) {
      if (!node.visible || node.type === 'light' || node.type === 'camera' || node.type === 'particle') continue;
      const meshKey = node.customMeshKey || node.geometry || 'cube';
      const mesh = this.meshCache.get(meshKey);
      if (!mesh) continue;

      // Select active shader program
      let prog = this.programCache.get(node.material?.shaderId || 'phong');

      if (this.viewportMode === 'normals' && this.debugNormalsProgram) {
        prog = this.debugNormalsProgram;
      } else if (this.viewportMode === 'depth' && this.debugDepthProgram) {
        prog = this.debugDepthProgram;
      } else if (this.viewportMode === 'unlit' && this.debugUnlitProgram) {
        prog = this.debugUnlitProgram;
      }

      if (!prog) prog = this.programCache.get('phong');
      if (!prog) continue;

      gl.useProgram(prog);

      // Model Matrix
      const modelMatrix = Mat4.fromRotationTranslationScale(node.transform.position, node.transform.rotation, node.transform.scale);
      const normalMatrix = Mat4.getNormalMatrix(modelMatrix);

      // Uniforms
      const uModel = gl.getUniformLocation(prog, 'u_model');
      const uView = gl.getUniformLocation(prog, 'u_view');
      const uProj = gl.getUniformLocation(prog, 'u_projection');
      const uNormMat = gl.getUniformLocation(prog, 'u_normalMatrix');
      const uLightPos = gl.getUniformLocation(prog, 'u_lightPos');
      const uLightCol = gl.getUniformLocation(prog, 'u_lightColor');
      const uViewPos = gl.getUniformLocation(prog, 'u_viewPos');
      const uBaseColor = gl.getUniformLocation(prog, 'u_baseColor');
      const uRoughness = gl.getUniformLocation(prog, 'u_roughness');
      const uMetallic = gl.getUniformLocation(prog, 'u_metallic');
      const uTime = gl.getUniformLocation(prog, 'u_time');

      if (uModel) gl.uniformMatrix4fv(uModel, false, modelMatrix.data);
      if (uView) gl.uniformMatrix4fv(uView, false, viewMatrix.data);
      if (uProj) gl.uniformMatrix4fv(uProj, false, projMatrix.data);
      if (uNormMat) gl.uniformMatrix3fv(uNormMat, false, normalMatrix);
      if (uLightPos) gl.uniform3fv(uLightPos, lightPos);
      if (uLightCol) gl.uniform3fv(uLightCol, lightColor);
      if (uViewPos) gl.uniform3fv(uViewPos, this.cameraPos);
      if (uTime) gl.uniform1f(uTime, currentTime * 0.001);

      // Material color
      const hexColor = node.material?.color || '#38bdf8';
      const r = parseInt(hexColor.slice(1, 3), 16) / 255;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255;
      if (uBaseColor) gl.uniform4f(uBaseColor, r, g, b, node.material?.opacity ?? 1.0);
      if (uRoughness) gl.uniform1f(uRoughness, node.material?.roughness ?? 0.35);
      if (uMetallic) gl.uniform1f(uMetallic, node.material?.metallic ?? 0.1);

      // Attributes
      const aPos = gl.getAttribLocation(prog, 'a_position');
      if (aPos >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuffer);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      }

      const aNorm = gl.getAttribLocation(prog, 'a_normal');
      if (aNorm >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuffer);
        gl.enableVertexAttribArray(aNorm);
        gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
      }

      const aUv = gl.getAttribLocation(prog, 'a_uv');
      if (aUv >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
      }

      // Draw mesh
      if (this.viewportMode === 'wireframe' || node.material?.wireframe) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.wireIndexBuffer);
        gl.drawElements(gl.LINES, mesh.wireIndexCount, gl.UNSIGNED_SHORT, 0);
        drawCalls++;
        triangles += mesh.wireIndexCount / 2;
      } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        drawCalls++;
        triangles += mesh.indexCount / 3;

        // Optional wireframe highlight if selected
        if (node.selected && this.debugUnlitProgram) {
          gl.useProgram(this.debugUnlitProgram);
          const uM = gl.getUniformLocation(this.debugUnlitProgram, 'u_model');
          const uV = gl.getUniformLocation(this.debugUnlitProgram, 'u_view');
          const uP = gl.getUniformLocation(this.debugUnlitProgram, 'u_projection');
          const uCol = gl.getUniformLocation(this.debugUnlitProgram, 'u_baseColor');
          if (uM) gl.uniformMatrix4fv(uM, false, modelMatrix.data);
          if (uV) gl.uniformMatrix4fv(uV, false, viewMatrix.data);
          if (uP) gl.uniformMatrix4fv(uP, false, projMatrix.data);
          if (uCol) gl.uniform4f(uCol, 0.98, 0.75, 0.15, 1.0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.wireIndexBuffer);
          gl.drawElements(gl.LINES, mesh.wireIndexCount, gl.UNSIGNED_SHORT, 0);
          drawCalls++;
        }
      }

      vertices += mesh.vertexCount;
    }

    // 3. Render Dynamic Billboard Particles
    const particleCount = this.particleSystem.render(viewMatrix.data, projMatrix.data);
    if (particleCount > 0) {
      drawCalls++;
      vertices += particleCount;
    }

    // 4. Execute Post-Processing Shader Pass onto Screen Framebuffer
    this.postProcessor.unbindAndRenderPostProcess(currentTime * 0.001);

    const renderEnd = performance.now();
    const frameMs = renderEnd - renderStart;

    // Calculate FPS
    this.frameCount++;
    this.fpsAccumulator++;
    if (renderEnd - this.fpsTimer > 500) {
      this.metrics.fps = Math.round((this.fpsAccumulator * 1000) / (renderEnd - this.fpsTimer));
      this.metrics.history.shift();
      this.metrics.history.push(this.metrics.fps);
      this.fpsAccumulator = 0;
      this.fpsTimer = renderEnd;
    }

    this.metrics.frameTimeMs = +frameMs.toFixed(2);
    this.metrics.renderTimeMs = +frameMs.toFixed(2);
    this.metrics.drawCalls = drawCalls;
    this.metrics.triangleCount = triangles;
    this.metrics.vertexCount = vertices;
    this.metrics.entityCount = nodes.length;
  }
}
