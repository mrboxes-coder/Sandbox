const frame=document.getElementById('scene');
for(const button of document.querySelectorAll('[data-scene]'))button.addEventListener('click',()=>{
 // The outer document remains fullscreen while scenes navigate inside it.
 const request=document.documentElement.requestFullscreen?.({navigationUI:'hide'});
 request?.catch(()=>{});
 document.body.classList.add('playing');
 frame.title=button.dataset.scene==='character-playground.html'?'Movement Playground':'Motion Review';
 frame.hidden=false;frame.src='./'+button.dataset.scene;
 frame.addEventListener('load',()=>frame.focus(),{once:true});
});
