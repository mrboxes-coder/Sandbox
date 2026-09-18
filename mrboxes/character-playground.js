import * as THREE from './three.module.js';
import {loadReference} from './reference-loader.js';
import {prepareRobotMotion,updateRobotMotion,poseCharacterFeet,updateCharacterTurn} from './character-motion.js';
import {CharacterController} from './character-controller.js';
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
let orbit=0,drag=null,controller=new CharacterController(),motion,actor,turnFeet,restFeet=null,turnStep=-1,stepStart,stepEnd,time=0,last=performance.now();
function clearKeys(){keys.forward=keys.left=keys.right=false}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement)return;const key={KeyW:'forward',KeyA:'left',KeyD:'right'}[e.code];if(key){keys[key]=true;e.preventDefault()}});
window.addEventListener('keyup',e=>{const key={KeyW:'forward',KeyA:'left',KeyD:'right'}[e.code];if(key){keys[key]=false;e.preventDefault()}});
window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX};renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus()});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;orbit+=(e.clientX-drag.x)*.006;drag.x=e.clientX});
renderer.domElement.addEventListener('pointerup',()=>{drag=null});renderer.domElement.addEventListener('pointercancel',()=>{drag=null});
const ease=t=>t*t*t*(t*(t*6-15)+10);
function captureFeet(){motion.raw.updateWorldMatrix(true,true);return motion.feet.map(f=>({position:motion.raw.localToWorld(new THREE.Vector3(f.x,0,f.z-.018)),yaw:controller.yaw+f.yaw}))}
function plantRestFeet(){
 actor.updateMatrixWorld(true);
 const feet=restFeet.map(f=>{const p=motion.raw.worldToLocal(f.position.clone());return {x:p.x,z:p.z+.018,lift:0,pitch:0,toe:0,yaw:f.yaw-controller.yaw}});
 poseCharacterFeet(motion,feet);
}
function turnPose(action,dt){
 if(action.serial!==turnStep){
  turnStep=action.serial;stepStart={position:turnFeet[action.foot].position.clone(),yaw:turnFeet[action.foot].yaw};
  const endYaw=controller.turn?controller.turn.startYaw+action.direction*Math.PI/6:action.yaw;
  const local=new THREE.Vector3((action.foot===0?-1:1)*.112*motion.scale,0,-.018*motion.scale).applyAxisAngle(new THREE.Vector3(0,1,0),endYaw).add(actor.position);
  stepEnd={position:local,yaw:endYaw+(action.foot===0?.06:-.06)};
 }
 // Re-plan the landing ahead of the moving body; the supporting foot stays
 // fixed in world space while W carries the character through the turn.
 const remaining=(1-action.u)*controller.stepDuration;
 const travel=controller.speed*(remaining+controller.stepDuration*.45);
 const landing=new THREE.Vector3((action.foot===0?-1:1)*.112*motion.scale,0,-.018*motion.scale+travel).applyAxisAngle(new THREE.Vector3(0,1,0),stepEnd.yaw-(action.foot===0?.06:-.06)).add(actor.position);
 stepEnd.position.copy(landing);
 const u=action.u,t=ease(u),f=turnFeet[action.foot];f.position.copy(stepStart.position).lerp(stepEnd.position,t);f.yaw=THREE.MathUtils.lerp(stepStart.yaw,stepEnd.yaw,t);
 updateCharacterTurn(motion,dt,action.foot,u,action.distance,action.serial);
 actor.updateMatrixWorld(true);
 const feet=turnFeet.map((f,i)=>{const p=motion.raw.worldToLocal(f.position.clone());return {x:p.x,z:p.z+.018,lift:i===action.foot?.037*Math.pow(Math.sin(Math.PI*u),2):0,pitch:i===action.foot?-.10*Math.sin(Math.PI*u):0,toe:0,yaw:f.yaw-action.yaw}});
 poseCharacterFeet(motion,feet);
}
function reset(){clearKeys();controller=new CharacterController();actor.position.set(0,0,0);actor.rotation.y=0;motion.state='idle';motion.amount=0;motion.cycle=0;motion.idleTime=1;motion.springs={};updateRobotMotion(motion,0,0,time);turnFeet=null;restFeet=null;turnStep=-1;renderer.domElement.focus()}
$('reset').onclick=()=>{if(actor)reset()};
try{const {root}=await loadReference('./game-robot.glb');actor=new THREE.Group();scene.add(actor);root.scale.setScalar(2.6/3.15);actor.add(root);motion=prepareRobotMotion(root);actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});reset()}catch(e){$('error').textContent='The robot could not load. Refresh to try again.';throw e}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;time+=dt;
 const wasTurning=!!controller.turn;
 // Capture contact positions before rotating the actor into the next step.
 if(!wasTurning&&(keys.left!==keys.right))turnFeet=captureFeet();
 const action=controller.advance(dt,keys);actor.rotation.y=action.yaw;
 const previous=actor.position.clone();actor.position.x=THREE.MathUtils.clamp(actor.position.x+Math.sin(action.yaw)*action.distance,-18,18);actor.position.z=THREE.MathUtils.clamp(actor.position.z+Math.cos(action.yaw)*action.distance,-18,18);
 if(action.kind==='turn'){
  restFeet=null;
  turnPose(action,dt);
  // Every turn step has already landed. Do not run the walking stop's
  // recovery/repositioning steps over those same contacts a second time.
  if(action.finished&&!keys.forward)restFeet=turnFeet.map(f=>({position:f.position.clone(),yaw:f.yaw}));
  $('status').textContent=(action.distance>0?'Walking + ':'')+(action.direction===1?'Turning left':'Turning right')+' · '+(action.foot===0?'Left':'Right')+' foot · Step '+(action.step+1)+' / 3';
 }else{
  if(keys.forward)restFeet=null;
  updateRobotMotion(motion,dt,actor.position.distanceTo(previous),time);
  if(restFeet)plantRestFeet();
  $('status').textContent=motion.state==='walk'?'Walking':motion.state==='settle'?'Settling to rest':'At rest · looking around';
 }
 const target=actor.position.clone().add(new THREE.Vector3(0,1.35,0));camera.position.copy(target).add(new THREE.Vector3(Math.sin(orbit)*6.8,2.0,Math.cos(orbit)*6.8));camera.lookAt(target);renderer.render(scene,camera);
}requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

