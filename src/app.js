import { sanitizeInput } from './security.js';
import {
  createListId,
  createSubtaskId,
  createTaskId,
  loadAppState,
  saveAppState,
  saveTheme,
} from './storage.js';

const taskForm = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskList = document.querySelector('#task-list');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const sidebar = document.querySelector('.sidebar');
const toggleSidebarButton = document.querySelector('#toggle-sidebar');
const listList = document.querySelector('#list-list');
const listForm = document.querySelector('#list-form');
const listInput = document.querySelector('#list-input');
const addListButton = document.querySelector('#add-list-button');
const cancelListButton = document.querySelector('#cancel-list-button');
const themeToggle = document.querySelector('#theme-toggle');
const settingsButton = document.querySelector('#settings-button');
const settingsPanel = document.querySelector('#settings-panel');
const settingsOverlay = document.querySelector('#settings-overlay');
const closeSettingsButton = document.querySelector('#close-settings');
const settingsDetail = document.querySelector('#settings-detail');
const settingsBackButton = document.querySelector('#settings-back');
const settingsDetailTitle = document.querySelector('#settings-detail-title');
const settingsDetailCopy = document.querySelector('#settings-detail-copy');
const settingsDetailActions = document.querySelector('#settings-detail-actions');
const taskDueDate = document.querySelector('#task-due-date');
const taskPriority = document.querySelector('#task-priority');
const taskListSelect = document.querySelector('#task-list-select');
const subtaskInput = document.querySelector('#subtask-input');
const addSubtaskButton = document.querySelector('#add-subtask-button');
const subtaskList = document.querySelector('#subtask-list');
const cancelEditTaskButton = document.querySelector('#cancel-edit-task');
const viewTitle = document.querySelector('#view-title');
const taskSortSelect = document.querySelector('#task-sort-select');
const taskDetailPanel = document.querySelector('#task-detail-panel');
const taskDetailOverlay = document.querySelector('#task-detail-overlay');
const closeTaskDetailButton = document.querySelector('#close-task-detail');
const taskDetailTitle = document.querySelector('#task-detail-title');

const appState = loadAppState();
let tasks = appState.tasks;
let lists = appState.lists;
let activeFilter = 'all';
let selectedListId = 'all';
let currentTheme = appState.theme;
let editingTaskId = null;
let draftSubtasks = [];
let detailTaskId = null;
let taskOrder = appState.taskOrder || 'created-desc';
let manualTaskOrder = [...(appState.manualTaskOrder || [])];
let touchStartX = 0;
let touchStartY = 0;

const priorityLabels = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

function persistState() {
  saveAppState({ theme: currentTheme, lists, tasks, taskOrder, manualTaskOrder });
}

function getListById(listId) {
  return lists.find((list) => list.id === listId) || lists[0];
}

function getCurrentListName() {
  if (selectedListId === 'all') {
    return 'Mis tareas';
  }

  const currentList = getListById(selectedListId);
  return currentList ? currentList.name : 'Mis tareas';
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle('active', isActive);
  });
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  document.body.classList.toggle('light-theme', theme === 'light');
  themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  saveTheme(theme);
}

function openSettingsMenu() {
  closeSettingsDetail();
  settingsPanel.classList.remove('hidden');
  settingsOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
    settingsPanel.setAttribute('aria-hidden', 'false');
    settingsPanel.querySelectorAll('.settings-option').forEach((item) => item.setAttribute('aria-expanded', 'false'));
  settingsOverlay.setAttribute('aria-hidden', 'false');
}

function closeSettingsMenu() {
  settingsPanel.classList.add('hidden');
  settingsOverlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
    settingsPanel.setAttribute('aria-hidden', 'true');
    settingsPanel.querySelectorAll('.settings-option').forEach((item) => item.setAttribute('aria-expanded', 'false'));
  settingsOverlay.setAttribute('aria-hidden', 'true');
  settingsDetail.classList.add('hidden');
}

function openSettingsDetail(settingName) {
  settingsPanel.querySelectorAll('.settings-menu').forEach((menu) => menu.classList.add('hidden'));
  settingsDetailTitle.textContent = settingName;
  const detailContent = {
    'Mi cuenta': ['Revisa los datos de tu cuenta.', '<label class="settings-field">Nombre<input type="text" placeholder="Tu nombre" /></label>'],
    'Administrar perfil': ['Personaliza la información visible de tu perfil.', '<label class="settings-field">Descripción<textarea rows="3" placeholder="Cuéntanos sobre ti"></textarea></label>'],
    'Google Drive': ['Elige cómo sincronizar tus tareas con Google Drive.', '<label class="settings-field">Cuenta conectada<input type="email" placeholder="correo@ejemplo.com" /></label>'],
    iCloud: ['Configura la cuenta de iCloud que quieres utilizar.', '<label class="settings-field">Apple ID<input type="email" placeholder="correo@ejemplo.com" /></label>'],
    'Sincronizar manual': ['Inicia una sincronización manual de tus datos.', '<p class="settings-status">Última sincronización: todavía no realizada.</p>'],
    'Centro de ayuda': ['Encuentra respuestas y guías para usar Tareasy.', '<button type="button" class="secondary-button small">Abrir guías</button>'],
    'Preguntas frecuentes': ['Consulta las respuestas a las dudas más comunes.', '<button type="button" class="secondary-button small">Ver preguntas</button>'],
    'Enviar mensaje': ['Escribe un mensaje para nuestro equipo de soporte.', '<label class="settings-field">Mensaje<textarea rows="3" placeholder="¿En qué podemos ayudarte?"></textarea></label>'],
    Email: ['Envía tu consulta directamente por correo electrónico.', '<button type="button" class="secondary-button small">Redactar email</button>'],
    Chat: ['Conversa con soporte desde la aplicación.', '<button type="button" class="secondary-button small">Iniciar chat</button>'],
  };
  const [copy, content] = detailContent[settingName] || ['Configuración específica.', ''];
  settingsDetailCopy.textContent = copy;
  settingsDetailActions.innerHTML = `${content}<button type="button" class="primary-button small">Guardar cambios</button>`;
  settingsDetail.classList.remove('hidden');
  settingsPanel.querySelectorAll('.settings-section').forEach((section) => section.classList.add('hidden'));
  settingsDetail.focus?.();
}

function closeSettingsDetail() {
  settingsDetail.classList.add('hidden');
  settingsPanel.querySelectorAll('.settings-section').forEach((section) => section.classList.remove('hidden'));
}

function renderListOptions() {
  taskListSelect.innerHTML = lists
    .map(
      (list) => `
        <option value="${list.id}" ${selectedListId === list.id ? 'selected' : ''}>${sanitizeInput(list.name)}</option>
      `,
    )
    .join('');

  if (!taskListSelect.value && lists.length) {
    taskListSelect.value = lists[0].id;
  }
}

function renderSidebarLists() {
  listList.innerHTML = lists
    .map(
      (list) => `
        <div class="list-item ${selectedListId === list.id ? 'active' : ''}">
          <button type="button" class="list-select" data-list-id="${list.id}">${sanitizeInput(list.name)}</button>
          <div class="list-actions">
            <button type="button" class="list-action" data-list-action="rename" data-list-id="${list.id}" aria-label="Renombrar lista">✎</button>
            <button type="button" class="list-action" data-list-action="delete" data-list-id="${list.id}" aria-label="Eliminar lista">🗑</button>
          </div>
        </div>
      `,
    )
    .join('');
}

function getVisibleTasks() {
  const scopedTasks = selectedListId === 'all'
    ? tasks
    : tasks.filter((task) => task.listId === selectedListId);

  let visibleTasks = scopedTasks;
  if (activeFilter === 'active') {
    visibleTasks = scopedTasks.filter((task) => !task.completed);
  }

  if (activeFilter === 'completed') {
    visibleTasks = scopedTasks.filter((task) => task.completed);
  }

  if (taskOrder === 'manual') {
    const orderMap = new Map(manualTaskOrder.map((id, index) => [id, index]));
    return [...visibleTasks].sort((first, second) => (orderMap.get(first.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(second.id) ?? Number.MAX_SAFE_INTEGER));
  }

  return [...visibleTasks].sort((first, second) => {
    if (taskOrder === 'name-asc' || taskOrder === 'name-desc') {
      const result = first.text.localeCompare(second.text, 'es', { sensitivity: 'base' });
      return taskOrder === 'name-asc' ? result : -result;
    }
    if (taskOrder === 'due-asc' || taskOrder === 'due-desc') {
      const firstDate = first.dueDate || (taskOrder === 'due-asc' ? '9999-12-31' : '0000-01-01');
      const secondDate = second.dueDate || (taskOrder === 'due-asc' ? '9999-12-31' : '0000-01-01');
      return taskOrder === 'due-asc' ? firstDate.localeCompare(secondDate) : secondDate.localeCompare(firstDate);
    }
    return second.createdAt.localeCompare(first.createdAt);
  });
}

function formatDueDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
}

function renderSubtasksEditor() {
  if (!draftSubtasks.length) {
    subtaskList.innerHTML = '<li class="empty-state">Sin subtareas todavía.</li>';
    return;
  }

  subtaskList.innerHTML = draftSubtasks
    .map(
      (subtask) => `
        <li class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
          <button type="button" class="task-subtask-toggle" data-subtask-action="toggle" data-subtask-id="${subtask.id}">
            ${subtask.completed ? '✓' : ''}
          </button>
          <span class="subtask-text">${sanitizeInput(subtask.text)}</span>
          <button type="button" class="task-subtask-delete" data-subtask-action="delete" data-subtask-id="${subtask.id}" aria-label="Eliminar subtarea">×</button>
        </li>
      `,
    )
    .join('');
}

function renderTasks() {
  viewTitle.textContent = getCurrentListName();

  const visibleTasks = getVisibleTasks();
  if (!visibleTasks.length) {
    taskList.innerHTML = `
      <li class="empty-state">
        No hay tareas en esta vista. Añade una nueva tarea o cambia de lista.
      </li>
    `;
    return;
  }

  taskList.innerHTML = visibleTasks
    .map((task) => {
      const dueText = task.dueDate ? formatDueDate(task.dueDate) : '';
      const isOverdue = task.dueDate && !task.completed && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString());
      return `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-header" data-action="detail" data-id="${task.id}">
            <button
              type="button"
              class="task-toggle"
              data-action="toggle"
              data-id="${task.id}"
              aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}"
            >
              ${task.completed ? '✓' : ''}
            </button>

            <div class="task-text-wrap">
              <span class="task-text">${sanitizeInput(task.text)}</span>
              <div class="task-meta-row">
                <span class="task-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
                ${dueText ? `<span class="task-badge due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueText}</span>` : ''}
              </div>
            </div>

            <div class="task-actions">
              <button type="button" class="task-more" aria-label="Más opciones" aria-expanded="false">•••</button>
              <div class="task-menu hidden">
                <button type="button" data-action="edit" data-id="${task.id}">Editar</button>
                <button type="button" data-action="delete" data-id="${task.id}">Eliminar</button>
                <button type="button" data-action="move-up" data-id="${task.id}">Subir</button>
                <button type="button" data-action="move-down" data-id="${task.id}">Bajar</button>
              </div>
            </div>
          </div>
        </li>
      `;
    })
    .join('');
}

function resetTaskForm() {
  taskForm.reset();
  taskForm.dataset.mode = 'create';
  cancelEditTaskButton.classList.add('hidden');
  taskInput.placeholder = 'Añadir una tarea...';
  draftSubtasks = [];
  renderSubtasksEditor();
  if (lists.length) {
    taskListSelect.value = selectedListId === 'all' ? lists[0].id : selectedListId;
  }
  editingTaskId = null;
}

function openTaskEditor(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  editingTaskId = taskId;
  taskForm.dataset.mode = 'edit';
  taskInput.value = task.text;
  taskDueDate.value = task.dueDate || '';
  taskPriority.value = task.priority || 'media';
  taskListSelect.value = task.listId || lists[0].id;
  draftSubtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
  renderSubtasksEditor();
  cancelEditTaskButton.classList.remove('hidden');
  taskInput.focus();
}

function addSubtask() {
  const text = sanitizeInput(subtaskInput.value);
  if (!text) {
    subtaskInput.focus();
    return;
  }

  draftSubtasks.push({
    id: createSubtaskId(),
    text,
    completed: false,
  });

  subtaskInput.value = '';
  renderSubtasksEditor();
}

function toggleSubtask(subtaskId) {
  draftSubtasks = draftSubtasks.map((subtask) => {
    if (subtask.id !== subtaskId) {
      return subtask;
    }

    return { ...subtask, completed: !subtask.completed };
  });

  renderSubtasksEditor();
}

function removeSubtask(subtaskId) {
  draftSubtasks = draftSubtasks.filter((subtask) => subtask.id !== subtaskId);
  renderSubtasksEditor();
}

function submitTask(event) {
  event.preventDefault();

  const text = sanitizeInput(taskInput.value);
  if (!text) {
    taskInput.focus();
    return;
  }

  const selectedList = taskListSelect.value || lists[0]?.id || 'inbox';
  const taskPayload = {
    id: editingTaskId || createTaskId(),
    text,
    completed: editingTaskId ? tasks.find((task) => task.id === editingTaskId)?.completed || false : false,
    createdAt: editingTaskId ? tasks.find((task) => task.id === editingTaskId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    dueDate: taskDueDate.value || '',
    priority: taskPriority.value || 'media',
    listId: selectedList,
    subtasks: draftSubtasks,
  };

  if (editingTaskId) {
    tasks = tasks.map((task) => (task.id === editingTaskId ? taskPayload : task));
  } else {
    tasks = [taskPayload, ...tasks];
    manualTaskOrder = [taskPayload.id, ...manualTaskOrder.filter((id) => id !== taskPayload.id)];
  }

  persistState();
  renderTasks();
  resetTaskForm();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return { ...task, completed: !task.completed };
  });

  persistState();
  renderTasks();
  if (detailTaskId === taskId) {
    renderDetailSubtasks();
  }
}

function renderDetailSubtasks() {
  const task = tasks.find((item) => item.id === detailTaskId);
  if (!task) return;
  taskDetailTitle.textContent = task.text;
  subtaskList.innerHTML = task.subtasks?.length
    ? task.subtasks.map((subtask) => `
        <li class="subtask-item ${subtask.completed ? 'completed' : ''}">
          <button type="button" class="task-subtask-toggle" data-detail-subtask-action="toggle" data-subtask-id="${subtask.id}">${subtask.completed ? '✓' : ''}</button>
          <span class="subtask-text">${sanitizeInput(subtask.text)}</span>
          <button type="button" class="task-subtask-delete" data-detail-subtask-action="delete" data-subtask-id="${subtask.id}" aria-label="Eliminar subtarea">×</button>
        </li>`).join('')
    : '<li class="empty-state">Sin subtareas todavía.</li>';
}

function openTaskDetail(taskId) {
  if (!tasks.some((task) => task.id === taskId)) return;
  detailTaskId = taskId;
  renderDetailSubtasks();
  taskDetailPanel.classList.remove('hidden');
  taskDetailOverlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
  subtaskInput.focus();
}

function closeTaskDetail() {
  taskDetailPanel.classList.add('hidden');
  taskDetailOverlay.classList.add('hidden');
  detailTaskId = null;
  if (settingsPanel.classList.contains('hidden')) document.body.classList.remove('modal-open');
}

function addDetailSubtask() {
  const text = sanitizeInput(subtaskInput.value);
  if (!text || !detailTaskId) {
    subtaskInput.focus();
    return;
  }
  tasks = tasks.map((task) => task.id === detailTaskId
    ? { ...task, subtasks: [...(task.subtasks || []), { id: createSubtaskId(), text, completed: false }] }
    : task);
  subtaskInput.value = '';
  persistState();
  renderDetailSubtasks();
  renderTasks();
}

function handleDetailSubtaskAction(event) {
  const button = event.target.closest('[data-detail-subtask-action]');
  if (!button || !detailTaskId) return;
  const subtaskId = button.dataset.subtaskId;
  if (button.dataset.detailSubtaskAction === 'toggle') {
    toggleTaskSubtask(detailTaskId, subtaskId);
    return;
  }
  tasks = tasks.map((task) => task.id === detailTaskId
    ? { ...task, subtasks: (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId) }
    : task);
  persistState();
  renderDetailSubtasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  manualTaskOrder = manualTaskOrder.filter((id) => id !== taskId);
  persistState();
  renderTasks();
}

function moveTask(taskId, direction) {
  const currentOrder = tasks.map((task) => task.id)
    .sort((first, second) => manualTaskOrder.indexOf(first) - manualTaskOrder.indexOf(second));
  const currentIndex = currentOrder.indexOf(taskId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;
  [currentOrder[currentIndex], currentOrder[nextIndex]] = [currentOrder[nextIndex], currentOrder[currentIndex]];
  manualTaskOrder = currentOrder;
  taskOrder = 'manual';
  taskSortSelect.value = taskOrder;
  persistState();
  renderTasks();
}

function toggleTaskSubtask(taskId, subtaskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      subtasks: (task.subtasks || []).map((subtask) => {
        if (subtask.id !== subtaskId) {
          return subtask;
        }

        return { ...subtask, completed: !subtask.completed };
      }),
    };
  });

  persistState();
  renderTasks();
  if (detailTaskId === taskId) {
    renderDetailSubtasks();
  }
}

function handleTaskAction(event) {
  const moreButton = event.target.closest('.task-more');
  if (moreButton) {
    const menu = moreButton.nextElementSibling;
    menu.classList.toggle('hidden');
    moreButton.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) {
    return;
  }

  const { action, id } = actionButton.dataset;
  if (!id) {
    return;
  }

  if (action === 'toggle') {
    toggleTask(id);
  }

  if (action === 'detail') {
    openTaskDetail(id);
  }

  if (action === 'delete') {
    deleteTask(id);
  }

  if (action === 'edit') {
    openTaskEditor(id);
  }

  if (action === 'move-up') {
    moveTask(id, -1);
  }

  if (action === 'move-down') {
    moveTask(id, 1);
  }
}

function handleSubtaskActions(event) {
  const toggleButton = event.target.closest('[data-subtask-action]');
  if (!toggleButton) {
    return;
  }

  const { subtaskAction, subtaskId } = toggleButton.dataset;

  if (subtaskAction === 'toggle') {
    toggleSubtask(subtaskId);
  }

  if (subtaskAction === 'delete') {
    removeSubtask(subtaskId);
  }
}

function handleTaskSubtaskAction(event) {
  const subtaskButton = event.target.closest('[data-task-action]');
  if (!subtaskButton) {
    return;
  }

  const { taskId, subtaskId } = subtaskButton.dataset;
  if (taskId && subtaskId) {
    toggleTaskSubtask(taskId, subtaskId);
  }
}

function createList(name) {
  const cleanName = sanitizeInput(name);
  if (!cleanName) {
    return;
  }

  const newList = {
    id: createListId(),
    name: cleanName,
    createdAt: new Date().toISOString(),
  };

  lists = [...lists, newList];
  selectedListId = newList.id;
  renderSidebarLists();
  renderListOptions();
  taskListSelect.value = newList.id;
  persistState();
  renderTasks();
}

function renameList(listId, newName) {
  const cleanName = sanitizeInput(newName);
  if (!cleanName) {
    return;
  }

  lists = lists.map((list) => {
    if (list.id !== listId) {
      return list;
    }

    return { ...list, name: cleanName };
  });

  persistState();
  renderSidebarLists();
  renderListOptions();
  renderTasks();
}

function deleteList(listId) {
  if (lists.length <= 1 || listId === 'inbox') {
    return;
  }

  lists = lists.filter((list) => list.id !== listId);
  tasks = tasks.map((task) => ({
    ...task,
    listId: task.listId === listId ? 'inbox' : task.listId,
  }));

  if (selectedListId === listId) {
    selectedListId = 'all';
    activeFilter = 'all';
  }

  persistState();
  renderSidebarLists();
  renderListOptions();
  updateFilterButtons();
  renderTasks();
}

function onFilterChange(nextFilter) {
  activeFilter = nextFilter;
  updateFilterButtons();
  renderTasks();
}

function handleTouchStart(event) {
  const item = event.target.closest('.task-item');
  if (!item) {
    return;
  }

  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchEnd(event) {
  const item = event.target.closest('.task-item');
  if (!item) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  const taskId = item.dataset.id;
  if (deltaX < 0) {
    deleteTask(taskId);
    return;
  }

  toggleTask(taskId);
}

function handleSidebarListActions(event) {
  const listButton = event.target.closest('[data-list-action]');
  if (!listButton) {
    return;
  }

  const { listAction, listId } = listButton.dataset;
  if (!listId) {
    return;
  }

  if (listAction === 'rename') {
    const list = getListById(listId);
    const nextName = window.prompt('Renombrar lista', list?.name || '');
    if (nextName !== null) {
      renameList(listId, nextName);
    }
  }

  if (listAction === 'delete') {
    deleteList(listId);
  }
}

function bindEvents() {
  taskForm.addEventListener('submit', submitTask);
  taskList.addEventListener('click', handleTaskAction);
  taskList.addEventListener('click', handleTaskSubtaskAction);
  taskList.addEventListener('touchstart', handleTouchStart, { passive: true });
  taskList.addEventListener('touchend', handleTouchEnd, { passive: true });

  taskDetailPanel.addEventListener('click', handleDetailSubtaskAction);
  addSubtaskButton.addEventListener('click', addDetailSubtask);
  subtaskInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addDetailSubtask();
    }
  });
  closeTaskDetailButton.addEventListener('click', closeTaskDetail);
  taskDetailOverlay.addEventListener('click', closeTaskDetail);

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      onFilterChange(button.dataset.filter);
      if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.remove('open');
      }
    });
  });

  listForm.addEventListener('submit', (event) => {
    event.preventDefault();
    createList(listInput.value);
    listForm.reset();
    listForm.classList.add('hidden');
  });

  addListButton.addEventListener('click', () => {
    listForm.classList.toggle('hidden');
    if (!listForm.classList.contains('hidden')) {
      listInput.focus();
    }
  });

  cancelListButton.addEventListener('click', () => {
    listForm.classList.add('hidden');
    listForm.reset();
  });

  listList.addEventListener('click', (event) => {
    const listButton = event.target.closest('[data-list-id]');
    if (!listButton || listButton.dataset.listAction) {
      return;
    }

    selectedListId = listButton.dataset.listId;
    activeFilter = 'all';
    updateFilterButtons();
    renderSidebarLists();
    renderListOptions();
    renderTasks();
  });

  listList.addEventListener('click', handleSidebarListActions);

  cancelEditTaskButton.addEventListener('click', resetTaskForm);

  themeToggle.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      settingsPanel.classList.contains('hidden') ? openSettingsMenu() : closeSettingsMenu();
    });
  }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeSettingsMenu();
        closeTaskDetail();
        sidebar?.classList.remove('open');
        toggleSidebarButton?.setAttribute('aria-expanded', 'false');
      }
    });

  if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', closeSettingsMenu);
  }

  settingsPanel.addEventListener('click', (event) => {
    const pageLink = event.target.closest('.settings-page-link');
    if (pageLink) {
      openSettingsDetail(pageLink.dataset.settingPage);
    }
  });

  settingsBackButton.addEventListener('click', closeSettingsDetail);

  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', closeSettingsMenu);
  }

  settingsPanel.addEventListener('click', (event) => {
    const optionButton = event.target.closest('.settings-option');
    if (!optionButton) {
      return;
    }

    const group = optionButton.closest('.settings-item-group');
    const menu = group ? group.querySelector('.settings-menu') : null;
    if (!menu) {
      return;
    }

    const isOpen = !menu.classList.contains('hidden');
    settingsPanel.querySelectorAll('.settings-menu').forEach((item) => item.classList.add('hidden'));
    settingsPanel.querySelectorAll('.settings-option').forEach((item) => item.setAttribute('aria-expanded', 'false'));
    if (!isOpen) {
      menu.classList.remove('hidden');
      optionButton.setAttribute('aria-expanded', 'true');
    }
  });

  settingsPanel.addEventListener('click', (event) => {
    const menuItem = event.target.closest('.settings-menu-item');
    if (!menuItem) {
      return;
    }

    const optionButton = menuItem.closest('.settings-item-group')?.querySelector('.settings-option');
    const valueSpan = optionButton?.querySelector('.settings-value');
    if (valueSpan) {
      valueSpan.textContent = menuItem.textContent.trim();
    }

    settingsPanel.querySelectorAll('.settings-menu').forEach((menu) => menu.classList.add('hidden'));
    settingsPanel.querySelectorAll('.settings-option').forEach((item) => item.setAttribute('aria-expanded', 'false'));
  });

  taskListSelect.addEventListener('change', () => {
    if (taskForm.dataset.mode === 'create') {
      selectedListId = taskListSelect.value; 
    }
  });

  taskSortSelect.addEventListener('change', () => {
    taskOrder = taskSortSelect.value;
    persistState();
    renderTasks();
  });

  if (toggleSidebarButton && sidebar) {
    toggleSidebarButton.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      toggleSidebarButton.setAttribute('aria-expanded', String(sidebar.classList.contains('open')));
    });
  }

  document.addEventListener('click', (event) => {
    if (window.innerWidth >= 768 || !sidebar) {
      return;
    }

    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedToggleButton = toggleSidebarButton && toggleSidebarButton.contains(event.target);

    if (!clickedInsideSidebar && !clickedToggleButton) {
      sidebar.classList.remove('open');
      toggleSidebarButton?.setAttribute('aria-expanded', 'false');
    }
  });
}

function initializeApp() {
  const isDark = currentTheme === 'dark';
  applyTheme(isDark ? 'dark' : 'light');
  closeSettingsMenu();

  if (!lists.length) {
    lists = [{ id: 'inbox', name: 'Inbox', createdAt: new Date().toISOString() }];
  }

  manualTaskOrder = [
    ...manualTaskOrder.filter((id) => tasks.some((task) => task.id === id)),
    ...tasks.map((task) => task.id).filter((id) => !manualTaskOrder.includes(id)),
  ];

  if (selectedListId === 'all' || !lists.some((list) => list.id === selectedListId)) {
    selectedListId = 'all';
  }

  renderSidebarLists();
  renderListOptions();
  updateFilterButtons();
  renderTasks();
  taskSortSelect.value = taskOrder;
  persistState();
  resetTaskForm();
}

bindEvents();
initializeApp();
