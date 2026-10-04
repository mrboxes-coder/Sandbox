// Layout depends on available space, with an explicit development override.
export function chooseLayout({override, width, height, ios, standalone, fullscreen}) {
 if (override === 'compact' || override === 'spacious') return override;
 return (width > height && height <= 360) || (ios && !standalone && !fullscreen) ? 'compact' : 'spacious';
}
if (typeof document !== 'undefined') {
 const override=new URLSearchParams(location.search).get('layout');
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 function update(){
  let fullscreen=!!document.fullscreenElement;
  let standalone=!!navigator.standalone||matchMedia('(display-mode: standalone)').matches;
  try { fullscreen ||= !!parent.document.fullscreenElement; standalone ||= !!parent.navigator.standalone||parent.matchMedia('(display-mode: standalone)').matches; } catch {}
  document.documentElement.dataset.layout=chooseLayout({override,width:innerWidth,height:visualViewport?.height||innerHeight,ios,standalone,fullscreen});
 }
 update();addEventListener('resize',update);document.addEventListener('fullscreenchange',update);window.visualViewport?.addEventListener('resize',update);
}
