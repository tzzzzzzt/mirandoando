/* ---------------------------
   MirandaPet - script.js
   --------------------------- */

/* ---------- Configuración ---------- */
// intervalos en ms
const HUNGER_INTERVAL = 40000;        // cada 40s baja hambre (fullness)
const SLEEP_INTERVAL = 60000;         // cada 60s baja sueño
const ENTERTAIN_INTERVAL = 90000;     // cada 90s baja entretenimiento
const HAPPINESS_INTERVAL = 50000;     // cada 50s recalcula felicidad interna
const COIN_INTERVAL = 30000;          // cada 30s +1 moneda

// precios
const PRICE_APPLE = 5;

// ---------- Estado inicial / persistencia ----------
let hambre = 50;           // 0 = muerto de hambre, 100 = lleno
let sueno = 70;
let entretenimiento = 50;
let felicidad = 60;        // interna, depende de sueno+entretenimiento
let salud = 100;

let monedas = parseInt(localStorage.getItem("mp_coins")) || 15;
let inventario = JSON.parse(localStorage.getItem("mp_inventory")) || {}; // {manzana:{icon:'🍎',nombre:'Manzana',cantidad:2}}

let mascotaViva = true;
let nameSaved = localStorage.getItem("mp_name") || "";

/* Timers handlers */
let timers = [];

/* ---------- DOM ---------- */
const startScreen = document.getElementById("startScreen");
const petNameInput = document.getElementById("petNameInput");
const startBtn = document.getElementById("startBtn");

const petNameEl = document.getElementById("petName");
const petImg = document.getElementById("petImg");
const coinsDisplay = document.getElementById("coinsDisplay");

const barraHambre = document.getElementById("barraHambre");
const barraSueno = document.getElementById("barraSueno");
const barraEntretenimiento = document.getElementById("barraEntretenimiento");
const barraSalud = document.getElementById("barraSalud");

const btnAlimentar = document.getElementById("btnAlimentar");
const btnJugar = document.getElementById("btnJugar");
const btnDormir = document.getElementById("btnDormir");
const btnReiniciar = document.getElementById("btnReiniciar");

const modalJuegos = document.getElementById("modalJuegos");
const modalShop = document.getElementById("modalShop");
const modalInv = document.getElementById("modalInv");
const modalNotes = document.getElementById("modalNotes");
const modalSnake = document.getElementById("modalSnake");

const openGames = document.getElementById("openGames");
const openShop = document.getElementById("openShop");
const openInv = document.getElementById("openInv");
const openNotes = document.getElementById("openNotes");

const buyAppleBtn = document.getElementById("buyApple");
const inventoryList = document.getElementById("inventoryList");
const useBox = document.getElementById("useBox");
const useItemLabel = document.getElementById("useItemLabel");
const useAmount = document.getElementById("useAmount");
const confirmUseBtn = document.getElementById("confirmUse");

const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const saveNoteBtn = document.getElementById("saveNote");
const notesList = document.getElementById("notesList");

const alertsContainer = document.getElementById("alerts");

/* Snake game elements */
const openSnakeBtn = document.getElementById("openSnake");
const snakeCanvas = document.getElementById("snakeCanvas");
const startSnakeBtn = document.getElementById("startSnake");
const stopSnakeBtn = document.getElementById("stopSnake");
const snakeScore = document.getElementById("snakeScore");

let snakeGame = null;

/* ---------- Utilidades UI ---------- */
function showAlert(text) {
  const div = document.createElement("div");
  div.className = "alert";
  div.textContent = text;
  alertsContainer.appendChild(div);
  setTimeout(()=> div.remove(), 4000);
}

function saveState() {
  localStorage.setItem("mp_coins", monedas);
  localStorage.setItem("mp_inventory", JSON.stringify(inventario));
  // name saved separately when chosen
}

/* ---------- Inicialización UI ---------- */
function updateUI() {
  barraHambre.value = hambre;
  barraSueno.value = sueno;
  barraEntretenimiento.value = entretenimiento;
  // salud recalculada al llamar recalcular()
  barraSalud.value = salud;

  coinsDisplay.textContent = `🪙 ${monedas}`;
  petNameEl.textContent = localStorage.getItem("mp_name") || "MirandaPet";

  // elegir imagen según estado (prioridad)
  let src = "feliz.png";
  if (!mascotaViva) src = "muerto.png";
  else if (hambre <= 20) src = "hambrienta.png";
  else if (sueno <= 20) src = "dormido.png";
  else if (entretenimiento <= 20) src = "triste.png";
  petImg.src = src;
}

/* ---------- Lógica básica ---------- */
function recalcular() {
  // felicidad interna depende de sueño y entretenimiento
  felicidad = Math.round((sueno + entretenimiento) / 2);
  salud = Math.round((hambre + sueno + felicidad) / 3);
  salud = Math.max(0, Math.min(100, salud));
  if (salud <= 0 && mascotaViva) {
    morir();
  }
  updateUI();
  saveState();
}

function morir() {
  mascotaViva = false;
  // detiene timers
  timers.forEach(t => clearInterval(t));
  timers = [];
  updateUI();
  showAlert("💀 MirandaPet ha fallecido... reinicia para intentarlo nuevamente.");
  // deshabilitar botones
  setControlsEnabled(false);
}

/* Habilitar / Deshabilitar controles */
function setControlsEnabled(enabled) {
  btnAlimentar.disabled = !enabled;
  btnJugar.disabled = !enabled;
  btnDormir.disabled = !enabled;
  buyAppleBtn.disabled = !enabled;
  openSnakeBtn.disabled = !enabled;
}

/* ---------- Acciones principales ---------- */
btnAlimentar.addEventListener("click", () => {
  if (!mascotaViva) return;
  // intenta consumir una manzana del inventario
  if (inventario.manzana && inventario.manzana.cantidad > 0) {
    useItem('manzana', 1);
  } else {
    showAlert("No tienes manzanas. Compra en la tienda 🛒");
  }
});

btnJugar.addEventListener("click", () => {
  if (!mascotaViva) return;
  entretenimiento = Math.min(100, entretenimiento + 15);
  showAlert("🎲 Jugaste con tu mascota. +Entretenimiento");
  recalcular();
});

btnDormir.addEventListener("click", () => {
  if (!mascotaViva) return;
  sueno = Math.min(100, sueno + 20);
  showAlert("💤 MirandaPet descansó.");
  recalcular();
});

/* ---------- Reiniciar ---------- */
btnReiniciar.addEventListener("click", () => {
  // preguntar si desea conservar nombre
  const keepName = confirm("¿Deseas conservar el nombre de la mascota? (Aceptar = conservar)");
  if (!keepName) {
    localStorage.removeItem("mp_name");
  }
  // reset stats but keep coins and inventory? Aquí reseteamos stats and keep coins & inventory (opcional)
  hambre = 50; sueno = 70; entretenimiento = 50; felicidad = 60; salud = 100; mascotaViva = true;
  setControlsEnabled(true);
  updateUI();
  // reiniciar timers
  timers.forEach(t => clearInterval(t));
  timers = [];
  startTimers();
});

/* ---------- Tienda / Inventario ---------- */
buyAppleBtn.addEventListener("click", () => {
  if (!mascotaViva) return;
  if (monedas < PRICE_APPLE) {
    showAlert("No tienes suficientes monedas 🪙");
    return;
  }
  monedas -= PRICE_APPLE;
  if (!inventario.manzana) inventario.manzana = {icon:'🍎', nombre:'Manzana', cantidad:0};
  inventario.manzana.cantidad++;
  showAlert("🍎 Compraste una manzana");
  saveState();
  updateUI();
  renderInventory();
});

/* Render inventario en modal */
function renderInventory() {
  inventoryList.innerHTML = "";
  const keys = Object.keys(inventario);
  if (keys.length === 0) {
    inventoryList.innerHTML = "<p>No tienes ítems.</p>";
    return;
  }
  keys.forEach(k => {
    const it = inventario[k];
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `<span>${it.icon} ${it.nombre} x${it.cantidad}</span>
      <div><button onclick="prepareUse('${k}')">Usar</button></div>`;
    inventoryList.appendChild(div);
  });
}

/* Prepara uso de item (muestra panel con cantidad) */
function prepareUse(key) {
  if (!inventario[key]) return;
  useBox.style.display = "block";
  useItemLabel.textContent = `${inventario[key].icon} ${inventario[key].nombre} — tienes ${inventario[key].cantidad}`;
  useAmount.max = inventario[key].cantidad;
  useAmount.value = 1;
  useBox.dataset.itemKey = key;
}

/* Uso confirmado */
confirmUseBtn.addEventListener("click", () => {
  const key = useBox.dataset.itemKey;
  const qty = parseInt(useAmount.value) || 1;
  useItem(key, qty);
  useBox.style.display = "none";
});

/* Lógica de uso de items */
function useItem(key, qty) {
  if (!inventario[key] || inventario[key].cantidad < qty) {
    showAlert("No tienes suficientes unidades.");
    return;
  }
  // efectos por item
  if (key === 'manzana') {
    hambre = Math.min(100, hambre + (20 * qty));
    showAlert(`🍎 Usaste ${qty} manzana(s). +${20*qty} Hambre`);
  }
  inventario[key].cantidad -= qty;
  if (inventario[key].cantidad <= 0) delete inventario[key];
  renderInventory();
  saveState();
  recalcular();
}

/* ---------- Recordatorios (alertas en pantalla) ---------- */
let notes = JSON.parse(localStorage.getItem("mp_notes")) || [];

saveNoteBtn.addEventListener("click", () => {
  const t = noteTitle.value.trim();
  const b = noteBody.value.trim();
  if (!t) { showAlert("Ingresa un título"); return; }
  notes.push({titulo: t, body: b});
  localStorage.setItem("mp_notes", JSON.stringify(notes));
  renderNotes();
  showAlert("📝 Recordatorio guardado");
  noteTitle.value = ""; noteBody.value = "";
});

function renderNotes() {
  notesList.innerHTML = "";
  if (notes.length === 0) { notesList.innerHTML = "<p>No hay recordatorios.</p>"; return; }
  notes.forEach((n, i) => {
    const div = document.createElement("div");
    div.textContent = n.titulo;
    div.style.cursor = "pointer";
    div.onclick = () => showAlert(`📌 ${n.titulo}: ${n.body || '(sin contenido)'}`);
    notesList.appendChild(div);
  });
}

/* ---------- Timers / Degradación ---------- */
function startTimers() {
  // hunger decay
  timers.push(setInterval(()=>{ if(mascotaViva){ hambre = Math.max(0, hambre - 5); recalcular(); } }, HUNGER_INTERVAL));
  // sleep decay
  timers.push(setInterval(()=>{ if(mascotaViva){ sueno = Math.max(0, sueno - 5); recalcular(); } }, SLEEP_INTERVAL));
  // entertainment decay
  timers.push(setInterval(()=>{ if(mascotaViva){ entretenimiento = Math.max(0, entretenimiento - 5); recalcular(); } }, ENTERTAIN_INTERVAL));
  // happiness recalc period (redundant pero permite subida automática de felicidad interna)
  timers.push(setInterval(()=>{ if(mascotaViva){ felicidad = Math.round((sueno + entretenimiento)/2); recalcular(); } }, HAPPINESS_INTERVAL));
  // coins
  timers.push(setInterval(()=>{ if(mascotaViva){ monedas++; saveState(); updateUI(); } }, COIN_INTERVAL));
}

/* ---------- Modales open/close ---------- */
function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

/* Attach open buttons */
openGames.addEventListener("click", ()=>{ openModal('modalJuegos'); });
openShop.addEventListener("click", ()=>{ openModal('modalShop'); });
openInv.addEventListener("click", ()=>{ renderInventory(); openModal('modalInv'); });
openNotes.addEventListener("click", ()=>{ renderNotes(); openModal('modalNotes'); });

/* Close handlers for .close elements */
document.querySelectorAll('.close').forEach(el => {
  el.addEventListener('click', (e)=>{
    const id = e.target.dataset.close;
    if (id) closeModal(id);
    else {
      // fallback for data-close not present
      el.parentElement.parentElement.style.display = 'none';
    }
    // if closing snake modal stop game
    if (e.target.dataset.close === 'modalSnake') stopSnakeGame();
  });
});

/* ---------- Start / load ---------- */
/* Si ya hay nombre guardado, lo mostramos en el input; de lo contrario dejamos el overlay visible */
if (nameSaved && nameSaved.length > 0) {
  petNameInput.value = nameSaved;
} else {
  petNameInput.value = "";
}
startScreen.style.display = "flex";

/* Cuando el usuario presiona comenzar */
startBtn.addEventListener("click", ()=>{
  const chosen = petNameInput.value.trim();
  const nameToUse = chosen || "MirandaPet";
  localStorage.setItem("mp_name", nameToUse);
  petNameEl.textContent = nameToUse;
  startScreen.style.display = "none";
  updateUI();
  // iniciar timers solo la primera vez que arranca
  startTimers();
});

/* ---------- Snake (viborita) - implementación sencilla ---------- */
openSnakeBtn.addEventListener('click', ()=> {
  openModal('modalSnake');
  initSnakeGame();
});

/* Snake implementation */
function initSnakeGame() {
  const canvas = snakeCanvas;
  const ctx = canvas.getContext('2d');
  const size = 20; // grid 20x20 -> cell 20 (canvas 400x400)
  const cell = 20;
  let snake = [{x:9,y:9}];
  let dir = {x:0,y:0};
  let apple = spawnApple();
  let score = 0;
  let running = false;
  let gameInterval = null;

  function spawnApple(){
    return {x: Math.floor(Math.random()*size), y: Math.floor(Math.random()*size)};
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw apple
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x*cell, apple.y*cell, cell, cell);
    // draw snake
    ctx.fillStyle = 'green';
    snake.forEach(s=> ctx.fillRect(s.x*cell+1, s.y*cell+1, cell-2, cell-2));
  }

  function step(){
    if(!running) return;
    // move snake
    const head = {x: (snake[0].x + dir.x + size)%size, y: (snake[0].y + dir.y + size)%size};
    // collision with self?
    if (snake.some(s => s.x===head.x && s.y===head.y)) {
      // end game
      running = false;
      clearInterval(gameInterval);
      showAlert("💥 La viborita chocó. Puntaje: "+score);
      return;
    }
    snake.unshift(head);
    // eat apple?
    if (head.x === apple.x && head.y === apple.y) {
      score++;
      snakeScore.textContent = "Puntaje: " + score;
      // reward: give 1 moneda and +entretenimiento
      monedas += 1;
      entretenimiento = Math.min(100, entretenimiento + 8);
      saveState();
      updateUI();
      apple = spawnApple();
    } else {
      snake.pop();
    }
    draw();
  }

  function keyHandler(e){
    const k = e.key;
    if (k === 'ArrowUp' && dir.y!==1) dir = {x:0,y:-1};
    if (k === 'ArrowDown' && dir.y!==-1) dir = {x:0,y:1};
    if (k === 'ArrowLeft' && dir.x!==1) dir = {x:-1,y:0};
    if (k === 'ArrowRight' && dir.x!==-1) dir = {x:1,y:0};
  }

  function start(){
    if (running) return;
    running = true;
    dir = {x:1,y:0};
    gameInterval = setInterval(step, 120);
    window.addEventListener('keydown', keyHandler);
  }
  function stop(){
    running = false;
    clearInterval(gameInterval);
    window.removeEventListener('keydown', keyHandler);
  }
  function destroy(){
    stop();
    snake = [{x:9,y:9}];
    dir = {x:0,y:0};
    apple = spawnApple();
    score = 0;
    snakeScore.textContent = "Puntaje: 0";
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  // Expose controls
  startSnakeBtn.onclick = start;
  stopSnakeBtn.onclick = stop;

  // Save reference for closing cleanup
  snakeGame = {start, stop, destroy, cleanup: ()=>{ stop(); window.removeEventListener('keydown', keyHandler); }};
}

/* Stop & cleanup when modal closes */
function stopSnakeGame() {
  if (snakeGame) {
    snakeGame.destroy && snakeGame.destroy();
    snakeGame = null;
  }
}

/* ---------- Cerrar modales al hacer click fuera del contenido ---------- */
document.querySelectorAll('.modal').forEach(mod => {
  mod.addEventListener('click', (e) => {
    if (e.target === mod) {
      mod.style.display = 'none';
      if (mod.id === 'modalSnake') stopSnakeGame();
    }
  });
});

/* ---------- On load: actualizar UI y renderizar datos guardados ---------- */
petNameEl.textContent = localStorage.getItem("mp_name") || "MirandaPet";
renderInventory();
renderNotes();
updateUI();
