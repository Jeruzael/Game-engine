import { ShaderPreset } from '../../types/engine';

export const DEFAULT_SHADERS: ShaderPreset[] = [
  {
    id: 'phong',
    name: 'Blinn-Phong Standard',
    description: 'Classic OpenGL lighting model with ambient, diffuse, and specular highlights.',
    vertexShader: `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_fragPos = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}`,
    fragmentShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform vec3 u_viewPos;
uniform vec4 u_baseColor;
uniform float u_roughness;
uniform float u_metallic;
uniform float u_time;

void main() {
    // Ambient
    float ambientStrength = 0.22;
    vec3 ambient = ambientStrength * u_lightColor;

    // Diffuse
    vec3 norm = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPos - v_fragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * u_lightColor;

    // Specular (Blinn-Phong)
    vec3 viewDir = normalize(u_viewPos - v_fragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float shininess = mix(64.0, 4.0, u_roughness);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), shininess);
    vec3 specular = vec3(0.35) * spec;

    vec3 result = (ambient + diffuse + specular) * u_baseColor.rgb;
    gl_FragColor = vec4(result, u_baseColor.a);
}`
  },
  {
    id: 'pbr',
    name: 'PBR Physical Shader',
    description: 'Physically based rendering with roughness, metallic microfacets and fresnel.',
    vertexShader: `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_fragPos = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}`,
    fragmentShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform vec3 u_viewPos;
uniform vec4 u_baseColor;
uniform float u_roughness;
uniform float u_metallic;
uniform float u_time;

const float PI = 3.14159265359;

void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_viewPos - v_fragPos);
    vec3 L = normalize(u_lightPos - v_fragPos);
    vec3 H = normalize(V + L);

    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.001);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    // Fresnel Schlick
    vec3 F0 = mix(vec3(0.04), u_baseColor.rgb, u_metallic);
    vec3 F = F0 + (1.0 - F0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

    // Normal Distribution (GGX)
    float alpha = max(u_roughness * u_roughness, 0.002);
    float alpha2 = alpha * alpha;
    float denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    float D = alpha2 / (PI * denom * denom);

    // Geometry Schlick-GGX
    float k = (u_roughness + 1.0) * (u_roughness + 1.0) / 8.0;
    float G1 = NdotV / (NdotV * (1.0 - k) + k);
    float G2 = NdotL / (NdotL * (1.0 - k) + k);
    float G = G1 * G2;

    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;

    vec3 kD = (vec3(1.0) - F) * (1.0 - u_metallic);
    vec3 diffuse = (kD * u_baseColor.rgb / PI) * NdotL;

    vec3 color = (diffuse + specular) * u_lightColor * 2.2 + u_baseColor.rgb * 0.15;
    // Simple Reinhard Tone mapping
    color = color / (color + vec3(1.0));

    gl_FragColor = vec4(color, u_baseColor.a);
}`
  },
  {
    id: 'hologram',
    name: 'Holographic Scanline',
    description: 'Futuristic sci-fi wireframe with animated scanlines and rim fresnel.',
    vertexShader: `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform float u_time;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

void main() {
    // Subtle vertex jitter
    vec3 pos = a_position;
    pos.x += sin(u_time * 8.0 + pos.y * 10.0) * 0.012;
    vec4 worldPos = u_model * vec4(pos, 1.0);
    v_fragPos = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}`,
    fragmentShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

uniform vec3 u_viewPos;
uniform vec4 u_baseColor;
uniform float u_time;

void main() {
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_viewPos - v_fragPos);
    float rim = 1.0 - max(dot(N, V), 0.0);
    rim = pow(rim, 2.5);

    // Animated scanlines
    float scanline = sin((v_fragPos.y + u_time * 0.5) * 45.0) * 0.5 + 0.5;
    scanline = pow(scanline, 3.0);

    vec3 holoColor = u_baseColor.rgb * (rim * 1.8 + scanline * 0.7 + 0.2);
    gl_FragColor = vec4(holoColor, 0.85);
}`
  },
  {
    id: 'toon',
    name: 'Cel / Toon Outline',
    description: 'NPR (Non-Photorealistic) cel shading with stepped lighting steps.',
    vertexShader: `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_fragPos = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}`,
    fragmentShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec4 u_baseColor;

void main() {
    vec3 N = normalize(v_normal);
    vec3 L = normalize(u_lightPos - v_fragPos);
    vec3 V = normalize(u_viewPos - v_fragPos);

    float NdotL = dot(N, L);
    // Quantize light into 3 distinct tone levels
    float stepFactor = 0.2;
    if (NdotL > 0.6) {
        stepFactor = 1.0;
    } else if (NdotL > 0.2) {
        stepFactor = 0.6;
    }

    // Silhouette outline detection
    float rim = dot(N, V);
    if (rim < 0.22 && rim >= 0.0) {
        gl_FragColor = vec4(0.05, 0.05, 0.08, 1.0);
        return;
    }

    vec3 color = u_baseColor.rgb * stepFactor;
    gl_FragColor = vec4(color, u_baseColor.a);
}`
  },
  {
    id: 'water',
    name: 'Dynamic Water Wave',
    description: 'Vertex displacement shader animating procedural wave ripples and refraction.',
    vertexShader: `precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform float u_time;

varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

void main() {
    vec3 pos = a_position;
    // Sinusoidal wave displacement
    float wave = sin(pos.x * 4.0 + u_time * 2.5) * cos(pos.z * 4.0 + u_time * 2.0) * 0.15;
    pos.y += wave;

    vec4 worldPos = u_model * vec4(pos, 1.0);
    v_fragPos = worldPos.xyz;
    
    // Recalculate normal approximation
    vec3 displacedNormal = normalize(a_normal + vec3(wave * 0.5, 0.0, wave * 0.5));
    v_normal = normalize(u_normalMatrix * displacedNormal);
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}`,
    fragmentShader: `precision mediump float;
varying vec3 v_normal;
varying vec3 v_fragPos;
varying vec2 v_uv;

uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec4 u_baseColor;
uniform float u_time;

void main() {
    vec3 N = normalize(v_normal);
    vec3 L = normalize(u_lightPos - v_fragPos);
    vec3 V = normalize(u_viewPos - v_fragPos);

    float diff = max(dot(N, L), 0.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0);

    vec3 waterColor = mix(vec3(0.05, 0.35, 0.65), vec3(0.2, 0.7, 0.85), diff);
    vec3 finalColor = waterColor + vec3(spec * 0.8);

    gl_FragColor = vec4(finalColor, 0.85);
}`
  }
];
