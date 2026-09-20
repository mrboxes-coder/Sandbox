// All events use simulation frames, independent of playback speed.
export function reviewSequence(id='approved',offset=0,direction=1){
 const side=direction===1?'Left':'Right';
 let stages,title,hint;
 if(id==='approved'){
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
