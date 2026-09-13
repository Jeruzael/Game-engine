// Wavefront OBJ Parser & Built-in 3D Assets for Aether Engine

export interface ParsedMesh {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  wireIndices: Uint16Array;
}

export function parseOBJ(objText: string): ParsedMesh {
  const lines = objText.split('\n');
  const tempPositions: [number, number, number][] = [];
  const tempNormals: [number, number, number][] = [];
  const tempUVs: [number, number][] = [];

  const outPositions: number[] = [];
  const outNormals: number[] = [];
  const outUVs: number[] = [];
  const outIndices: number[] = [];
  const wireIndices: number[] = [];

  const vertexCache = new Map<string, number>();

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    const type = parts[0];

    if (type === 'v') {
      tempPositions.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (type === 'vn') {
      tempNormals.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (type === 'vt') {
      tempUVs.push([
        parseFloat(parts[1]),
        parseFloat(parts[2])
      ]);
    } else if (type === 'f') {
      // Face elements: v, v/vt, v//vn, v/vt/vn
      const faceVertices = parts.slice(1);
      const faceIndices: number[] = [];

      for (const vertexStr of faceVertices) {
        let index = vertexCache.get(vertexStr);
        if (index === undefined) {
          const sub = vertexStr.split('/');
          const vIdx = parseInt(sub[0], 10) - 1;
          const vtIdx = sub[1] ? parseInt(sub[1], 10) - 1 : -1;
          const vnIdx = sub[2] ? parseInt(sub[2], 10) - 1 : -1;

          const p = tempPositions[vIdx] || [0, 0, 0];
          const n = (vnIdx >= 0 && tempNormals[vnIdx]) ? tempNormals[vnIdx] : [0, 1, 0];
          const uv = (vtIdx >= 0 && tempUVs[vtIdx]) ? tempUVs[vtIdx] : [0, 0];

          index = outPositions.length / 3;
          outPositions.push(p[0], p[1], p[2]);
          outNormals.push(n[0], n[1], n[2]);
          outUVs.push(uv[0], uv[1]);

          vertexCache.set(vertexStr, index);
        }
        faceIndices.push(index);
      }

      // Fan triangulate (quads or polygons)
      for (let i = 1; i < faceIndices.length - 1; i++) {
        const i0 = faceIndices[0];
        const i1 = faceIndices[i];
        const i2 = faceIndices[i + 1];

        outIndices.push(i0, i1, i2);

        // Wireframe edges
        wireIndices.push(i0, i1, i1, i2, i2, i0);
      }
    }
  }

  // If no normals were specified in the OBJ, compute flat face normals
  if (tempNormals.length === 0 && outIndices.length > 0) {
    for (let i = 0; i < outIndices.length; i += 3) {
      const idx0 = outIndices[i];
      const idx1 = outIndices[i + 1];
      const idx2 = outIndices[i + 2];

      const ax = outPositions[idx0 * 3], ay = outPositions[idx0 * 3 + 1], az = outPositions[idx0 * 3 + 2];
      const bx = outPositions[idx1 * 3], by = outPositions[idx1 * 3 + 1], bz = outPositions[idx1 * 3 + 2];
      const cx = outPositions[idx2 * 3], cy = outPositions[idx2 * 3 + 1], cz = outPositions[idx2 * 3 + 2];

      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;

      let nx = aby * acz - abz * acy;
      let ny = abz * acx - abx * acz;
      let nz = abx * acy - aby * acx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      outNormals[idx0 * 3] = nx; outNormals[idx0 * 3 + 1] = ny; outNormals[idx0 * 3 + 2] = nz;
      outNormals[idx1 * 3] = nx; outNormals[idx1 * 3 + 1] = ny; outNormals[idx1 * 3 + 2] = nz;
      outNormals[idx2 * 3] = nx; outNormals[idx2 * 3 + 1] = ny; outNormals[idx2 * 3 + 2] = nz;
    }
  }

  return {
    positions: new Float32Array(outPositions),
    normals: new Float32Array(outNormals),
    uvs: new Float32Array(outUVs),
    indices: new Uint16Array(outIndices),
    wireIndices: new Uint16Array(wireIndices)
  };
}

// Built-in iconic 3D models encoded in standard OBJ format
export const BUILTIN_OBJ_MODELS: Record<string, { name: string; description: string; objData: string }> = {
  teapot: {
    name: 'Utah Teapot (Classic)',
    description: 'The iconic 1975 computer graphics reference model designed by Martin Newell at the University of Utah.',
    objData: `
# Utah Teapot Low-poly representation
v -0.6 0.0 -0.6
v 0.6 0.0 -0.6
v 0.8 0.0 0.0
v 0.6 0.0 0.6
v -0.6 0.0 0.6
v -0.8 0.0 0.0
v -0.9 0.5 -0.9
v 0.9 0.5 -0.9
v 1.2 0.5 0.0
v 0.9 0.5 0.9
v -0.9 0.5 0.9
v -1.2 0.5 0.0
v -0.6 1.0 -0.6
v 0.6 1.0 -0.6
v 0.8 1.0 0.0
v 0.6 1.0 0.6
v -0.6 1.0 0.6
v -0.8 1.0 0.0
v 0.0 1.2 0.0
v 1.2 0.8 0.0
v 1.8 1.2 0.0
v 1.5 0.4 0.0
v -1.1 0.8 0.0
v -1.6 0.5 0.0
v -1.2 0.2 0.0
f 1 2 8 7
f 2 3 9 8
f 3 4 10 9
f 4 5 11 10
f 5 6 12 11
f 6 1 7 12
f 7 8 14 13
f 8 9 15 14
f 9 10 16 15
f 10 11 17 16
f 11 12 18 17
f 12 7 13 18
f 13 14 19
f 14 15 19
f 15 16 19
f 16 17 19
f 17 18 19
f 18 13 19
f 9 20 21
f 20 22 21
f 6 25 24
f 25 23 24
`
  },
  fighter: {
    name: 'Viper Starfighter',
    description: 'Sci-fi interceptor with swept wings, cockpit canopy, and dual plasma exhaust thrusters.',
    objData: `
# Viper Starfighter Model
v 0.0 0.2 2.0
v 0.3 0.1 0.5
v -0.3 0.1 0.5
v 0.0 -0.2 1.8
v 0.5 0.2 -1.2
v -0.5 0.2 -1.2
v 0.0 -0.3 -1.2
v 0.0 0.6 -0.8
v 2.4 -0.1 -1.4
v -2.4 -0.1 -1.4
v 1.8 -0.1 -0.4
v -1.8 -0.1 -0.4
v 0.0 0.9 -1.4
v 0.0 0.2 -1.4
f 1 2 3
f 1 3 4
f 1 4 2
f 2 5 7 4
f 3 4 7 6
f 2 8 5
f 3 6 8
f 2 11 9 5
f 3 6 10 12
f 8 13 14
f 5 8 14 7
f 6 7 14 8
`
  },
  suzanne: {
    name: 'Suzanne Monkey Mascot',
    description: 'The standard 3D graphics monkey test primitive with brow ridge and prominent ears.',
    objData: `
# Suzanne Primitive approximation
v 0.0 0.0 0.9
v 0.4 0.2 0.8
v -0.4 0.2 0.8
v 0.0 -0.4 0.7
v 0.6 0.5 0.3
v -0.6 0.5 0.3
v 0.8 -0.2 0.2
v -0.8 -0.2 0.2
v 0.0 0.8 0.1
v 1.5 0.4 -0.2
v -1.5 0.4 -0.2
v 1.3 0.0 -0.2
v -1.3 0.0 -0.2
v 0.5 0.8 -0.6
v -0.5 0.8 -0.6
v 0.0 0.0 -0.8
v 0.0 -0.6 -0.5
f 1 2 5 9
f 1 9 6 3
f 1 3 8 4
f 1 4 7 2
f 2 7 12 10
f 5 2 10
f 3 6 11 13
f 3 13 8
f 5 10 14 9
f 6 9 15 11
f 9 14 16 15
f 7 4 17 12
f 8 13 17 4
f 14 10 12 16
f 15 16 13 11
f 12 17 16
f 13 16 17
`
  }
};
