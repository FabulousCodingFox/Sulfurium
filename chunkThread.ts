import { Chunk, getNeighbour } from './chunks.js'
import * as THREE from 'three';

onmessage = (e) => {
    console.log('Message received from main script');
    const workerResult = [updateChunks(
        e.data[0],
        e.data[1],
        e.data[2],
        e.data[3],
        e.data[4],
        e.data[5]
    )]
    console.log('Posting message back to main script');
    postMessage(workerResult);
}

function updateChunks(chunks: Chunk[], scene:THREE.Scene, x: number, z:number, renderDistance: number, seed: number): Chunk[] {
    // Remove all chunks outside the render distance
    let newC: Chunk[] = []
    for(let i=0; i<chunks.length; i++){
        let c = chunks[i]
        if(c.x > x + renderDistance + 1 || c.x < x - renderDistance - 1 ||
           c.z > z + renderDistance + 1 || c.z < z - renderDistance - 1 ){
            c.destroy(scene)
        }else{
            newC.push(c)
        }
    }

    // Adding chunks to the list that are within the render distance
    for(let i = x - renderDistance - 1; i <= x + renderDistance + 1; i++){
        for(let j = z - renderDistance - 1; j <= z + renderDistance + 1; j++){
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

    let chunksToGenerate: Chunk[] = []
    for(let i=0; i<chunks.length; i++){
        let c = chunks[i]
        if(!c.isTerrainGenerated){
            let sides: number = 0
            for(let j=0; j<chunks.length; j++){
                let s = chunks[j]
                if(s.x==c.x-1 && s.z==c.z-1){ sides++; }
                if(s.x==c.x   && s.z==c.z-1){ sides++; }
                if(s.x==c.x+1 && s.z==c.z-1){ sides++; }
                if(s.x==c.x-1 && s.z==c.z)  { sides++; }
                if(s.x==c.x+1 && s.z==c.z)  { sides++; }
                if(s.x==c.x-1 && s.z==c.z+1){ sides++; }
                if(s.x==c.x   && s.z==c.z+1){ sides++; }
                if(s.x==c.x+1 && s.z==c.z+1){ sides++; }
            }
            if(sides >= 8) {
                chunksToGenerate.push(c);
            }
        }
    }

    //Sort chunks by distance
    chunksToGenerate.sort(function(a, b){
        let valueA = Math.sqrt(Math.pow(a.x - x, 2) + Math.pow(a.z - z, 2));
        let valueB = Math.sqrt(Math.pow(b.x - x, 2) + Math.pow(b.z - z, 2));
        return valueB - valueA
    })

    //Generate Chunks
    for(let i=0; i<chunksToGenerate.length; i++){
        let c: Chunk = chunksToGenerate[i]
        if(!c.isTerrainGenerated) c.generateTerrain(seed);
        if(!getNeighbour(chunks, this.x - 1, this.x - 1).isTerrainGenerated){ getNeighbour(chunks, this.x - 1, this.x - 1).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x + 0, this.x - 1).isTerrainGenerated){ getNeighbour(chunks, this.x + 0, this.x - 1).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x + 1, this.x - 1).isTerrainGenerated){ getNeighbour(chunks, this.x + 1, this.x - 1).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x - 1, this.x + 0).isTerrainGenerated){ getNeighbour(chunks, this.x - 1, this.x + 0).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x + 1, this.x + 0).isTerrainGenerated){ getNeighbour(chunks, this.x + 1, this.x + 0).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x - 1, this.x + 1).isTerrainGenerated){ getNeighbour(chunks, this.x - 1, this.x + 1).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x + 0, this.x + 1).isTerrainGenerated){ getNeighbour(chunks, this.x + 0, this.x + 1).generateTerrain(seed);}
        if(!getNeighbour(chunks, this.x + 1, this.x + 1).isTerrainGenerated){ getNeighbour(chunks, this.x + 1, this.x + 1).generateTerrain(seed);}
        c.generateMesh(chunks, scene);
    }

    return chunks
}

