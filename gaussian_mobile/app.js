const $=id=>document.getElementById(id);
let frame,url,controller,generation=0,phase='library',scene,input={speed:0,yaw:0,altitude:0};
const pads=[];
function send(type,extra={}){frame?.contentWindow?.postMessage({type,...extra},location.origin);}
function clearInput(){input={speed:0,yaw:0,altitude:0};pads.forEach(p=>p.reset());send('input',{input});}
function release(){generation++;controller?.abort();controller=null;clearInput();send('dispose');frame?.remove();frame=null;if(url)URL.revokeObjectURL(url);url=null;}
function library(){release();phase='library';$('viewer').hidden=true;$('library').hidden=false;$('file').value='';}
function setPhase(value){phase=value;$('controls').hidden=value!=='flying';$('pause').hidden=!['flying','paused'].includes(value);$('reset').hidden=!['ready','flying','paused'].includes(value);$('panel').hidden=value==='flying';$('start').hidden=!['ready','paused'].includes(value);$('cancel').hidden=!['loading','preparing','error'].includes(value);$('progress').hidden=value!=='loading';$('pause').textContent=value==='paused'?'Resume':'Pause';$('start').textContent=value==='paused'?'Resume flight':'Start flight';}
function pause(){if(phase!=='flying')return;clearInput();send('active',{active:false});setPhase('paused');$('status').textContent='Flight paused';$('detail').textContent='Tap Resume when you are ready.';}
function start(){if(!['ready','paused'].includes(phase)||innerHeight>innerWidth||document.hidden)return;void enterFullscreen();clearInput();send('active',{active:true});setPhase('flying');}
async function load(selected,file){
 release();const token=generation;scene=selected;$('library').hidden=true;$('viewer').hidden=false;$('sceneTitle').textContent=scene.title;setPhase('loading');$('status').textContent='Downloading scene';$('detail').textContent='Connecting…';$('progress').removeAttribute('value');controller=new AbortController();
 try{
 let blob=file;
 if(!blob){const response=await fetch(scene.url,{signal:controller.signal});if(!response.ok)throw Error(`Download failed (${response.status})`);
 const total=Number(response.headers.get('content-length'));const reader=response.body.getReader();let received=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;if(total)$('progress').value=Math.min(1,received/total);$('detail').textContent=`${(received/1048576).toFixed(1)} MB${total?' / '+(total/1048576).toFixed(1)+' MB':''}`;}
 blob=new Blob(chunks,{type:'application/octet-stream'});
 }
 if(token!==generation)return;
 url=URL.createObjectURL(blob);setPhase('preparing');$('status').textContent='Preparing scene';$('detail').textContent='Loading SOG textures and preparing the first frame…';frame=document.createElement('iframe');frame.title='Gaussian splat scene';frame.src='renderer.html';$('renderHost').append(frame);
 }catch(error){if(token!==generation)return;fail(error.message);}
}
function fail(message){release();setPhase('error');$('status').textContent='Unable to open scene';$('detail').textContent=message+' Check the connection and use a bundled .sog file.';}
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;if(e.data.type==='boot')send('load',{scene,url});if(e.data.type==='ready'){if(url)URL.revokeObjectURL(url);url=null;setPhase('ready');$('status').textContent='Ready to explore';$('detail').textContent='Left thumb: altitude. Right thumb: turn and move. Release to hover.';}if(e.data.type==='error')fail(e.data.message);});
function bindPad(id,altitude){const el=$(id),knob=el.querySelector('i');let pointer=null;function reset(){if(pointer!==null&&el.hasPointerCapture(pointer))el.releasePointerCapture(pointer);pointer=null;knob.style.transform='translate(-50%,-50%)';}pads.push({reset});
 function move(e){if(e.pointerId!==pointer)return;const r=el.getBoundingClientRect(),radius=r.width*.32;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;const dead=v=>Math.abs(v)<.08?0:Math.sign(v)*(Math.abs(v)-.08)/.92;if(altitude){input.altitude=-dead(y);x=0;}else{input.yaw=dead(x);input.speed=-dead(y);}knob.style.transform=`translate(calc(-50% + ${x*radius}px),calc(-50% + ${y*radius}px))`;send('input',{input});}
 el.addEventListener('pointerdown',e=>{if(phase!=='flying'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;el.setPointerCapture(pointer);move(e);});el.addEventListener('pointermove',move);
 function end(e){if(e.pointerId!==pointer)return;reset();if(altitude)input.altitude=0;else input.yaw=input.speed=0;send('input',{input});}
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>el.addEventListener(name,end));
}
bindPad('altitude',true);bindPad('flight',false);
$('scenes').onclick=library;$('cancel').onclick=library;$('start').onclick=start;$('pause').onclick=()=>phase==='flying'?pause():start();$('reset').onclick=()=>{pause();clearInput();send('reset');};
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});addEventListener('resize',()=>{if(innerHeight>innerWidth)pause();});addEventListener('pagehide',release);
$('file').onchange=e=>{const file=e.target.files[0];if(file&&/\.sog$/i.test(file.name))load({title:file.name},file);};
function validate(s){if(typeof s.title!=='string'||typeof s.url!=='string'||!s.url.split('?')[0].toLowerCase().endsWith('.sog'))throw Error('Each scene needs a title and a .sog URL.');const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);if(s.pose&&((s.pose.position&&!vector(s.pose.position))||['yaw','pitch'].some(k=>s.pose[k]!==undefined&&!Number.isFinite(s.pose[k]))))throw Error('Invalid camera pose.');if(s.rotation&&!vector(s.rotation))throw Error('Invalid scene rotation.');if(s.speed&&Object.values(s.speed).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid speed settings.');if(s.bounds&&(!vector(s.bounds.min)||!vector(s.bounds.max)||s.bounds.min.some((v,i)=>v>s.bounds.max[i])))throw Error('Invalid scene bounds.');return s;}
try{const response=await fetch('scenes.json');if(!response.ok)throw Error('Cannot read scenes.json');const data=await response.json();for(const item of data.scenes){const s=validate(item),button=document.createElement('button');button.className='card';const img=document.createElement('img');img.alt='';img.src=s.thumbnail||'placeholder.svg';img.onerror=()=>{img.onerror=null;img.src='placeholder.svg';};const body=document.createElement('div'),title=document.createElement('strong'),caption=document.createElement('small');title.textContent=s.title;caption.textContent=s.description||'Explore scene →';body.append(title,caption);button.append(img,body);button.onclick=()=>load(s);$('cards').append(button);}$('libraryStatus').textContent=data.scenes.length?'Select a scene to begin.':'No hosted scenes configured yet. Open a local SOG to test, or add scenes to scenes.json.';}catch(error){$('libraryStatus').textContent=error.message;}

async function enterFullscreen(){
  if(document.fullscreenElement)return;
  if(!document.documentElement.requestFullscreen){
    $('fullscreenStatus').textContent='Fullscreen is unavailable in this browser. Open the viewer in Chrome or Samsung Internet.';
    return;
  }
  try{
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
    $('fullscreenStatus').textContent='';
  }catch{
    $('fullscreenStatus').textContent='Fullscreen was not allowed. Tap Enter fullscreen to try again in your mobile browser.';
  }
}
$('fullscreen').onclick=enterFullscreen;
document.addEventListener('fullscreenchange',()=>{
  $('fullscreen').hidden=!!document.fullscreenElement;
  if(!document.fullscreenElement)pause();
});
