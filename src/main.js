import confetti from 'canvas-confetti';

// =========================================================
// DEFAULT DATA (5 MATERIAS DE LA FOTO CON CASILLAS VACÍAS)
// =========================================================
function createEmptyTasks(prefix, count = 5) {
  const tasks = [];
  for (let i = 1; i <= count; i++) {
    tasks.push({
      id: `${prefix}-${i}`,
      actividad: '',
      tema: '',
      fecha: '',
      completed: false
    });
  }
  return tasks;
}

const DEFAULT_SUBJECTS = [
  {
    id: 'subj-1',
    name: 'DIDACTICA ESPECIAL',
    theme: 'purple',
    tasks: createEmptyTasks('t1', 5),
    cumplioTodas: null,
    cualesFaltaron: ''
  },
  {
    id: 'subj-2',
    name: 'INT. A LA INFORMATICA',
    theme: 'blue',
    tasks: createEmptyTasks('t2', 5),
    cumplioTodas: null,
    cualesFaltaron: ''
  },
  {
    id: 'subj-3',
    name: 'EDU. PARA EL TRABAJO',
    theme: 'pink',
    tasks: createEmptyTasks('t3', 5),
    cumplioTodas: null,
    cualesFaltaron: ''
  },
  {
    id: 'subj-4',
    name: 'FASE DE INTEGRACION',
    theme: 'yellow',
    tasks: createEmptyTasks('t4', 5),
    cumplioTodas: null,
    cualesFaltaron: ''
  },
  {
    id: 'subj-5',
    name: 'ELEM. DE LA BIOLOGIA',
    theme: 'green',
    tasks: createEmptyTasks('t5', 5),
    cumplioTodas: null,
    cualesFaltaron: ''
  }
];

const THEME_OPTIONS = [
  { id: 'purple', name: 'Lila / Púrpura', dot: '#9b74e6' },
  { id: 'blue', name: 'Celeste / Azul', dot: '#38bdf8' },
  { id: 'pink', name: 'Rosa Pastel', dot: '#f472b6' },
  { id: 'yellow', name: 'Amarillo Sol', dot: '#fbbf24' },
  { id: 'green', name: 'Verde Menta', dot: '#34d399' }
];

// =========================================================
// APPLICATION STATE
// =========================================================
const STORAGE_KEY = 'mi_planner_v2_clean';

let state = {
  subjects: [],
  currentView: 'home', // 'home' | 'planner'
  soundEnabled: true
};

// =========================================================
// WEB AUDIO SYNTHESIZER (KAWAII SOUND FX)
// =========================================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBubblePop() {
  if (!state.soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    // Ignore
  }
}

function playSparkleChime() {
  if (!state.soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  } catch (e) {
    // Ignore
  }
}

function playPawPurr() {
  if (!state.soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const chords = [392, 493.88, 587.33, 783.99];
    chords.forEach((f) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    });
  } catch (e) {
    // Ignore
  }
}

// =========================================================
// PERSISTENCE (LOCAL STORAGE)
// =========================================================
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.subjects = parsed.subjects || DEFAULT_SUBJECTS;
      state.soundEnabled = parsed.soundEnabled !== undefined ? parsed.soundEnabled : true;
    } else {
      state.subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
    }
  } catch (e) {
    state.subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
  }
  updateSoundIcon();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      subjects: state.subjects,
      soundEnabled: state.soundEnabled
    }));
    updateGlobalStats();
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// =========================================================
// UI HELPERS & STATS
// =========================================================
function updateCurrentDate() {
  const el = document.getElementById('currentDateDisplay');
  if (!el) return;
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('es-ES', options);
  el.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

function updateGlobalStats() {
  const statsEl = document.getElementById('statsText');
  if (!statsEl) return;

  let totalTasks = 0;
  let completedTasks = 0;

  state.subjects.forEach(subj => {
    subj.tasks.forEach(task => {
      // Only count rows that have activity or completion
      if (task.actividad && task.actividad.trim().length > 0) {
        totalTasks++;
        if (task.completed) completedTasks++;
      }
    });
  });

  if (totalTasks === 0) {
    statsEl.textContent = '0 actividades registradas';
  } else {
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    statsEl.textContent = `${completedTasks} / ${totalTasks} completadas (${percentage}%)`;
  }
}

function switchView(viewName) {
  state.currentView = viewName;
  const viewHome = document.getElementById('viewHome');
  const viewPlanner = document.getElementById('viewPlanner');
  const btnNavHome = document.getElementById('btnNavHome');
  const btnNavPlanner = document.getElementById('btnNavPlanner');

  if (viewName === 'home') {
    viewHome.classList.add('active');
    viewPlanner.classList.remove('active');
    btnNavHome.classList.add('active');
    btnNavPlanner.classList.remove('active');
    renderHomeSubjectChips();
  } else {
    viewHome.classList.remove('active');
    viewPlanner.classList.add('active');
    btnNavHome.classList.remove('active');
    btnNavPlanner.classList.add('active');
    renderPlannerSubjects();
    renderSubjectJumpPills();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateSoundIcon() {
  const soundIcon = document.getElementById('soundIcon');
  if (soundIcon) {
    soundIcon.textContent = state.soundEnabled ? '🔔' : '🔕';
  }
}

// =========================================================
// RENDERING FUNCTIONS
// =========================================================

// Render Home Page Preview Chips
function renderHomeSubjectChips() {
  const container = document.getElementById('homeChipsContainer');
  if (!container) return;
  container.innerHTML = '';

  state.subjects.forEach((subj) => {
    const chip = document.createElement('div');
    chip.className = 'preview-chip';
    chip.title = `Ir a ${subj.name}`;

    const colorDot = document.createElement('span');
    colorDot.className = 'chip-color-dot';
    const themeObj = THEME_OPTIONS.find(t => t.id === subj.theme) || THEME_OPTIONS[0];
    colorDot.style.background = themeObj.dot;

    const completedCount = subj.tasks.filter(t => t.completed).length;
    const totalFilled = subj.tasks.filter(t => t.actividad && t.actividad.trim().length > 0).length;

    chip.appendChild(colorDot);
    chip.appendChild(document.createTextNode(`${subj.name} (${completedCount}/${totalFilled > 0 ? totalFilled : subj.tasks.length})`));

    chip.addEventListener('click', () => {
      playBubblePop();
      switchView('planner');
      setTimeout(() => {
        const target = document.getElementById(`subject-card-${subj.id}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.style.transition = 'box-shadow 0.4s ease';
          target.style.boxShadow = '0 0 25px rgba(255, 255, 255, 0.9)';
          setTimeout(() => target.style.boxShadow = '', 1500);
        }
      }, 100);
    });

    container.appendChild(chip);
  });
}

// Render Jump Pills in Planner Header
function renderSubjectJumpPills() {
  const container = document.getElementById('subjectJumpNav');
  if (!container) return;
  container.innerHTML = '';

  state.subjects.forEach(subj => {
    const pill = document.createElement('button');
    pill.className = 'jump-pill';
    pill.textContent = subj.name;
    pill.addEventListener('click', () => {
      playBubblePop();
      const target = document.getElementById(`subject-card-${subj.id}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    container.appendChild(pill);
  });
}

// Render All Subject Cards in Planner
function renderPlannerSubjects() {
  const listContainer = document.getElementById('subjectsList');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  state.subjects.forEach((subj, sIdx) => {
    const card = document.createElement('article');
    card.className = `subject-card theme-${subj.theme}`;
    card.id = `subject-card-${subj.id}`;

    // --- Header Row ---
    const headerRow = document.createElement('div');
    headerRow.className = 'subject-header-row';

    const titleContainer = document.createElement('div');
    titleContainer.className = 'subject-title-container';

    const title = document.createElement('h2');
    title.className = 'subject-bubble-title';
    title.textContent = subj.name;
    title.title = 'Haz doble clic para editar el nombre';
    title.addEventListener('dblclick', () => {
      const newName = prompt('Editar nombre de la materia:', subj.name);
      if (newName && newName.trim()) {
        subj.name = newName.trim().toUpperCase();
        saveState();
        renderPlannerSubjects();
        renderSubjectJumpPills();
      }
    });
    titleContainer.appendChild(title);
    headerRow.appendChild(titleContainer);

    // Subject Tools (Edit, Delete)
    const tools = document.createElement('div');
    tools.className = 'subject-tools';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'tool-icon-btn';
    btnEdit.innerHTML = '✏️';
    btnEdit.title = 'Editar materia y color';
    btnEdit.addEventListener('click', () => openEditSubjectModal(subj));

    const btnDel = document.createElement('button');
    btnDel.className = 'tool-icon-btn';
    btnDel.innerHTML = '🗑️';
    btnDel.title = 'Eliminar materia';
    btnDel.addEventListener('click', () => {
      if (confirm(`¿Eliminar la sección "${subj.name}"?`)) {
        state.subjects.splice(sIdx, 1);
        saveState();
        renderPlannerSubjects();
        renderSubjectJumpPills();
        renderHomeSubjectChips();
      }
    });

    tools.appendChild(btnEdit);
    tools.appendChild(btnDel);
    headerRow.appendChild(tools);

    card.appendChild(headerRow);

    // --- Activities Table (Spacious & Centered) ---
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'activities-table-wrapper';

    // Header Row: ACTIVIDAD / TEMA / FECHA
    const tableHead = document.createElement('div');
    tableHead.className = 'table-header-row';
    tableHead.innerHTML = `
      <span class="col-header">ACTIVIDAD</span>
      <span class="col-header">TEMA</span>
      <span class="col-header">FECHA DE ENTREGA</span>
      <span class="col-header"></span>
    `;
    tableWrapper.appendChild(tableHead);

    // Rows Container
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'rows-container';

    subj.tasks.forEach((task, tIdx) => {
      const row = document.createElement('div');
      row.className = `activity-row ${task.completed ? 'completed' : ''}`;

      // 1. Actividad (Checkbox + Centered Input)
      const colAct = document.createElement('div');
      colAct.className = 'cell-wrapper cell-actividad';

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = `check-task-btn ${task.completed ? 'checked' : ''}`;
      checkBtn.innerHTML = task.completed ? '✔' : '';
      checkBtn.title = task.completed ? 'Marcar pendiente' : 'Marcar completado';
      checkBtn.addEventListener('click', () => {
        playBubblePop();
        task.completed = !task.completed;
        saveState();
        renderPlannerSubjects();
        if (task.completed) {
          triggerTaskConfetti(checkBtn);
        }
      });

      const inputAct = document.createElement('input');
      inputAct.type = 'text';
      inputAct.className = 'cell-input';
      inputAct.value = task.actividad || '';
      inputAct.placeholder = 'Escribe tu actividad...';
      inputAct.addEventListener('input', (e) => {
        task.actividad = e.target.value;
        saveState();
      });

      colAct.appendChild(checkBtn);
      colAct.appendChild(inputAct);

      // 2. Tema (Centered Input)
      const colTema = document.createElement('div');
      colTema.className = 'cell-wrapper';
      const inputTema = document.createElement('input');
      inputTema.type = 'text';
      inputTema.className = 'cell-input';
      inputTema.value = task.tema || '';
      inputTema.placeholder = 'Escribe el tema...';
      inputTema.addEventListener('input', (e) => {
        task.tema = e.target.value;
        saveState();
      });
      colTema.appendChild(inputTema);

      // 3. Fecha (Date picker / delivery date)
      const colFecha = document.createElement('div');
      colFecha.className = 'cell-wrapper';
      const inputFecha = document.createElement('input');
      inputFecha.type = 'date';
      inputFecha.className = 'cell-input';
      inputFecha.value = task.fecha || '';
      inputFecha.addEventListener('input', (e) => {
        task.fecha = e.target.value;
        saveState();
      });
      colFecha.appendChild(inputFecha);

      // 4. Delete Row Button
      const colDel = document.createElement('div');
      const btnDelRow = document.createElement('button');
      btnDelRow.type = 'button';
      btnDelRow.className = 'btn-delete-row';
      btnDelRow.innerHTML = '✕';
      btnDelRow.title = 'Eliminar fila';
      btnDelRow.addEventListener('click', () => {
        subj.tasks.splice(tIdx, 1);
        saveState();
        renderPlannerSubjects();
      });
      colDel.appendChild(btnDelRow);

      row.appendChild(colAct);
      row.appendChild(colTema);
      row.appendChild(colFecha);
      row.appendChild(colDel);

      rowsContainer.appendChild(row);
    });

    tableWrapper.appendChild(rowsContainer);

    // Table Footer Actions (+ Fila)
    const tableFooter = document.createElement('div');
    tableFooter.className = 'table-footer-actions';
    const btnAddRow = document.createElement('button');
    btnAddRow.type = 'button';
    btnAddRow.className = 'btn-add-row';
    btnAddRow.innerHTML = '<span>➕ Agregar Fila</span>';
    btnAddRow.addEventListener('click', () => {
      playBubblePop();
      subj.tasks.push({
        id: 't-' + Date.now(),
        actividad: '',
        tema: '',
        fecha: '',
        completed: false
      });
      saveState();
      renderPlannerSubjects();
    });
    tableFooter.appendChild(btnAddRow);
    tableWrapper.appendChild(tableFooter);

    card.appendChild(tableWrapper);

    // --- Compliance Section ---
    const compSection = document.createElement('div');
    compSection.className = 'compliance-section';

    const questionTitle = document.createElement('h3');
    questionTitle.className = 'compliance-question';
    questionTitle.textContent = '¿LOGRASTE CUMPLIR CON TODAS LAS ACTIVIDADES??';
    compSection.appendChild(questionTitle);

    const optionsRow = document.createElement('div');
    optionsRow.className = 'compliance-options-row';

    // Button [ SÍ ]
    const btnSi = document.createElement('button');
    btnSi.type = 'button';
    btnSi.className = `pill-choice-btn ${subj.cumplioTodas === true ? 'selected' : ''}`;
    btnSi.textContent = 'SÍ';
    btnSi.addEventListener('click', () => {
      playSparkleChime();
      subj.cumplioTodas = true;
      saveState();
      renderPlannerSubjects();
      triggerSubjectCelebration(btnSi);
    });

    // Button [ NO ]
    const btnNo = document.createElement('button');
    btnNo.type = 'button';
    btnNo.className = `pill-choice-btn ${subj.cumplioTodas === false ? 'selected' : ''}`;
    btnNo.textContent = 'NO';
    btnNo.addEventListener('click', () => {
      playBubblePop();
      subj.cumplioTodas = false;
      saveState();
      renderPlannerSubjects();
      setTimeout(() => {
        const inputFaltan = card.querySelector('.missing-input-field');
        if (inputFaltan) inputFaltan.focus();
      }, 50);
    });

    optionsRow.appendChild(btnSi);
    optionsRow.appendChild(btnNo);
    compSection.appendChild(optionsRow);

    // Sub-Question: ¿CUÁLES FALTARON??
    const missingSection = document.createElement('div');
    missingSection.className = 'missing-tasks-section';

    const subQuestion = document.createElement('h4');
    subQuestion.className = 'missing-question';
    subQuestion.textContent = '¿CUÁLES FALTARON??';
    missingSection.appendChild(subQuestion);

    const inputMissing = document.createElement('textarea');
    inputMissing.className = 'missing-input-field';
    inputMissing.placeholder = 'Anota aquí tus actividades pendientes o reflexiones...';
    inputMissing.rows = 2;
    inputMissing.value = subj.cualesFaltaron || '';
    inputMissing.addEventListener('input', (e) => {
      subj.cualesFaltaron = e.target.value;
      saveState();
    });
    missingSection.appendChild(inputMissing);

    compSection.appendChild(missingSection);
    card.appendChild(compSection);

    listContainer.appendChild(card);
  });
}

// =========================================================
// CELEBRATION & CONFETTI ANIMATIONS
// =========================================================
function triggerTaskConfetti(element) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 25,
    spread: 60,
    origin: { x, y },
    colors: ['#cbb2f9', '#ffd1eb', '#bae6fd', '#fef08a', '#a7f3d0'],
    disableForReducedMotion: true
  });
}

function triggerSubjectCelebration(btnElement) {
  const rect = btnElement.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 65,
    spread: 80,
    origin: { x, y },
    colors: ['#9b74e6', '#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#ffffff'],
    scalar: 1.1,
    disableForReducedMotion: true
  });
}

function triggerBigPlannerConfetti() {
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#c5a4f7', '#ffffff', '#ffd1eb', '#a7f3d0', '#bae6fd'],
    disableForReducedMotion: true
  });
}

// =========================================================
// MODAL: NUEVA / EDITAR MATERIA
// =========================================================
function initColorPaletteOptions(selectedTheme = 'purple') {
  const container = document.getElementById('colorPaletteOptions');
  if (!container) return;
  container.innerHTML = '';

  THEME_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `color-radio-btn ${opt.id === selectedTheme ? 'selected' : ''}`;
    btn.dataset.themeId = opt.id;
    btn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:${opt.dot}; border:1.5px solid #522b82;"></span> ${opt.name}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-radio-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    container.appendChild(btn);
  });
}

function openAddSubjectModal() {
  document.getElementById('modalSubjectTitle').textContent = 'Nueva Materia';
  document.getElementById('editSubjectId').value = '';
  document.getElementById('inputSubjectName').value = '';
  document.getElementById('inputInitialRows').value = 5;
  initColorPaletteOptions('purple');
  document.getElementById('modalSubject').classList.add('open');
}

function openEditSubjectModal(subj) {
  document.getElementById('modalSubjectTitle').textContent = 'Editar Materia';
  document.getElementById('editSubjectId').value = subj.id;
  document.getElementById('inputSubjectName').value = subj.name;
  document.getElementById('inputInitialRows').value = subj.tasks.length;
  initColorPaletteOptions(subj.theme);
  document.getElementById('modalSubject').classList.add('open');
}

function closeSubjectModal() {
  document.getElementById('modalSubject').classList.remove('open');
}

function handleSubjectFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('editSubjectId').value;
  const name = document.getElementById('inputSubjectName').value.trim().toUpperCase();
  const selectedThemeBtn = document.querySelector('.color-radio-btn.selected');
  const theme = selectedThemeBtn ? selectedThemeBtn.dataset.themeId : 'purple';
  const rowCount = parseInt(document.getElementById('inputInitialRows').value, 10) || 5;

  if (!name) return;

  if (editId) {
    const existing = state.subjects.find(s => s.id === editId);
    if (existing) {
      existing.name = name;
      existing.theme = theme;
    }
  } else {
    state.subjects.push({
      id: `subj-${Date.now()}`,
      name,
      theme,
      tasks: createEmptyTasks(`t-${Date.now()}`, rowCount),
      cumplioTodas: null,
      cualesFaltaron: ''
    });
  }

  saveState();
  closeSubjectModal();
  renderPlannerSubjects();
  renderSubjectJumpPills();
  renderHomeSubjectChips();
  playSparkleChime();
}

// =========================================================
// EVENT LISTENERS & INITIALIZATION
// =========================================================
function setupEventListeners() {
  // Navigation Tabs
  document.getElementById('btnNavHome').addEventListener('click', () => {
    playBubblePop();
    switchView('home');
  });

  document.getElementById('btnNavPlanner').addEventListener('click', () => {
    playBubblePop();
    switchView('planner');
  });

  // Hero CTA Button
  document.getElementById('btnOpenPlannerFromHero').addEventListener('click', () => {
    playSparkleChime();
    switchView('planner');
  });

  // Bubbly PLANNER Sticker interactive bounce & confetti
  const sticker = document.getElementById('plannerSticker');
  if (sticker) {
    sticker.addEventListener('click', () => {
      playSparkleChime();
      triggerBigPlannerConfetti();
    });
  }

  // Kawaii Cat Paw Badge interaction
  const paw = document.getElementById('btnPawFun');
  if (paw) {
    paw.addEventListener('click', () => {
      playPawPurr();
      confetti({
        particleCount: 35,
        spread: 60,
        shapes: ['circle'],
        colors: ['#f472b6', '#d8bcfd', '#ffffff']
      });
    });
  }

  // Add Subject Button
  document.getElementById('btnAddSubject').addEventListener('click', () => {
    playBubblePop();
    openAddSubjectModal();
  });

  // Sound Toggle Button
  document.getElementById('btnSoundToggle').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    updateSoundIcon();
    saveState();
    if (state.soundEnabled) playBubblePop();
  });

  // Subject Modal Controls
  document.getElementById('btnCloseSubjectModal').addEventListener('click', closeSubjectModal);
  document.getElementById('btnCancelSubjectModal').addEventListener('click', closeSubjectModal);
  document.getElementById('formSubject').addEventListener('submit', handleSubjectFormSubmit);

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });
}

// =========================================================
// APP BOOTSTRAP
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateCurrentDate();
  updateGlobalStats();
  renderHomeSubjectChips();
  renderPlannerSubjects();
  renderSubjectJumpPills();
  setupEventListeners();
});
