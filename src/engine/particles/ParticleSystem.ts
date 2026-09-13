// GPU/CPU Instanced Particle Simulation System for Aether Engine
import { Vector3D } from '../../types/engine';

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public maxParticles: number = 250;
  private buffer: WebGLBuffer | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;

  public init(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.buffer = gl.createBuffer();

    const vs = `precision mediump float;
attribute vec3 a_position;
attribute vec4 a_color;
attribute float a_size;

uniform mat4 u_view;
uniform mat4 u_projection;

varying vec4 v_color;

void main() {
    v_color = a_color;
    vec4 eyePos = u_view * vec4(a_position, 1.0);
    gl_Position = u_projection * eyePos;
    gl_PointSize = a_size * (200.0 / -eyePos.z);
}`;

    const fs = `precision mediump float;
varying vec4 v_color;

void main() {
    // Round particle sprite mask
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, dist) * v_color.a;
    gl_FragColor = vec4(v_color.rgb, alpha);
}`;

    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, vs);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, fs);
    gl.compileShader(fragShader);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    this.program = prog;

    // Seed initial ambient particles
    this.seedParticles({ x: 0, y: 1.5, z: 0 }, '#38bdf8', 100);
  }

  public seedParticles(origin: Vector3D, colorHex: string, count: number = 50) {
    const r = parseInt(colorHex.slice(1, 3), 16) / 255;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 1.5;
      const elevation = (Math.random() - 0.2) * 1.5;

      this.particles.push({
        x: origin.x + (Math.random() - 0.5) * 0.4,
        y: origin.y + (Math.random() - 0.5) * 0.4,
        z: origin.z + (Math.random() - 0.5) * 0.4,
        vx: Math.cos(angle) * speed,
        vy: elevation + 1.2,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.8,
        size: 3 + Math.random() * 5,
        r,
        g,
        b,
        a: 0.9
      });
    }

    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(this.particles.length - this.maxParticles);
    }
  }

  public update(dt: number, emitterOrigin?: Vector3D, emitterColor: string = '#38bdf8') {
    // If emitter origin provided, continuously spawn new particles
    if (emitterOrigin && this.particles.length < this.maxParticles) {
      this.seedParticles(emitterOrigin, emitterColor, 3);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Gentle gravity and drag
      p.vy -= 0.6 * dt;
      p.vx *= 0.98;
      p.vz *= 0.98;

      // Fade out
      const progress = p.life / p.maxLife;
      p.a = Math.max(0, 1.0 - progress);
    }
  }

  public render(viewMatrix: Float32Array, projMatrix: Float32Array) {
    if (!this.gl || !this.program || !this.buffer || this.particles.length === 0) return 0;
    const gl = this.gl;

    gl.useProgram(this.program);

    const uView = gl.getUniformLocation(this.program, 'u_view');
    const uProj = gl.getUniformLocation(this.program, 'u_projection');
    if (uView) gl.uniformMatrix4fv(uView, false, viewMatrix);
    if (uProj) gl.uniformMatrix4fv(uProj, false, projMatrix);

    // Build interleaved vertex array: [x, y, z, r, g, b, a, size] -> 8 floats per particle
    const stride = 8 * 4; // 32 bytes
    const data = new Float32Array(this.particles.length * 8);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const offset = i * 8;
      data[offset + 0] = p.x;
      data[offset + 1] = p.y;
      data[offset + 2] = p.z;
      data[offset + 3] = p.r;
      data[offset + 4] = p.g;
      data[offset + 5] = p.b;
      data[offset + 6] = p.a;
      data[offset + 7] = p.size;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    const aCol = gl.getAttribLocation(this.program, 'a_color');
    const aSize = gl.getAttribLocation(this.program, 'a_size');

    if (aPos >= 0) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);
    }
    if (aCol >= 0) {
      gl.enableVertexAttribArray(aCol);
      gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, stride, 3 * 4);
    }
    if (aSize >= 0) {
      gl.enableVertexAttribArray(aSize);
      gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, stride, 7 * 4);
    }

    // Enable additive/alpha blending for luminous particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);

    gl.drawArrays(gl.POINTS, 0, this.particles.length);

    // Restore state
    gl.depthMask(true);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return this.particles.length;
  }
}
