import * as THREE from '../vendor/three.module.js';

// GLB loading and model-specific rig preparation.
// Reader for the uncompressed static GLB assets used in this review.
export async function loadReference(url,skipTextures=false){
 const response=await fetch(url);if(!response.ok)throw Error('Model download failed: '+response.status);
 const bytes=await response.arrayBuffer(),dv=new DataView(bytes);if(dv.getUint32(0,true)!==0x46546c67)throw Error('Invalid GLB');
 let json,bin;for(let off=12;off<bytes.byteLength;){const n=dv.getUint32(off,true),kind=dv.getUint32(off+4,true);if(kind===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,off+8,n)));if(kind===0x004e4942)bin=bytes.slice(off+8,off+8+n);off+=8+n;}
 const types={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array};const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 function attribute(i){const a=json.accessors[i],v=json.bufferViews[a.bufferView],Ctor=types[a.componentType],width=widths[a.type];if(!Ctor||!width)throw Error('Unsupported attribute');const start=(v.byteOffset||0)+(a.byteOffset||0);let array;if(v.byteStride&&v.byteStride!==Ctor.BYTES_PER_ELEMENT*width){array=new Ctor(a.count*width);for(let k=0;k<a.count;k++)array.set(new Ctor(bin,start+k*v.byteStride,width),k*width)}else array=new Ctor(bin,start,a.count*width);return new THREE.BufferAttribute(array,width,!!a.normalized)}
 const textures=[];
 if(!skipTextures)for(const tex of json.textures||[]){const im=json.images[tex.source],v=json.bufferViews[im.bufferView];const blob=new Blob([bin.slice(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)],{type:im.mimeType});const uri=URL.createObjectURL(blob);try{const texture=await new THREE.TextureLoader().loadAsync(uri);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture)}finally{URL.revokeObjectURL(uri)}}
 const materials=(json.materials||[{}]).map(m=>{const p=m.pbrMetallicRoughness||{},c=p.baseColorFactor||[1,1,1,1];return new THREE.MeshStandardMaterial({color:new THREE.Color(c[0],c[1],c[2]),map:textures[p.baseColorTexture?.index]||null,metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide})});
 let triangles=0;const nodes=json.nodes.map(n=>{const g=new THREE.Group();g.name=n.name||'Robot';if(n.matrix){g.matrix.fromArray(n.matrix);g.matrix.decompose(g.position,g.quaternion,g.scale)}else{if(n.translation)g.position.fromArray(n.translation);if(n.rotation)g.quaternion.fromArray(n.rotation);if(n.scale)g.scale.fromArray(n.scale)}if(n.mesh!==undefined)for(const p of json.meshes[n.mesh].primitives){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',attribute(p.attributes.POSITION));if(p.attributes.TEXCOORD_0!==undefined)geometry.setAttribute('uv',attribute(p.attributes.TEXCOORD_0));if(p.attributes.NORMAL!==undefined)geometry.setAttribute('normal',attribute(p.attributes.NORMAL));if(p.indices!==undefined)geometry.setIndex(attribute(p.indices));if(!geometry.attributes.normal)geometry.computeVertexNormals();triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;g.add(new THREE.Mesh(geometry,materials[p.material??0]));}return g});
 json.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));const root=new THREE.Group();for(const i of json.scenes[json.scene||0].nodes)root.add(nodes[i]);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3.15/size.y;
 const fitted=new THREE.Group();root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);root.scale.setScalar(scale);fitted.add(root);return {root:fitted,materials,triangles};
}

// The source GLB merges the +X rear thigh plate into waist part 12.
// Its -X counterpart (part 20) is already a separate thigh-mounted plate.
// Use that counterpart's mirrored rest-space bounds to separate the plate,
// retaining its original vertices, UVs, normals, material and rest placement.
export function attachThighArmour(body,thigh){
 if(body.getObjectByName('ThighArmourR'))return;
 const waist=body.getObjectByName('tripo_part_12');
 const reference=body.getObjectByName('tripo_part_20');
 body.updateMatrixWorld(true);
 const inverse=body.matrixWorld.clone().invert();
 const bounds=new THREE.Box3();
 reference.traverse(mesh=>{if(!mesh.isMesh)return;const matrix=inverse.clone().multiply(mesh.matrixWorld),p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));});
 const xMin=bounds.min.x;bounds.min.x=-bounds.max.x;bounds.max.x=-xMin;
 bounds.expandByScalar(.008); // Small source-model asymmetry, in fitted model units.
 for(const mesh of [...waist.children]){
  if(!mesh.isMesh)continue;
  const source=mesh.geometry.toNonIndexed(),p=source.attributes.position;
  const matrix=inverse.clone().multiply(mesh.matrixWorld),plate=[],rest=[];
  for(let i=0;i<p.count;i+=3){
   const center=new THREE.Vector3();
   for(let j=0;j<3;j++)center.add(new THREE.Vector3().fromBufferAttribute(p,i+j));
   center.multiplyScalar(1/3).applyMatrix4(matrix);
   (bounds.containsPoint(center)?plate:rest).push(i,i+1,i+2);
  }
  if(!plate.length||!rest.length){source.dispose();throw Error('Unable to isolate thigh armour from waist');}
  function subset(indices){const geometry=new THREE.BufferGeometry();for(const [name,attribute] of Object.entries(source.attributes)){const array=new attribute.array.constructor(indices.length*attribute.itemSize);indices.forEach((index,i)=>{for(let c=0;c<attribute.itemSize;c++)array[i*attribute.itemSize+c]=attribute.array[index*attribute.itemSize+c];});geometry.setAttribute(name,new THREE.BufferAttribute(array,attribute.itemSize,attribute.normalized));}geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;}
  const armour=new THREE.Mesh(subset(plate),mesh.material);armour.name='ThighArmourR';armour.position.copy(mesh.position);armour.quaternion.copy(mesh.quaternion);armour.scale.copy(mesh.scale);mesh.parent.add(armour);
  const old=mesh.geometry;mesh.geometry=subset(rest);old.dispose();source.dispose();
  body.updateMatrixWorld(true);thigh.attach(armour);
 }
}
