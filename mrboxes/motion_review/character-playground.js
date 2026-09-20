import * as THREE from './three.module.js';
import {loadReference} from './reference-loader.js';
import {ReviewLocomotion,FIXED_DT} from './review-locomotion.js';

const $=id=>document.getElementById(id),keys={forward:false,left:false,right:false};
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x172630);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Robot movement area. W walks; A and D turn. Drag to orbit.');document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x172630,27,65);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.05,100);
scene.add(new THREE.HemisphereLight(0xc9e4ff,0x53565c,2.2));
const sun=new THREE.DirectionalLight(0xffecd5,3);sun.position.set(8,14,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.5,far:50});sun.shadow.bias=-.0002;scene.add(sun);
const material=new THREE.MeshStandardMaterial({color:0x46565f,roughness:.94});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),material);floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(40,40,0x7897a7,0x596e7a);grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.45;scene.add(grid);
const pad=new THREE.Mesh(new THREE.RingGeometry(2.8,2.84,96),new THREE.MeshBasicMaterial({color:0x84bcc7,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.y=.004;scene.add(pad);
function box(w,h,d,x,y,z,color){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.7}));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
for(const [x,z] of [[-20,-20],[-20,20],[20,-20],[20,20]]){box(.7,3.2,.7,x,1.6,z,0x263e4c);box(.74,.12,.74,x,2.9,z,0x84c7d6)}
for(const [x,z,w,d] of [[0,-20,40,.15],[0,20,40,.15],[-20,0,.15,40],[20,0,.15,40]])box(w,.13,d,x,.055,z,0x8eafb9);
for(const [name,x,z,color] of [['NORTH',0,19,0x8db5c6],['EAST',19,0,0xc2a373],['SOUTH',0,-19,0x8db5c6],['WEST',-19,0,0xc2a373]]){
 box(1.6,.5,.6,x,.25,z,color);const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#101d28';ctx.fillRect(0,0,512,128);ctx.fillStyle='#d4edf3';ctx.font='500 45px system-ui';ctx.textAlign='center';ctx.fillText(name,256,80);const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c)}));sign.position.set(x,1.4,z);sign.scale.set(2.4,.6,1);scene.add(sign);
}
let orbit=0,drag=null,rig,actor,accumulator=0,last=performance.now();
function clearKeys(){keys.forward=keys.left=keys.right=false}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement)return;const key={KeyW:'forward',KeyA:'left',KeyD:'right'}[e.code];if(key){keys[key]=true;e.preventDefault()}});
window.addEventListener('keyup',e=>{const key={KeyW:'forward',KeyA:'left',KeyD:'right'}[e.code];if(key){keys[key]=false;e.preventDefault()}});
window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX};renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus()});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;orbit+=(e.clientX-drag.x)*.006;drag.x=e.clientX});
renderer.domElement.addEventListener('pointerup',()=>{drag=null});renderer.domElement.addEventListener('pointercancel',()=>{drag=null});
function reset(){clearKeys();rig.reset();accumulator=0;renderer.domElement.focus()}
$('reset').onclick=()=>{if(actor)reset()};
try{const {root}=await loadReference('./game-robot.glb');actor=new THREE.Group();scene.add(actor);root.scale.setScalar(2.6/3.15);actor.add(root);rig=new ReviewLocomotion(actor,root);actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});reset()}catch(e){$('error').textContent='The robot could not load. Refresh to try again.';throw e}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;
 accumulator+=dt;
 while(accumulator>=FIXED_DT){
  // Stop forward travel at the arena boundary; world-space foot anchors stay intact.
  const forward=keys.forward && Math.abs(actor.position.x+Math.sin(rig.yaw)*.1)<18 && Math.abs(actor.position.z+Math.cos(rig.yaw)*.1)<18;
  rig.advance(FIXED_DT,{...keys,forward,left:keys.left&&!keys.right,right:keys.right&&!keys.left});
  accumulator-=FIXED_DT;
 }
 $('status').textContent=rig.phase;
 const target=actor.position.clone().add(new THREE.Vector3(0,1.35,0));camera.position.copy(target).add(new THREE.Vector3(Math.sin(orbit)*6.8,2.0,Math.cos(orbit)*6.8));camera.lookAt(target);renderer.render(scene,camera);
}requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});


