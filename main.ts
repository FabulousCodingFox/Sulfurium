import * as THREE from 'three';
import { Vector3 } from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { Chunk } from './chunks.js'

let camera: THREE.PerspectiveCamera
let scene: THREE.Scene;
let clock: THREE.Clock;
let controls: FirstPersonControls;
let renderer: THREE.WebGLRenderer;
let atlas: THREE.Texture;
let container: HTMLElement | null;

let chunks: Chunk[]

let playerPosition: Vector3
let prevPlayerPosition: Vector3

let renderDistance = 6

let seed = Math.random()

let chunkThread: Worker = new Worker("chunkThread.ts", { type: "module" });

let isChunkThreadActive: boolean = false
let shouldChunkThreadRunAgain: boolean = false

function init() {
    container = document.getElementById("container")

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.y = 100 * 100

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    atlas = new THREE.TextureLoader().load('public/atlas.png');
    atlas.magFilter = THREE.NearestFilter;

    const ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("container")
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 1000;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;

    window.addEventListener('resize', onWindowResize);

    chunks = []

    playerPosition = camera.position.clone().divide(new THREE.Vector3(100, 100, 100))
    prevPlayerPosition = camera.position.clone().divide(new THREE.Vector3(100, 100, 100))

    /*let cMain = new Chunk(0, 0)
    cMain.generateTerrain()
    cMain.generateMesh()*/

    chunkThread.onmessage = (e) => {
        chunks = e.data[0]
        isChunkThreadActive = false
    }

    updateChunks()

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

function animate() {
    console.log(Math.floor(playerPosition.x / 100 / 16) + " " + Math.floor(playerPosition.z / 100 / 16))

    if(!isChunkThreadActive && shouldChunkThreadRunAgain){
        updateChunks()
    }

    if(Math.floor(playerPosition.x / 100 / 16) != Math.floor(prevPlayerPosition.x / 100 / 16) || Math.floor(playerPosition.z / 100 / 16) != Math.floor(prevPlayerPosition.z / 100 / 16)){
        if(isChunkThreadActive){
            shouldChunkThreadRunAgain = true
        }else{
            updateChunks()
        }
    }
    
    prevPlayerPosition = playerPosition.clone()

    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update(clock.getDelta());
    playerPosition = camera.position
    renderer.render(scene, camera)
}

function updateChunks(){
    isChunkThreadActive = true
    shouldChunkThreadRunAgain = false

    "chunks: Chunk[], scene:THREE.Scene, x: number, z:number, renderDistance: number, seed: number"

    chunkThread.postMessage([
        chunks,
        scene,
        Math.floor(playerPosition.x / 100 / 16),
        Math.floor(playerPosition.z / 100 / 16),
        renderDistance,
        seed
    ])
}

init()