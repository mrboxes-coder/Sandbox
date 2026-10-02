import {MobileController} from './mobile-controller.js';
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
