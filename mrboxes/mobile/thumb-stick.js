export class ThumbStick {
 constructor(element){
  this.element=element;this.knob=element.querySelector('.knob');this.x=0;this.y=0;this.pointer=null;
  element.addEventListener('pointerdown',e=>{if(this.pointer!==null||e.button!==0)return;e.preventDefault();this.pointer=e.pointerId;element.setPointerCapture(e.pointerId);this.update(e);});
  element.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){e.preventDefault();this.update(e);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===this.pointer)this.clear();});
 }
 update(e){const r=this.element.getBoundingClientRect(),radius=r.width*.32;let x=(e.clientX-r.left-r.width/2)/radius,y=(r.top+r.height/2-e.clientY)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}this.x=x;this.y=y;this.knob.style.transform=`translate(${x*radius}px,${-y*radius}px)`;}
 clear(){const pointer=this.pointer;this.pointer=null;this.x=this.y=0;this.knob.style.transform='';if(pointer!==null&&this.element.hasPointerCapture(pointer))this.element.releasePointerCapture(pointer);}
}
