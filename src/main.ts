import * as THREE from 'three';

enum Block {
    AIR,
    GRASS,
    STONE
}

class SubChunk {
    y: number
    isMeshGenerated: boolean
    mesh: THREE.Mesh
    voxels: Array<Block>

    constructor(y: number) {
        this.y = y
        this.isMeshGenerated = false
        this.mesh = undefined
        this.voxels = new Array(16 * 16 * 16)
    }

    setCubeAtXYZ(x: number, y: number, z: number, v: Block) {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 16 || z >= 16) { return }
        this.voxels[x * 16 * 16 + y * 16 + z] = v
    }

    getCubeAtXYZ(x: number, y: number, z: number): Block {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 16 || z >= 16) { return 0 }
        return this.voxels[x * 16 * 16 + y * 16 + z]
    }
}

class Chunk {
    x: number
    z: number
    isTerrainGenerated: boolean

    constructor(x: number, z: number) {
        this.x = x
        this.z = z
        this.isTerrainGenerated = false
    }
}