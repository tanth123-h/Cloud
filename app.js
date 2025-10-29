// app.js — logic for mint webcam front-end
// Change MODEL_BASE to your model URL (public) or './my_model/'
const MODEL_BASE = 'https://teachablemachine.withgoogle.com/models/RAYtuKWBB/';

let model, webcam, maxPredictions;
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const camContainer = document.getElementById('webcam-container');
const labelsEl = document.getElementById('labels');

function setStatus(s){ statusEl.textContent = 'Status: ' + s; }

async function initModel(){
  setStatus('loading model...');
  try{
    model = await tmImage.load(MODEL_BASE + 'model.json', MODEL_BASE + 'metadata.json');
    maxPredictions = model.getTotalClasses();
    buildLabelRows(maxPredictions);
    setStatus('model loaded');
  }catch(err){
    console.error('Model load error', err);
    setStatus('model load failed');
    alert('Failed to load model. Check the MODEL_BASE URL or network/CORS.');
  }
}

function buildLabelRows(n){
  labelsEl.innerHTML = '';
  for(let i=0;i<n;i++){
    const row = document.createElement('div'); row.className = 'label';
    const name = document.createElement('div'); name.className = 'label-name'; name.textContent = '—';
    const wrap = document.createElement('div'); wrap.className = 'label-bar-wrap';
    const bg = document.createElement('div'); bg.className = 'bar-bg';
    const bar = document.createElement('div'); bar.className = 'bar'; bg.appendChild(bar);
    const pct = document.createElement('div'); pct.className = 'label-pct'; pct.textContent='0%';
    wrap.appendChild(bg); wrap.appendChild(pct);
    row.appendChild(name); row.appendChild(wrap);
    labelsEl.appendChild(row);
  }
}

async function startCam(){
  if(!model) await initModel();
  setStatus('requesting camera...');
  webcam = new tmImage.Webcam(360,360,true);
  try{
    await webcam.setup(); await webcam.play();
    const ph = document.getElementById('placeholder'); if(ph) ph.remove();
    camContainer.appendChild(webcam.canvas);
    setStatus('camera running');
    startBtn.disabled = true; stopBtn.disabled = false;
    window.requestAnimationFrame(loop);
  }catch(err){
    console.error('Camera error', err);
    setStatus('camera denied');
    alert('Cannot access camera. Serve over HTTPS or use localhost and allow camera permission.');
  }
}

function stopCam(){
  if(webcam){ webcam.stop(); webcam.canvas.remove(); webcam = null; }
  if(!document.getElementById('placeholder')){
    const ph = document.createElement('div'); ph.id='placeholder'; ph.className='placeholder'; ph.textContent='Camera off'; camContainer.appendChild(ph);
  }
  setStatus('camera stopped'); startBtn.disabled=false; stopBtn.disabled=true;
}

async function loop(){
  if(!webcam) return;
  webcam.update(); await predict(); window.requestAnimationFrame(loop);
}

async function predict(){
  const predictions = await model.predict(webcam.canvas);
  for(let i=0;i<predictions.length;i++){
    const row = labelsEl.childNodes[i];
    const name = row.querySelector('.label-name');
    const bar = row.querySelector('.bar');
    const pct = row.querySelector('.label-pct');
    const p = predictions[i].probability;
    name.textContent = predictions[i].className;
    bar.style.width = (p*100).toFixed(1) + '%';
    pct.textContent = (p*100).toFixed(1) + '%';
  }
}

startBtn.addEventListener('click', startCam);
stopBtn.addEventListener('click', stopCam);

// preload model quietly
initModel();
