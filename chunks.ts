import * as THREE from 'three';
import * as NOISE from 'noisejs'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export enum Block {
    AIR,
    GRASS,
    STONE
}

export class SubChunk {
    y: number
    isMeshGenerated: boolean
    voxels: Array<Block>
    mesh: THREE.Mesh | null
    chunk: Chunk

    constructor(y: number, c: Chunk) {
        this.y = y
        this.isMeshGenerated = false
        this.voxels = new Array(16 * 16 * 16)
        this.mesh = null
        this.chunk = c
    }

    setCubeAtXYZ(x: number, y: number, z: number, v: Block) {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 16 || z >= 16) { return }
        this.voxels[x * 16 * 16 + y * 16 + z] = v
    }

    getCubeAtXYZ(x: number, y: number, z: number): Block {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 16 || z >= 16) { return 0 }
        return this.voxels[x * 16 * 16 + y * 16 + z]
    }

    generateMesh(chunks: Chunk[], scene: THREE.Scene) {
        let pxGeometry = new THREE.PlaneGeometry(100, 100);
        pxGeometry.attributes.uv.array[1] = 0.5;
        pxGeometry.attributes.uv.array[3] = 0.5;
        pxGeometry.rotateY(Math.PI / 2);
        pxGeometry.translate(50, 0, 0);

        let nxGeometry = new THREE.PlaneGeometry(100, 100);
        nxGeometry.attributes.uv.array[1] = 0.5;
        nxGeometry.attributes.uv.array[3] = 0.5;
        nxGeometry.rotateY(-Math.PI / 2);
        nxGeometry.translate(-50, 0, 0);

        let pyGeometry = new THREE.PlaneGeometry(100, 100);
        pyGeometry.attributes.uv.array[5] = 0.5;
        pyGeometry.attributes.uv.array[7] = 0.5;
        pyGeometry.rotateX(-Math.PI / 2);
        pyGeometry.translate(0, 50, 0);

        let nyGeometry = new THREE.PlaneGeometry(100, 100);
        nyGeometry.attributes.uv.array[5] = 0.5;
        nyGeometry.attributes.uv.array[7] = 0.5;
        nyGeometry.rotateX(Math.PI / 2);
        nyGeometry.translate(0, -50, 0);

        let pzGeometry = new THREE.PlaneGeometry(100, 100);
        pzGeometry.attributes.uv.array[1] = 0.5;
        pzGeometry.attributes.uv.array[3] = 0.5;
        pzGeometry.translate(0, 0, 50);

        let nzGeometry = new THREE.PlaneGeometry(100, 100);
        nzGeometry.attributes.uv.array[1] = 0.5;
        nzGeometry.attributes.uv.array[3] = 0.5;
        nzGeometry.rotateY(Math.PI);
        nzGeometry.translate(0, 0, -50);

        const geometries = [];

        let matrix = new THREE.Matrix4();

        for (let x: number = 0; x < 16; x++) {
            for (let y: number = 0; y < 16; y++) {
                for (let z: number = 0; z < 16; z++) {
                    let block = this.chunk.getBlockAtXYZ(x, y + 16 * this.y, z)

                    if (block == Block.GRASS) {
                        matrix.makeTranslation(
                            x * 100 + this.chunk.x * 100 * 16,
                            y * 100 + this.y * 100 * 16,
                            z * 100 + this.chunk.z * 100 * 16
                        );

                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x+1, y+this.y*16, z) == Block.AIR) geometries.push(pxGeometry.clone().applyMatrix4(matrix));
                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x-1, y+this.y*16, z) == Block.AIR) geometries.push(nxGeometry.clone().applyMatrix4(matrix));
                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x, y+this.y*16+1, z) == Block.AIR) geometries.push(pyGeometry.clone().applyMatrix4(matrix));
                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x, y+this.y*16-1, z) == Block.AIR) geometries.push(nyGeometry.clone().applyMatrix4(matrix));
                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x, y+this.y*16, z+1) == Block.AIR) geometries.push(pzGeometry.clone().applyMatrix4(matrix));
                        if(this.chunk.getNeigbourBlockAtXYZ(chunks, x, y+this.y*16, z-1) == Block.AIR) geometries.push(nzGeometry.clone().applyMatrix4(matrix));
                    }
                }
            }
        }

        if(geometries.length != 0){
            const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
            geometry.computeBoundingSphere();
            if(this.mesh != null) scene.remove(this.mesh)
            this.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: atlas, side: THREE.DoubleSide }));
            scene.add(this.mesh)
        }else{
            this.mesh = null
        }
    }

    getMesh(): THREE.Mesh | null {
        return this.mesh
    }

    destroy(scene: THREE.Scene){
        if(this.mesh != null){
            scene.remove(this.mesh)
            this.mesh.remove()
        }
    }
}

export class Chunk {
    x: number
    z: number
    isTerrainGenerated: boolean
    subchunks: Array<SubChunk>

    constructor(x: number, z: number) {
        this.x = x
        this.z = z
        this.isTerrainGenerated = false
        this.subchunks = new Array(16)
        for (let i: number = 0; i < 16; i++) {
            this.subchunks[i] = new SubChunk(i, this)
        }
    }

    setBlockAtXYZ(x: number, y: number, z: number, v: Block) {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 256 || z >= 16) { return }
        this.subchunks[Math.floor(y / 16)].setCubeAtXYZ(x, y - 16 * Math.floor(y / 16), z, v)
    }

    getBlockAtXYZ(x: number, y: number, z: number): Block {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 256 || z >= 16) { return Block.AIR }
        return this.subchunks[Math.floor(y / 16)].getCubeAtXYZ(x, y - 16 * Math.floor(y / 16), z)
    }

    getNeigbourBlockAtXYZ(chunks: Chunk[], x: number, y: number, z: number): Block{
        if(y < 0) return Block.STONE
        if(y >= 256) return Block.AIR

        if(x >= 0 && x < 16 && z >= 0 && z < 16) return this.getBlockAtXYZ(x, y, z);
        if(x < 0 && z < 0)              return getNeighbour(chunks, this.x - 1, this.z - 1).getBlockAtXYZ(x+16, y, z+16); // If in CHunk "c0": x<0 && z<0
        if(x >= 0 && x < 16 && z < 0)   return getNeighbour(chunks, this.x + 0, this.z - 1).getBlockAtXYZ(x, y, z+16);    // If in CHunk "c1": 0>=x<16 && z<0
        if(x >= 16 && z < 0)            return getNeighbour(chunks, this.x + 1, this.z - 1).getBlockAtXYZ(x-16, y, z+16); // If in CHunk "c2": x>=16 && z<0
        if(x < 0 && z >= 0 && z < 16)   return getNeighbour(chunks, this.x - 1, this.z + 0).getBlockAtXYZ(x+16, y, z);    // If in CHunk "c3": x<0 && 0>=z<16
        if(x >= 16 && z >= 0 && z < 16) return getNeighbour(chunks, this.x + 1, this.z + 0).getBlockAtXYZ(x-16, y, z);    // If in CHunk "c4": x>=16 && 0>=z<16
        if(x < 0 && z >= 16)            return getNeighbour(chunks, this.x - 1, this.z + 1).getBlockAtXYZ(x+16, y, z-16); // If in CHunk "c5"
        if(x >= 0 && x < 16 && z >= 16) return getNeighbour(chunks, this.x + 0, this.z + 1).getBlockAtXYZ(x, y, z-16);    // If in CHunk "c6"
        if(x >= 16 && z >= 16)          return getNeighbour(chunks, this.x + 1, this.z + 1).getBlockAtXYZ(x-16, y, z-16); // If in CHunk "c7"
        
        return Block.AIR
    }

    generateTerrain(seed: number) {
        for (let x: number = 0; x < 16; x++) {
            for (let y: number = 0; y < 256; y++) {
                for (let z: number = 0; z < 16; z++) {
                    let height = Math.abs(new NOISE.Noise(seed).perlin2(
                        (x + (this.x * 16)) / 30,
                        (z + (this.z * 16)) / 30)
                    ) * 20 + 90
                    this.setBlockAtXYZ(x, y, z, y < height ? Block.GRASS : Block.AIR)
                }
            }
        }
        this.isTerrainGenerated = true
    }

    generateMesh(chunks: Chunk[], scene: THREE.Scene) {
        if (!this.isTerrainGenerated) { return }
        for (let scn = 0; scn < this.subchunks.length; scn++) {
            let sc = this.subchunks[scn]
            sc.generateMesh(chunks, scene)
        }
    }

    destroy(scene: THREE.Scene){
        for (let scn = 0; scn < this.subchunks.length; scn++) {
            this.subchunks[scn].destroy(scene)
        }
        this.subchunks = []
    }
}

export function getNeighbour(chunks: Chunk[], px: number, pz: number): Chunk | null{
    for(let i=0;i<chunks.length;i++){
        if(px == chunks[i].x && pz == chunks[i].z) return chunks[i]
    }
    return null
}