import {deadzone, displacement, snapDirection} from './motion.mjs';
const $ = id => document.getElementById(id);
let pc, app, rig, camera, world, asset, ready = false, busy = false, yaw = 0, armed = true;
let previousA = false, previousB = false, needsCenter = false, seconds = 0, frames = 0;
const status = text => $('status').textContent = text;
import {config} from './scenes.mjs';
let current = config.practice, sceneScale = 1, floor = 0, activeLod = false;
function buttons(){ $('engine').disabled=busy||!!app?.xr.active; $('lod').disabled=busy||!!app?.xr.active; $('scene').disabled=busy||!!app?.xr.active; $('load').disabled=busy||!!app?.xr.active; $('reset').disabled=!ready||busy; $('enter').disabled=!ready||busy||!app?.xr.isAvailable(pc.XRTYPE_VR); }
function reset(){
  yaw=current.yaw;rig.setEulerAngles(0,yaw,0);
  rig.setPosition(current.position[0]*sceneScale,floor*sceneScale,current.position[2]*sceneScale);
  if(app.xr.active){const local=camera.getLocalPosition();const offset=rig.getRotation().transformVector(new pc.Vec3(local.x,0,local.z));rig.translate(-offset.x,0,-offset.z);}
  else {camera.setLocalPosition(0,1.6,0);camera.setLocalEulerAngles(0,0,0);}
  armed=false;needsCenter=true;
}
function box(name,pos,size,color){const e=new pc.Entity(name);e.addComponent('render',{type:'box'});const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...color);m.emissive=new pc.Color(...color);m.update();e.render.material=m;e.setPosition(...pos);e.setLocalScale(...size);world.addChild(e);}
async function load(){
  if(busy)return;busy=true;ready=false;buttons();
  try{
    const scale=Number($('scale').value), height=Number($('floor').value);
    if(!Number.isFinite(scale)||scale<0.01||scale>100||!Number.isFinite(height))throw Error('Enter a scale from 0.01 to 100 and a valid floor height.');
    world?.destroy();if(asset){asset.unload();app.assets.remove(asset);asset=null;}
    world=new pc.Entity('Environment');app.root.addChild(world);
    current=config[$('scene').value];sceneScale=current.url?scale:1;floor=current.url?height:0;
    activeLod=!!current.url && $('lod').checked;
    app.scene.gsplat.splatBudget=activeLod?400000:0;
    if(current.url){
      status('Downloading and preparing '+current.title+'... This can take a while on Quest.');
      const url=activeLod?current.url.replace('assets/','assets/lod/').replace('.sog','/lod-meta.json'):current.url;
      asset=new pc.Asset(current.title,'gsplat',{url,filename:activeLod?'lod-meta.json':'scene.sog'});app.assets.add(asset);
      await new Promise((resolve,reject)=>{asset.once('load',resolve);asset.once('error',err=>reject(Error(String(err))));app.assets.load(asset);});
      const splat=new pc.Entity('Splat');splat.addComponent('gsplat',{asset,unified:true});splat.setEulerAngles(180,0,0);splat.setLocalScale(sceneScale,sceneScale,sceneScale);world.addChild(splat);
    }else{
      box('Floor',[0,-.05,0],[12,.1,12],[.08,.13,.2]);
      for(let i=-6;i<=6;i++){box('Grid',[i,.005,0],[.015,.01,12],[.17,.28,.4]);box('Grid',[0,.005,i],[12,.01,.015],[.17,.28,.4]);}
      box('Blue landmark',[-2,.75,-2],[.6,1.5,.6],[.1,.4,.9]);box('Orange landmark',[2,.5,-3],[1,1,1],[.9,.35,.1]);
    }
    ready=true;reset();status('Ready'+(current.url?(activeLod?' - LOD enabled (detail streams as you move)':' - full detail'):'')+'. Select Enter VR when the scene is visible.');
  }catch(error){status('Could not load '+current.title+': '+error.message+' Check that the SOG file exists in the assets folder.');}finally{busy=false;buttons();}
}
function update(dt){
  seconds+=dt;frames++;if(seconds>=1){$('stats').textContent=`PlayCanvas | ${Math.round(frames/seconds)} FPS - ${app.xr.active?'VR':'browser preview'} - ${current.title} - ${activeLod?'LOD on':'LOD off'}`;seconds=frames=0;}
  if(!app.xr.active||!ready)return;
  if(app.xr.session.visibilityState!=='visible'){needsCenter=true;return;}
  let lx=0,ly=0,rx=0,ry=0,a=false,b=false;
  for(const source of app.xr.input.inputSources){const g=source.gamepad;if(!g||g.mapping!=='xr-standard')continue;
    if(source.handedness==='left'){lx=g.axes[2]||0;ly=g.axes[3]||0;}
    if(source.handedness==='right'){rx=g.axes[2]||0;ry=g.axes[3]||0;a=!!g.buttons[4]?.pressed;b=!!g.buttons[5]?.pressed;}}
  if(b&&!previousB)app.xr.end();if(a&&!previousA)reset();previousA=a;previousB=b;
  if(needsCenter){if([lx,ly,rx,ry].every(v=>Math.abs(v)<.18)){needsCenter=false;armed=true;}return;}
  const snap=snapDirection(rx,armed);armed=snap.armed;
  if(snap.turn){const before=camera.getPosition().clone();yaw+=snap.turn;rig.setEulerAngles(0,yaw,0);const after=camera.getPosition();rig.translate(before.x-after.x,0,before.z-after.z);}
  const delta=displacement(deadzone(lx),deadzone(ly),-deadzone(ry),camera.forward,Number($('speed').value),dt);
  rig.translate(delta.x,delta.y,delta.z);
}
async function boot(){try{
  pc=await import('https://cdn.jsdelivr.net/npm/playcanvas@2.23.2/+esm');
  app=new pc.Application($('view'),{graphicsDeviceOptions:{antialias:false,alpha:false}});app.graphicsDevice.maxPixelRatio=1;
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);
  rig=new pc.Entity('Player rig');app.root.addChild(rig);camera=new pc.Entity('Head');camera.addComponent('camera',{clearColor:new pc.Color(.025,.045,.075),nearClip:.05,farClip:1000});rig.addChild(camera);
  app.xr.on('available',buttons);app.xr.on('error',error=>{status('VR error: '+error.message);buttons();});
  app.xr.on('start',()=>{document.body.classList.add('xr');reset();buttons();});
  app.xr.on('end',()=>{document.body.classList.remove('xr');reset();buttons();status('VR ended. You can change environments or enter again.');});

  $('load').onclick=load;$('reset').onclick=reset;
  $('enter').onclick=()=>{app.xr.start(camera.camera,pc.XRTYPE_VR,pc.XRSPACE_LOCALFLOOR,{callback:error=>{if(error)status('Could not enter VR: '+error.message);}});};
  addEventListener('resize',()=>app.resizeCanvas());app.on('update',update);app.start();
  $('support').textContent=!isSecureContext?'VR needs HTTPS. Upload this folder to your HTTPS website.':!navigator.xr?'This browser has no WebXR. Open this page in the Quest browser.':'WebXR detected. Enter VR becomes available when immersive VR is supported.';
  await load();
}catch(error){status('Startup failed: '+error.message+' - check your internet connection and reload.');}}
boot();
