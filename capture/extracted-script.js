
'use strict';

// ======================================================= CONSTANTS
const PALETTES = {
  standard: [
    // 1-5: black -> white grey tones
    '#000000','#404040','#808080','#bfbfbf','#ffffff',
    // 6-25: rainbow spectrum
    '#ff0000','#ff3d00','#ff7700','#ffaa00','#ffd700',
    '#bfff00','#66ff00','#00ff44','#00ffaa','#00ffff',
    '#00aaff','#0055ff','#0000ff','#5500ff','#aa00ff',
    '#ff00ff','#ff00aa','#ff0055','#ff6680','#ffccdd'
  ],
  pastel: [
    // 1-5: neutral pastels
    '#f5f0eb','#e8e0d8','#d4c9c0','#bfb0a8','#a89890',
    // 6-25: soft rainbow pastels, ordered warm to cool
    '#ffb3b3','#ffc8d4','#ffd4c8','#ffcba4','#ffe4b3',
    '#fde68a','#e8ffb3','#d4f5a0','#b8f0c8','#b3ffe4',
    '#a0f0e8','#b3e8ff','#a8d8ff','#b3c6ff','#c8c8ff',
    '#c9b8ff','#e8c8ff','#e8b3ff','#ffb3e8','#ffc8e8'
  ],
  industrial: [
    // 1-25: darks, steel, concrete, rust and safety tones
    '#0a0a0a','#1a1a1a','#2d2d2d','#3d3d3d','#4f4f4f',
    '#2a3a4a','#344858','#3d5a6a','#4a6a7a','#5a7a8a',
    '#6b6b6b','#8a8a8a','#b0a898','#d4c8b8','#e8e0d0',
    '#8b4a2a','#a0522d','#c06030','#d4782a','#e09040',
    '#c8b020','#e8c830','#f0a000','#cc3300','#990000'
  ],
  forest: [
    // 1-25: forest floor, canopy, moss, bark, dappled light and fungi
    '#0a0f08','#141f10','#1e2e18','#2a3e20','#364e28',
    '#2a4a1a','#3a6828','#4a8838','#60a848','#7acc58',
    '#4a5e32','#5a7040','#6a8450','#7a9860','#8aac70',
    '#3d2b1a','#5a3c24','#7a5030','#9a6840','#b88050',
    '#c8d890','#d8e8a8','#e8f0c0','#f0c860','#c89840'
  ],
  mountain: [
    // 1-25: brighter alpine, pine, sky, stone, brown and sepia tones
    '#f7f3e8','#e4edf2','#c9dce8','#9fc2d8','#6fa3c4',
    '#2d3f52','#435f78','#6687a0','#8fb2c8','#c4d8e4',
    '#1a1814','#34302a','#5a5144','#8a7a66','#c9bba6',
    '#4a2f1e','#6b4328','#8a5a36','#b47a48','#d6a05f',
    '#2d4a36','#3f6b45','#5b8f52','#82b96a','#b7d88a'
  ],
  inferno: [
    // 1-5: black to deep ember
    '#000000','#1a0000','#2d0000','#4a0800','#6b1000',
    // 6-25: inferno spectrum - ember to plasma white
    '#8b1a00','#aa2200','#cc3300','#e04400','#f05500',
    '#ff6600','#ff7700','#ff8800','#ff9900','#ffaa00',
    '#ffbb00','#ffcc00','#ffdd44','#ffee88','#fff0aa',
    '#ff3300','#ff1100','#cc0000','#ff44aa','#ffffff'
  ],
  watercolour: [
    // 1-5: deep ocean to open water
    '#061826','#0b2d45','#104966','#156d88','#1a91a6',
    // 6-25: varied blues, teals, greens, seafoam, sand and coral
    '#003f73','#0067a5','#0094c6','#32b7d8','#78d8ea',
    '#005f73','#008891','#00a8a8','#20c7b6','#65e0cf',
    '#0b5d4a','#12805f','#27a673','#54c98a','#9be6b0',
    '#c8f3e6','#e6f7ef','#d8c98f','#f0b46a','#ff7f6e'
  ],
  highlight: [
    // 1-25: marker brights, readable accents and softer highlighter washes
    '#fff200','#ffe600','#ffd400','#ffbf00','#ff9f1c',
    '#b6ff00','#7cff00','#2eff6f','#00ffa3','#00f5ff',
    '#00b7ff','#2f6bff','#7b4dff','#b000ff','#ff00e6',
    '#ff007a','#ff2d55','#ff4d00','#f6ff7a','#d8ff8f',
    '#9dffd0','#8fefff','#b8c7ff','#f0a6ff','#ffb3d1'
  ],
  corporate: [
    // 1-25: professional neutrals, blues, teals, green, amber and burgundy
    '#111827','#1f2937','#374151','#6b7280','#d1d5db',
    '#0b1f3a','#123a63','#1f5f8b','#2f7fb3','#7fb3d5',
    '#0f3d4c','#176b73','#24919a','#65b8bd','#b9e0df',
    '#1f4d3a','#2f6f4e','#4f8f66','#8bbf8a','#d4e7c5',
    '#7a4b00','#b7791f','#d99a2b','#8a1538','#b8325a'
  ]
};
let activePaletteName = 'standard';
const MAX_UNDO = 10;

// ======================================================= STATE
let appMode = 'screenshot';  // 'screenshot' | 'record' | 'paint'

// Capture state
let captureStream   = null;
let mediaRecorder   = null;
let recordedChunks  = [];
let timerInterval   = null;
let elapsed         = 0;
let currentBlob     = null;

// Paint state
let paintActive     = false;   // true when canvas is initialised
let canvasW         = 1920;
let canvasH         = 1080;
let activeTool      = 'pen';
let activeColour    = '#ff3b3b';
let brushSize       = 6;
let brushOpacity    = 1.0;
let customColours   = Array(25).fill('');
let cropRect        = null;
let cropStart       = null;
let cropDragMode    = null;
let isCropping      = false;

// Layer system
// Each layer: { id, name, canvas(offscreen), visible, type:'pen' }
let layers     = [];
let activeLayerIdx = 0;
let undoStack  = [];  // array of snapshots [{layerIdx, imageData}]
let redoStack  = [];
let canvasViewMode = 'actual';

// Drawing state
let isDrawing  = false;
let lastX = 0, lastY = 0;

// Full-res screenshot for save-at-scale
let fullResCanvas = null;

// -- Text state ------------------------------------------------------------
const DEFAULT_TEXT_STYLE = {
  fontFamily: 'sans-serif',
  fontSize: 36,
  colour: '#000000',
  bold: false,
  italic: false,
  align: 'left',
};

let textFontFamily  = DEFAULT_TEXT_STYLE.fontFamily;
let textFontSize    = DEFAULT_TEXT_STYLE.fontSize;
let textColour      = DEFAULT_TEXT_STYLE.colour;
let textBold        = false;
let textItalic      = false;
let textAlign       = 'left';
let activeTextarea  = null;   // the live <textarea> DOM element while editing
let editingLayerIdx = -1;     // layer being re-edited (-1 = new text)

// -- Shape state -----------------------------------------------------------
const SHAPE_TOOLS = new Set(['rect','circle','line','arrow','star','speech','thought']);
let shapeStrokeWidth = 2;
let shapeStrokeColour = '#000000';
let shapeFillColour = activeColour;
let shapeColourTarget = 'fill';
let speechTailCorner = 'bl';

// Selected shape tracking
let selectedLayerIdx = -1;   // index into layers[]
let dragMode = null;          // 'move'|'scale-nw'|'scale-ne'|'scale-sw'|'scale-se'|
                              // 'scale-n'|'scale-s'|'scale-e'|'scale-w'|'rotate'|null
let dragStartX = 0, dragStartY = 0;
let dragStartShape = null;    // clone of shape at drag start

// ======================================================= DOM REFS
const displayCanvas = document.getElementById('displayCanvas');
const dc            = displayCanvas.getContext('2d');
const overlayCanvas = document.getElementById('overlayCanvas');
const oc            = overlayCanvas.getContext('2d');
const captureVideo  = document.getElementById('captureVideo');
const canvasEmpty   = document.getElementById('canvasEmpty');
const canvasArea    = document.getElementById('canvasArea');
const recBadge      = document.getElementById('recBadge');
const recTimer      = document.getElementById('recTimer');
const zoomBadge     = document.getElementById('zoomBadge');

// ======================================================= INIT
buildPalette();
buildCustomSwatches();
setActiveColour(activeColour);
setupLeftAccordions();
updateShapeStylePanel(null);
syncTextStylePanel();
setMode('screenshot');
updateLayerPanel();

window.addEventListener('keydown', e => {
  if (e.key === 'Delete' && !isTypingTarget(e.target)) {
    if (deleteSelectedItem()) e.preventDefault();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
});

// (selection save handled by toolbar mousedown)

function isTypingTarget(el) {
  return !!el?.closest?.('input, textarea, select, [contenteditable="true"]');
}

function deleteSelectedItem() {
  if (selectedLayerIdx < 0) return false;
  if (!layers[selectedLayerIdx] || layers.length <= 1) return false;
  deleteLayer(selectedLayerIdx);
  return true;
}

function toggleAccordion(id) {
  document.getElementById(id)?.classList.toggle('open');
}

function setupLeftAccordions() {
  ['brushSizePanel','opacityPanel','colourPanel','palettePanel','customPalettePanel','shapeStylePanel'].forEach(id => {
    document.getElementById(id)?.classList.add('nested');
  });
  hideOptionPanel('customPalettePanel');
  const textPanel = document.getElementById('textStylePanel');
  if (textPanel) textPanel.style.display = 'none';
  refreshToolOptions();
}

function moveOptionPanel(id, target) {
  const panel = document.getElementById(id);
  if (!panel || !target) return;
  panel.style.display = '';
  target.appendChild(panel);
}

function hideOptionPanel(id) {
  const panel = document.getElementById(id);
  if (panel) panel.style.display = 'none';
}

function refreshToolOptions() {
  const drawOptions = document.getElementById('drawToolOptions');
  const shapeOptions = document.getElementById('shapeToolOptions');
  const selectedShape = selectedLayerIdx >= 0 && layers[selectedLayerIdx]?.type === 'shape'
    ? layers[selectedLayerIdx].shape
    : null;
  if (!drawOptions || !shapeOptions) return;
  drawOptions.classList.remove('active');
  shapeOptions.classList.remove('active');
  ['brushSizePanel','opacityPanel','colourPanel','palettePanel','customPalettePanel','shapeStylePanel'].forEach(hideOptionPanel);

  if (selectedShape) {
    shapeOptions.classList.add('active');
    moveOptionPanel('shapeStylePanel', shapeOptions);
    moveOptionPanel('opacityPanel', shapeOptions);
    moveOptionPanel('colourPanel', shapeOptions);
    moveOptionPanel('palettePanel', shapeOptions);
    updateShapeToolOptions();
  } else if (activeTool === 'pen') {
    drawOptions.classList.add('active');
    moveOptionPanel('brushSizePanel', drawOptions);
    moveOptionPanel('opacityPanel', drawOptions);
    moveOptionPanel('colourPanel', drawOptions);
    moveOptionPanel('palettePanel', drawOptions);
  } else if (activeTool === 'eraser') {
    drawOptions.classList.add('active');
    moveOptionPanel('brushSizePanel', drawOptions);
  } else if (activeTool === 'fill') {
    drawOptions.classList.add('active');
    moveOptionPanel('opacityPanel', drawOptions);
    moveOptionPanel('colourPanel', drawOptions);
    moveOptionPanel('palettePanel', drawOptions);
  } else if (SHAPE_TOOLS.has(activeTool)) {
    shapeOptions.classList.add('active');
    moveOptionPanel('shapeStylePanel', shapeOptions);
    moveOptionPanel('opacityPanel', shapeOptions);
    moveOptionPanel('colourPanel', shapeOptions);
    moveOptionPanel('palettePanel', shapeOptions);
    updateShapeToolOptions();
  }
  syncActiveColourDisplay();
}

function updateShapeToolOptions() {
  const selectedShape = selectedLayerIdx >= 0 && layers[selectedLayerIdx]?.type === 'shape'
    ? layers[selectedLayerIdx].shape
    : null;
  const shapeType = selectedShape?.type || activeTool;
  const hasFill = !['line','arrow'].includes(shapeType);
  const fillRow = document.getElementById('shapeFillRow');
  const fillBtn = document.getElementById('shapeTargetFill');
  const lineControls = document.getElementById('shapeLineControls');
  if (fillRow) fillRow.style.display = 'none';
  if (fillBtn) fillBtn.style.display = hasFill ? '' : 'none';
  if (!hasFill && shapeColourTarget === 'fill') shapeColourTarget = 'line';
  if (lineControls) lineControls.style.display = shapeColourTarget === 'line' ? 'flex' : 'none';
  updateShapeTargetButtons();
  syncActiveColourDisplay();
}

function setShapeColourTarget(target) {
  const selectedShape = selectedLayerIdx >= 0 && layers[selectedLayerIdx]?.type === 'shape'
    ? layers[selectedLayerIdx].shape
    : null;
  const shapeType = selectedShape?.type || activeTool;
  const hasFill = !['line','arrow'].includes(shapeType);
  shapeColourTarget = target === 'line' || !hasFill ? 'line' : 'fill';
  updateShapeToolOptions();
}

function updateShapeTargetButtons() {
  document.getElementById('shapeTargetLine')?.classList.toggle('active', shapeColourTarget === 'line');
  document.getElementById('shapeTargetFill')?.classList.toggle('active', shapeColourTarget === 'fill');
}

function showSelectedShapeStyle(shape) {
  if (!shape) {
    updateShapeStylePanel(null);
    refreshToolOptions();
    return;
  }
  document.getElementById('shapesAccordion')?.classList.add('open');
  if (['line','arrow'].includes(shape.type)) shapeColourTarget = 'line';
  updateShapeStylePanel(shape);
  refreshToolOptions();
}

// ======================================================= MODE
function setMode(m) {
  appMode = m;
  ['screenshot','record','paint'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === m);
  });
  document.getElementById('ssControls').style.display    = m === 'screenshot' ? '' : 'none';
  document.getElementById('recControls').style.display   = m === 'record'     ? '' : 'none';
  document.getElementById('paintControls').style.display = m === 'paint'      ? '' : 'none';

  if (m === 'screenshot' || m === 'record') {
    // Capture modes: hide paint canvas if no capture active
    if (!paintActive) {
      displayCanvas.style.display = 'none';
      canvasEmpty.style.display   = 'flex';
      zoomBadge?.classList.remove('active');
    }
  }
  if (m === 'paint') {
    captureVideo.classList.remove('visible');
    if (!paintActive) {
      // Show canvas empty state with paint hint
      displayCanvas.style.display = 'none';
      canvasEmpty.style.display   = 'flex';
      zoomBadge?.classList.remove('active');
    }
  }
}

// ======================================================= CANVAS SIZING
function fitCanvasToArea() {
  const area = canvasArea.getBoundingClientRect();
  const aW   = area.width  - 2;
  const aH   = area.height - 2;
  const fitScale = Math.min(aW / canvasW, aH / canvasH);
  const scale = canvasViewMode === 'actual' ? 1 : fitScale;
  const pw = Math.floor(canvasW * scale);
  const ph = Math.floor(canvasH * scale);
  displayCanvas.style.width  = pw + 'px';
  displayCanvas.style.height = ph + 'px';
  overlayCanvas.style.width  = pw + 'px';
  overlayCanvas.style.height = ph + 'px';
  // Position overlay exactly over displayCanvas
  const dr = displayCanvas.getBoundingClientRect();
  const cr = canvasArea.getBoundingClientRect();
  overlayCanvas.style.left = (dr.left - cr.left) + 'px';
  overlayCanvas.style.top  = (dr.top  - cr.top)  + 'px';
  if (zoomBadge) {
    zoomBadge.textContent = Math.round(scale * 100) + '%';
    zoomBadge.classList.toggle('active', paintActive);
  }
}

function setCanvasViewMode(mode) {
  canvasViewMode = mode === 'actual' ? 'actual' : 'fit';
  const sel = document.getElementById('selCanvasView');
  if (sel) sel.value = canvasViewMode;
  if (paintActive) fitCanvasToArea();
}

// Map pointer event coords to canvas pixel coords
function canvasCoords(e) {
  const r = displayCanvas.getBoundingClientRect();
  const scaleX = canvasW / r.width;
  const scaleY = canvasH / r.height;
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top)  * scaleY
  };
}

// ======================================================= LAYER SYSTEM
function createLayer(name, type = 'pen') {
  const c = document.createElement('canvas');
  c.width  = canvasW;
  c.height = canvasH;
  return { id: Date.now() + Math.random(), name, canvas: c, visible: true, type };
}

function cloneCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

function cloneLayer(layer) {
  return {
    id: layer.id,
    name: layer.name,
    canvas: cloneCanvas(layer.canvas),
    visible: layer.visible,
    type: layer.type,
    shape: layer.shape ? JSON.parse(JSON.stringify(layer.shape)) : undefined,
    text: layer.text ? JSON.parse(JSON.stringify(layer.text)) : undefined
  };
}

function snapshotState() {
  return {
    layers: layers.map(cloneLayer),
    activeLayerIdx,
    selectedLayerIdx,
    canvasW,
    canvasH
  };
}

function restoreState(snap) {
  if (!snap) return;
  canvasW = snap.canvasW; canvasH = snap.canvasH;
  displayCanvas.width = canvasW; displayCanvas.height = canvasH;
  overlayCanvas.width = canvasW; overlayCanvas.height = canvasH;
  layers = snap.layers.map(cloneLayer);
  cropRect = null;
  cropStart = null;
  cropDragMode = null;
  isCropping = false;
  activeLayerIdx = Math.min(Math.max(snap.activeLayerIdx ?? 0, 0), Math.max(layers.length - 1, 0));
  selectedLayerIdx = snap.selectedLayerIdx ?? -1;
  fitCanvasToArea();
  composite();
  fullResCanvas = renderCompositeToCanvas(1);
  refreshSelectionOverlay();
  updateCropControls();
  updateLayerPanel();
}

function initCanvas(w, h, bgColour = null) {
  canvasW = w; canvasH = h;
  displayCanvas.width  = w;
  displayCanvas.height = h;
  overlayCanvas.width  = w;
  overlayCanvas.height = h;
  layers = [];
  selectedLayerIdx = -1;
  cropRect = null;
  cropStart = null;
  cropDragMode = null;
  isCropping = false;
  clearOverlay();
  undoStack = []; redoStack = [];
  updateUndoButtons();

  // Background layer
  if (bgColour) {
    const bg = createLayer('Background', 'background');
    const bgCtx = bg.canvas.getContext('2d');
    bgCtx.fillStyle = bgColour;
    bgCtx.fillRect(0, 0, w, h);
    layers.push(bg);
  }
  // Default pen layer
  layers.push(createLayer('Pen 1'));
  activeLayerIdx = layers.length - 1;

  displayCanvas.style.display = 'block';
  canvasEmpty.style.display   = 'none';
  paintActive = true;
  fitCanvasToArea();
  composite();
  updateLayerPanel();
}

function composite() {
  dc.clearRect(0, 0, canvasW, canvasH);
  layers.forEach(l => {
    if (l.visible) dc.drawImage(l.canvas, 0, 0);
  });
}

function renderCompositeToCanvas(scale = 1) {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(canvasW * scale));
  out.height = Math.max(1, Math.round(canvasH * scale));
  const ctx = out.getContext('2d');
  layers.forEach(l => { if (l.visible) ctx.drawImage(l.canvas, 0, 0, out.width, out.height); });
  return out;
}

function setBaseImageLayer(source, name = 'Background') {
  if (!layers.length) layers.push(createLayer(name, 'background'));
  const base = layers[0];
  base.name = name;
  base.type = 'background';
  base.visible = true;
  delete base.shape;
  delete base.text;
  const ctx = base.canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.drawImage(source, 0, 0, canvasW, canvasH);
  if (layers.length === 1) layers.push(createLayer('Pen 1', 'pen'));
  activeLayerIdx = layers.length - 1;
  selectedLayerIdx = -1;
  clearOverlay();
  composite();
  updateLayerPanel();
}

function activeLayerCtx() {
  return layers[activeLayerIdx]?.canvas.getContext('2d');
}

function addPenLayer() {
  if (!paintActive) return;
  saveUndoState();
  layers.push(createLayer(`Pen ${layers.filter(l=>l.type==='pen').length + 1}`, 'pen'));
  activeLayerIdx = layers.length - 1;
  selectedLayerIdx = activeLayerIdx;
  clearOverlay();
  composite();
  updateLayerPanel();
  showToast('New pen layer added');
}

function clearCurrentLayer() {
  if (!paintActive) return;
  saveUndoState();
  const ctx = activeLayerCtx();
  if (ctx) ctx.clearRect(0, 0, canvasW, canvasH);
  composite();
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function layerLabel(type) {
  return type === 'background' ? 'background' : type;
}

function layerIcon(name) {
  const common = 'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const icons = {
    eye: '<svg '+common+'><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg '+common+'><path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"/><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6 0 10 7 10 7a17.8 17.8 0 0 1-3.1 4.1"/><path d="M6.1 6.1C3.5 7.9 2 12 2 12s4 7 10 7c1.4 0 2.7-.4 3.9-1"/></svg>',
    up: '<svg '+common+'><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>',
    down: '<svg '+common+'><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>',
    merge: '<svg '+common+'><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
    text: '<span class="aa-icon" aria-hidden="true">Aa</span>',
    trash: '<svg '+common+'><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>'
  };
  return icons[name] || '';
}


function updateLayerPanel() {
  const list = document.getElementById('layerList');
  if (!list) return;
  if (!paintActive || !layers.length) {
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);">No canvas yet</div>';
    return;
  }
  let html = '';
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    const active = i === activeLayerIdx || i === selectedLayerIdx;
    html += `<div class="layer-row ${active ? 'active' : ''} ${l.visible ? '' : 'hidden'}" onclick="selectLayer(${i})">
      <div class="layer-main">
        <button class="icon-btn" title="Show / hide" aria-label="Show / hide" onclick="event.stopPropagation();toggleLayerVisibility(${i})">${l.visible ? layerIcon('eye') : layerIcon('eyeOff')}</button>
        <input class="layer-name" value="${escapeHtml(l.name)}" onclick="event.stopPropagation()" onchange="renameLayer(${i}, this.value)">
      </div>
      <div class="layer-type">${escapeHtml(layerLabel(l.type))}</div>
      <div class="layer-actions">
        <button class="icon-btn" title="Move forward" aria-label="Move forward" onclick="event.stopPropagation();moveLayer(${i}, 1)" ${i >= layers.length - 1 ? 'disabled' : ''}>${layerIcon('up')}</button>
        <button class="icon-btn" title="Move backward" aria-label="Move backward" onclick="event.stopPropagation();moveLayer(${i}, -1)" ${i <= 0 ? 'disabled' : ''}>${layerIcon('down')}</button>
        <button class="icon-btn" title="Merge down" aria-label="Merge down" onclick="event.stopPropagation();mergeLayerDown(${i})" ${i <= 0 ? 'disabled' : ''}>${layerIcon('merge')}</button>
        <button class="icon-btn" title="Edit text" aria-label="Edit text" onclick="event.stopPropagation();reopenTextLayer(${i})" ${l.type !== 'text' ? 'disabled' : ''}>${layerIcon('text')}</button>
        <button class="icon-btn" title="Delete" aria-label="Delete" onclick="event.stopPropagation();deleteLayer(${i})" ${layers.length <= 1 ? 'disabled' : ''}>${layerIcon('trash')}</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
}

function selectLayer(i) {
  if (!layers[i]) return;
  activeLayerIdx = i;
  selectedLayerIdx = (layers[i].type === 'shape' || layers[i].type === 'text') ? i : -1;
  refreshSelectionOverlay();
  refreshToolOptions();
  updateLayerPanel();
}

function renameLayer(i, name) {
  if (!layers[i]) return;
  saveUndoState();
  layers[i].name = name.trim() || layers[i].name;
  updateLayerPanel();
}

function toggleLayerVisibility(i) {
  if (!layers[i]) return;
  saveUndoState();
  layers[i].visible = !layers[i].visible;
  composite();
  refreshSelectionOverlay();
  updateLayerPanel();
}

function moveLayer(i, dir) {
  const j = i + dir;
  if (!layers[i] || j < 0 || j >= layers.length) return;
  saveUndoState();
  const [layer] = layers.splice(i, 1);
  layers.splice(j, 0, layer);
  if (activeLayerIdx === i) activeLayerIdx = j;
  else if (dir > 0 && activeLayerIdx > i && activeLayerIdx <= j) activeLayerIdx--;
  else if (dir < 0 && activeLayerIdx >= j && activeLayerIdx < i) activeLayerIdx++;
  if (selectedLayerIdx === i) selectedLayerIdx = j;
  else if (dir > 0 && selectedLayerIdx > i && selectedLayerIdx <= j) selectedLayerIdx--;
  else if (dir < 0 && selectedLayerIdx >= j && selectedLayerIdx < i) selectedLayerIdx++;
  composite();
  refreshSelectionOverlay();
  updateLayerPanel();
}

function mergeLayerDown(i) {
  if (!paintActive || i <= 0 || !layers[i] || !layers[i - 1]) return;
  saveUndoState();
  const below = layers[i - 1];
  const above = layers[i];
  below.canvas.getContext('2d').drawImage(above.canvas, 0, 0);
  below.name = below.name + ' + ' + above.name;
  below.type = below.type === 'background' ? 'background' : 'pen';
  delete below.shape;
  delete below.text;
  layers.splice(i, 1);
  activeLayerIdx = i - 1;
  selectedLayerIdx = -1;
  clearOverlay();
  composite();
  refreshToolOptions();
  updateLayerPanel();
}

function deleteLayer(i) {
  if (!layers[i] || layers.length <= 1) return;
  saveUndoState();
  layers.splice(i, 1);
  activeLayerIdx = Math.min(activeLayerIdx, layers.length - 1);
  if (selectedLayerIdx === i) selectedLayerIdx = -1;
  else if (selectedLayerIdx > i) selectedLayerIdx--;
  clearOverlay();
  composite();
  refreshToolOptions();
  updateLayerPanel();
}

function refreshSelectionOverlay() {
  clearOverlay();
  const selected = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (selected?.type === 'shape') {
    document.getElementById('shapesAccordion')?.classList.add('open');
    drawHandles(selected.shape);
    updateShapeStylePanel(selected.shape);
  } else if (selected?.type === 'text') {
    drawTextHandles(selected.text);
    const st = selected.text.defaultStyle || {};
    textFontFamily = st.fontFamily || textFontFamily;
    textFontSize = st.fontSize || textFontSize;
    textColour = st.colour || textColour;
    textBold = !!st.bold;
    textItalic = !!st.italic;
    textAlign = st.align || 'left';
    syncTextStylePanel();
  } else {
    updateShapeStylePanel(null);
  }
  refreshToolOptions();
}

// ======================================================= UNDO / REDO
function saveUndoState() {
  if (!paintActive || !layers.length) return;
  undoStack.push(snapshotState());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  const snap = undoStack.pop();
  restoreState(snap);
  updateUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  const snap = redoStack.pop();
  restoreState(snap);
  updateUndoButtons();
}

function updateUndoButtons() {
  document.getElementById('btnUndo').disabled = undoStack.length === 0;
  document.getElementById('btnRedo').disabled = redoStack.length === 0;
}

// ======================================================= DRAWING
// The stroke is accumulated into a path that stays open for the entire
// pointer-down -> pointer-up gesture. We draw the full path each move on
// a TEMPORARY offscreen canvas (strokeCanvas) which is composited on top
// of the layer. Only on pointer-up do we bake it permanently into the layer.
// This gives smooth, consistent colour with no overlapping-segment darkening.

let strokeCanvas = null;   // temp canvas for the in-progress stroke
let strokeCtx    = null;
let strokePoints = [];     // [{x,y,pressure}] for the current stroke

displayCanvas.addEventListener('pointerdown', onPointerDown);
displayCanvas.addEventListener('pointermove', onPointerMove);
displayCanvas.addEventListener('pointerup',   onPointerUp);
displayCanvas.addEventListener('pointerleave',onPointerUp);

function onPointerDown(e) {
  if (!paintActive) return;
  e.preventDefault();
  displayCanvas.setPointerCapture(e.pointerId);
  const { x, y } = canvasCoords(e);

  if (activeTool === 'eyedrop') { pickColour(x, y); return; }
  if (activeTool === 'fill')    { floodFill(x, y);  return; }
  if (activeTool === 'select')  { return; }   // handled by overlayCanvas
  if (activeTool === 'crop')    { return; }   // handled by overlayCanvas
  if (activeTool === 'text')    { placeTextbox(e);  return; }
  if (SHAPE_TOOLS.has(activeTool)) { startShapeDraw(e); return; }

  saveUndoState();
  isDrawing    = true;
  lastX = x; lastY = y;
  strokePoints = [{ x, y, pressure: e.pressure > 0 ? e.pressure : 1 }];

  // Prepare a fresh stroke canvas
  strokeCanvas        = document.createElement('canvas');
  strokeCanvas.width  = canvasW;
  strokeCanvas.height = canvasH;
  strokeCtx           = strokeCanvas.getContext('2d');

  renderStroke();
}

function onPointerMove(e) {
  if (!paintActive) return;
  if (SHAPE_TOOLS.has(activeTool)) { updateShapeDraw(e); return; }
  if (!isDrawing) return;
  e.preventDefault();
  const { x, y } = canvasCoords(e);
  const pressure  = e.pressure > 0 ? e.pressure : 1;
  strokePoints.push({ x, y, pressure });
  lastX = x; lastY = y;
  renderStroke();
}

function onPointerUp(e) {
  if (SHAPE_TOOLS.has(activeTool)) { finishShapeDraw(e); return; }
  if (!isDrawing) return;
  isDrawing = false;
  // Bake the completed stroke into the active layer permanently
  if (strokeCanvas) {
    const ctx = activeLayerCtx();
    if (ctx) {
      if (activeTool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = brushOpacity;
        ctx.drawImage(strokeCanvas, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(strokeCanvas, 0, 0);
      }
    }
    strokeCanvas = null;
    strokeCtx    = null;
    strokePoints = [];
    composite();
  }
}

function renderStroke() {
  if (!strokeCtx || strokePoints.length === 0) return;

  // Clear the stroke canvas and redraw the whole stroke from scratch.
  // Drawing on a blank canvas in one pass means no segment overlaps,
  // so opacity stays perfectly uniform across the entire stroke.
  strokeCtx.clearRect(0, 0, canvasW, canvasH);

  const pts = strokePoints;

  if (activeTool === 'eraser') {
    strokeCtx.globalCompositeOperation = 'source-over';
    strokeCtx.strokeStyle = '#000000';
    strokeCtx.fillStyle   = '#000000';
    strokeCtx.globalAlpha = 1;
  } else {
    strokeCtx.globalCompositeOperation = 'source-over';
    strokeCtx.strokeStyle = activeColour;
    strokeCtx.fillStyle   = activeColour;
    strokeCtx.globalAlpha = brushOpacity;
  }
  strokeCtx.lineCap  = 'round';
  strokeCtx.lineJoin = 'round';

  if (pts.length === 1) {
    // Single tap - draw a circle
    const p = pts[0];
    strokeCtx.lineWidth = brushSize * p.pressure;
    strokeCtx.beginPath();
    strokeCtx.arc(p.x, p.y, (brushSize * p.pressure) / 2, 0, Math.PI * 2);
    strokeCtx.fill();
  } else {
    // Multi-point stroke - draw as a single open path
    // Use average pressure for consistent width; variable-width would require
    // rebuilding as filled polygons (stage 2+ enhancement)
    const avgPressure = pts.reduce((s, p) => s + p.pressure, 0) / pts.length;
    strokeCtx.lineWidth = brushSize * avgPressure;
    strokeCtx.beginPath();
    strokeCtx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      // Smooth with midpoint quadratic curves
      const mx = (pts[i].x + pts[i+1].x) / 2;
      const my = (pts[i].y + pts[i+1].y) / 2;
      strokeCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    // Final segment to last point
    const last = pts[pts.length - 1];
    strokeCtx.lineTo(last.x, last.y);
    strokeCtx.stroke();
  }

  // For eraser: bake strokeCanvas as destination-out onto the layer copy for preview
  // Composite: layer + stroke on top
  dc.clearRect(0, 0, canvasW, canvasH);
  layers.forEach((l, i) => {
    if (!l.visible) return;
    if (i === activeLayerIdx && activeTool === 'eraser') {
      // Draw layer, then erase
      const tmp = document.createElement('canvas');
      tmp.width = canvasW; tmp.height = canvasH;
      const tCtx = tmp.getContext('2d');
      tCtx.drawImage(l.canvas, 0, 0);
      tCtx.globalCompositeOperation = 'destination-out';
      tCtx.globalAlpha = brushOpacity;
      tCtx.drawImage(strokeCanvas, 0, 0);
      dc.drawImage(tmp, 0, 0);
    } else if (i === activeLayerIdx) {
      dc.drawImage(l.canvas, 0, 0);
      dc.drawImage(strokeCanvas, 0, 0);
    } else {
      dc.drawImage(l.canvas, 0, 0);
    }
  });
}

// ======================================================= TEXT ENGINE
// Uses contenteditable for per-character styling.
// Key design: toolbar buttons preventDefault() to keep editor focused.
// Selects/inputs save+restore selection via selectionchange event.
// Rendering reads element.style.* inline properties only - no getComputedStyle.

let activeEditor = null;
let _savedRange  = null;
let _savedSelectionOffsets = null;
let _activeSizeInput = null;
let _activeSizeApply = null;
let _activeSizeSelectAll = false;

function buildFontString(size, family, bold, italic) {
  return `${italic?'italic ':''}${bold?'bold ':''}${size}px ${family}`;
}

function saveEditorSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !activeEditor?._div) return;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (el && activeEditor._div.contains(el)) {
    _savedRange = range.cloneRange();
    _savedSelectionOffsets = editorSelectionOffsets(activeEditor._div, range);
  }
}

function restoreEditorSelection() {
  if ((!_savedRange && !_savedSelectionOffsets) || !activeEditor) return;
  const ediv = activeEditor._div;
  if (!ediv) return;
  let range = _savedRange;
  if (_savedSelectionOffsets && (!_savedRange || _savedRange.collapsed)) {
    range = editorRangeFromOffsets(ediv, _savedSelectionOffsets.start, _savedSelectionOffsets.end);
  }
  if (!range) return;
  ediv.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  _savedRange = range.cloneRange();
}

function hasEditorSelection() {
  return !!((_savedRange && !_savedRange.collapsed) ||
    (_savedSelectionOffsets && _savedSelectionOffsets.start !== _savedSelectionOffsets.end));
}

function beginFloatingSizeEdit(input, applyFn) {
  saveEditorSelection();
  _activeSizeInput = input;
  _activeSizeApply = applyFn;
  _activeSizeSelectAll = true;
  input.dataset.editing = 'true';
  input.style.borderColor = '#00e5a0';
  input.style.boxShadow = '0 0 0 1px rgba(0,229,160,.25)';
  restoreEditorSelection();
}

function endFloatingSizeEdit(apply = true) {
  if (!_activeSizeInput) return;
  const input = _activeSizeInput;
  const applyFn = _activeSizeApply;
  _activeSizeInput = null;
  _activeSizeApply = null;
  _activeSizeSelectAll = false;
  input.dataset.editing = '';
  input.style.borderColor = '#3a3f4a';
  input.style.boxShadow = 'none';
  if (apply && applyFn) applyFn();
  else restoreEditorSelection();
}

function syncFloatingSizeValue() {
  if (!_activeSizeInput) return;
  textFontSize = parseInt(_activeSizeInput.value) || 36;
  document.getElementById('textSize').value = textFontSize;
  document.getElementById('textSizeVal').textContent = textFontSize;
}

window.addEventListener('keydown', ev => {
  if (!_activeSizeInput) return;
  const isDigit = /^[0-9]$/.test(ev.key);
  if (isDigit) {
    ev.preventDefault();
    ev.stopPropagation();
    _activeSizeInput.value = _activeSizeSelectAll ? ev.key : (_activeSizeInput.value + ev.key);
    _activeSizeSelectAll = false;
    syncFloatingSizeValue();
    restoreEditorSelection();
    return;
  }
  if (ev.key === 'Backspace' || ev.key === 'Delete') {
    ev.preventDefault();
    ev.stopPropagation();
    _activeSizeInput.value = _activeSizeSelectAll ? '' : _activeSizeInput.value.slice(0, -1);
    _activeSizeSelectAll = false;
    syncFloatingSizeValue();
    restoreEditorSelection();
    return;
  }
  if (ev.key === 'Enter') {
    ev.preventDefault();
    ev.stopPropagation();
    endFloatingSizeEdit(true);
    return;
  }
  if (ev.key === 'Escape') {
    ev.preventDefault();
    ev.stopPropagation();
    endFloatingSizeEdit(false);
    return;
  }
}, true);

document.addEventListener('pointerdown', ev => {
  if (!_activeSizeInput || ev.target === _activeSizeInput) return;
  endFloatingSizeEdit(true);
}, true);

function editorSelectionOffsets(root, range) {
  const startRange = document.createRange();
  startRange.selectNodeContents(root);
  startRange.setEnd(range.startContainer, range.startOffset);
  const endRange = document.createRange();
  endRange.selectNodeContents(root);
  endRange.setEnd(range.endContainer, range.endOffset);
  return { start: startRange.toString().length, end: endRange.toString().length };
}

function editorRangeFromOffsets(root, start, end) {
  const range = document.createRange();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startSet = false;
  let endSet = false;
  let node;
  while ((node = walker.nextNode())) {
    const next = pos + node.textContent.length;
    if (!startSet && start <= next) {
      range.setStart(node, Math.max(0, start - pos));
      startSet = true;
    }
    if (!endSet && end <= next) {
      range.setEnd(node, Math.max(0, end - pos));
      endSet = true;
      break;
    }
    pos = next;
  }
  if (!startSet) range.setStart(root, root.childNodes.length);
  if (!endSet) range.setEnd(root, root.childNodes.length);
  return range;
}

// -- Place new textbox -----------------------------------------------------
function escapeTextHtml(text) {
  return String(text).replace(/[&<>]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[ch]));
}

function escapeAttrHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function wrapSelectionStyles(styles) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  wrapEditorRange(sel.getRangeAt(0), styles, true);
}

function wrapEditorRange(range, styles, focusEditor) {
  if (!activeEditor?._div || !range || range.collapsed) return;
  const frag = range.extractContents();
  const span = document.createElement('span');
  Object.assign(span.style, styles);
  span.appendChild(frag);
  range.insertNode(span);
  const nr = document.createRange();
  nr.selectNodeContents(span);
  if (focusEditor) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(nr);
  }
  _savedRange = nr.cloneRange();
  _savedSelectionOffsets = editorSelectionOffsets(activeEditor._div, nr);
}

function savedEditorRange() {
  if (!activeEditor?._div) return null;
  if (_savedSelectionOffsets) {
    return editorRangeFromOffsets(activeEditor._div, _savedSelectionOffsets.start, _savedSelectionOffsets.end);
  }
  return _savedRange;
}

function applyEditorStyle(styles, opts = {}) {
  if (!activeEditor) return;
  const focusEditor = opts.focusEditor !== false;
  if (hasEditorSelection()) {
    wrapEditorRange(savedEditorRange(), styles, focusEditor);
  } else {
    Object.assign(activeEditor._div.style, styles);
  }
  if (focusEditor) {
    activeEditor._div.focus();
    restoreEditorSelection();
  }
}

function serialiseEditorHtml(ediv) {
  const pieces = [];

  function appendStyledText(text, sourceEl) {
    if (!text) return;
    const cs = getComputedStyle(sourceEl || ediv);
    const fontSize = parseFloat(cs.fontSize) || textFontSize;
    const fontFamily = cs.fontFamily || textFontFamily;
    const colour = cs.color || textColour;
    const fontWeight = cs.fontWeight || '400';
    const fontStyle = cs.fontStyle || 'normal';
    pieces.push('<span style="font-family:' + escapeAttrHtml(fontFamily) + ';font-size:' + fontSize + 'px;color:' + escapeAttrHtml(colour) + ';font-weight:' + escapeAttrHtml(fontWeight) + ';font-style:' + escapeAttrHtml(fontStyle) + ';">' + escapeTextHtml(text) + '</span>');
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      appendStyledText(node.textContent, node.parentElement || ediv);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;
    if (tag === 'BR') {
      pieces.push('<br>');
      return;
    }
    const isBlock = tag === 'DIV' || tag === 'P';
    if (isBlock && pieces.length && pieces[pieces.length - 1] !== '<br>') pieces.push('<br>');
    for (const child of node.childNodes) walk(child);
  }

  for (const child of ediv.childNodes) walk(child);
  return pieces.join('');
}

function editorHtmlForEditing(textObj) {
  if (!textObj?.html) return '';
  const sy = textObj.scaleY || 1;
  if (Math.abs(sy - 1) < 0.001) return textObj.html;
  const scratch = document.createElement('div');
  scratch.innerHTML = textObj.html;
  scratch.querySelectorAll('[style]').forEach(el => {
    const rawPx = parseFloat(el.style.fontSize);
    if (rawPx) el.style.fontSize = (rawPx / sy) + 'px';
  });
  return scratch.innerHTML;
}

function placeTextbox(e) {
  if (!paintActive) return;
  if (activeEditor) commitEditor();
  resetTextDefaults();
  const { x, y } = canvasCoords(e);
  openEditor(x, y, null, -1);
}

function resetTextDefaults() {
  textFontFamily = DEFAULT_TEXT_STYLE.fontFamily;
  textFontSize   = DEFAULT_TEXT_STYLE.fontSize;
  textColour     = DEFAULT_TEXT_STYLE.colour;
  textBold       = DEFAULT_TEXT_STYLE.bold;
  textItalic     = DEFAULT_TEXT_STYLE.italic;
  textAlign      = DEFAULT_TEXT_STYLE.align;
  syncTextStylePanel();
}

// -- Re-edit existing layer ------------------------------------------------
function reopenTextLayer(layerIdx) {
  if (activeEditor) commitEditor();
  const layer = layers[layerIdx];
  if (!layer || layer.type !== 'text') return;
  const t = layer.text;
  textFontFamily = t.defaultStyle.fontFamily;
  textFontSize   = t.defaultStyle.fontSize;
  textColour     = t.defaultStyle.colour;
  textBold       = t.defaultStyle.bold;
  textItalic     = t.defaultStyle.italic;
  textAlign      = t.defaultStyle.align || 'left';
  syncTextStylePanel();
  layer.canvas.getContext('2d').clearRect(0, 0, canvasW, canvasH);
  composite();
  openEditor(t.x, t.y, t, layerIdx);
}

// -- Open editor -----------------------------------------------------------
function openEditor(canvasX, canvasY, existingText, layerIdx) {
  const cr     = displayCanvas.getBoundingClientRect();
  const viewScaleY = cr.height / canvasH;
  const viewScaleX = cr.width  / canvasW;
  const screenX = cr.left + canvasX * viewScaleX;
  const screenY = cr.top  + canvasY * viewScaleY;

  // -- Wrapper ----------------------------------------------------------
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position:'fixed', left:screenX+'px', top:screenY+'px', zIndex:'600',
    display:'flex', flexDirection:'column', minWidth:'280px',
    boxShadow:'0 4px 24px rgba(0,0,0,0.7)', borderRadius:'6px',
    maxWidth:(cr.width*0.85)+'px',
  });

  // -- Toolbar ----------------------------------------------------------
  const tb = document.createElement('div');
  Object.assign(tb.style, {
    background:'#1c1f26', border:'1px solid #00e5a0', borderBottom:'none',
    borderRadius:'6px 6px 0 0', padding:'5px 7px',
    display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap',
    userSelect:'none',
  });

  // Button that keeps editor focused via preventDefault on mousedown
  function mkBtn(html, title, action) {
    const b = document.createElement('button');
    b.innerHTML = html; b.title = title;
    Object.assign(b.style, {
      background:'#252830', border:'1px solid #3a3f4a', color:'#d0d4e0',
      borderRadius:'4px', padding:'2px 8px', cursor:'pointer',
      fontFamily:'IBM Plex Mono,monospace', fontSize:'12px', lineHeight:'1.5',
      flexShrink:'0',
    });
    b.addEventListener('mousedown', ev => {
      ev.preventDefault(); // keeps contenteditable focused + selection intact
      action(b);
    });
    return b;
  }

  // Bold
  const btnB = mkBtn('<b>B</b>', 'Bold (Ctrl+B)', () => {
    textBold = !textBold;
    applyEditorStyle({ fontWeight: textBold ? '700' : '400' });
    syncTextStylePanel();
  });

  // Italic
  const btnI = mkBtn('<i>I</i>', 'Italic (Ctrl+I)', () => {
    textItalic = !textItalic;
    applyEditorStyle({ fontStyle: textItalic ? 'italic' : 'normal' });
    syncTextStylePanel();
  });

  // Font size - uses mousedown to save selection before input steals focus
  const sizeInp = document.createElement('input');
  sizeInp.type='text'; sizeInp.inputMode='numeric'; sizeInp.pattern='[0-9]*';
  sizeInp.value = textFontSize; sizeInp.title='Size px';
  Object.assign(sizeInp.style, {
    width:'52px', background:'#252830', border:'1px solid #3a3f4a', color:'#d0d4e0',
    borderRadius:'4px', padding:'2px 4px', fontSize:'11px',
    fontFamily:'IBM Plex Mono,monospace',
  });
  function focusSizeInput(ev) {
    ev.preventDefault();
    beginFloatingSizeEdit(sizeInp, applyFloatingTextSize);
  }
  sizeInp.addEventListener('pointerdown', focusSizeInput, true);
  sizeInp.addEventListener('mousedown', focusSizeInput, true);
  const applyFloatingTextSize = (focusEditor = true) => {
    const px = parseInt(sizeInp.value)||36;
    applyEditorStyle({ fontSize: px+'px' }, { focusEditor });
    textFontSize = parseInt(sizeInp.value)||36;
    document.getElementById('textSize').value = textFontSize;
    document.getElementById('textSizeVal').textContent = textFontSize;
  };
  sizeInp.addEventListener('input', () => {
    textFontSize = parseInt(sizeInp.value)||36;
    document.getElementById('textSize').value = textFontSize;
    document.getElementById('textSizeVal').textContent = textFontSize;
  });
  sizeInp.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); applyFloatingTextSize(); }
    if (ev.key === 'Escape') { ev.preventDefault(); activeEditor?._div?.focus(); restoreEditorSelection(); }
  });
  sizeInp.addEventListener('change', applyFloatingTextSize);

  // Font family
  const fontSel = document.createElement('select');
  [['sans-serif','Sans'],['serif','Serif'],['monospace','Mono'],
   ['cursive','Cursive'],['Arial','Arial'],['Georgia','Georgia'],
   ['Impact','Impact'],['Comic Sans MS','Comic Sans'],
  ].forEach(([v,l]) => { const o=document.createElement('option'); o.value=v; o.textContent=l; fontSel.appendChild(o); });
  fontSel.value = textFontFamily;
  Object.assign(fontSel.style, {
    background:'#252830', border:'1px solid #3a3f4a', color:'#d0d4e0',
    borderRadius:'4px', padding:'2px 4px', fontSize:'11px', cursor:'pointer',
  });
  fontSel.addEventListener('mousedown', saveEditorSelection);
  fontSel.addEventListener('change', () => {
    textFontFamily = fontSel.value;
    document.getElementById('textFont').value = textFontFamily;
    applyEditorStyle({ fontFamily: textFontFamily });
  });

  // Colour
  const colInp = document.createElement('input');
  colInp.type='color'; colInp.value=textColour; colInp.title='Colour';
  Object.assign(colInp.style, {
    width:'28px', height:'24px', padding:'0 2px', border:'none',
    borderRadius:'4px', cursor:'pointer',
  });
  colInp.addEventListener('mousedown', saveEditorSelection);
  colInp.addEventListener('input', () => {
    textColour = colInp.value;
    document.getElementById('textColourSwatch').style.background = textColour;
    document.getElementById('textColourPicker').value = textColour;
    applyEditorStyle({ color: textColour });
  });

  // Done
  const btnDone = mkBtn('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Done</span>','Commit text', () => {
    if (_activeSizeInput === sizeInp) endFloatingSizeEdit(true);
    commitEditor();
  });
  Object.assign(btnDone.style, {background:'#00e5a0', color:'#000', marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:'5px'});

  tb.append(fontSel, sizeInp, colInp, btnB, btnI, btnDone);

  // -- Contenteditable div -----------------------------------------------
  const ediv = document.createElement('div');
  ediv.contentEditable = 'true';
  ediv.spellcheck = false;
  Object.assign(ediv.style, {
    background:'rgba(255,255,255,0.95)', border:'1px solid #00e5a0', borderTop:'none',
    outline:'none', padding:'6px 8px', lineHeight:'1.4', cursor:'text',
    whiteSpace:'pre-wrap', wordBreak:'break-word', minHeight:'1.6em',
    borderRadius:'0 0 6px 6px', overflowY:'auto', maxHeight:'60vh',
    fontFamily: textFontFamily,
    fontSize:   textFontSize+'px',
    color:      textColour,
    fontWeight: textBold   ? 'bold'   : 'normal',
    fontStyle:  textItalic ? 'italic' : 'normal',
  });
  ediv.dataset.canvasX  = canvasX;
  ediv.dataset.canvasY  = canvasY;
  ediv.dataset.scaleY   = 1;
  ediv.dataset.layerIdx = layerIdx;

  // Restore existing content if re-editing
  if (existingText?.html) ediv.innerHTML = editorHtmlForEditing(existingText);

  // Track selection continuously
  document.addEventListener('selectionchange', saveEditorSelection);

  ediv.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); cancelEditor(); }
    if ((ev.ctrlKey||ev.metaKey) && ev.key==='b') { ev.preventDefault(); toggleTextBold(); }
    if ((ev.ctrlKey||ev.metaKey) && ev.key==='i') { ev.preventDefault(); toggleTextItalic(); }
  });

  ediv.addEventListener('blur', () => {
    setTimeout(() => {
      const textPanel = document.getElementById('textStylePanel');
      if (activeEditor && !wrapper.contains(document.activeElement) && !textPanel?.contains(document.activeElement)) commitEditor();
    }, 100);
  });

  wrapper.append(tb, ediv);
  document.body.appendChild(wrapper);
  activeEditor = wrapper;
  activeEditor._div     = ediv;
  activeEditor._scaleY  = 1;
  activeEditor._scaleX  = 1;
  activeEditor._layerIdx = layerIdx;
  activeEditor._canvasX = canvasX;
  activeEditor._canvasY = canvasY;

  ediv.focus();
  // Cursor to end
  const r = document.createRange();
  r.selectNodeContents(ediv);
  r.collapse(false);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
  saveEditorSelection();
}

// -- Wrap selection in a span with one style property ---------------------
function wrapSelection(prop, value) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount===0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const frag  = range.extractContents();
  const span  = document.createElement('span');
  span.style[prop] = value;
  span.appendChild(frag);
  range.insertNode(span);
  const nr = document.createRange();
  nr.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(nr);
  _savedRange = nr.cloneRange();
  _savedSelectionOffsets = editorSelectionOffsets(activeEditor._div, nr);
}

// -- Commit ----------------------------------------------------------------
function commitEditor() {
  if (!activeEditor) return;
  document.removeEventListener('selectionchange', saveEditorSelection);
  const wrapper   = activeEditor;
  const ediv      = wrapper._div;
  const scaleY    = wrapper._scaleY;
  const layerIdx  = wrapper._layerIdx;
  const canvasX   = wrapper._canvasX;
  const canvasY   = wrapper._canvasY;
  activeEditor    = null;
  _savedRange     = null;
  _savedSelectionOffsets = null;
  if (_activeSizeInput) endFloatingSizeEdit(false);

  const html      = serialiseEditorHtml(ediv);
  const plainText = ediv.innerText.trim();
  const defStyle  = {
    fontFamily: textFontFamily, fontSize: textFontSize,
    colour: textColour, bold: textBold, italic: textItalic, align: textAlign,
  };

  if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  if (!plainText) { editingLayerIdx=-1; selectTool('select'); return; }

  const textObj = { x:canvasX, y:canvasY, html, scaleY, defaultStyle:defStyle };

  if (layerIdx>=0 && layers[layerIdx]?.type==='text') {
    layers[layerIdx].text = textObj;
    layers[layerIdx].name = 'Text: '+plainText.slice(0,12)+(plainText.length>12?'...':'');
    renderTextToLayer(layers[layerIdx]);
    editingLayerIdx = -1;
  } else {
    saveUndoState();
    const layer = createTextLayer(textObj, plainText);
    layers.push(layer);
    selectedLayerIdx = layers.length-1;
    activeLayerIdx = selectedLayerIdx;
  }
  composite();
  updateLayerPanel();
  selectTool('select');
}

function cancelEditor() {
  if (!activeEditor) return;
  document.removeEventListener('selectionchange', saveEditorSelection);
  const wrapper  = activeEditor;
  const layerIdx = wrapper._layerIdx;
  activeEditor   = null;
  _savedRange    = null;
  _savedSelectionOffsets = null;
  if (_activeSizeInput) endFloatingSizeEdit(false);
  if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  if (layerIdx>=0 && layers[layerIdx]) { renderTextToLayer(layers[layerIdx]); composite(); }
  editingLayerIdx = -1;
  selectTool('select');
}

// -- Left-panel controls (affect whole editor default or selected text) ----
function updateTextStyle() {
  textFontFamily = document.getElementById('textFont').value;
  textFontSize   = parseInt(document.getElementById('textSize').value);
  textAlign      = document.getElementById('textAlign').value;
  if (!activeEditor) return;
  const ediv = activeEditor._div;
  ediv.style.textAlign = textAlign;
  if (hasEditorSelection()) {
    applyEditorStyle({ fontFamily: textFontFamily, fontSize: textFontSize+'px' });
  } else {
    ediv.style.fontFamily = textFontFamily;
    ediv.style.fontSize   = textFontSize+'px';
  }
}

function openTextColourPicker() {
  saveEditorSelection();
  document.getElementById('textColourPicker').click();
}

function setTextColour(hex) {
  textColour = hex;
  document.getElementById('textColourSwatch').style.background = hex;
  document.getElementById('textColourPicker').value = hex;
  if (activeEditor) {
    restoreEditorSelection();
    if (hasEditorSelection()) {
      applyEditorStyle({ color: hex });
    } else {
      activeEditor._div.style.color = hex;
    }
  } else if (selectedLayerIdx>=0 && layers[selectedLayerIdx]?.type==='text') {
    const tl = layers[selectedLayerIdx];
    tl.text.defaultStyle.colour = hex;
    renderTextToLayer(tl); composite();
  }
}

function toggleTextBold() {
  textBold = !textBold;
  const btn = document.getElementById('btnBold');
  btn.style.background = textBold ? 'var(--accent)' : '';
  btn.style.color      = textBold ? '#000' : '';
  if (activeEditor) applyEditorStyle({ fontWeight: textBold ? '700' : '400' });
}

function toggleTextItalic() {
  textItalic = !textItalic;
  const btn = document.getElementById('btnItalic');
  btn.style.background = textItalic ? 'var(--accent)' : '';
  btn.style.color      = textItalic ? '#000' : '';
  if (activeEditor) applyEditorStyle({ fontStyle: textItalic ? 'italic' : 'normal' });
}

function applyFormatToSelection() {}  // compat stub

// -- Create + render layers ------------------------------------------------
function createTextLayer(textObj, plainText) {
  const c = document.createElement('canvas');
  c.width = canvasW; c.height = canvasH;
  const label = (plainText||'').slice(0,12);
  const layer = {
    id: Date.now()+Math.random(),
    name: 'Text: '+label+(label.length>=12?'...':''),
    canvas:c, visible:true, type:'text', text:textObj
  };
  renderTextToLayer(layer);
  return layer;
}

function textRunsFromHtml(t) {
  const sy  = t.scaleY || 1;
  const def = t.defaultStyle || { fontFamily:textFontFamily, fontSize:textFontSize,
    colour:textColour, bold:false, italic:false };

  const scratch = document.createElement('div');
  scratch.innerHTML = t.html || t.text || '';

  const defCanv = {
    fontSize:   def.fontSize,
    fontFamily: def.fontFamily,
    colour:     def.colour,
    bold:       def.bold||false,
    italic:     def.italic||false,
  };

  function styleFrom(el, parent) {
    if (el.nodeType !== Node.ELEMENT_NODE) return parent;
    const st = { ...parent };
    const s = el.style || {};
    const rawPx = parseFloat(s.fontSize);
    const face = el.getAttribute?.('face');
    const colourAttr = el.getAttribute?.('color');
    const weight = String(s.fontWeight || '').toLowerCase();
    if (rawPx) st.fontSize = rawPx / sy;
    if (s.fontFamily || face) st.fontFamily = String(s.fontFamily || face).replace(/['"]/g,'').split(',')[0].trim();
    if (s.color || colourAttr) st.colour = s.color || colourAttr;
    if (weight === 'bold' || parseInt(weight) >= 600 || el.tagName === 'B' || el.tagName === 'STRONG') st.bold = true;
    else if (weight === 'normal' || weight === '400') st.bold = false;
    if (s.fontStyle === 'italic' || el.tagName === 'I' || el.tagName === 'EM') st.italic = true;
    else if (s.fontStyle === 'normal') st.italic = false;
    return st;
  }

  const lines = [[]];
  function newline() {
    lines.push([]);
  }
  function addText(text, style) {
    if (!text) return;
    const parts = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    parts.forEach((part, i) => {
      if (i > 0) newline();
      if (part) lines[lines.length - 1].push({ text: part, style: { ...style } });
    });
  }
  function walk(node, style) {
    if (node.nodeType === Node.TEXT_NODE) { addText(node.textContent, style); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;
    if (tag === 'BR') { newline(); return; }
    const isBlock = tag === 'DIV' || tag === 'P';
    if (isBlock && lines[lines.length - 1].length) newline();
    const nextStyle = styleFrom(node, style);
    for (const child of node.childNodes) walk(child, nextStyle);
    if (isBlock && lines[lines.length - 1].length) newline();
  }

  for (const child of scratch.childNodes) walk(child, defCanv);
  while (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

function textLineLayout(ctx, line, defaultLineH) {
  if (!line.length) return { lineH: defaultLineH, baselineOffset: 0 };
  const maxSize = Math.max(...line.map(run => run.style.fontSize || textFontSize));
  const lineH = maxSize * 1.4;
  let ascent = 0;
  let descent = 0;
  line.forEach(run => {
    const st = run.style;
    const fontSize = st.fontSize || textFontSize;
    ctx.font = buildFontString(fontSize, st.fontFamily, st.bold, st.italic);
    const metrics = ctx.measureText(run.text || 'Mg');
    ascent = Math.max(ascent, metrics.actualBoundingBoxAscent || fontSize * 0.8);
    descent = Math.max(descent, metrics.actualBoundingBoxDescent || fontSize * 0.2);
  });
  const contentH = ascent + descent;
  return { lineH, baselineOffset: Math.max(ascent, (lineH - contentH) / 2 + ascent) };
}

function renderTextToLayer(layer) {
  const ctx = layer.canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasW, canvasH);
  const t = layer.text;
  if (!t.html && !t.text) return;

  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
  const lines = textRunsFromHtml(t);
  let curY = t.y;

  const defaultLineH = ((t.defaultStyle?.fontSize || textFontSize) * 1.4);
  lines.forEach(line => {
    const { lineH, baselineOffset } = textLineLayout(ctx, line, defaultLineH);
    const baselineY = curY + baselineOffset;
    let curX = t.x;
    line.forEach(run => {
      const st = run.style;
      ctx.font = buildFontString(st.fontSize, st.fontFamily, st.bold, st.italic);
      ctx.fillStyle = st.colour;
      ctx.fillText(run.text, curX, baselineY);
      curX += ctx.measureText(run.text).width;
    });
    curY += lineH;
  });
}

function _getTextBounds(t) {
  const tmp = document.createElement('canvas').getContext('2d');
  const lines = textRunsFromHtml(t);
  let maxW = 10;
  let totalH = 0;
  const defaultLineH = ((t.defaultStyle?.fontSize || textFontSize) * 1.4);
  lines.forEach(line => {
    let lineW = 0;
    const { lineH } = textLineLayout(tmp, line, defaultLineH);
    line.forEach(run => {
      const st = run.style;
      tmp.font = buildFontString(st.fontSize, st.fontFamily, st.bold, st.italic);
      lineW += tmp.measureText(run.text).width;
    });
    maxW = Math.max(maxW, lineW);
    totalH += lineH;
  });
  return { w: maxW, h: Math.max(20, totalH) };
}

function syncTextStylePanel() {
  document.getElementById('textFont').value          = textFontFamily;
  document.getElementById('textSize').value          = textFontSize;
  document.getElementById('textSizeVal').textContent = textFontSize;
  document.getElementById('textAlign').value         = textAlign;
  document.getElementById('textColourSwatch').style.background = textColour;
  document.getElementById('textColourPicker').value  = textColour;
  document.getElementById('btnBold').style.background   = textBold   ? 'var(--accent)' : '';
  document.getElementById('btnBold').style.color        = textBold   ? '#000' : '';
  document.getElementById('btnItalic').style.background = textItalic ? 'var(--accent)' : '';
  document.getElementById('btnItalic').style.color      = textItalic ? '#000' : '';
}

function commitTextarea() { commitEditor(); }
function cancelTextarea()  { cancelEditor(); }

// ======================================================= SHAPE ENGINE

// -- Overlay helpers -------------------------------------------------------
function clearOverlay() {
  oc.clearRect(0, 0, canvasW, canvasH);
}

// -- Create a shape layer --------------------------------------------------
function createShapeLayer(shapeObj) {
  const c = document.createElement('canvas');
  c.width = canvasW; c.height = canvasH;
  const layer = {
    id: Date.now() + Math.random(),
    name: capFirst(shapeObj.type),
    canvas: c,
    visible: true,
    type: 'shape',
    shape: shapeObj
  };
  renderShapeToLayer(layer);
  return layer;
}

function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// -- Render a shape object onto its layer canvas ---------------------------
function renderShapeToLayer(layer) {
  const ctx = layer.canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasW, canvasH);
  const s = layer.shape;
  ctx.save();
  // Rotate around shape centre
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate((s.rotation || 0) * Math.PI / 180);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = s.opacity ?? 1;
  ctx.fillStyle   = s.fillColour;
  ctx.strokeStyle = s.strokeColour;
  ctx.lineWidth   = s.strokeWidth;
  const earlyReturn = drawShapePath(ctx, s);
  if (!earlyReturn) {
    if (s.fillColour !== 'none') ctx.fill();
    if (s.strokeWidth > 0 && s.strokeColour !== 'none') ctx.stroke();
    ctx.restore();
  }
}

// -- Draw the path for a shape (no fill/stroke calls - caller decides) -----
function drawShapePath(ctx, s) {
  const { x, y, w, h, type } = s;
  const cx = x + w/2, cy = y + h/2;
  const rx = Math.abs(w/2), ry = Math.abs(h/2);

  ctx.beginPath();
  switch(type) {
    case 'rect':
      ctx.rect(x, y, w, h);
      break;

    case 'circle':
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      break;

    case 'line':
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      break;

    case 'arrow': {
      // Line from (x,y) to (x+w,y+h) with arrowhead at end
      const ex = x + w, ey = y + h;
      const angle = Math.atan2(ey - y, ex - x);
      const headLen = Math.max(20, Math.sqrt(w*w+h*h) * 0.18);
      const headAngle = Math.PI / 6;
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle - headAngle), ey - headLen * Math.sin(angle - headAngle));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(angle + headAngle), ey - headLen * Math.sin(angle + headAngle));
      break;
    }

    case 'star': {
      const outerR = Math.min(rx, ry);
      const innerR = outerR * 0.42;
      const pts    = 5;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI / pts) - Math.PI / 2;
        i === 0 ? ctx.moveTo(cx + r*Math.cos(a), cy + r*Math.sin(a))
                : ctx.lineTo(cx + r*Math.cos(a), cy + r*Math.sin(a));
      }
      ctx.closePath();
      break;
    }

    case 'speech': {
      const corner = s.tailCorner || 'bl';
      const tailTop = corner[0] === 't';
      const tailLeft = corner[1] === 'l';
      const tailH = Math.min(Math.max(12, Math.abs(h) * 0.28), Math.abs(h) * 0.45);
      const bx = x;
      const by = tailTop ? y + tailH : y;
      const bw = w;
      const bh = Math.max(4, h - tailH);
      const bb = by + bh;
      const r = Math.min(Math.abs(bw), Math.abs(bh)) * 0.12;
      const tailBase = Math.min(Math.abs(w) * 0.28, Math.max(18, Math.abs(w) * 0.2));
      const tailInset = Math.max(r, tailBase * 0.35);

      ctx.moveTo(bx + r, by);
      if (tailTop && tailLeft) {
        ctx.lineTo(bx + tailInset, by);
        ctx.lineTo(x, y);
        ctx.lineTo(bx + tailInset + tailBase, by);
      } else if (tailTop) {
        ctx.lineTo(bx + bw - tailInset - tailBase, by);
        ctx.lineTo(x + w, y);
        ctx.lineTo(bx + bw - tailInset, by);
      }
      ctx.lineTo(bx + bw - r, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, bb - r);
      ctx.quadraticCurveTo(bx + bw, bb, bx + bw - r, bb);
      if (!tailTop && !tailLeft) {
        ctx.lineTo(bx + bw - tailInset, bb);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(bx + bw - tailInset - tailBase, bb);
      } else if (!tailTop) {
        ctx.lineTo(bx + tailInset + tailBase, bb);
        ctx.lineTo(x, y + h);
        ctx.lineTo(bx + tailInset, bb);
      }
      ctx.lineTo(bx + r, bb);
      ctx.quadraticCurveTo(bx, bb, bx, bb - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      break;
    }

    case 'thought': {
      const bubbles = [
        { x: cx - rx * 0.28, y: cy - ry * 0.08, r: Math.min(rx, ry) * 0.48 },
        { x: cx + rx * 0.10, y: cy - ry * 0.24, r: Math.min(rx, ry) * 0.52 },
        { x: cx + rx * 0.42, y: cy + ry * 0.02, r: Math.min(rx, ry) * 0.42 },
        { x: cx - rx * 0.02, y: cy + ry * 0.18, r: Math.min(rx, ry) * 0.50 }
      ];
      bubbles.forEach(b => {
        ctx.moveTo(b.x + b.r, b.y);
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      });
      const tail1 = Math.min(rx, ry) * 0.16;
      const tail2 = Math.min(rx, ry) * 0.10;
      ctx.moveTo(x + w * 0.28 + tail1, y + h * 0.82);
      ctx.arc(x + w * 0.28, y + h * 0.82, tail1, 0, Math.PI * 2);
      ctx.moveTo(x + w * 0.16 + tail2, y + h * 0.96);
      ctx.arc(x + w * 0.16, y + h * 0.96, tail2, 0, Math.PI * 2);
      break;
    }
  }
}

function hitTestShape(shape, px, py) {
  const { x, y, w, h, rotation } = shape;
  const cx = x + w/2, cy = y + h/2;
  // Un-rotate the point
  const angle = -(rotation || 0) * Math.PI / 180;
  const dx = px - cx, dy = py - cy;
  const lx = cx + dx*Math.cos(angle) - dy*Math.sin(angle);
  const ly = cy + dx*Math.sin(angle) + dy*Math.cos(angle);

  const pad = 10;
  if (shape.type === 'line' || shape.type === 'arrow') {
    // Distance from point to line segment
    const ex = x+w, ey = y+h;
    const seg = Math.sqrt((ex-x)**2+(ey-y)**2);
    if (seg === 0) return Math.sqrt((lx-x)**2+(ly-y)**2) < pad+8;
    const t = Math.max(0,Math.min(1,((lx-x)*(ex-x)+(ly-y)*(ey-y))/(seg*seg)));
    const nx = x+t*(ex-x), ny = y+t*(ey-y);
    return Math.sqrt((lx-nx)**2+(ly-ny)**2) < (shape.strokeWidth||2)+pad;
  }
  return lx >= x-pad && lx <= x+w+pad && ly >= y-pad && ly <= y+h+pad;
}

// -- Draw selection box around text ---------------------------------------
function drawTextHandles(t) {
  clearOverlay();
  const { w, h } = _getTextBounds(t);
  const pad   = 6;
  oc.strokeStyle = 'rgba(0,229,160,0.8)';
  oc.lineWidth   = 1.5;
  oc.setLineDash([6, 4]);
  oc.strokeRect(t.x - pad, t.y - pad, w + pad*2, h + pad*2);
  oc.setLineDash([]);
  // Move handle (centre dot)
  oc.fillStyle = '#fff';
  oc.strokeStyle = '#00e5a0';
  oc.lineWidth = 2;
  oc.beginPath();
  oc.arc(t.x + w/2, t.y + h/2, 6, 0, Math.PI*2);
  oc.fill(); oc.stroke();
}

// -- Hit test text layers -------------------------------------------------
function hitTestText(t, px, py) {
  const { w, h } = _getTextBounds(t);
  const pad = 10;
  return px >= t.x - pad && px <= t.x + w + pad &&
         py >= t.y - pad && py <= t.y + h + pad;
}

// -- Draw selection handles on overlay canvas ------------------------------
const HANDLE_R  = 6;    // handle radius px (canvas coords)
const ROT_DIST  = 30;   // rotation handle distance above top-centre

function drawHandles(shape) {
  clearOverlay();
  const { x, y, w, h, rotation } = shape;
  const cx = x + w/2, cy = y + h/2;
  const angle = (rotation || 0) * Math.PI / 180;

  oc.save();
  oc.translate(cx, cy);
  oc.rotate(angle);
  oc.translate(-cx, -cy);

  // Bounding box
  oc.strokeStyle = 'rgba(0,229,160,0.8)';
  oc.lineWidth   = 1.5;
  oc.setLineDash([6, 4]);
  oc.strokeRect(x, y, w, h);
  oc.setLineDash([]);

  // Scale handles
  const handles = getHandlePositions(shape);
  handles.forEach(h => {
    oc.fillStyle   = '#fff';
    oc.strokeStyle = '#00e5a0';
    oc.lineWidth   = 2;
    oc.beginPath();
    oc.arc(h.x, h.y, HANDLE_R, 0, Math.PI*2);
    oc.fill();
    oc.stroke();
  });

  // Rotation handle
  const rotX = cx, rotY = y - ROT_DIST;
  oc.strokeStyle = 'rgba(0,229,160,0.6)';
  oc.lineWidth   = 1.5;
  oc.beginPath();
  oc.moveTo(cx, y);
  oc.lineTo(rotX, rotY);
  oc.stroke();
  oc.fillStyle   = '#ffcc00';
  oc.strokeStyle = '#00e5a0';
  oc.lineWidth   = 2;
  oc.beginPath();
  oc.arc(rotX, rotY, HANDLE_R, 0, Math.PI*2);
  oc.fill();
  oc.stroke();

  oc.restore();
}

function getHandlePositions(shape) {
  const { x, y, w, h } = shape;
  return [
    { id:'nw', x:x,     y:y     },
    { id:'n',  x:x+w/2, y:y     },
    { id:'ne', x:x+w,   y:y     },
    { id:'e',  x:x+w,   y:y+h/2 },
    { id:'se', x:x+w,   y:y+h   },
    { id:'s',  x:x+w/2, y:y+h   },
    { id:'sw', x:x,     y:y+h   },
    { id:'w',  x:x,     y:y+h/2 },
  ];
}

// Transform a point from screen-rotated space back to canvas coords
function unrotatePoint(shape, px, py) {
  const { x, y, w, h, rotation } = shape;
  const cx = x+w/2, cy = y+h/2;
  const a  = -(rotation||0)*Math.PI/180;
  const dx = px-cx, dy = py-cy;
  return {
    x: cx + dx*Math.cos(a) - dy*Math.sin(a),
    y: cy + dx*Math.sin(a) + dy*Math.cos(a)
  };
}

// -- Hit test handles ------------------------------------------------------
function hitHandle(shape, px, py) {
  const { x, y, w, h, rotation } = shape;
  const cx = x+w/2, cy = y+h/2;
  const { x:lx, y:ly } = unrotatePoint(shape, px, py);
  const rotX = cx, rotY = y - ROT_DIST;
  if (Math.sqrt((lx-rotX)**2+(ly-rotY)**2) <= HANDLE_R+4) return 'rotate';
  for (const h of getHandlePositions(shape)) {
    if (Math.sqrt((lx-h.x)**2+(ly-h.y)**2) <= HANDLE_R+4) return 'scale-'+h.id;
  }
  return null;
}

// -- Overlay pointer events (select mode) ---------------------------------
overlayCanvas.addEventListener('pointerdown', onOverlayDown);
overlayCanvas.addEventListener('pointermove', onOverlayMove);
overlayCanvas.addEventListener('pointerup',   onOverlayUp);
overlayCanvas.addEventListener('pointerleave',onOverlayUp);

function onOverlayDown(e) {
  if (activeTool === 'crop') { startCropDrag(e); return; }
  if (activeTool !== 'select' || !paintActive) return;
  e.preventDefault();
  overlayCanvas.setPointerCapture(e.pointerId);
  const { x, y } = canvasCoords(e);

  // Check if clicking on a selected shape's handles first
  if (selectedLayerIdx >= 0) {
    const sel = layers[selectedLayerIdx];
    if (sel?.type === 'shape') {
      const hit = hitHandle(sel.shape, x, y);
      if (hit) {
        dragMode       = hit;
        dragStartX     = x; dragStartY = y;
        dragStartShape = JSON.parse(JSON.stringify(sel.shape));
        saveUndoState();
        return;
      }
    }
  }

  // Check all shape AND text layers top-to-bottom for a hit
  let found = -1;
  for (let i = layers.length-1; i >= 0; i--) {
    const l = layers[i];
    if (!l.visible) continue;
    if (l.type === 'shape' && hitTestShape(l.shape, x, y)) { found = i; break; }
    if (l.type === 'text'  && hitTestText(l.text, x, y))   { found = i; break; }
  }
  selectedLayerIdx = found;
  if (found >= 0) {
    activeLayerIdx = found;
    const l = layers[found];
    if (l.type === 'text') {
      // Single click = select + move (just like shapes)
      // Store text position as a pseudo-shape so onOverlayMove can move it
      dragMode       = 'move-text';
      dragStartX     = x; dragStartY = y;
      dragStartShape = { x: l.text.x, y: l.text.y }; // store start position
      saveUndoState();
      drawTextHandles(l.text);
      syncTextStylePanel();
      // Load text colours/settings into text style panel
      const st = l.text.defaultStyle || {};
      textFontFamily = st.fontFamily || textFontFamily;
      textFontSize   = st.fontSize || textFontSize;
      textColour     = st.colour || textColour;
      textBold       = !!st.bold;
      textItalic     = !!st.italic;
      textAlign      = st.align || 'left';
      syncTextStylePanel();
    } else {
      dragMode       = 'move';
      dragStartX     = x; dragStartY = y;
      dragStartShape = JSON.parse(JSON.stringify(l.shape));
      saveUndoState();
      drawHandles(l.shape);
      showSelectedShapeStyle(l.shape);
    }
    updateLayerPanel();
  } else {
    clearOverlay();
    selectedLayerIdx = -1;
    showSelectedShapeStyle(null);
    updateLayerPanel();
  }
}

// Double-click on overlay = re-edit text
overlayCanvas.addEventListener('dblclick', e => {
  if (activeTool !== 'select' || !paintActive) return;
  const { x, y } = canvasCoords(e);
  for (let i = layers.length-1; i >= 0; i--) {
    const l = layers[i];
    if (!l.visible || l.type !== 'text') continue;
    if (hitTestText(l.text, x, y)) {
      reopenTextLayer(i);
      clearOverlay();
      dragMode = null;
      return;
    }
  }
});

function onOverlayMove(e) {
  if (activeTool === 'crop') { updateCropDrag(e); return; }
  if (!dragMode || activeTool !== 'select') return;
  e.preventDefault();
  const { x, y } = canvasCoords(e);
  const dx = x - dragStartX, dy = y - dragStartY;
  const s0 = dragStartShape;
  const sel = layers[selectedLayerIdx];
  if (!sel) return;

  // Text layer move
  if (dragMode === 'move-text') {
    sel.text.x = s0.x + dx;
    sel.text.y = s0.y + dy;
    renderTextToLayer(sel);
    composite();
    drawTextHandles(sel.text);
    return;
  }

  const sh = sel.shape;
  if (dragMode === 'move') {
    sh.x = s0.x + dx;
    sh.y = s0.y + dy;
  } else if (dragMode === 'rotate') {
    const cx = s0.x + s0.w/2, cy = s0.y + s0.h/2;
    const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90;
    sh.rotation = Math.round(angle);
  } else if (dragMode.startsWith('scale-')) {
    const dir = dragMode.slice(6);
    applyScaleDrag(sh, s0, dir, dx, dy);
  }

  renderShapeToLayer(sel);
  composite();
  drawHandles(sh);
  updateShapePropPanel(sh);
}

function onOverlayUp(e) {
  if (activeTool === 'crop') { finishCropDrag(e); return; }
  if (!dragMode) return;
  dragMode = null;
}

function normaliseCropRect(a, b) {
  const x1 = Math.max(0, Math.min(canvasW, Math.min(a.x, b.x)));
  const y1 = Math.max(0, Math.min(canvasH, Math.min(a.y, b.y)));
  const x2 = Math.max(0, Math.min(canvasW, Math.max(a.x, b.x)));
  const y2 = Math.max(0, Math.min(canvasH, Math.max(a.y, b.y)));
  return {
    x: Math.round(x1),
    y: Math.round(y1),
    w: Math.round(x2 - x1),
    h: Math.round(y2 - y1)
  };
}

function cropHandleAt(pt) {
  if (!cropRect || cropRect.w < 4 || cropRect.h < 4) return null;
  const hit = 18;
  const { x, y, w, h } = cropRect;
  const handles = [
    { id:'nw', x,     y     },
    { id:'ne', x:x+w, y     },
    { id:'se', x:x+w, y:y+h },
    { id:'sw', x,     y:y+h }
  ];
  return handles.find(handle => Math.abs(pt.x - handle.x) <= hit && Math.abs(pt.y - handle.y) <= hit)?.id || null;
}

function oppositeCropPoint(handle) {
  const { x, y, w, h } = cropRect;
  const points = {
    nw: { x: x + w, y: y + h },
    ne: { x,     y: y + h },
    se: { x,     y },
    sw: { x: x + w, y }
  };
  return points[handle];
}

function startCropDrag(e) {
  if (!paintActive) return;
  e.preventDefault();
  overlayCanvas.setPointerCapture(e.pointerId);
  const pt = canvasCoords(e);
  const handle = cropHandleAt(pt);
  cropDragMode = handle ? 'resize-' + handle : 'new';
  cropStart = handle ? oppositeCropPoint(handle) : pt;
  if (!handle) cropRect = { x: pt.x, y: pt.y, w: 0, h: 0 };
  isCropping = true;
  drawCropOverlay();
  updateCropControls();
}

function updateCropDrag(e) {
  if (!isCropping || !cropStart) return;
  e.preventDefault();
  cropRect = normaliseCropRect(cropStart, canvasCoords(e));
  drawCropOverlay();
  updateCropControls();
}

function finishCropDrag(e) {
  if (!isCropping) return;
  isCropping = false;
  cropDragMode = null;
  if (cropRect && (cropRect.w < 4 || cropRect.h < 4)) cropRect = null;
  drawCropOverlay();
  updateCropControls();
}

function drawCropOverlay() {
  clearOverlay();
  if (!cropRect) return;
  const { x, y, w, h } = cropRect;
  oc.save();
  oc.fillStyle = 'rgba(0, 0, 0, 0.42)';
  oc.fillRect(0, 0, canvasW, canvasH);
  oc.clearRect(x, y, w, h);
  oc.strokeStyle = '#00e5a0';
  oc.lineWidth = 2;
  oc.setLineDash([8, 5]);
  oc.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
  oc.setLineDash([]);
  oc.fillStyle = '#ffffff';
  oc.strokeStyle = '#00e5a0';
  oc.lineWidth = 2;
  [[x,y], [x+w,y], [x+w,y+h], [x,y+h]].forEach(([hx, hy]) => {
    oc.fillRect(hx - 7, hy - 7, 14, 14);
    oc.strokeRect(hx - 7, hy - 7, 14, 14);
  });
  oc.restore();
}

function updateCropControls() {
  const panel = document.getElementById('cropActions');
  const label = document.getElementById('cropSizeLabel');
  const applyBtn = document.getElementById('btnApplyCrop');
  if (!panel || !label || !applyBtn) return;
  const visible = activeTool === 'crop' || !!cropRect;
  panel.style.display = visible ? '' : 'none';
  const valid = !!cropRect && cropRect.w >= 4 && cropRect.h >= 4;
  applyBtn.disabled = !valid;
  label.textContent = valid
    ? `${cropRect.w} x ${cropRect.h} at ${cropRect.x}, ${cropRect.y}`
    : 'Drag on canvas';
}

function cancelCrop() {
  cropRect = null;
  cropStart = null;
  cropDragMode = null;
  isCropping = false;
  clearOverlay();
  updateCropControls();
}

function applyCrop() {
  if (!paintActive || !cropRect || cropRect.w < 4 || cropRect.h < 4) return;
  const { x, y, w, h } = cropRect;
  saveUndoState();
  layers.forEach(layer => {
    const next = document.createElement('canvas');
    next.width = w;
    next.height = h;
    next.getContext('2d').drawImage(layer.canvas, x, y, w, h, 0, 0, w, h);
    layer.canvas = next;
    if (layer.shape) {
      layer.shape.x -= x;
      layer.shape.y -= y;
    }
    if (layer.text) {
      layer.text.x -= x;
      layer.text.y -= y;
    }
  });
  canvasW = w;
  canvasH = h;
  displayCanvas.width = w;
  displayCanvas.height = h;
  overlayCanvas.width = w;
  overlayCanvas.height = h;
  cropRect = null;
  cropStart = null;
  cropDragMode = null;
  isCropping = false;
  selectedLayerIdx = -1;
  fullResCanvas = renderCompositeToCanvas(1);
  setCanvasViewMode('actual');
  composite();
  clearOverlay();
  updateLayerPanel();
  updateCropControls();
  showToast(`Cropped to ${w}x${h}`);
}

function applyScaleDrag(sh, s0, dir, dx, dy) {
  // Adjust bounding box based on which handle was dragged
  let { x, y, w, h } = s0;
  if (dir.includes('e')) w = Math.max(10, s0.w + dx);
  if (dir.includes('s')) h = Math.max(10, s0.h + dy);
  if (dir.includes('w')) { x = s0.x + dx; w = Math.max(10, s0.w - dx); }
  if (dir.includes('n')) { y = s0.y + dy; h = Math.max(10, s0.h - dy); }
  sh.x = x; sh.y = y; sh.w = w; sh.h = h;
}

// -- Shape drawing (drag to create) ----------------------------------------
let shapePreviewLayer = null;   // temp layer during drag-draw
function startShapeDraw(e) {
  const { x, y } = canvasCoords(e);
  const shapeObj = {
    type:         activeTool,
    x, y, w: 0, h: 0,
    rotation:     0,
    fillColour:   activeTool === 'line' || activeTool === 'arrow' ? 'none' : shapeFillColour,
    strokeColour: shapeStrokeColour,
    strokeWidth:  shapeStrokeWidth,
    opacity:      brushOpacity,
    tailCorner:   activeTool === 'speech' ? speechTailCorner : undefined
  };
  shapePreviewLayer = createShapeLayer(shapeObj);
  dragStartX = x; dragStartY = y;
  isDrawing  = true;
}

function updateShapeDraw(e) {
  if (!isDrawing || !shapePreviewLayer) return;
  const { x, y } = canvasCoords(e);
  const sh = shapePreviewLayer.shape;
  if (sh.type === 'line' || sh.type === 'arrow') {
    // Line/arrow: x,y = start point; w,h = vector to end point.
    // Do NOT normalise - direction matters.
    sh.x = dragStartX;
    sh.y = dragStartY;
    sh.w = x - dragStartX;
    sh.h = y - dragStartY;
  } else {
    // All other shapes: normalise to positive bounding box
    sh.x = Math.min(x, dragStartX);
    sh.y = Math.min(y, dragStartY);
    sh.w = Math.abs(x - dragStartX);
    sh.h = Math.abs(y - dragStartY);
  }
  renderShapeToLayer(shapePreviewLayer);
  // Preview composite
  dc.clearRect(0,0,canvasW,canvasH);
  layers.forEach(l => { if (l.visible) dc.drawImage(l.canvas,0,0); });
  dc.drawImage(shapePreviewLayer.canvas,0,0);
}

function finishShapeDraw(e) {
  if (!isDrawing || !shapePreviewLayer) return;
  isDrawing = false;
  const sh = shapePreviewLayer.shape;
  const tooSmall = (sh.type === 'line' || sh.type === 'arrow')
    ? Math.sqrt(sh.w*sh.w + sh.h*sh.h) < 8   // use actual length for line/arrow
    : sh.w < 4 && sh.h < 4;
  if (tooSmall) { shapePreviewLayer = null; composite(); return; }
  // Commit: add shape layer above active pen layer
  saveUndoState();
  layers.push(shapePreviewLayer);
  shapePreviewLayer = null;
  // Auto-select the new shape
  selectedLayerIdx = layers.length - 1;
  activeLayerIdx = selectedLayerIdx;
  selectTool('select');
  drawHandles(layers[selectedLayerIdx].shape);
  updateShapePropPanel(layers[selectedLayerIdx].shape);
  showSelectedShapeStyle(layers[selectedLayerIdx]?.shape || null);
  composite();
  updateLayerPanel();
}

// -- Property panel --------------------------------------------------------
// -- Unified shape style panel ---------------------------------------------
// Controls act as defaults for new shapes AND live-edit a selected shape.

function updateShapeStylePanel(sh) {
  // sh may be null (no selection) - in that case show current defaults
  const fillVal   = sh ? sh.fillColour   : shapeFillColour;
  const strokeVal = sh ? sh.strokeColour : shapeStrokeColour;
  const widthVal  = sh ? (sh.strokeWidth ?? shapeStrokeWidth) : shapeStrokeWidth;

  const fillSwatch = document.getElementById('propFillSwatch');
  if (fillVal === 'none') {
    fillSwatch.style.background = 'repeating-linear-gradient(45deg,#333 0,#333 4px,#555 4px,#555 8px)';
  } else {
    fillSwatch.style.background = fillVal;
  }
  document.getElementById('propStrokeSwatch').style.background = strokeVal === 'none'
    ? 'repeating-linear-gradient(45deg,#333 0,#333 4px,#555 4px,#555 8px)'
    : strokeVal;
  document.getElementById('propStrokeW').value      = widthVal;
  document.getElementById('propStrokeWVal').textContent = widthVal;
  const opacityVal = Math.round((sh ? (sh.opacity ?? brushOpacity) : brushOpacity) * 100);
  document.getElementById('brushOpacity').value = opacityVal;
  document.getElementById('brushOpacityVal').textContent = opacityVal;
  updateSpeechTailControls(sh);
  updateShapeToolOptions();

}

// Alias used by legacy call sites
function updateShapePropPanel(sh) { updateShapeStylePanel(sh); }

function updateSpeechTailControls(sh) {
  const panel = document.getElementById('speechTailControls');
  if (!panel) return;
  const shapeType = sh?.type || activeTool;
  const visible = shapeType === 'speech';
  panel.style.display = visible ? '' : 'none';
  if (!visible) return;
  const corner = sh?.tailCorner || speechTailCorner;
  ['tl','tr','bl','br'].forEach(c => {
    document.getElementById(`speechTail${capFirst(c)}`)?.classList.toggle('active', corner === c);
  });
  drawSpeechTailPreview(corner);
}

function drawSpeechTailPreview(corner) {
  const path = document.getElementById('speechTailPreviewPath');
  const dot = document.getElementById('speechTailPreviewDot');
  if (!path || !dot) return;
  const top = corner[0] === 't';
  const left = corner[1] === 'l';
  const x = 18, y = top ? 20 : 8, w = 86, h = 50;
  const r = 8;
  const bb = y + h;
  const tipX = left ? 4 : 118;
  const tipY = top ? 4 : 74;
  const baseA = left ? x + 18 : x + w - 18;
  const baseB = left ? x + 40 : x + w - 40;
  let d = `M ${x+r} ${y}`;
  if (top && left) d += ` L ${baseA} ${y} L ${tipX} ${tipY} L ${baseB} ${y}`;
  if (top && !left) d += ` L ${baseB} ${y} L ${tipX} ${tipY} L ${baseA} ${y}`;
  d += ` L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r}`;
  d += ` L ${x+w} ${bb-r} Q ${x+w} ${bb} ${x+w-r} ${bb}`;
  if (!top && !left) d += ` L ${baseA} ${bb} L ${tipX} ${tipY} L ${baseB} ${bb}`;
  if (!top && left) d += ` L ${baseB} ${bb} L ${tipX} ${tipY} L ${baseA} ${bb}`;
  d += ` L ${x+r} ${bb} Q ${x} ${bb} ${x} ${bb-r}`;
  d += ` L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
  path.setAttribute('d', d);
  dot.setAttribute('cx', String(tipX));
  dot.setAttribute('cy', String(tipY));
}

function setSpeechTailCorner(corner) {
  if (!['tl','tr','bl','br'].includes(corner)) return;
  speechTailCorner = corner;
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape' && sel.shape.type === 'speech') {
    saveUndoState();
    sel.shape.tailCorner = corner;
    renderShapeToLayer(sel);
    composite();
    drawHandles(sel.shape);
    updateShapeStylePanel(sel.shape);
  } else {
    updateSpeechTailControls(null);
  }
}

function openShapeFillPicker() {
  const inp = document.getElementById('shapeFillPicker');
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  const cur = sel?.shape?.fillColour || shapeFillColour;
  inp.value = (!cur || cur === 'none') ? activeColour : cur;
  inp.click();
}

function openShapeStrokePicker() {
  const inp = document.getElementById('shapeStrokePicker');
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  const cur = sel?.shape?.strokeColour || shapeStrokeColour;
  inp.value = (!cur || cur === 'none') ? activeColour : cur;
  inp.click();
}

function applyShapeFill(hex) {
  shapeFillColour = hex;
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.fillColour = hex;
    renderShapeToLayer(sel); composite(); drawHandles(sel.shape);
    updateShapeStylePanel(sel.shape);
  } else {
    updateShapeStylePanel(null);
  }
  syncActiveColourDisplay();
}

function setShapeFillNone() {
  shapeFillColour = 'none';
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.fillColour = 'none';
    renderShapeToLayer(sel); composite(); drawHandles(sel.shape);
    updateShapeStylePanel(sel.shape);
  } else {
    updateShapeStylePanel(null);
  }
  syncActiveColourDisplay();
}

function setShapeStrokeNone() {
  shapeStrokeColour = 'none';
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.strokeColour = 'none';
    renderShapeToLayer(sel); composite(); drawHandles(sel.shape);
    updateShapeStylePanel(sel.shape);
  } else {
    updateShapeStylePanel(null);
  }
  syncActiveColourDisplay();
}

function setActiveShapeColourNone() {
  if (shapeColourTarget === 'line') setShapeStrokeNone();
  else setShapeFillNone();
}

function applyShapeStroke(hex) {
  shapeStrokeColour = hex;
  document.getElementById('propStrokeSwatch').style.background = hex;
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.strokeColour = hex;
    renderShapeToLayer(sel); composite(); drawHandles(sel.shape);
  }
  syncActiveColourDisplay();
}

function applyShapeStrokeWidth(v) {
  shapeStrokeWidth = parseInt(v);
  document.getElementById('propStrokeWVal').textContent = v;
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.strokeWidth = shapeStrokeWidth;
    renderShapeToLayer(sel); composite();
  }
}

// -- Shape stroke controls -------------------------------------------------
// Legacy stubs - logic now in applyShapeStroke / applyShapeStrokeWidth
function updateShapeStroke(v) { applyShapeStrokeWidth(v); }
function openStrokeColourPicker() { openShapeStrokePicker(); }
function setStrokeColour(hex) { applyShapeStroke(hex); }

// ======================================================= FILL TOOL
function floodFill(startX, startY) {
  saveUndoState();
  const ctx   = activeLayerCtx();
  if (!ctx) return;
  const layerData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data      = layerData.data;
  // Fill boundaries come from the selected layer only. Other visible layers should
  // not define or block the area being filled.
  const sourceData = new Uint8ClampedArray(data);
  const sx = Math.round(startX), sy = Math.round(startY);
  if (sx < 0 || sx >= canvasW || sy < 0 || sy >= canvasH) return;
  const idx = (sy * canvasW + sx) * 4;
  const targetR = sourceData[idx], targetG = sourceData[idx+1], targetB = sourceData[idx+2], targetA = sourceData[idx+3];
  const [fillR, fillG, fillB] = hexToRgb(activeColour);
  const fillA = Math.round(brushOpacity * 255);

  if (targetR===fillR && targetG===fillG && targetB===fillB && targetA===fillA) return;

  const stack = [[sx, sy]];
  const visited = new Uint8Array(canvasW * canvasH);
  const filled = new Uint8Array(canvasW * canvasH);
  const fillTolerance = 42;
  const edgeTolerance = 170;
  const gapTolerance = 210;

  function colourDistance(i) {
    const dr = sourceData[i]   - targetR;
    const dg = sourceData[i+1] - targetG;
    const db = sourceData[i+2] - targetB;
    const da = (sourceData[i+3] - targetA) * 0.75;
    return Math.sqrt(dr*dr + dg*dg + db*db + da*da);
  }

  function paintPixel(pi, alphaScale = 1) {
    const a = Math.max(0, Math.min(255, Math.round(fillA * alphaScale)));
    if (alphaScale >= 0.999) {
      data[pi]   = fillR;
      data[pi+1] = fillG;
      data[pi+2] = fillB;
      data[pi+3] = a;
      return;
    }
    const t = a / 255;
    data[pi]   = Math.round(data[pi]   * (1 - t) + fillR * t);
    data[pi+1] = Math.round(data[pi+1] * (1 - t) + fillG * t);
    data[pi+2] = Math.round(data[pi+2] * (1 - t) + fillB * t);
    data[pi+3] = Math.round(Math.max(data[pi+3], a));
  }

  function underpaintPixel(pi, alphaScale = 1) {
    const existingA = sourceData[pi+3] / 255;
    if (existingA <= 0 || existingA >= 0.98) return;
    const underA = Math.max(0, Math.min(1, (fillA / 255) * alphaScale));
    const outA = existingA + underA * (1 - existingA);
    if (outA <= 0) return;
    data[pi]   = Math.round((sourceData[pi]   * existingA + fillR * underA * (1 - existingA)) / outA);
    data[pi+1] = Math.round((sourceData[pi+1] * existingA + fillG * underA * (1 - existingA)) / outA);
    data[pi+2] = Math.round((sourceData[pi+2] * existingA + fillB * underA * (1 - existingA)) / outA);
    data[pi+3] = Math.round(outA * 255);
  }

  function match(i) {
    if (targetA < 8) return sourceData[i+3] < 16;
    return colourDistance(i) <= fillTolerance;
  }

  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= canvasW || cy < 0 || cy >= canvasH) continue;
    const ci = cy * canvasW + cx;
    if (visited[ci]) continue;
    visited[ci] = 1;
    const pi = ci * 4;
    if (!match(pi)) continue;
    filled[ci] = 1;
    stack.push([cx+1,cy], [cx-1,cy], [cx,cy+1], [cx,cy-1]);
  }

  function filledNeighbours(x, y) {
    let count = 0;
    for (let oy = -1; oy <= 1; oy++) {
      const yy = y + oy;
      if (yy < 0 || yy >= canvasH) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const xx = x + ox;
        if (xx < 0 || xx >= canvasW) continue;
        if (filled[yy * canvasW + xx]) count++;
      }
    }
    return count;
  }

  function closeTinyFillGaps() {
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (let y = 0; y < canvasH; y++) {
        for (let x = 0; x < canvasW; x++) {
          const ci = y * canvasW + x;
          if (filled[ci]) continue;
          const neighbours = filledNeighbours(x, y);
          if (neighbours === 0) continue;
          if (colourDistance(ci * 4) <= gapTolerance || neighbours >= 5) add.push(ci);
        }
      }
      if (!add.length) break;
      add.forEach(ci => { filled[ci] = 1; });
    }
  }

  closeTinyFillGaps();

  // Paint the discovered fill area solid, then extend into target-coloured fringe pixels.
  // Keeping boundary pixels solid avoids pale seams between fill and outline.
  for (let y = 0; y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const ci = y * canvasW + x;
      const neighbours = filledNeighbours(x, y);
      if (!filled[ci] && neighbours === 0) continue;
      const pi = ci * 4;
      if (filled[ci]) {
        paintPixel(pi, 1);
      } else {
        if (targetA < 8 && sourceData[pi+3] > 0 && sourceData[pi+3] < 250) {
          underpaintPixel(pi, Math.min(1, Math.max(0.45, neighbours / 5)));
          continue;
        }
        const dist = colourDistance(pi);
        if (dist > edgeTolerance) continue;
        const closeness = 1 - dist / edgeTolerance;
        paintPixel(pi, Math.min(1, Math.max(0.72, (neighbours / 9) * closeness * 1.35)));
      }
    }
  }
  ctx.putImageData(layerData, 0, 0);
  composite();
}

// ======================================================= EYEDROPPER
function pickColour(x, y) {
  // Sample from the composite display canvas
  const pixel = dc.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex   = '#' + [pixel[0],pixel[1],pixel[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  setActiveColour(hex);
  selectTool('pen'); // switch back to pen after picking
}

// ======================================================= TOOLS & COLOUR
function selectTool(t) {
  // Commit any open textarea when switching tools
  if (activeEditor) commitEditor();
  if (activeTool === 'crop' && t !== 'crop') cancelCrop();
  // Deselect shape when switching away from select tool
  if (activeTool === 'select' && t !== 'select') {
    selectedLayerIdx = -1;
    clearOverlay();
    updateShapeStylePanel(null);
  }
  if (t === 'crop') {
    selectedLayerIdx = -1;
    updateShapeStylePanel(null);
    clearOverlay();
  }
  activeTool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tool-${t}`);
  if (btn) btn.classList.add('active');
  const cursorMap = { eyedrop:'crosshair', fill:'cell', eraser:'cell', select:'default',
    crop:'crosshair', text:'text',
    rect:'crosshair', circle:'crosshair', line:'crosshair', arrow:'crosshair',
    star:'crosshair', speech:'crosshair', thought:'crosshair' };
  displayCanvas.style.cursor = cursorMap[t] || 'crosshair';
  overlayCanvas.style.pointerEvents = (t === 'select' || t === 'crop') ? 'auto' : 'none';
  refreshToolOptions();
  updateCropControls();
}

function updateBrushSize(v) {
  brushSize = parseInt(v);
  document.getElementById('brushSizeVal').textContent = v;
}

function updateOpacity(v) {
  brushOpacity = parseInt(v) / 100;
  document.getElementById('brushOpacityVal').textContent = v;
  const sel = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (sel?.type === 'shape') {
    saveUndoState();
    sel.shape.opacity = brushOpacity;
    renderShapeToLayer(sel);
    composite();
    drawHandles(sel.shape);
  }
}

function setActiveColour(hex) {
  activeColour = hex;
  document.getElementById('colourPickerInput').value = hex;
  // Update palette active state
  document.querySelectorAll('.swatch[data-colour]').forEach(s => {
    s.classList.toggle('active', s.dataset.colour === hex);
  });
  // If text tool active or text layer selected - also set text colour
  if (activeTool === 'text') {
    setTextColour(hex);
    return;
  }
  if (selectedLayerIdx >= 0 && layers[selectedLayerIdx]?.type === 'text') {
    setTextColour(hex);
    return;
  }
  const selectedShape = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (SHAPE_TOOLS.has(activeTool) || selectedShape?.type === 'shape') {
    if (shapeColourTarget === 'line') applyShapeStroke(hex);
    else applyShapeFill(hex);
    return;
  }
  if (selectedLayerIdx < 0 || layers[selectedLayerIdx]?.type !== 'shape') {
    shapeFillColour = hex;
    updateShapeStylePanel(null);
  }
  syncActiveColourDisplay();
}

function openColourPicker() {
  const inp = document.getElementById('colourPickerInput');
  const selectedShape = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (SHAPE_TOOLS.has(activeTool) || selectedShape?.type === 'shape') {
    const shape = selectedShape?.type === 'shape' ? selectedShape.shape : null;
    const current = shapeColourTarget === 'line'
      ? (shape?.strokeColour || shapeStrokeColour)
      : (shape?.fillColour || shapeFillColour);
    inp.value = current && current !== 'none' ? current : activeColour;
  }
  inp.click();
}

function setColourFromPicker(hex) {
  setActiveColour(hex);
}

function syncActiveColourDisplay() {
  const swatch = document.getElementById('activeColourSwatch');
  const label = document.getElementById('activeColourHex');
  const noneBtn = document.getElementById('activeColourNoneBtn');
  if (!swatch || !label) return;

  let colour = activeColour;
  let allowNone = false;
  const selectedShape = selectedLayerIdx >= 0 ? layers[selectedLayerIdx] : null;
  if (SHAPE_TOOLS.has(activeTool) || selectedShape?.type === 'shape') {
    const shape = selectedShape?.type === 'shape' ? selectedShape.shape : null;
    const targetType = shape?.type || activeTool;
    const hasFill = !['line','arrow'].includes(targetType);
    allowNone = shapeColourTarget === 'line' || (shapeColourTarget === 'fill' && hasFill);
    colour = shapeColourTarget === 'line'
      ? (shape?.strokeColour || shapeStrokeColour)
      : (shape?.fillColour || shapeFillColour);
  }

  if (colour === 'none') {
    swatch.style.background = 'repeating-linear-gradient(45deg,#333 0,#333 4px,#555 4px,#555 8px)';
    label.textContent = 'None';
  } else {
    swatch.style.background = colour;
    label.textContent = colour;
  }
  if (noneBtn) noneBtn.style.display = allowNone ? '' : 'none';
}

// ======================================================= PALETTE
function buildPalette() {
  const grid    = document.getElementById('paletteGrid');
  if (activePaletteName === 'custom') {
    buildCustomPaletteGrid(grid);
    return;
  }
  const colours = PALETTES[activePaletteName] || PALETTES.standard;
  grid.innerHTML = '';
  colours.forEach(colour => {
    const s = document.createElement('div');
    s.className = 'swatch';
    s.dataset.colour = colour;
    s.style.background = colour;
    s.title = colour;
    s.onmousedown = () => saveEditorSelection();
    s.onclick = () => setActiveColour(colour);
    grid.appendChild(s);
  });
}

function buildCustomPaletteGrid(grid = document.getElementById('paletteGrid')) {
  if (!grid) return;
  grid.innerHTML = '';
  customColours.forEach((colour, i) => {
    const s = document.createElement('div');
    s.className = 'swatch' + (colour ? '' : ' custom');
    s.dataset.colour = colour || '';
    if (colour) s.style.background = colour;
    s.title = colour ? colour : 'Click to set custom colour';
    s.onmousedown = () => saveEditorSelection();
    s.onclick = () => {
      if (colour) {
        setActiveColour(colour);
      } else {
        const inp = document.getElementById('colourPickerInput');
        inp.value = activeColour;
        const handler = () => {
          customColours[i] = inp.value;
          buildPalette();
          setActiveColour(inp.value);
          inp.removeEventListener('change', handler);
        };
        inp.addEventListener('change', handler);
        inp.click();
      }
    };
    s.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (colour) { customColours[i] = ''; buildPalette(); }
    });
    grid.appendChild(s);
  });
}

function switchPalette(name) {
  activePaletteName = name;
  // Update tab active states
  document.querySelectorAll('.pal-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('onclick').includes(`'${name}'`));
  });
  buildPalette();
}

function buildCustomSwatches() {
  const grid = document.getElementById('customGrid');
  if (!grid) return;
  grid.innerHTML = '';
  customColours.forEach((colour, i) => {
    const s = document.createElement('div');
    s.className = 'swatch' + (colour ? '' : ' custom');
    s.dataset.colour = colour || '';
    if (colour) s.style.background = colour;
    s.title = colour ? colour : 'Click to set custom colour';
    s.onclick = () => {
      if (colour) {
        setActiveColour(colour);
      } else {
        // Open picker and store result in this slot
        const inp = document.getElementById('colourPickerInput');
        inp.value = activeColour;
        const handler = () => {
          customColours[i] = inp.value;
          buildCustomSwatches();
          setActiveColour(inp.value);
          inp.removeEventListener('change', handler);
        };
        inp.addEventListener('change', handler);
        inp.click();
      }
    };
    // Right-click to clear
    s.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (colour) { customColours[i] = ''; buildCustomSwatches(); }
    });
    grid.appendChild(s);
  });
}

// ======================================================= CANVAS ACTIONS
function newBlankCanvas() {
  const sel  = document.getElementById('selCanvasSize').value;
  let w = 1920, h = 1080;
  if (sel === 'custom') {
    w = parseInt(document.getElementById('customCanvasW')?.value) || 1200;
    h = parseInt(document.getElementById('customCanvasH')?.value) || 800;
  } else {
    [w, h] = sel.split('x').map(Number);
  }
  w = Math.max(1, w);
  h = Math.max(1, h);
  initCanvas(w, h, '#ffffff');
  setMode('paint');
  showToast(`Canvas ${w}x${h} ready`);
}

function toggleCustomCanvasSize() {
  const fields = document.getElementById('customCanvasFields');
  const isCustom = document.getElementById('selCanvasSize')?.value === 'custom';
  if (fields) fields.style.display = isCustom ? 'flex' : 'none';
}

function loadImageToCanvas() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const url  = URL.createObjectURL(file);
    const img  = new Image();
    img.onload = () => {
      initCanvas(img.naturalWidth, img.naturalHeight);
      setBaseImageLayer(img, 'Image');
      URL.revokeObjectURL(url);
      showToast(`Loaded ${img.naturalWidth}x${img.naturalHeight}`);
    };
    img.src = url;
  };
  inp.click();
}

function exportPaint() {
  if (!paintActive) return;
  const scale = parseFloat(document.getElementById('selPaintScale')?.value || '1');
  const mime = document.getElementById('selPaintFormat')?.value || 'image/png';
  const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
  const out = renderCompositeToCanvas(scale);
  const pct = Math.round(scale * 100);
  const exportCanvas = mime === 'image/jpeg' ? document.createElement('canvas') : out;
  if (mime === 'image/jpeg') {
    exportCanvas.width = out.width;
    exportCanvas.height = out.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(out, 0, 0);
  }
  exportCanvas.toBlob(blob => {
    downloadBlob(blob, `paint-${pct}pct-${exportCanvas.width}x${exportCanvas.height}-${timestamp()}.${ext}`);
  }, mime, 0.92);
}

// Integrate screenshot into paint canvas
function loadSnapshotToPaint() {
  if (!fullResCanvas) return;
  initCanvas(fullResCanvas.width, fullResCanvas.height);
  setBaseImageLayer(fullResCanvas, 'Screenshot');
  setMode('paint');
  showToast('Screenshot loaded into paint canvas');
}

// ======================================================= SCREENSHOT
async function selectScreenForScreenshot() {
  try {
    if (captureStream) stopCapture();
    captureStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor:'always' }, audio: false });

    // Show live preview in captureVideo (not the paint canvas)
    captureVideo.srcObject = captureStream;
    captureVideo.classList.add('visible');
    displayCanvas.style.display = 'none';
    canvasEmpty.style.display   = 'none';

    document.getElementById('btnSnap').disabled    = false;
    document.getElementById('btnSaveSnap').disabled = true;
    document.getElementById('btnStopSS').style.display = '';

    captureStream.getVideoTracks()[0].addEventListener('ended', () => {
      stopCapture();
      if (!paintActive) { captureVideo.classList.remove('visible'); canvasEmpty.style.display = 'flex'; }
    });
  } catch(e) { if (e.name !== 'NotAllowedError') showToast('Could not access screen.', true); }
}

function takeSnapshot() {
  if (!captureStream) return;
  const vt  = captureStream.getVideoTracks()[0];
  const s   = vt.getSettings();
  const w   = s.width  || captureVideo.videoWidth;
  const h   = s.height || captureVideo.videoHeight;

  fullResCanvas = document.createElement('canvas');
  fullResCanvas.width = w; fullResCanvas.height = h;
  fullResCanvas.getContext('2d').drawImage(captureVideo, 0, 0, w, h);

  // Show the snapshot in the paint canvas at screen size
  initCanvas(w, h);
  setBaseImageLayer(fullResCanvas, 'Screenshot');

  captureVideo.classList.remove('visible');
  document.getElementById('btnSaveSnap').disabled = false;
  showToast(`Captured ${w}x${h} - paint canvas ready`);
}

function saveSnapshot() {
  if (!fullResCanvas) return;
  const scale = parseFloat(document.getElementById('selSSScale').value);
  const source = (paintActive && canvasW === fullResCanvas.width && canvasH === fullResCanvas.height)
    ? renderCompositeToCanvas(1)
    : fullResCanvas;
  const outW  = Math.round(source.width  * scale);
  const outH  = Math.round(source.height * scale);
  const out   = document.createElement('canvas');
  out.width = outW; out.height = outH;
  out.getContext('2d').drawImage(source, 0, 0, outW, outH);
  out.toBlob(blob => {
    const pct = Math.round(scale * 100);
    downloadBlob(blob, `screenshot-${pct}pct-${outW}x${outH}-${timestamp()}.png`);
  }, 'image/png');
}

function stopCapture() {
  if (captureStream) { captureStream.getTracks().forEach(t => t.stop()); captureStream = null; }
  captureVideo.srcObject = null;
  captureVideo.classList.remove('visible');
  document.getElementById('btnSnap').disabled    = true;
  document.getElementById('btnStopSS').style.display = 'none';
  clearInterval(timerInterval);
  recBadge.classList.remove('active');
  recTimer.classList.remove('active');
}

// ======================================================= RECORDING
async function startRecording() {
  try {
    const wantAudio = document.getElementById('chkAudio').checked;
    const wantMic   = document.getElementById('chkMic').checked;
    const bitrate   = parseInt(document.getElementById('selQuality').value);
    const mimeType  = getSupportedMime();
    const scale     = parseFloat(document.getElementById('selRecScale').value);
    const screenW   = window.screen.width;
    const screenH   = window.screen.height;
    const videoConstraints = { cursor: 'always' };
    if (scale < 1) {
      videoConstraints.width  = { ideal: Math.round(screenW * scale) };
      videoConstraints.height = { ideal: Math.round(screenH * scale) };
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: videoConstraints, audio: wantAudio });
    const displayAudioTracks = displayStream.getAudioTracks();
    const hasSystemAudio = wantAudio && displayAudioTracks.length > 0;

    let micStream = null;
    if (wantMic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation:true, noiseSuppression:true, sampleRate:48000 }, video: false
        });
      } catch { showToast('Mic unavailable', true); }
    }

    let audioCtx = null;
    const finalTracks = [...displayStream.getVideoTracks()];

    if (hasSystemAudio && micStream) {
      audioCtx = new AudioContext({ sampleRate: 48000 });
      const dest = audioCtx.createMediaStreamDestination();
      audioCtx.createMediaStreamSource(new MediaStream(displayAudioTracks)).connect(dest);
      audioCtx.createMediaStreamSource(micStream).connect(dest);
      finalTracks.push(...dest.stream.getAudioTracks());
    } else if (hasSystemAudio) {
      finalTracks.push(...displayAudioTracks);
    } else if (micStream) {
      finalTracks.push(...micStream.getAudioTracks());
    }

    captureStream = new MediaStream(finalTracks);
    recordedChunks = []; currentBlob = null;

    captureVideo.srcObject = captureStream;
    captureVideo.muted = true;
    captureVideo.classList.add('visible');
    displayCanvas.style.display = 'none';
    canvasEmpty.style.display   = 'none';
    recBadge.classList.add('active');
    elapsed = 0;
    recTimer.classList.add('active');
    recTimer.textContent = '00:00';
    timerInterval = setInterval(() => {
      elapsed++;
      recTimer.textContent = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`;
    }, 1000);

    const recOpts = { mimeType };
    if (bitrate) recOpts.videoBitsPerSecond = bitrate;
    mediaRecorder = new MediaRecorder(captureStream, recOpts);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      if (audioCtx)  audioCtx.close();
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      const blob = new Blob(recordedChunks, { type: mimeType });
      currentBlob = blob;
      const url  = URL.createObjectURL(blob);
      captureVideo.srcObject = null;
      captureVideo.src       = url;
      captureVideo.muted     = false;
      captureVideo.controls  = true;
      captureVideo.classList.add('visible');
      document.getElementById('btnSaveRec').disabled = false;
    };
    mediaRecorder.start();
    document.getElementById('btnStartRec').disabled = true;
    document.getElementById('btnStopRec').disabled  = false;
    document.getElementById('btnSaveRec').disabled  = true;
    displayStream.getVideoTracks()[0].addEventListener('ended', stopRecording);
  } catch(e) { if (e.name !== 'NotAllowedError') showToast('Could not start recording.', true); }
}

function stopRecording() {
  clearInterval(timerInterval);
  recBadge.classList.remove('active');
  recTimer.classList.remove('active');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (captureStream) { captureStream.getTracks().forEach(t => t.stop()); captureStream = null; }
  document.getElementById('btnStartRec').disabled = false;
  document.getElementById('btnStopRec').disabled  = true;
}

function extensionFromMime(mime) {
  return String(mime || '').toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

async function saveRecording() {
  if (!currentBlob) return;
  const saveScale = parseFloat(document.getElementById('selSaveScale').value);
  const saveMime  = getSupportedMime();
  const currentExt = extensionFromMime(currentBlob.type);
  const ext       = extensionFromMime(saveMime || currentBlob.type);
  const pct       = Math.round(saveScale * 100);
  if (saveScale === 1 && currentExt === ext) { downloadBlob(currentBlob, `recording-100pct-${timestamp()}.${ext}`); return; }

  showToast('Re-encoding... please wait');
  document.getElementById('btnSaveRec').disabled = true;
  const srcVideo = document.createElement('video');
  srcVideo.src = URL.createObjectURL(currentBlob); srcVideo.muted = true; srcVideo.preload = 'auto';
  await new Promise(res => { srcVideo.onloadedmetadata = res; });
  const outW = Math.round(srcVideo.videoWidth * saveScale);
  const outH = Math.round(srcVideo.videoHeight * saveScale);
  const offCv = document.createElement('canvas'); offCv.width = outW; offCv.height = outH;
  const offCtx = offCv.getContext('2d');
  const canvasSt = offCv.captureStream(60);
  let audioTracks = [], audioCtxSave = null;
  try {
    audioCtxSave = new AudioContext({ sampleRate:48000 });
    const aSrc = audioCtxSave.createMediaElementSource(srcVideo);
    const aDst = audioCtxSave.createMediaStreamDestination();
    aSrc.connect(aDst); audioTracks = aDst.stream.getAudioTracks();
  } catch {}
  const saveSt   = new MediaStream([...canvasSt.getVideoTracks(), ...audioTracks]);
  const saveChunks = [];
  const saveRec  = new MediaRecorder(saveSt, { mimeType: saveMime, videoBitsPerSecond: parseInt(document.getElementById('selQuality').value) });
  saveRec.ondataavailable = e => { if (e.data.size > 0) saveChunks.push(e.data); };
  saveRec.onstop = () => {
    if (audioCtxSave) audioCtxSave.close();
    URL.revokeObjectURL(srcVideo.src);
    const blob = new Blob(saveChunks, { type: saveMime });
    const outExt = extensionFromMime(saveMime);
    downloadBlob(blob, `recording-${pct}pct-${outW}x${outH}-${timestamp()}.${outExt}`);
    document.getElementById('btnSaveRec').disabled = false;
    showToast(`Saved at ${pct}%`);
  };
  const draw = () => { offCtx.drawImage(srcVideo, 0, 0, outW, outH); if (!srcVideo.ended) srcVideo.requestVideoFrameCallback(draw); };
  saveRec.start(); srcVideo.requestVideoFrameCallback(draw); srcVideo.play();
  srcVideo.onended = () => { offCtx.drawImage(srcVideo, 0, 0, outW, outH); setTimeout(() => saveRec.stop(), 300); };
}

function getSupportedMime() {
  const fmt = document.getElementById('selFormat').value;
  const candidates = fmt === 'video/mp4'
    ? ['video/mp4;codecs=h264','video/mp4','video/webm;codecs=vp9,opus','video/webm']
    : ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
}

// ======================================================= UTILS
function hexToRgba(hex, alpha = 1) {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  showToast(`Saved: ${name}`);
}

function timestamp(prefix = '') {
  const d = new Date(), pad = n => String(n).padStart(2,'0');
  return (prefix ? prefix+'-' : '') +
    `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

let _toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = isError ? 'var(--danger)' : 'var(--accent)';
  t.style.color       = isError ? 'var(--danger)' : 'var(--accent)';
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Fit canvas when window resizes
const _ro = new ResizeObserver(() => { if (paintActive) fitCanvasToArea(); });
_ro.observe(canvasArea);

