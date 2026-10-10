import * as THREE from 'three';
import {SparkRenderer,SplatMesh} from '@sparkjsdev/spark';
import {config} from './scenes.mjs';
import {deadzone,displacement,snapDirection} from './motion.mjs';
const $=id=>document.getElementById(id),status=text=>$('status').textContent=text;
const renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:false,alpha:false});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
const scene=new THREE.Scene();scene.background=new THREE.Color(.025,.045,.075);
const rig=new THREE.Group(),camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.05,1000);
rig.add(camera);scene.add(rig);
const spark=new SparkRenderer({renderer,lodSplatCount:400000});scene.add(spark);
let world=new THREE.Group();scene.add(world);
let splat=null,current=config.practice,ready=false,busy=false,supported=false,entering=false;
let sceneScale=1,floor=0,activeLod=false,armed=false,needsCenter=true,previousA=false,previousB=false;
let previousTime=0,seconds=0,frames=0;
const forward=new THREE.Vector3(),before=new THREE.Vector3(),after=new THREE.Vector3();
function buttons(){
  const locked=busy||renderer.xr.isPresenting||entering;
  for(const id of ['engine','scene','lod','load'])$(id).disabled=locked;
  $('reset').disabled=!ready||busy;$('enter').disabled=!ready||locked||!supported;
}
function reset(){
  rig.rotation.set(0,THREE.MathUtils.degToRad(current.yaw),0);
  rig.position.set(current.position[0]*sceneScale,floor*sceneScale,current.position[2]*sceneScale);
  if(renderer.xr.isPresenting){
    const offset=new THREE.Vector3(camera.position.x,0,camera.position.z).applyQuaternion(rig.quaternion);
    rig.position.sub(offset);
  }else{camera.position.set(0,1.6,0);camera.rotation.set(0,0,0);}
  rig.updateMatrixWorld(true);armed=false;needsCenter=true;
}
function disposeWorld(){
  if(splat){world.remove(splat);splat.dispose();splat=null;}
  world.traverse(object=>{object.geometry?.dispose();if(object.material){for(const m of [].concat(object.material))m.dispose();}});
  scene.remove(world);world=new THREE.Group();scene.add(world);
}
function box(position,size,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color}));mesh.position.set(...position);world.add(mesh);}
async function load(){
  if(busy||renderer.xr.isPresenting)return;
  busy=true;ready=false;buttons();
  try{
    const scale=Number($('scale').value),height=Number($('floor').value);
    if(!Number.isFinite(scale)||scale<.01||scale>100||!Number.isFinite(height))throw Error('Enter a scale from 0.01 to 100 and a valid floor height.');
    disposeWorld();current=config[$('scene').value];sceneScale=current.url?scale:1;floor=current.url?height:0;activeLod=!!current.url&&$('lod').checked;
    if(current.url){
      status('Spark: loading '+current.title+(activeLod?' and building LOD...':'...'));
      splat=new SplatMesh({url:current.url,lod:activeLod,enableLod:activeLod,extSplats:true});
      splat.rotation.x=Math.PI;splat.scale.setScalar(sceneScale);world.add(splat);
      await splat.initialized;
    }else{
      box([0,-.05,0],[12,.1,12],0x142133);
      const grid=new THREE.GridHelper(12,12,0x2b4766,0x2b4766);grid.position.y=.005;world.add(grid);
      box([-2,.75,-2],[.6,1.5,.6],0x1966e6);box([2,.5,-3],[1,1,1],0xe65919);
    }
    reset();ready=true;status('Ready - SparkJS'+(current.url?(activeLod?' - LOD on':' - full detail'):'')+'. Select Enter VR.');
  }catch(error){disposeWorld();status('Spark could not load '+current.title+': '+error.message);}
  finally{busy=false;buttons();}
}
function movement(dt){
  const session=renderer.xr.getSession();if(!session||!ready)return;
  if(session.visibilityState!=='visible'){needsCenter=true;return;}
  let lx=0,ly=0,rx=0,ry=0,a=false,b=false;
  for(const source of session.inputSources){const g=source.gamepad;if(!g||g.mapping!=='xr-standard')continue;
    if(source.handedness==='left'){lx=g.axes[2]||0;ly=g.axes[3]||0;}
    if(source.handedness==='right'){rx=g.axes[2]||0;ry=g.axes[3]||0;a=!!g.buttons[4]?.pressed;b=!!g.buttons[5]?.pressed;}}
  if(b&&!previousB)session.end().catch(error=>status(error.message));
  if(a&&!previousA)reset();previousA=a;previousB=b;
  if(needsCenter){if([lx,ly,rx,ry].every(v=>Math.abs(v)<.18)){needsCenter=false;armed=true;}return;}
  const snap=snapDirection(rx,armed);armed=snap.armed;
  if(snap.turn){camera.getWorldPosition(before);rig.rotation.y+=THREE.MathUtils.degToRad(snap.turn);rig.updateMatrixWorld(true);camera.getWorldPosition(after);rig.position.x+=before.x-after.x;rig.position.z+=before.z-after.z;}
  camera.getWorldDirection(forward);
  const delta=displacement(deadzone(lx),deadzone(ly),-deadzone(ry),forward,Number($('speed').value),dt);
  rig.position.x+=delta.x;rig.position.y+=delta.y;rig.position.z+=delta.z;
}
renderer.xr.addEventListener('sessionstart',()=>{document.body.classList.add('xr');camera.position.set(0,0,0);reset();buttons();});
renderer.xr.addEventListener('sessionend',()=>{document.body.classList.remove('xr');entering=false;reset();buttons();status('VR ended. Choose settings or another engine.');});
$('enter').onclick=async()=>{
  if(!ready||entering)return;entering=true;buttons();let session;
  try{session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});await renderer.xr.setSession(session);}
  catch(error){if(session)await session.end().catch(()=>{});status('Could not enter VR: '+error.message);}
  finally{entering=false;buttons();}
};
$('load').onclick=load;$('reset').onclick=reset;
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);disposeWorld();spark.dispose();renderer.dispose();});
renderer.setAnimationLoop(time=>{
  const dt=previousTime?Math.max(0,(time-previousTime)/1000):0;previousTime=time;
  movement(dt);renderer.render(scene,camera);
  seconds+=dt;frames++;if(seconds>=1){$('stats').textContent=`SparkJS | ${Math.round(frames/seconds)} FPS - ${renderer.xr.isPresenting?'VR':'browser preview'} - ${current.title} - ${activeLod?'LOD on':'LOD off'}`;seconds=frames=0;}
});
async function support(){try{supported=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');}catch{supported=false;}buttons();}
navigator.xr?.addEventListener('devicechange',support);await support();
$('support').textContent=!isSecureContext?'VR needs HTTPS.':supported?'Immersive VR is available.':'Desktop preview. Open the HTTPS site in the Quest browser to enter VR.';
await load();
