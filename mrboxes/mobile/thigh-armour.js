import * as THREE from './three.module.js';

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
