import * as THREE from '../vendor/three.module.js';
import {loadReference} from './robot.js';
import {ReviewLocomotion,FIXED_DT} from './animation.js';
import {MobileController} from './controls.js';
import {FIELDS,settings,saveSettings,DEFAULTS} from './settings.js';

// Repeatable keyboard and mobile studies.
// All events use simulation frames, independent of playback speed.
export function reviewSequence(id='approved',offset=0,direction=1){
 const side=direction===1?'Left':'Right';
 let stages,title,hint;
 if(id==='pelvis-walk'){
  stages=[[0,'Rest',''],[60,'Straight walk','W'],[412,'Settle',''],[600,'End','']];
  title='Straight walk · pelvis rise and tilt';
  hint='Front: lifted-leg hip rises, supporting hip drops; chest counters one frame later. Side: pelvis rises with the step and lowers at contact. This motion also applies to the other studies and turns.';
 }else if(id==='approved'){
  stages=[[0,'Rest',''],[60,'Walk','W'],[Math.round((3.25+offset)*60),side+' turn',direction===1?'WA':'WD'],[Math.round((5.45+offset)*60),'Walk','W'],[480,'Settle',''],[630,'End','']];
  title='Walk → '+side.toLowerCase()+' turn → walk';hint='Approved single-turn sequence.';
 }else if(id.startsWith('walk-stop-')){
  const release={'walk-stop-first-lift':80,'walk-stop-first-land':96,'walk-stop-second-lift':124,'walk-stop-second-land':140}[id];
  stages=[[0,'Rest',''],[60,'Walk','W'],[release,'Release / settle',''],[release+210,'End','']];
  title='Walk → rest · '+(id.includes('first')?'first':'opposite')+' foot '+(id.endsWith('lift')?'lifting':'descending');
  hint='Release W at frame '+release+'. Compare the support leg, landing and final weight transfer. Direction mirrors the starting foot.';
 }else if(id.startsWith('turn-stop')){
  const release={'turn-stop-early':286,'turn-stop-late':318}[id]??302;
  stages=[[0,'Rest',''],[60,'Walk','W'],[195,side+' turn',direction===1?'WA':'WD'],[release,'Release all',''],[510,'End','']];
  title='Walk → '+side.toLowerCase()+' turn → settle';hint='All keys released at frame '+release+'. The current foot finishes landing. Compare early, middle and late releases.';
 }else if(id==='reverse-turn'){
  const opposite=direction===1?'Right':'Left';
  stages=[[0,'Rest',''],[60,'Walk','W'],[195,side+' turn',direction===1?'WA':'WD'],[302,opposite+' requested',direction===1?'WD':'WA'],[434,'Walk','W'],[540,'Settle',''],[750,'End','']];
  title=side+' → '+opposite.toLowerCase()+' · direct steering reversal';
  hint='At frame 302, steering reverses while W stays held. Inspect the head lead, body rotation and the next foot placement. Direction swaps the order.';
 }else if(id.startsWith('settle-restart')){
  const restart=id==='settle-restart-early'?333:360;
  stages=[[0,'Rest',''],[60,'Walk','W'],[302,'Release / settle',''],[restart,'Resume W','W'],[510,'Settle',''],[720,'End','']];
  title='Walk → interrupted settle → walk → rest';
  hint='Release W at frame 302; resume at frame '+restart+(id.endsWith('early')?' before the closing half-step lifts.':' during the closing half-step.')+' Inspect continuity as walking resumes.';
 }else{
  const release={mixed:786,'mixed-early':774,'mixed-late':802}[id]??786;
  stages=[[0,'Rest',''],[60,'Walk','W'],[195,'Left','WA'],[327,'Walk','W'],[420,'Right','WD'],[552,'Walk','W'],[710,'Partial left','WA'],[release,'Walk','W'],[960,'Settle',''],[1140,'End','']];
  title='Walk → left → walk → right → walk → partial left → walk → settle';
  hint='A released at frame '+release+' ('+(id==='mixed-early'?'just after lift-off':id==='mixed-late'?'just before landing':'mid-step')+'); W stays held. All keys released at frame 960.';
 }
 const frames=stages.at(-1)[0];
 return {frames,title,hint,stages,direction:id.startsWith('mixed')?1:direction,input(frame){
  let stage=stages[0];for(const candidate of stages){if(candidate[0]>frame)break;stage=candidate;}
  return {forward:stage[2].includes('W'),left:stage[2].includes('A'),right:stage[2].includes('D')};
 }};
}

export function mobileStudy(id='mobile-reversal',direction=1){
 const controller=new MobileController();
 const release=id==='mobile-release';
 const circle=id==='mobile-circle';
 const stages=release?[[0,'Rest'],[60,'Walk'],[180,'Reverse'],[230,'Release'],[380,'Forward again'],[480,'Settle'],[660,'End']]:[[0,'Rest'],[60,'Walk'],[180,circle?'360° sweep':'Reverse'],[540,'Release'],[750,'End']];
 return {mobile:true,direction,frames:stages.at(-1)[0],stages,title:circle?'Mobile · continuous 360° sweep':release?'Mobile · release mid-pivot and restart':'Mobile · walk → 180° pivot → walk',hint:'Uses the same analogue controller and animation settings as the Playground. Change turn direction to mirror the sweep. The release study stops yaw immediately, lands the current foot, and settles.',reset(){controller.reset();},input(frame,yaw=0){
  let x=0,y=0;
  if(frame>=60&&frame<180)y=1;
  if(circle&&frame>=180&&frame<540){const angle=(frame-180)/360*Math.PI*2;x=-direction*Math.sin(angle);y=Math.cos(angle);}
  else if(!circle&&frame>=180&&frame<(release?230:540)){x=direction*-.00001;y=-1;if(frame===180)controller.sweep=direction;}
  if(release&&frame>=380&&frame<480)y=1;
  return controller.sample(x,y,yaw,1/60);
 }};
}

// Settings editor.
export function mountTuning(onChange){
 const box=document.getElementById('tuning-fields'),message=document.getElementById('tuning-status');
 for(const [name,[title,min,max,step]] of Object.entries(FIELDS)){
  const label=document.createElement('label');label.textContent=title;
  const input=document.createElement('input');Object.assign(input,{type:'number',min,max,step,value:settings[name],name});label.append(input);box.append(label);
 }
 const fill=()=>{for(const input of box.querySelectorAll('input'))input.value=settings[input.name];};
 document.getElementById('apply-tuning').onclick=()=>{
  const values={};for(const input of box.querySelectorAll('input')){if(!input.reportValidity())return;values[input.name]=Number(input.value);}
  const saved=saveSettings(values);fill();onChange();message.textContent=saved?'Saved on this browser. Mobile study restarted; Playground uses these settings on opening.':'Applied for this page. Browser storage is unavailable; export to keep settings.';
 };
 document.getElementById('reset-tuning').onclick=()=>{saveSettings(DEFAULTS);fill();onChange();message.textContent='Default settings restored.';};
 document.getElementById('export-tuning').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(settings,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mrboxes-mobile-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.getElementById('import-tuning').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||!Object.keys(FIELDS).some(k=>Number.isFinite(data[k])))throw Error('No recognised settings');saveSettings(data);fill();onChange();message.textContent='Settings imported.';}catch{message.textContent='Could not import: choose a mrBoxes settings JSON file.';}e.target.value='';};
}

// Browser page. Keep study functions usable by Node tests without a DOM.
if(typeof document !== 'undefined'){
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
let study=mobileStudy(),totalFrames=study.frames;
let lastInput={};
function tick(){if(frameNumber>=totalFrames)return;lastInput=study.input(frameNumber,rig.yaw);rig.advance(FIXED_DT,lastInput);frameNumber++;}
function seek(frame){rig.reset(study.direction);study.reset?.();lastInput={};frameNumber=0;accumulator=0;for(let i=0;i<frame;i++)tick();paint();}
function setPaused(value){paused=value;accumulator=0;$('play').textContent=paused?'Play':'Pause';$('play').setAttribute('aria-label',paused?'Play animation':'Pause animation');}
$('play').onclick=()=>setPaused(!paused);
$('replay').onclick=()=>{if(rig){seek(0);setPaused(false);}};
$('step').onclick=()=>{if(rig){setPaused(true);tick();paint();}};
$('back').onclick=()=>{if(rig){setPaused(true);seek(Math.max(0,frameNumber-1));}};
$('timeline').oninput=()=>{if(rig){setPaused(true);seek(Number($('timeline').value));}};
function configureStudy(){
 study=$('study').value.startsWith('mobile-')?mobileStudy($('study').value,Number($('direction').value)):reviewSequence($('study').value,Number($('sequence').value),Number($('direction').value));totalFrames=study.frames;
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
 const input=lastInput;$('input-state').textContent=study.mobile?('Speed: '+rig.speed.toFixed(2)+' · Heading error: '+Math.round((input.error||0)*180/Math.PI)+'°'):'Keys: '+([input.forward?'W':'',input.left?'A':'',input.right?'D':''].filter(Boolean).join(' + ')||'released');
 $('phase').textContent=rig.phase;
 $('support').textContent=rig.actualContacts.map((c,i)=>(i===0?'L':'R')+': '+(c?'contact':'air')).join('  /  ');
 $('balance').textContent='Support target: L '+Math.round(rig.weights[0]*100)+'% · R '+Math.round(rig.weights[1]*100)+'%';
 $('time').textContent=(frameNumber*FIXED_DT).toFixed(2)+' s / '+(totalFrames*FIXED_DT).toFixed(2)+' s';$('frame-count').textContent='Frame '+frameNumber;$('timeline').value=frameNumber;
 const target=actor.position.clone().add(new THREE.Vector3(0,1.30,0));
 // Offset framing to leave room for the review controls on the left.
 const right=new THREE.Vector3(Math.cos(orbit),0,-Math.sin(orbit));target.addScaledVector(right,innerWidth>800&&innerHeight>500?-.85:0);
 camera.position.copy(target).add(new THREE.Vector3(Math.sin(orbit)*7.3,2,Math.cos(orbit)*7.3));camera.lookAt(target);renderer.render(scene,camera);
}
try{const {root}=await loadReference('./game-robot.glb');root.scale.setScalar(2.6/3.15);actor.add(root);actor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});rig=new ReviewLocomotion(actor,root);configureStudy();paint();}catch(e){$('error').textContent='Unable to load the robot: '+e.message;}
function render(now){const elapsed=Math.min(.1,(now-last)/1000);last=now;if(rig&&!paused&&!document.hidden){accumulator+=elapsed*Number($('speed').value);while(accumulator>=FIXED_DT){if(frameNumber>=totalFrames){if($('loop').checked){seek(0);break;}setPaused(true);break;}tick();accumulator-=FIXED_DT;}}paint();requestAnimationFrame(render);}requestAnimationFrame(render);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);paint();});


mountTuning(()=>configureStudy());
$('review-toggle').onclick=()=>{const open=document.body.classList.toggle('controls-open');$('review-toggle').setAttribute('aria-expanded',String(open));};
}
