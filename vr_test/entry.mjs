const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
for(const id of ['engine','scene','speed','scale','floor']){
  const value=params.get(id);
  if(value!==null && ($(id).tagName!=='SELECT'||[...$(id).options].some(o=>o.value===value)))$(id).value=value;
}
$('lod').checked=params.get('lod')==='1';
function note(){
  $('lodNote').textContent=$('lod').checked
    ?($('engine').value==='spark'?'Spark builds LOD from the SOG on this device; preparation uses extra time and memory.':'PlayCanvas streams the prepared LOD files.')+' Press Load environment to apply.'
    :'Off: original full-detail SOG. Press Load environment after changing this option.';
}
$('lod').onchange=note;
$('engine').onchange=()=>{
  const url=new URL(location.href);
  for(const id of ['engine','scene','speed','scale','floor'])url.searchParams.set(id,$(id).value);
  url.searchParams.set('lod',$('lod').checked?'1':'0');
  location.replace(url.href);
};
note();
try{await import($('engine').value==='spark'?'./spark-app.mjs?v=dual1':'./app.js?v=dual1');}
catch(error){$('status').textContent='Renderer startup failed: '+error.message+'. Check your connection, or choose the other engine.';}
