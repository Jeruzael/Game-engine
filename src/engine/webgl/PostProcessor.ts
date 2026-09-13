// Post-Processing Pipeline & Offscreen FBO Stack for Aether Engine
import { PostProcessSettings } from '../../types/engine';

export class PostProcessor {
  private gl: WebGLRenderingContext | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private colorTexture: WebGLTexture | null = null;
  private depthBuffer: WebGLRenderbuffer | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private postProgram: WebGLProgram | null = null;

  public width: number = 0;
  public height: number = 0;

  public settings: PostProcessSettings = {
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
  };

  public init(gl: WebGLRenderingContext, width: number, height: number) {
    this.gl = gl;
    this.initShaders();
    this.initQuad();
    this.resize(width, height);
  }

  private initQuad() {
    if (!this.gl) return;
    const gl = this.gl;
    // Fullscreen quad in NDC [-1, 1]
    const quadVertices = new Float32Array([
      -1.0,  1.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0,
       1.0, -1.0, 1.0, 0.0,
      -1.0,  1.0, 0.0, 1.0,
       1.0, -1.0, 1.0, 0.0,
       1.0,  1.0, 1.0, 1.0
    ]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
  }

  private initShaders() {
    if (!this.gl) return;
    const gl = this.gl;

    const vs = `precision mediump float;
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;

void main() {
    v_uv = a_uv;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

    const fs = `precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_sceneTexture;
uniform vec2 u_resolution;
uniform float u_time;

// Post-process settings
uniform bool u_bloomEnabled;
uniform float u_bloomIntensity;
uniform float u_bloomThreshold;

uniform int u_toneMapping; // 0: none, 1: reinhard, 2: aces
uniform float u_exposure;
uniform float u_gamma;

uniform bool u_vignetteEnabled;
uniform float u_vignetteStrength;

uniform bool u_chromaticEnabled;
uniform float u_aberrationOffset;

uniform bool u_ssaoEnabled;
uniform float u_ssaoIntensity;

// ACES Filmic Tone Mapping Curve
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec2 uv = v_uv;

    // 1. Chromatic Aberration (Lens Dispersion)
    vec3 color;
    if (u_chromaticEnabled && u_aberrationOffset > 0.0) {
        vec2 dist = uv - 0.5;
        vec2 offset = dist * u_aberrationOffset;
        float r = texture2D(u_sceneTexture, uv + offset).r;
        float g = texture2D(u_sceneTexture, uv).g;
        float b = texture2D(u_sceneTexture, uv - offset).b;
        color = vec3(r, g, b);
    } else {
        color = texture2D(u_sceneTexture, uv).rgb;
    }

    // 2. High-Quality Multi-Tap Bloom Simulation
    if (u_bloomEnabled && u_bloomIntensity > 0.0) {
        vec2 texel = 1.0 / u_resolution;
        vec3 bloomAcc = vec3(0.0);
        float totalWeight = 0.0;

        // 9-tap separable blur kernel
        for (int x = -2; x <= 2; x++) {
            for (int y = -2; y <= 2; y++) {
                vec2 sampleUv = uv + vec2(float(x), float(y)) * texel * 2.5;
                vec3 sampleCol = texture2D(u_sceneTexture, sampleUv).rgb;
                float brightness = dot(sampleCol, vec3(0.2126, 0.7152, 0.0722));
                if (brightness > u_bloomThreshold) {
                    float weight = 1.0 / (1.0 + float(x * x + y * y));
                    bloomAcc += sampleCol * weight;
                    totalWeight += weight;
                }
            }
        }
        if (totalWeight > 0.0) {
            bloomAcc /= totalWeight;
            color += bloomAcc * u_bloomIntensity;
        }
    }

    // 3. Screen-Space Ambient Crevice Shadowing
    if (u_ssaoEnabled && u_ssaoIntensity > 0.0) {
        vec2 texel = 1.0 / u_resolution;
        float centerLuma = dot(color, vec3(0.299, 0.587, 0.114));
        float neighborLuma = (
            dot(texture2D(u_sceneTexture, uv + vec2(texel.x * 2.0, 0.0)).rgb, vec3(0.299, 0.587, 0.114)) +
            dot(texture2D(u_sceneTexture, uv - vec2(texel.x * 2.0, 0.0)).rgb, vec3(0.299, 0.587, 0.114)) +
            dot(texture2D(u_sceneTexture, uv + vec2(0.0, texel.y * 2.0)).rgb, vec3(0.299, 0.587, 0.114)) +
            dot(texture2D(u_sceneTexture, uv - vec2(0.0, texel.y * 2.0)).rgb, vec3(0.299, 0.587, 0.114))
        ) * 0.25;

        float diff = max(0.0, neighborLuma - centerLuma);
        color *= (1.0 - diff * u_ssaoIntensity * 1.5);
    }

    // 4. Exposure & Tone Mapping
    color *= u_exposure;
    if (u_toneMapping == 2) {
        color = ACESFilm(color);
    } else if (u_toneMapping == 1) {
        color = color / (color + vec3(1.0));
    }

    // 5. Vignette (Darkened Lens Edges)
    if (u_vignetteEnabled && u_vignetteStrength > 0.0) {
        vec2 coord = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
        float vignette = 1.0 - dot(coord, coord) * u_vignetteStrength * 1.2;
        vignette = clamp(vignette, 0.0, 1.0);
        color *= vignette;
    }

    // 6. Gamma Correction (Linear -> sRGB)
    color = pow(max(color, vec3(0.0)), vec3(1.0 / u_gamma));

    gl_FragColor = vec4(color, 1.0);
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
    this.postProgram = prog;
  }

  public resize(width: number, height: number) {
    if (!this.gl || width <= 0 || height <= 0) return;
    if (this.width === width && this.height === height && this.fbo) return;

    this.width = width;
    this.height = height;
    const gl = this.gl;

    // Clean existing
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.colorTexture) gl.deleteTexture(this.colorTexture);
    if (this.depthBuffer) gl.deleteRenderbuffer(this.depthBuffer);

    // Create FBO
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    // Create Color Texture Attachment
    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

    // Create Depth Renderbuffer Attachment
    this.depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  public bindFBO() {
    if (!this.gl || !this.fbo || !this.settings.enabled) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.width, this.height);
  }

  public unbindAndRenderPostProcess(timeSec: number) {
    if (!this.gl) return;
    const gl = this.gl;

    // If post-processing is disabled, it directly drew to null framebuffer or we blit
    if (!this.settings.enabled || !this.fbo || !this.colorTexture || !this.postProgram || !this.quadBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    // Bind Screen Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.postProgram);

    // Set Textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    const uTex = gl.getUniformLocation(this.postProgram, 'u_sceneTexture');
    if (uTex) gl.uniform1i(uTex, 0);

    // Set Uniforms
    const uRes = gl.getUniformLocation(this.postProgram, 'u_resolution');
    if (uRes) gl.uniform2f(uRes, this.width, this.height);

    const uTime = gl.getUniformLocation(this.postProgram, 'u_time');
    if (uTime) gl.uniform1f(uTime, timeSec);

    const uBloom = gl.getUniformLocation(this.postProgram, 'u_bloomEnabled');
    if (uBloom) gl.uniform1i(uBloom, this.settings.bloom ? 1 : 0);

    const uBloomInt = gl.getUniformLocation(this.postProgram, 'u_bloomIntensity');
    if (uBloomInt) gl.uniform1f(uBloomInt, this.settings.bloomIntensity);

    const uBloomThresh = gl.getUniformLocation(this.postProgram, 'u_bloomThreshold');
    if (uBloomThresh) gl.uniform1f(uBloomThresh, this.settings.bloomThreshold);

    const uTone = gl.getUniformLocation(this.postProgram, 'u_toneMapping');
    const toneVal = this.settings.toneMapping === 'aces' ? 2 : (this.settings.toneMapping === 'reinhard' ? 1 : 0);
    if (uTone) gl.uniform1i(uTone, toneVal);

    const uExp = gl.getUniformLocation(this.postProgram, 'u_exposure');
    if (uExp) gl.uniform1f(uExp, this.settings.exposure);

    const uGamma = gl.getUniformLocation(this.postProgram, 'u_gamma');
    if (uGamma) gl.uniform1f(uGamma, this.settings.gamma);

    const uVignette = gl.getUniformLocation(this.postProgram, 'u_vignetteEnabled');
    if (uVignette) gl.uniform1i(uVignette, this.settings.vignette ? 1 : 0);

    const uVigStr = gl.getUniformLocation(this.postProgram, 'u_vignetteStrength');
    if (uVigStr) gl.uniform1f(uVigStr, this.settings.vignetteStrength);

    const uChromatic = gl.getUniformLocation(this.postProgram, 'u_chromaticEnabled');
    if (uChromatic) gl.uniform1i(uChromatic, this.settings.chromaticAberration ? 1 : 0);

    const uOffset = gl.getUniformLocation(this.postProgram, 'u_aberrationOffset');
    if (uOffset) gl.uniform1f(uOffset, this.settings.aberrationOffset);

    const uSSAO = gl.getUniformLocation(this.postProgram, 'u_ssaoEnabled');
    if (uSSAO) gl.uniform1i(uSSAO, this.settings.ssao ? 1 : 0);

    const uSSAOInt = gl.getUniformLocation(this.postProgram, 'u_ssaoIntensity');
    if (uSSAOInt) gl.uniform1f(uSSAOInt, this.settings.ssaoIntensity);

    // Bind Quad Attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const aPos = gl.getAttribLocation(this.postProgram, 'a_pos');
    const aUV = gl.getAttribLocation(this.postProgram, 'a_uv');

    if (aPos >= 0) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 4 * 4, 0);
    }
    if (aUV >= 0) {
      gl.enableVertexAttribArray(aUV);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST);
  }
}
