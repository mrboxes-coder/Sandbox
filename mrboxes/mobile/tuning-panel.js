import {FIELDS,settings,saveSettings,DEFAULTS} from './mobile-settings.js';
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
