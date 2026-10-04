const frame=document.getElementById('scene');
for(const button of document.querySelectorAll('[data-scene]'))button.addEventListener('click',()=>{
 // The outer document remains fullscreen while scenes navigate inside it.
 try {
  const request=document.documentElement.requestFullscreen?.({navigationUI:'hide'});
  request?.catch(()=>{});
 } catch { /* A browser may reject fullscreen; the scene remains usable. */ }
 document.body.classList.add('playing');
 frame.title=button.dataset.scene==='character-playground.html'?'Movement Playground':'Motion Review';
 frame.hidden=false;frame.src='./'+button.dataset.scene;
 frame.addEventListener('load',()=>frame.focus(),{once:true});
});


const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(ios&&!standalone){
 document.querySelector('.note').textContent='iPhone: for a view without browser toolbars, open in Safari, tap Share → Add to Home Screen (enable Open as Web App if shown), then launch mrBoxes from that icon. Rotate to landscape.';
}
