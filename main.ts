import * as THREE from 'three';
import { Vector3 } from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

enum Block {
    AIR,
    GRASS,
    STONE
}

class SubChunk {
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

    generateMesh() {
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

        for (let x: number = 0; x < 16; x++) {
            for (let y: number = 0; y < 16; y++) {
                for (let z: number = 0; z < 16; z++) {
                    matrix.makeTranslation(
                        x * 100 + this.chunk.x * 100 * 16,
                        y * 100 + this.y * 100 * 16,
                        z * 100 + this.chunk.z * 100 * 16
                    );

                    let block = this.chunk.getBlockAtXYZ(x, y + 16 * this.y, z)

                    if (block == Block.GRASS) {
                        geometries.push(pxGeometry.clone().applyMatrix4(matrix));
                        geometries.push(nxGeometry.clone().applyMatrix4(matrix));
                        geometries.push(pyGeometry.clone().applyMatrix4(matrix));
                        geometries.push(nyGeometry.clone().applyMatrix4(matrix));
                        geometries.push(pzGeometry.clone().applyMatrix4(matrix));
                        geometries.push(nzGeometry.clone().applyMatrix4(matrix));
                    }
                }
            }
        }

        const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
        geometry.computeBoundingSphere();

        this.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: atlas, side: THREE.DoubleSide }));
    }

    getMesh(): THREE.Mesh | null {
        return this.mesh
    }

    destroy(){

    }
}

class Chunk {
    x: number
    z: number
    isTerrainGenerated: boolean
    subchunks: Array<SubChunk>
    neighbors: Array<Chunk> | null

    constructor(x: number, z: number) {
        this.x = x
        this.z = z
        this.isTerrainGenerated = false
        this.subchunks = new Array(16)
        for (let i: number = 0; i < 16; i++) {
            this.subchunks[i] = new SubChunk(i, this)
        }
        this.neighbors = null
    }

    setBlockAtXYZ(x: number, y: number, z: number, v: Block) {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 256 || z >= 16) { return }
        this.subchunks[Math.floor(y / 16)].setCubeAtXYZ(x, y - 16 * Math.floor(y / 16), z, v)
    }

    getBlockAtXYZ(x: number, y: number, z: number): Block {
        if (x < 0 || y < 0 || z < 0 || x >= 16 || y >= 256 || z >= 16) { return Block.AIR }
        return this.subchunks[Math.floor(y / 16)].getCubeAtXYZ(x, y - 16 * Math.floor(y / 16), z)
    }

    generateTerrain() {
        for (let x: number = 0; x < 16; x++) {
            for (let y: number = 0; y < 256; y++) {
                for (let z: number = 0; z < 16; z++) {

                    this.setBlockAtXYZ(x, y, z, Math.random() < 0.6 ? Block.GRASS : Block.AIR)
                }
            }
        }
        this.isTerrainGenerated = true
    }

    generateMesh() {
        if (!this.isTerrainGenerated) { return }
        for (let scn = 0; scn < this.subchunks.length; scn++) {
            let sc = this.subchunks[scn]
            sc.generateMesh()
            scene.add(sc.getMesh())
        }
    }

    destroy(){
        this.neighbors = []
        for (let scn = 0; scn < this.subchunks.length; scn++) {
            this.subchunks[scn].destroy()
        }
        this.subchunks = []
    }
}

function executeAsync(func: Function) {
    setTimeout(func, 0);
}

let camera: THREE.PerspectiveCamera
let scene: THREE.Scene;
let clock: THREE.Clock;
let controls: FirstPersonControls;
let renderer: THREE.WebGLRenderer;
let matrix: THREE.Matrix4;
let atlas: THREE.Texture;
let container: HTMLElement | null;

let chunks: Chunk[]
let chunksToDestroy: Chunk[]

let playerPosition: Vector3

let renderDistance = 1

function init() {
    container = document.getElementById("container")

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.y = 100

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    matrix = new THREE.Matrix4();

    atlas = new THREE.TextureLoader().load('public/atlas.png');
    atlas.magFilter = THREE.NearestFilter;

    const ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.querySelector("#container")
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;

    window.addEventListener('resize', onWindowResize);

    chunks = []
    chunksToDestroy = []

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    executeAsync(updateChunks)

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function animate() {
    for(let i=0;i<chunksToDestroy.length;i++){chunksToDestroy[i].destroy()}
    chunksToDestroy = []

    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update(clock.getDelta());
    playerPosition = camera.position
    renderer.render(scene, camera)
}

function updateChunks() {
    // Get the players position
    let x = Math.floor(playerPosition.x / 16)
    let z = Math.floor(playerPosition.z / 16)

    // Remove all chunks outside the render distance
    let newC = []
    for(let i=0; i<chunks.length; i++){
        let c = chunks[i]
        if(c.x > x + renderDistance + 1 || c.x < x - renderDistance - 1 ||
           c.z > z + renderDistance + 1 || c.z < z - renderDistance - 1 ){
            chunksToDestroy.push(c)
        }else{
            newC.push(c)
        }
    }

    // Adding chunks to the list that are within the render distance
    for(let i = x- renderDistance; i <= x + renderDistance; i++){
        for(let j = z- renderDistance; j <= z + renderDistance; j++){
            let exists = false
            for(let i=0; i<chunks.length; i++){
                if(chunks[i].x == i && chunks[i].z == j){
                    exists = true
                }
            }
            if(!exists){
                newC.push(new Chunk(i, j))
            }
        }
    }
    chunks = newC

    let chunksToGenerate = []
    for(let i=0; i<chunks.length; i++){
        let c = chunks[i]
        if(!c.isTerrainGenerated){
            let sides: number = 0
            let neighbors: Array<Chunk> = new Array(8)
            for(let j=0; j<chunks.length; j++){
                let s = chunks[j]
                if(s.x==c.x-1 && s.z==c.z-1){ sides++;neighbors[0] = s; }
                if(s.x==c.x && s.z==c.z-1){ sides++;neighbors[1] = s; }
                if(s.x==c.x+1 && s.z==c.z-1){ sides++;neighbors[2] = s; }

                if(s.x==c.x-1 && s.z==c.z){ sides++;neighbors[3] = s; }
                if(s.x==c.x+1 && s.z==c.z){ sides++;neighbors[4] = s; }

                if(s.x==c.x-1 && s.z==c.z+1){ sides++;neighbors[5] = s; }
                if(s.x==c.x && s.z==c.z+1){ sides++;neighbors[6] = s; }
                if(s.x==c.x+1 && s.z==c.z+1){ sides++;neighbors[7] = s; }
            }
            c.neighbors = neighbors
            if(sides == 8) {
                chunksToGenerate.push(c);
            }
        }
    }

    //Sort chunks by distance
    chunksToGenerate.sort(function(a, b){
        let valueA = Math.sqrt(Math.pow(a.x - x, 2) + Math.pow(a.z - z, 2));
        let valueB = Math.sqrt(Math.pow(b.x - x, 2) + Math.pow(b.z - z, 2));
        return valueA - valueB
    })

    //Generate Chunks
    for(let i=0; i<chunksToGenerate.length; i++){
        let c = chunksToGenerate[i]
        if(!c.isTerrainGenerated) c.generateTerrain();
        if(!c.neighbors[0].isTerrainGenerated){ c.neighbors[0].generateTerrain();}
        if(!c.neighbors[1].isTerrainGenerated){ c.neighbors[1].generateTerrain();}
        if(!c.neighbors[2].isTerrainGenerated){ c.neighbors[2].generateTerrain();}
        if(!c.neighbors[3].isTerrainGenerated){ c.neighbors[3].generateTerrain();}
        if(!c.neighbors[4].isTerrainGenerated){ c.neighbors[4].generateTerrain();}
        if(!c.neighbors[5].isTerrainGenerated){ c.neighbors[5].generateTerrain();}
        if(!c.neighbors[6].isTerrainGenerated){ c.neighbors[6].generateTerrain();}
        if(!c.neighbors[7].isTerrainGenerated){ c.neighbors[7].generateTerrain();}
        c.generateMesh(
            c.neighbors[0],
            c.neighbors[1],
            c.neighbors[2],
            c.neighbors[3],
            c.neighbors[4],
            c.neighbors[5],
            c.neighbors[6],
            c.neighbors[7]
        );
    }

}

init()