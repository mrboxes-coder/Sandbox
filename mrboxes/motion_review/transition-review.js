import * as THREE from './three.module.js';
import {loadReference} from './reference-loader.js';
import {ReviewLocomotion,FIXED_DT,DURATION,sequenceInput} from './review-locomotion.js';
import {reviewSequence} from './review-sequences.js';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x172630);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Robot transition review scene. Drag to orbit.');document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x172630,24,65);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.05,100);
scene.add(new THREE.HemisphereLight(0xc9e4ff,0x53565c,2.2));const sun=new THREE.DirectionalLight(0xffecd5,3);sun.position.set(8,14,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.5,far:50});sun.shadow.bias=-.0002;scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x46565f,roughness:.94}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(40,40,0x7897a7,0x596e7a);grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.42;scene.add(grid);
const actor=new THREE.Group();scene.add(actor);const overlays=new THREE.Group();scene.add(overlays);
function marker(radius,color){const o=new THREE.Mesh(new THREE.RingGeometry(radius*.70,radius,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false}));o.rotation.x=-Math.PI/2;o.renderOrder=5;overlays.add(o);return o;}
const footMarkers=[marker(.20,0x70e2b0),marker(.20,0x70e2b0)],pelvisMarker=marker(.07,0x73c7ff),supportMarker=marker(.065,0xe9e6c2);
const balanceLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0x73c7ff,depthTest:false}));overlays.add(balanceLine);
let rig,frameNumber=0,paused=false,accumulator=0,last=performance.now(),orbit=0,drag=null;
let study=reviewSequence(),totalFrames=study.frames;
function tick(){if(frameNumber>=totalFrames)return;rig.advance(FIXED_DT,study.input(frameNumber));frameNumber++;}
function seek(frame){rig.reset(study.direction);frameNumber=0;accumulator=0;for(let i=0;i<frame;i++)tick();paint();}
function setPaused(value){paused=value;accumulator=0;$('play').textContent=paused?'Play':'Pause';$('play').setAttribute('aria-label',paused?'Play animation':'Pause animation');}
$('play').onclick=()=>setPaused(!paused);
$('replay').onclick=()=>{if(rig){seek(0);setPaused(false);}};
$('step').onclick=()=>{if(rig){setPaused(true);tick();paint();}};
$('back').onclick=()=>{if(rig){setPaused(true);seek(Math.max(0,frameNumber-1));}};
$('timeline').oninput=()=>{if(rig){setPaused(true);seek(Number($('timeline').value));}};
function configureStudy(){
 study=reviewSequence($('study').value,Number($('sequence').value),Number($('direction').value));totalFrames=study.frames;
 $('timeline').max=totalFrames;$('sequence-title').textContent=study.title;$('sequence-note').textContent=study.hint;
 $('direction').disabled=$('study').value.startsWith('mixed');$('sequence').disabled=$('study').value!=='approved';
 const stages=document.querySelector('.stages');stages.replaceChildren();stages.style.gridTemplateColumns=study.stages.slice(0,-1).map((s,i)=>(study.stages[i+1][0]-s[0])+'fr').join(' ');
 for(const stage of study.stages.slice(0,-1)){const item=document.createElement('span');item.textContent=stage[1];stages.appendChild(item);}
 if(rig)seek(0);
}
$('study').onchange=configureStudy;$('sequence').onchange=configureStudy;$('direction').onchange=configureStudy;
$('view').onchange=()=>{orbit=Number($('view').value);paint();};
$('markers').onchange=()=>{overlays.visible=$('markers').checked;paint();};
window.addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();setPaused(!paused);}if(e.code==='ArrowRight'){e.preventDefault();$('step').click();}if(e.code==='ArrowLeft'){e.preventDefault();$('back').click();}});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX};renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;orbit+=(e.clientX-drag.x)*.006;drag.x=e.clientX;});
renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;});
function paint(){
 if(!rig)return;
 const m=rig.motion;m.raw.updateWorldMatrix(true,true);
 for(let i=0;i<2;i++){
  const p=m.ankles[i].getWorldPosition(new THREE.Vector3());footMarkers[i].position.set(p.x,.018,p.z);footMarkers[i].material.color.setHex(rig.actualContacts[i]?0x70e2b0:0xffc574);
 }
 const pelvis=m.pelvis.getWorldPosition(new THREE.Vector3());pelvisMarker.position.set(pelvis.x,.023,pelvis.z);
 const support=rig.feet[0].position.clone().multiplyScalar(rig.weights[0]).addScaledVector(rig.feet[1].position,rig.weights[1]);support.y=.024;supportMarker.position.copy(support);
 balanceLine.geometry.setFromPoints([pelvisMarker.position,support]);
 const input=study.input(Math.max(0,frameNumber-1));$('input-state').textContent='Keys: '+([input.forward?'W':'',input.left?'A':'',input.right?'D':''].filter(Boolean).join(' + ')||'released');
 $('phase').textContent=rig.phase;
 $('support').textContent=rig.actualContacts.map((c,i)=>(i===0?'L':'R')+': '+(c?'contact':'air')).join('  /  ');
 $('balance').textContent='Support target: L '+Math.round(rig.weights[0]*100)+'% · R '+Math.round(rig.weights[1]*100)+'%';
 $('time').textContent=(frameNumber*FIXED_DT).toFixed(2)+' s / '+(totalFrames*FIXED_DT).toFixed(2)+' s';$('frame-count').textContent='Frame '+frameNumber;$('timeline').value=frameNumber;
 const target=actor.position.clone().add(new THREE.Vector3(0,1.30,0));
 // Offset framing to leave room for the review controls on the left.
 const right=new THREE.Vector3(Math.cos(orbit),0,-Math.sin(orbit));target.addScaledVector(right,-.85);
 camera.position.copy(target).add(new THREE.Vector3(Math.sin(orbit)*7.3,2,Math.cos(orbit)*7.3));camera.lookAt(target);renderer.render(scene,camera);
}
try{const {root}=await loadReference('./game-robot.glb');root.scale.setScalar(2.6/3.15);actor.add(root);actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});rig=new ReviewLocomotion(actor,root);paint();}catch(e){$('error').textContent='Unable to load the robot: '+e.message;}
function render(now){const elapsed=Math.min(.1,(now-last)/1000);last=now;if(rig&&!paused&&!document.hidden){accumulator+=elapsed*Number($('speed').value);while(accumulator>=FIXED_DT){if(frameNumber>=totalFrames){if($('loop').checked){seek(0);break;}setPaused(true);break;}tick();accumulator-=FIXED_DT;}}paint();requestAnimationFrame(render);}requestAnimationFrame(render);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);paint();});

