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
const quickLanguageSelect = document.querySelector('#quick-language-select');
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
const taskDueTime = document.querySelector('#task-due-time');
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
const deleteListOverlay = document.querySelector('#delete-list-overlay');
const deleteListDialog = document.querySelector('#delete-list-dialog');
const cancelDeleteListButton = document.querySelector('#cancel-delete-list');
const confirmDeleteListButton = document.querySelector('#confirm-delete-list');
const focusModeToggle = document.querySelector('#focus-mode-toggle');
const focusModeIndicator = document.querySelector('#focus-mode-indicator');
const streakValue = document.querySelector('#streak-value');
const pomodoroTime = document.querySelector('#pomodoro-time');
const pomodoroTask = document.querySelector('#pomodoro-task');
const pomodoroPlay = document.querySelector('#pomodoro-play');
const pomodoroReset = document.querySelector('#pomodoro-reset');
const pomodoroClose = document.querySelector('#pomodoro-widget .pomodoro-close');
const pomodoroWidget = document.querySelector('#pomodoro-widget');
const pomodoroMinutes = document.querySelector('#pomodoro-minutes');
const pomodoroTitle = document.querySelector('#pomodoro-title');
const pomodoroDurationLabel = document.querySelector('#pomodoro-duration-label');
const pomodoroMinutesLabel = document.querySelector('#pomodoro-minutes-label');
const addPomodoroButton = document.querySelector('#add-pomodoro');
const pomodoroWidgets = document.querySelector('#pomodoro-widgets');
const editPriorityOptionButton = document.querySelector('#edit-priority-option');
const editListOptionButton = document.querySelector('#edit-list-option');
const priorityColorPicker = document.querySelector('#priority-color-picker');

const appState = loadAppState();
let tasks = appState.tasks;
let lists = appState.lists;
let activeFilter = 'all';
let selectedListId = 'all';
let currentTheme = appState.theme;
let currentLanguage = appState.language || 'es';
let editingTaskId = null;
let draftSubtasks = [];
let detailTaskId = null;
let taskOrder = appState.taskOrder || 'created-desc';
let manualTaskOrder = [...(appState.manualTaskOrder || [])];
let touchStartX = 0;
let touchStartY = 0;
let pendingDeleteListId = null;
let focusModeActive = false;
let pomodoroSeconds = 25 * 60;
let pomodoroDuration = 25;
let pomodoroTimer = null;
let pomodoroTaskId = null;
let primaryPomodoroVisible = true;
const STREAK_STORAGE_KEY = 'tareasy.streak.v1';
const POMODORO_POSITION_STORAGE_KEY = 'tareasy.pomodoro-position.v1';
const PRIORITY_OPTIONS_STORAGE_KEY = 'tareasy.priority-options.v1';
const priorityColors = ['#111827', '#ef4444', '#f97316', '#facc15', '#22c55e', '#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
let priorityOptions = loadPriorityOptions();
let extraPomodoros = [];

function loadPriorityOptions() {
  const defaults = [
    { id: 'alta', name: 'Alta', color: '#ef4444' }, { id: 'media', name: 'Media', color: '#f59e0b' }, { id: 'baja', name: 'Baja', color: '#10b981' },
  ];
  try {
    const saved = JSON.parse(localStorage.getItem(PRIORITY_OPTIONS_STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : defaults;
  } catch { return defaults; }
}

function savePriorityOptions() { localStorage.setItem(PRIORITY_OPTIONS_STORAGE_KEY, JSON.stringify(priorityOptions)); }

const priorityLabels = {
  '': 'noPriority',
  alta: 'high',
  media: 'medium',
  baja: 'low',
};

const translations = {
  es: {
        brand: 'Tareasy', today: 'Hoy', myTasks: 'Mis tareas', addTask: 'Añadir una tarea...', save: 'Guardar',
    all: 'Todas', active: 'Pendientes', completed: 'Completadas', done: 'Hechas', lists: 'Listas', newList: 'Nueva lista', cancel: 'Cancelar',
    dueDate: 'Fecha de vencimiento', dueTime: 'Hora de vencimiento', todayLabel: 'HOY', tomorrow: 'Mañana', priority: 'Prioridad', list: 'Lista', low: 'Baja', medium: 'Media', high: 'Alta',
    sort: 'Ordenar', lastAdded: 'Última tarea agregada', dueAsc: 'Fecha: menor a mayor', dueDesc: 'Fecha: mayor a menor', nameAsc: 'Nombre: A-Z', nameDesc: 'Nombre: Z-A', manual: 'Orden manual', dueTime: 'Hora de vencimiento', todayLabel: 'HOY', tomorrow: 'Mañana',
    settings: 'Ajustes', close: 'Cerrar ajustes', account: 'Cuenta', personalization: 'Personalización', themes: 'Temas', language: 'Idioma', support: 'Soporte',
    profile: 'Perfil', accountPage: 'Mi cuenta', manageProfile: 'Administrar perfil', sync: 'Sincronización', drive: 'Google Drive', icloud: 'iCloud', manualSync: 'Sincronizar manual',
    style: 'Estilo', minimal: 'Minimal', compact: 'Compacto', premium: 'Premium', view: 'Vista', compactList: 'Lista compacta', wideList: 'Lista amplia', board: 'Vista por tablero', mode: 'Modo', light: 'Claro', dark: 'Oscuro', system: 'Sistema',
    help: 'Centro de ayuda', faq: 'Preguntas frecuentes', contact: 'Contacto', sendMessage: 'Enviar mensaje', email: 'Email', chat: 'Chat', languageOptions: 'Opciones de idioma',
    emptyTasks: 'No hay tareas en esta vista. Añade una nueva tarea o cambia de lista.', subtaskEmpty: 'Sin subtareas todavía.', addSubtask: 'Añadir subtarea...', add: 'Añadir',
    edit: 'Editar', remove: 'Eliminar', moveUp: 'Subir', moveDown: 'Bajar', more: 'Más opciones', completedTask: 'Marcar como completada', pendingTask: 'Marcar como pendiente',
    detail: 'Detalle', backSettings: '‹ Volver a Ajustes', saveChanges: 'Guardar cambios', configuration: 'Configuración específica de',
    detailCopy: { accountPage: 'Revisa los datos de tu cuenta.', manageProfile: 'Personaliza la información visible de tu perfil.', drive: 'Elige cómo sincronizar tus tareas con Google Drive.', icloud: 'Configura la cuenta de iCloud que quieres utilizar.', manualSync: 'Inicia una sincronización manual de tus datos.', help: 'Encuentra respuestas y guías para usar Tareasy.', faq: 'Consulta las respuestas a las dudas más comunes.', sendMessage: 'Escribe un mensaje para nuestro equipo de soporte.', email: 'Envía tu consulta directamente por correo electrónico.', chat: 'Conversa con soporte desde la aplicación.' },
  },
  en: {
    brand: 'Tareasy', today: 'Today', myTasks: 'My tasks', addTask: 'Add a task...', save: 'Save', all: 'All', active: 'Pending', completed: 'Completed', done: 'Done', lists: 'Lists', newList: 'New list', cancel: 'Cancel', dueDate: 'Due date', dueTime: 'Due time', todayLabel: 'TODAY', tomorrow: 'Tomorrow', priority: 'Priority', list: 'List', low: 'Low', medium: 'Medium', high: 'High', sort: 'Sort', lastAdded: 'Last added', dueAsc: 'Date: oldest first', dueDesc: 'Date: newest first', nameAsc: 'Name: A-Z', nameDesc: 'Name: Z-A', manual: 'Manual order', settings: 'Settings', close: 'Close settings', account: 'Account', personalization: 'Personalization', themes: 'Themes', language: 'Language', support: 'Support', profile: 'Profile', accountPage: 'My account', manageProfile: 'Manage profile', sync: 'Sync', drive: 'Google Drive', icloud: 'iCloud', manualSync: 'Sync manually', style: 'Style', minimal: 'Minimal', compact: 'Compact', premium: 'Premium', view: 'View', compactList: 'Compact list', wideList: 'Wide list', board: 'Board view', mode: 'Mode', light: 'Light', dark: 'Dark', system: 'System', help: 'Help center', faq: 'Frequently asked questions', contact: 'Contact', sendMessage: 'Send a message', email: 'Email', chat: 'Chat', languageOptions: 'Language options', emptyTasks: 'No tasks in this view. Add a new task or change lists.', subtaskEmpty: 'No subtasks yet.', addSubtask: 'Add subtask...', add: 'Add', edit: 'Edit', remove: 'Delete', moveUp: 'Move up', moveDown: 'Move down', more: 'More options', completedTask: 'Mark as completed', pendingTask: 'Mark as pending', detail: 'Detail', backSettings: '‹ Back to Settings', saveChanges: 'Save changes', configuration: 'Specific settings for', detailCopy: { accountPage: 'Review your account details.', manageProfile: 'Customize the information shown on your profile.', drive: 'Choose how to sync your tasks with Google Drive.', icloud: 'Configure the iCloud account you want to use.', manualSync: 'Start a manual data sync.', help: 'Find answers and guides for using Tareasy.', faq: 'Browse answers to common questions.', sendMessage: 'Write a message for our support team.', email: 'Send your question by email.', chat: 'Chat with support from the app.' },
  },
  zh: {
    brand: 'Tareasy', today: '今天', myTasks: '我的任务', addTask: '添加任务...', save: '保存', all: '全部', active: '待办', completed: '已完成', done: '完成', lists: '列表', newList: '新列表', cancel: '取消', dueDate: '截止日期', priority: '优先级', list: '列表', low: '低', medium: '中', high: '高', sort: '排序', lastAdded: '最近添加', dueAsc: '日期：从早到晚', dueDesc: '日期：从晚到早', nameAsc: '名称：A-Z', nameDesc: '名称：Z-A', manual: '手动排序', settings: '设置', close: '关闭设置', account: '账户', personalization: '个性化', themes: '主题', language: '语言', support: '支持', profile: '个人资料', accountPage: '我的账户', manageProfile: '管理个人资料', sync: '同步', drive: 'Google Drive', icloud: 'iCloud', manualSync: '手动同步', style: '样式', minimal: '简约', compact: '紧凑', premium: '高级', view: '视图', compactList: '紧凑列表', wideList: '宽列表', board: '看板视图', mode: '模式', light: '浅色', dark: '深色', system: '系统', help: '帮助中心', faq: '常见问题', contact: '联系', sendMessage: '发送消息', email: '电子邮件', chat: '聊天', languageOptions: '语言选项', emptyTasks: '此视图中没有任务。添加新任务或切换列表。', subtaskEmpty: '还没有子任务。', addSubtask: '添加子任务...', add: '添加', edit: '编辑', remove: '删除', moveUp: '上移', moveDown: '下移', more: '更多选项', completedTask: '标记为已完成', pendingTask: '标记为待办', detail: '详情', backSettings: '‹ 返回设置', saveChanges: '保存更改', configuration: '具体设置：', detailCopy: { accountPage: '查看账户信息。', manageProfile: '自定义个人资料信息。', drive: '选择 Google Drive 任务同步方式。', icloud: '配置要使用的 iCloud 账户。', manualSync: '开始手动同步数据。', help: '查找 Tareasy 使用帮助和指南。', faq: '查看常见问题的答案。', sendMessage: '给支持团队留言。', email: '通过电子邮件发送问题。', chat: '在应用中联系支持。' },
  },
  pt: {
    brand: 'Tareasy', today: 'Hoje', myTasks: 'Minhas tarefas', addTask: 'Adicionar tarefa...', save: 'Salvar', all: 'Todas', active: 'Pendentes', completed: 'Concluídas', done: 'Feitas', lists: 'Listas', newList: 'Nova lista', cancel: 'Cancelar', dueDate: 'Data de vencimento', priority: 'Prioridade', list: 'Lista', low: 'Baixa', medium: 'Média', high: 'Alta', sort: 'Ordenar', lastAdded: 'Última adicionada', dueAsc: 'Data: menor para maior', dueDesc: 'Data: maior para menor', nameAsc: 'Nome: A-Z', nameDesc: 'Nome: Z-A', manual: 'Ordem manual', settings: 'Configurações', close: 'Fechar configurações', account: 'Conta', personalization: 'Personalização', themes: 'Temas', language: 'Idioma', support: 'Suporte', profile: 'Perfil', accountPage: 'Minha conta', manageProfile: 'Administrar perfil', sync: 'Sincronização', drive: 'Google Drive', icloud: 'iCloud', manualSync: 'Sincronizar manualmente', style: 'Estilo', minimal: 'Minimal', compact: 'Compacto', premium: 'Premium', view: 'Visualização', compactList: 'Lista compacta', wideList: 'Lista ampla', board: 'Visualização em quadro', mode: 'Modo', light: 'Claro', dark: 'Escuro', system: 'Sistema', help: 'Central de ajuda', faq: 'Perguntas frequentes', contact: 'Contato', sendMessage: 'Enviar mensagem', email: 'Email', chat: 'Chat', languageOptions: 'Opções de idioma', emptyTasks: 'Não há tarefas nesta visualização. Adicione uma tarefa ou troque de lista.', subtaskEmpty: 'Ainda não há subtarefas.', addSubtask: 'Adicionar subtarefa...', add: 'Adicionar', edit: 'Editar', remove: 'Excluir', moveUp: 'Mover para cima', moveDown: 'Mover para baixo', more: 'Mais opções', completedTask: 'Marcar como concluída', pendingTask: 'Marcar como pendente', detail: 'Detalhes', backSettings: '‹ Voltar às configurações', saveChanges: 'Salvar alterações', configuration: 'Configurações específicas de', detailCopy: { accountPage: 'Revise os dados da sua conta.', manageProfile: 'Personalize as informações do seu perfil.', drive: 'Escolha como sincronizar suas tarefas com o Google Drive.', icloud: 'Configure a conta do iCloud que deseja usar.', manualSync: 'Inicie uma sincronização manual dos dados.', help: 'Encontre respostas e guias para usar o Tareasy.', faq: 'Consulte respostas para dúvidas comuns.', sendMessage: 'Escreva uma mensagem para nossa equipe de suporte.', email: 'Envie sua dúvida por email.', chat: 'Converse com o suporte pelo aplicativo.' },
  },
};

function t(key) {
  const fallbackLabels = {
    pomodoro: { es: 'Pomodoro', en: 'Pomodoro', zh: '番茄钟', pt: 'Pomodoro' },
    noPomodoroTask: { es: 'Sin tarea vinculada', en: 'No linked task', zh: '未关联任务', pt: 'Nenhuma tarefa vinculada' },
    duration: { es: 'Duración', en: 'Duration', zh: '时长', pt: 'Duração' },
    minutes: { es: 'min', en: 'min', zh: '分钟', pt: 'min' },
    startPomodoro: { es: 'Iniciar temporizador', en: 'Start timer', zh: '开始计时器', pt: 'Iniciar temporizador' },
    pausePomodoro: { es: 'Pausar temporizador', en: 'Pause timer', zh: '暂停计时器', pt: 'Pausar temporizador' },
    resetPomodoro: { es: 'Reiniciar temporizador', en: 'Reset timer', zh: '重置计时器', pt: 'Redefinir temporizador' },
    linkPomodoro: { es: 'Vincular al Pomodoro', en: 'Link to Pomodoro', zh: '关联到番茄钟', pt: 'Vincular ao Pomodoro' },
    noPriority: { es: 'Sin prioridad', en: 'No priority', zh: '无优先级', pt: 'Sem prioridade' },
    noList: { es: 'Sin lista', en: 'No list', zh: '无列表', pt: 'Sem lista' },
    editList: { es: 'Editar lista', en: 'Edit list', zh: '编辑列表', pt: 'Editar lista' },
    removeList: { es: 'Eliminar lista', en: 'Delete list', zh: '删除列表', pt: 'Excluir lista' },
    renameListPrompt: { es: 'Renombrar lista', en: 'Rename list', zh: '重命名列表', pt: 'Renomear lista' },
    clear: { es: 'Borrar', en: 'Clear', zh: '清除', pt: 'Limpar' },
    listOptions: { es: 'Opciones de lista', en: 'List options', zh: '列表选项', pt: 'Opções da lista' },
    moveRight: { es: 'Mover a la derecha', en: 'Move right', zh: '向右移动', pt: 'Mover para a direita' },
    moveLeft: { es: 'Mover a la izquierda', en: 'Move left', zh: '向左移动', pt: 'Mover para a esquerda' },
    scrollListsLeft: { es: 'Desplazar listas a la izquierda', en: 'Scroll lists left', zh: '向左滚动列表', pt: 'Rolar listas para a esquerda' },
    scrollListsRight: { es: 'Desplazar listas a la derecha', en: 'Scroll lists right', zh: '向右滚动列表', pt: 'Rolar listas para a direita' },
    deleteListTitle: { es: '¿Eliminar lista?', en: 'Delete list?', zh: '删除列表？', pt: 'Excluir lista?' },
    deleteListCopy: { es: '¿Seguro que deseas eliminar la lista? Esta acción no se puede deshacer', en: 'Are you sure you want to delete this list? This action cannot be undone', zh: '确定要删除此列表吗？此操作无法撤销', pt: 'Tem certeza de que deseja excluir esta lista? Esta ação não pode ser desfeita' },
  };
  return translations[currentLanguage]?.[key] ?? translations.es[key] ?? fallbackLabels[key]?.[currentLanguage] ?? key;
}

function dateLabel(key) {
  const fallback = {
    es: { dueTime: 'Hora de vencimiento', todayLabel: 'HOY', tomorrow: 'Mañana' },
    en: { dueTime: 'Due time', todayLabel: 'TODAY', tomorrow: 'Tomorrow' },
    zh: { dueTime: '截止时间', todayLabel: '今天', tomorrow: '明天' },
    pt: { dueTime: 'Hora de vencimento', todayLabel: 'HOJE', tomorrow: 'Amanhã' },
  };
  return translations[currentLanguage]?.[key] ?? fallback[currentLanguage]?.[key] ?? fallback.es[key];
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
  document.querySelector('.brand-name').textContent = t('brand');
  document.querySelector('.main-heading .eyebrow').textContent = t('today');
  document.querySelector('#view-title').textContent = getCurrentListName();
  const filterLabels = {
    'all-lists': { es: 'Todas', en: 'All', zh: '全部', pt: 'Todas' },
    'current-all': { es: 'Todas de esta lista', en: 'All in this list', zh: '此列表中的全部', pt: 'Todas desta lista' },
    active: { es: 'Pendientes', en: 'Pending', zh: '待办', pt: 'Pendentes' },
    completed: { es: 'Completadas', en: 'Completed', zh: '已完成', pt: 'Concluídas' },
    all: { es: 'Todas', en: 'All', zh: '全部', pt: 'Todas' },
  };
  document.querySelectorAll('[data-filter]').forEach((button) => { button.textContent = filterLabels[button.dataset.filter]?.[currentLanguage] || button.dataset.filter; });
  document.querySelector('.section-header span').textContent = t('lists');
  taskInput.placeholder = t('addTask');
  listInput.placeholder = t('newList');
  document.querySelector('#add-list-button').setAttribute('aria-label', t('newList'));
  document.querySelector('#task-due-date').setAttribute('aria-label', t('dueDate'));
  document.querySelector('#task-due-time').setAttribute('aria-label', dateLabel('dueTime'));
  document.querySelector('#task-priority').setAttribute('aria-label', t('priority'));
  document.querySelector('#task-list-select').setAttribute('aria-label', t('list'));
  document.querySelector('#settings-panel h3').textContent = t('settings');
  closeSettingsButton.setAttribute('aria-label', t('close'));
  document.querySelectorAll('.settings-section h4').forEach((heading, index) => { heading.textContent = [t('account'), t('personalization'), t('themes'), t('language'), t('support')][index]; });
  const settingLabels = { perfil: 'profile', sincronizacion: 'sync', estilo: 'style', vista: 'view', modo: 'mode', language: 'language' };
  document.querySelectorAll('.settings-option[data-setting]').forEach((button) => {
    const label = settingLabels[button.dataset.setting];
    if (label) button.firstElementChild.textContent = t(label);
  });
  const settingValues = { perfil: 'accountPage', sincronizacion: 'drive', estilo: 'minimal', vista: 'compactList', modo: 'light' };
  document.querySelectorAll('.settings-option[data-setting]').forEach((button) => {
    const value = button.querySelector('.settings-value');
    if (value && settingValues[button.dataset.setting]) value.textContent = t(settingValues[button.dataset.setting]);
  });
  const languageValue = document.querySelector('[data-setting="language"] .settings-value');
  if (languageValue) languageValue.textContent = { es: 'Español', en: 'English', zh: '中文', pt: 'Português' }[currentLanguage];
  const menuTranslations = { estilo: ['minimal', 'compact', 'premium'], vista: ['compactList', 'wideList', 'board'], modo: ['light', 'dark', 'system'] };
  document.querySelectorAll('.settings-item-group').forEach((group) => {
    const setting = group.querySelector('.settings-option')?.dataset.setting;
    if (setting === 'language') return;
    group.querySelectorAll('.settings-menu-item').forEach((item, index) => {
      const key = menuTranslations[setting]?.[index];
      if (key) item.textContent = t(key);
    });
  });
  document.querySelectorAll('.settings-page-link').forEach((button) => { const key = button.dataset.settingPageKey || Object.keys({ accountPage: 1, manageProfile: 1, drive: 1, icloud: 1, manualSync: 1, help: 1, faq: 1, sendMessage: 1, email: 1, chat: 1 }).find((item) => translations.es[item] === button.dataset.settingPage); if (key) button.firstElementChild.textContent = t(key); });
  document.querySelectorAll('.settings-menu-item[data-language]').forEach((item) => { item.textContent = { es: 'Español', en: 'English', zh: '中文', pt: 'Português' }[item.dataset.language]; });
  document.querySelector('#task-sort-select').querySelectorAll('option').forEach((option) => { option.textContent = t({ 'created-desc': 'lastAdded', 'due-asc': 'dueAsc', 'due-desc': 'dueDesc', 'name-asc': 'nameAsc', 'name-desc': 'nameDesc', manual: 'manual' }[option.value]); });
  document.querySelector('.sort-control span').textContent = t('sort');
  quickLanguageSelect.value = currentLanguage;
  quickLanguageSelect.setAttribute('aria-label', t('language'));
  document.querySelector('#task-priority option[value="baja"]').textContent = t('low');
  document.querySelector('#task-priority option[value="media"]').textContent = t('medium');
  document.querySelector('#task-priority option[value="alta"]').textContent = t('high');
  document.querySelector('#task-priority option[value=""]').textContent = t('noPriority');
  const metaLabels = { 'task-due-date': 'dueDate', 'task-due-time': 'dueTime', 'task-priority': 'priority', 'task-list-select': 'list' };
  document.querySelectorAll('[data-clear-control]').forEach((button) => {
    const labelKey = metaLabels[button.dataset.clearControl];
    button.setAttribute('aria-label', `${t('clear')} ${labelKey ? t(labelKey) : ''}`.trim());
  });
  document.querySelector('[data-list-action="rename-selected"]')?.setAttribute('aria-label', t('editList'));
  document.querySelector('[data-list-action="delete-selected"]')?.setAttribute('aria-label', t('removeList'));
  document.querySelector('[data-list-scroll="left"]')?.setAttribute('aria-label', t('scrollListsLeft'));
  document.querySelector('[data-list-scroll="right"]')?.setAttribute('aria-label', t('scrollListsRight'));
  document.querySelectorAll('[data-add-list]').forEach((button) => button.setAttribute('aria-label', t('newList')));
  document.querySelector('#delete-list-title').textContent = t('deleteListTitle');
  document.querySelector('#delete-list-copy').textContent = t('deleteListCopy');
  cancelDeleteListButton.textContent = t('cancel');
  confirmDeleteListButton.textContent = t('remove');
  document.querySelector('#subtask-input').placeholder = t('addSubtask');
  document.querySelector('#add-subtask-button').textContent = t('add');
  document.querySelector('#cancel-edit-task').textContent = t('cancel');
  document.querySelector('#list-form .primary-button').textContent = t('save');
  document.querySelector('#cancel-list-button').textContent = t('cancel');
  document.querySelector('#close-task-detail').setAttribute('aria-label', t('cancel'));
  document.querySelector('#task-detail-panel .eyebrow').textContent = t('detail');
  document.querySelector('#settings-back').textContent = t('backSettings');
  pomodoroTitle.textContent = t('pomodoro');
  pomodoroDurationLabel.textContent = t('duration');
  pomodoroMinutesLabel.textContent = t('minutes');
  pomodoroReset.setAttribute('aria-label', t('resetPomodoro'));
  renderPomodoro();
  renderExtraPomodoros();
  renderSidebarLists();
  renderListOptions();
  renderPriorityOptions();
  renderTasks();
}

function persistState() {
  saveAppState({ theme: currentTheme, language: currentLanguage, lists, tasks, taskOrder, manualTaskOrder });
}

function getStreakState() {
  try { return JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY)) || { count: 0, lastCompletedDate: '' }; }
  catch { return { count: 0, lastCompletedDate: '' }; }
}

function updateStreakDisplay() {
  const streak = getStreakState();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  streakValue.textContent = [getLocalDateKey(), getLocalDateKey(yesterday)].includes(streak.lastCompletedDate) ? String(streak.count) : '0';
}

function recordTaskCompletion() {
  const today = getLocalDateKey();
  const streak = getStreakState();
  if (streak.lastCompletedDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  streak.count = streak.lastCompletedDate === getLocalDateKey(yesterday) ? streak.count + 1 : 1;
  streak.lastCompletedDate = today;
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
  updateStreakDisplay();
}

function updateFocusMode() {
  focusModeToggle.classList.toggle('active', focusModeActive);
  focusModeToggle.setAttribute('aria-pressed', String(focusModeActive));
  focusModeIndicator.classList.toggle('hidden', !focusModeActive);
}

function renderPomodoro() {
  pomodoroTime.textContent = `${String(Math.floor(pomodoroSeconds / 60)).padStart(2, '0')}:${String(pomodoroSeconds % 60).padStart(2, '0')}`;
  pomodoroTask.textContent = tasks.find((item) => item.id === pomodoroTaskId)?.text || t('noPomodoroTask');
  pomodoroPlay.textContent = pomodoroTimer ? 'Ⅱ' : '▶';
  pomodoroPlay.setAttribute('aria-label', pomodoroTimer ? t('pausePomodoro') : t('startPomodoro'));
  pomodoroMinutes.value = pomodoroDuration;
}

function togglePomodoro() {
  if (pomodoroTimer) { window.clearInterval(pomodoroTimer); pomodoroTimer = null; }
  else {
    pomodoroTimer = window.setInterval(() => {
      if (pomodoroSeconds <= 1) { window.clearInterval(pomodoroTimer); pomodoroTimer = null; pomodoroSeconds = 0; }
      else pomodoroSeconds -= 1;
      renderPomodoro();
    }, 1000);
  }
  renderPomodoro();
}

function resetPomodoro() {
  window.clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  pomodoroSeconds = pomodoroDuration * 60;
  renderPomodoro();
}

function linkPomodoroTask(taskId) {
  const choice = extraPomodoros.length ? Number(window.prompt(`Pomodoro para esta tarea (1-${extraPomodoros.length + 1})`, '1')) : 1;
  if (!Number.isInteger(choice) || choice < 1 || choice > extraPomodoros.length + 1) return;
  if (choice === 1) { pomodoroTaskId = taskId; renderPomodoro(); }
  else { extraPomodoros[choice - 2].taskId = taskId; renderExtraPomodoros(); }
  renderTasks();
}

function getPomodoroMinutesForTask(taskId) {
  const durations = pomodoroTaskId === taskId ? [pomodoroDuration] : [];
  extraPomodoros.filter((pomodoro) => pomodoro.taskId === taskId).forEach((pomodoro) => durations.push(pomodoro.duration));
  return durations;
}

function renderExtraPomodoros() {
  pomodoroWidgets.querySelectorAll('.extra-pomodoro').forEach((element) => element.remove());
  extraPomodoros.forEach((pomodoro, index) => {
    const task = tasks.find((item) => item.id === pomodoro.taskId);
    const widget = document.createElement('aside');
    widget.className = `pomodoro-widget extra-pomodoro pomodoro-${pomodoro.size}${pomodoro.minimized ? ' minimized' : ''}`;
    widget.dataset.pomodoroId = pomodoro.id;
    if (pomodoro.position && Number.isFinite(pomodoro.position.left) && Number.isFinite(pomodoro.position.top)) {
      widget.style.left = `${pomodoro.position.left}px`;
      widget.style.top = `${pomodoro.position.top}px`;
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
    } else {
      widget.style.right = '1rem';
      widget.style.bottom = `${16 + index * 300}px`;
    }
    widget.innerHTML = `<div class="pomodoro-heading"><span class="pomodoro-heading-left"><button type="button" class="pomodoro-minimize" data-extra-action="minimize" aria-label="Minimizar">⌄</button><span>${t('pomodoro')} ${index + 2}</span></span><span class="pomodoro-heading-actions"><span class="pomodoro-dot" aria-hidden="true"></span><button type="button" class="pomodoro-close" data-extra-action="close" aria-label="Cerrar Pomodoro">×</button></span></div><strong class="pomodoro-time">${String(Math.floor(pomodoro.seconds / 60)).padStart(2, '0')}:${String(pomodoro.seconds % 60).padStart(2, '0')}</strong><button class="pomodoro-task" type="button" data-extra-action="edit-task">${task?.text || t('noPomodoroTask')}</button><label class="pomodoro-duration"><span>${t('duration')}</span><input class="extra-duration" type="number" min="1" max="180" value="${pomodoro.duration}" /><span>${t('minutes')}</span></label><div class="pomodoro-options"><select class="extra-size" aria-label="Tamaño"><option value="normal">Normal</option><option value="small">Pequeño</option><option value="large">Grande</option></select></div><div class="pomodoro-controls"><button type="button" data-extra-action="play" aria-label="Iniciar temporizador">${pomodoro.timer ? 'Ⅱ' : '▶'}</button><button type="button" data-extra-action="reset" aria-label="Reiniciar temporizador">↺</button></div>`;
    widget.querySelector('.extra-size').value = pomodoro.size;
    pomodoroWidgets.append(widget);
    enablePomodoroDragging(widget, (position) => { pomodoro.position = position; });
  });
  updatePomodoroAddButton();
}

function updatePomodoroAddButton() {
  addPomodoroButton.disabled = primaryPomodoroVisible && extraPomodoros.length >= 2;
}

function closePrimaryPomodoro() {
  window.clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  primaryPomodoroVisible = false;
  pomodoroWidget.classList.add('hidden');
  updatePomodoroAddButton();
}

function closeExtraPomodoro(pomodoroId) {
  const pomodoro = extraPomodoros.find((item) => item.id === pomodoroId);
  if (!pomodoro) return;
  window.clearInterval(pomodoro.timer);
  extraPomodoros = extraPomodoros.filter((item) => item.id !== pomodoroId);
  renderExtraPomodoros();
}

function addPomodoro() {
  if (!primaryPomodoroVisible) {
    primaryPomodoroVisible = true;
    pomodoroWidget.classList.remove('hidden');
    renderPomodoro();
    updatePomodoroAddButton();
    return;
  }
  if (extraPomodoros.length >= 2) return;
  extraPomodoros.push({ id: String(Date.now()), duration: 25, seconds: 1500, taskId: null, timer: null, size: 'normal', minimized: false, position: null });
  renderExtraPomodoros();
}

function setPomodoroDuration() {
  const value = Math.min(180, Math.max(1, Number.parseInt(pomodoroMinutes.value, 10) || 25));
  pomodoroDuration = value;
  pomodoroSeconds = value * 60;
  window.clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  renderPomodoro();
}

function restorePomodoroPosition() {
  try {
    const position = JSON.parse(localStorage.getItem(POMODORO_POSITION_STORAGE_KEY));
    if (!position || !Number.isFinite(position.left) || !Number.isFinite(position.top)) return;
    pomodoroWidget.style.left = `${position.left}px`;
    pomodoroWidget.style.top = `${position.top}px`;
    pomodoroWidget.style.right = 'auto';
    pomodoroWidget.style.bottom = 'auto';
  } catch { /* Default fixed position remains in use. */ }
}

function enablePomodoroDragging(widget, onPositionChange = null) {
  let startX = 0; let startY = 0; let startLeft = 0; let startTop = 0;
  widget.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, input, label, select')) return;
    const rect = widget.getBoundingClientRect();
    startX = event.clientX; startY = event.clientY; startLeft = rect.left; startTop = rect.top;
    widget.setPointerCapture(event.pointerId);
    widget.classList.add('dragging');
  });
  widget.addEventListener('pointermove', (event) => {
    if (!widget.classList.contains('dragging')) return;
    const maxLeft = Math.max(0, window.innerWidth - widget.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - widget.offsetHeight);
    const left = Math.min(maxLeft, Math.max(0, startLeft + event.clientX - startX));
    const top = Math.min(maxTop, Math.max(0, startTop + event.clientY - startY));
    Object.assign(widget.style, { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
  });
  widget.addEventListener('pointerup', () => {
    if (!widget.classList.contains('dragging')) return;
    widget.classList.remove('dragging');
    const position = { left: widget.offsetLeft, top: widget.offsetTop };
    onPositionChange?.(position);
    if (widget === pomodoroWidget) localStorage.setItem(POMODORO_POSITION_STORAGE_KEY, JSON.stringify(position));
  });
}

function getPriorityLabel(priority) {
  if (!priority) return t('noPriority');
  return priorityOptions.find((option) => option.id === priority)?.name || t(priorityLabels[priority] || 'medium');
}

function getPriorityColor(priority) {
  return priorityOptions.find((option) => option.id === priority)?.color || '';
}

function renderPriorityOptions() {
  const selected = taskPriority.value;
  taskPriority.innerHTML = `<option value="">${t('noPriority')}</option>${priorityOptions.map((option) => `<option value="${option.id}">${sanitizeInput(option.name)}</option>`).join('')}<option value="__add__">AÑADIR</option>`;
  taskPriority.value = priorityOptions.some((option) => option.id === selected) ? selected : '';
  updateCustomSelectTriggers();
}

function updateCustomSelectTriggers() {
  const priorityName = getPriorityLabel(taskPriority.value);
  const listName = lists.find((list) => list.id === taskListSelect.value)?.name || t('noList');
  document.querySelector('[data-custom-select="priority"]')?.replaceChildren(document.createTextNode(priorityName));
  document.querySelector('[data-custom-select="list"]')?.replaceChildren(document.createTextNode(listName));
}

function closeCustomSelectMenus() {
  document.querySelectorAll('.custom-select-menu').forEach((menu) => menu.remove());
  document.querySelectorAll('.task-form-meta > label.custom-select-open').forEach((label) => label.classList.remove('custom-select-open'));
  document.body.classList.remove('selector-menu-open');
  document.documentElement.classList.remove('selector-menu-open');
}

function closeTaskMenus() {
  document.querySelectorAll('.task-menu').forEach((menu) => {
    menu.classList.add('hidden');
    menu.previousElementSibling?.setAttribute('aria-expanded', 'false');
  });
}

function openCustomSelect(type, trigger) {
  closeTaskMenus();
  closeCustomSelectMenus();
  taskForm.classList.add('is-expanded');
  document.body.classList.add('selector-menu-open');
  document.documentElement.classList.add('selector-menu-open');

  const triggerLabel = trigger.parentElement;
  triggerLabel.classList.add('custom-select-open');
  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  const options = type === 'priority'
    ? priorityOptions.map((option) => ({ id: option.id, name: option.name }))
    : lists.map((list) => ({ id: list.id, name: list.name }));
  menu.innerHTML = `${options.map((option) => `<div class="custom-select-option"><button type="button" data-select-value="${option.id}">${sanitizeInput(option.name)}</button><button type="button" class="option-pencil" data-edit-option="${option.id}">✎</button></div>`).join('')}<button type="button" class="custom-select-add" data-select-value="__add__">AÑADIR</button>`;
  const triggerRect = trigger.getBoundingClientRect();
  const estimatedMenuHeight = Math.min(245, options.length * 40 + 52);
  if (triggerRect.bottom + estimatedMenuHeight > window.innerHeight - 8) {
    menu.classList.add('opens-up');
  }
  triggerLabel.append(menu);
  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    const editId = event.target.closest('[data-edit-option]')?.dataset.editOption;
    const value = event.target.closest('[data-select-value]')?.dataset.selectValue;

    if (editId) {
      if (type === 'priority') {
        taskPriority.value = editId;
        editSelectedPriority();
        closeCustomSelectMenus();
      } else {
        const list = lists.find((item) => item.id === editId);
        const row = event.target.closest('.custom-select-option');
        if (list && row) {
          row.innerHTML = `<input class="inline-option-input" value="${sanitizeInput(list.name)}" maxlength="30" aria-label="Nombre de lista" />`;
          const input = row.querySelector('input');
          input.focus();
          input.select();
          input.addEventListener('change', () => {
            renameList(list.id, input.value);
            updateCustomSelectTriggers();
            closeCustomSelectMenus();
            taskForm.classList.add('is-expanded');
          });
        }
      }
      return;
    }

    if (!value) return;
    if (type === 'priority') {
      taskPriority.value = value;
      taskPriority.dispatchEvent(new Event('change'));
    } else {
      taskListSelect.value = value;
      taskListSelect.dispatchEvent(new Event('change'));
    }
    updateCustomSelectTriggers();
    closeCustomSelectMenus();
    taskForm.classList.add('is-expanded');
    if (!(type === 'priority' && value === '__add__')) trigger.focus();
  });
}

function editSelectedPriority() {
  const option = priorityOptions.find((item) => item.id === taskPriority.value);
  if (!option) return;
  priorityColorPicker.innerHTML = `<input class="priority-name-input" value="${sanitizeInput(option.name)}" maxlength="30" aria-label="Nombre de prioridad" />${priorityColors.map((color) => `<button type="button" class="priority-color-dot" data-priority-color="${color}" style="--priority-color:${color}" aria-label="${color}"></button>`).join('')}`;
  priorityColorPicker.dataset.priorityId = option.id;
  priorityColorPicker.classList.remove('hidden');
  savePriorityOptions();
  renderPriorityOptions();
  taskPriority.value = option.id;
  renderTasks();
}

function addPriorityOption() {
  const id = `priority-${Date.now()}`;
  priorityOptions.push({ id, name: 'Nueva prioridad', color: '#8b5cf6' });
  savePriorityOptions();
  renderPriorityOptions();
  taskPriority.value = id;
  editSelectedPriority();
}

function getListById(listId) {
  return lists.find((list) => list.id === listId) || lists[0];
}

function getCurrentListName() {
  if (activeFilter === 'all-lists') {
    return { es: 'Todas', en: 'All', zh: '全部', pt: 'Todas' }[currentLanguage];
  }

  if (selectedListId === 'all') {
    return activeFilter === 'completed' ? t('completed') : activeFilter === 'active' ? t('active') : t('all');
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
  const settingKeys = { 'Mi cuenta': 'accountPage', 'Administrar perfil': 'manageProfile', 'Google Drive': 'drive', iCloud: 'icloud', 'Sincronizar manual': 'manualSync', 'Centro de ayuda': 'help', 'Preguntas frecuentes': 'faq', 'Enviar mensaje': 'sendMessage', Email: 'email', Chat: 'chat' };
  const settingKey = settingKeys[settingName];
  settingsDetailTitle.textContent = settingKey ? t(settingKey) : settingName;
  const detailLabels = {
    es: { name: 'Nombre', description: 'Descripción', account: 'Cuenta conectada', apple: 'Apple ID', message: 'Mensaje', namePlaceholder: 'Tu nombre', aboutPlaceholder: 'Cuéntanos sobre ti', emailPlaceholder: 'correo@ejemplo.com', messagePlaceholder: '¿En qué podemos ayudarte?', lastSync: 'Última sincronización: todavía no realizada.', guides: 'Abrir guías', questions: 'Ver preguntas', emailAction: 'Redactar email', chatAction: 'Iniciar chat' },
    en: { name: 'Name', description: 'Description', account: 'Connected account', apple: 'Apple ID', message: 'Message', namePlaceholder: 'Your name', aboutPlaceholder: 'Tell us about yourself', emailPlaceholder: 'email@example.com', messagePlaceholder: 'How can we help?', lastSync: 'Last sync: not performed yet.', guides: 'Open guides', questions: 'View questions', emailAction: 'Write email', chatAction: 'Start chat' },
    zh: { name: '姓名', description: '描述', account: '已连接账户', apple: 'Apple ID', message: '消息', namePlaceholder: '你的姓名', aboutPlaceholder: '介绍一下自己', emailPlaceholder: 'email@example.com', messagePlaceholder: '有什么可以帮助你？', lastSync: '上次同步：尚未进行。', guides: '打开指南', questions: '查看问题', emailAction: '撰写邮件', chatAction: '开始聊天' },
    pt: { name: 'Nome', description: 'Descrição', account: 'Conta conectada', apple: 'Apple ID', message: 'Mensagem', namePlaceholder: 'Seu nome', aboutPlaceholder: 'Conte sobre você', emailPlaceholder: 'email@exemplo.com', messagePlaceholder: 'Como podemos ajudar?', lastSync: 'Última sincronização: ainda não realizada.', guides: 'Abrir guias', questions: 'Ver perguntas', emailAction: 'Redigir email', chatAction: 'Iniciar chat' },
  }[currentLanguage];
  const detailContent = {
    'Mi cuenta': [translations[currentLanguage].detailCopy.accountPage, `<label class="settings-field">${detailLabels.name}<input type="text" placeholder="${detailLabels.namePlaceholder}" /></label>`],
    'Administrar perfil': [translations[currentLanguage].detailCopy.manageProfile, `<label class="settings-field">${detailLabels.description}<textarea rows="3" placeholder="${detailLabels.aboutPlaceholder}"></textarea></label>`],
    'Google Drive': [translations[currentLanguage].detailCopy.drive, `<label class="settings-field">${detailLabels.account}<input type="email" placeholder="${detailLabels.emailPlaceholder}" /></label>`],
    iCloud: [translations[currentLanguage].detailCopy.icloud, `<label class="settings-field">${detailLabels.apple}<input type="email" placeholder="${detailLabels.emailPlaceholder}" /></label>`],
    'Sincronizar manual': [translations[currentLanguage].detailCopy.manualSync, `<p class="settings-status">${detailLabels.lastSync}</p>`],
    'Centro de ayuda': [translations[currentLanguage].detailCopy.help, `<button type="button" class="secondary-button small">${detailLabels.guides}</button>`],
    'Preguntas frecuentes': [translations[currentLanguage].detailCopy.faq, `<button type="button" class="secondary-button small">${detailLabels.questions}</button>`],
    'Enviar mensaje': [translations[currentLanguage].detailCopy.sendMessage, `<label class="settings-field">${detailLabels.message}<textarea rows="3" placeholder="${detailLabels.messagePlaceholder}"></textarea></label>`],
    Email: [translations[currentLanguage].detailCopy.email, `<button type="button" class="secondary-button small">${detailLabels.emailAction}</button>`],
    Chat: [translations[currentLanguage].detailCopy.chat, `<button type="button" class="secondary-button small">${detailLabels.chatAction}</button>`],
  };
  const copy = translations[currentLanguage]?.detailCopy?.[settingKey] || detailContent[settingName]?.[0] || `${t('configuration')} ${settingName}.`;
  const content = detailContent[settingName]?.[1] || '';
  settingsDetailCopy.textContent = copy;
  settingsDetailActions.innerHTML = `${content}<button type="button" class="primary-button small">${t('saveChanges')}</button>`;
  settingsDetail.classList.remove('hidden');
  settingsPanel.querySelectorAll('.settings-section').forEach((section) => section.classList.add('hidden'));
  settingsDetail.focus?.();
}

function closeSettingsDetail() {
  settingsDetail.classList.add('hidden');
  settingsPanel.querySelectorAll('.settings-section').forEach((section) => section.classList.remove('hidden'));
}

function renderListOptions() {
  const selected = taskListSelect.value;
  taskListSelect.innerHTML = `<option value="">${t('noList')}</option>${lists
    .map(
      (list) => `
        <option value="${list.id}" ${selectedListId === list.id ? 'selected' : ''}>${sanitizeInput(list.name)}</option>
      `,
    )
    .join('')}<option value="__add__">AÑADIR</option>`;

  if (!lists.some((list) => list.id === selected)) {
    taskListSelect.value = lists[0].id;
  }
  updateCustomSelectTriggers();
}

function renderSidebarLists() {
  listList.innerHTML = lists
    .map(
      (list) => `
        <div class="list-tab ${selectedListId === list.id ? 'active' : ''}">
          <button type="button" class="list-select" data-list-id="${list.id}">${sanitizeInput(list.name)}</button>
          <div class="list-actions">
            <button type="button" class="list-more-button" data-list-action="toggle-menu" data-list-id="${list.id}" aria-label="${t('listOptions')}" aria-expanded="false">•••</button>
            <div class="list-tab-menu hidden">
              <button type="button" data-list-action="rename" data-list-id="${list.id}">${t('editList')}</button>
              ${lists.length > 1 ? `<button type="button" data-list-action="delete" data-list-id="${list.id}">${t('removeList')}</button>` : ''}
              <button type="button" data-list-action="move-right" data-list-id="${list.id}">${t('moveRight')}</button>
              <button type="button" data-list-action="move-left" data-list-id="${list.id}">${t('moveLeft')}</button>
            </div>
          </div>
        </div>
      `,
    )
    .join('');

  document.querySelectorAll('.selected-list-manage').forEach((button) => {
    button.classList.toggle('hidden', selectedListId === 'all');
    button.disabled = selectedListId === 'all' || (button.dataset.listAction === 'delete-selected' && lists.length <= 1);
  });

  updateListScrollControls();
}

function updateListScrollControls() {
  const hasOverflow = listList.scrollWidth > listList.clientWidth + 1;
  document.querySelectorAll('[data-list-scroll]').forEach((button) => {
    button.classList.toggle('hidden', !hasOverflow);
  });
}

function getVisibleTasks() {
  const scopedTasks = activeFilter === 'all-lists' || selectedListId === 'all'
    ? tasks
    : tasks.filter((task) => task.listId === selectedListId);

  let visibleTasks = scopedTasks;
  if (activeFilter === 'active') {
    visibleTasks = scopedTasks.filter((task) => !task.completed);
  }

  if (activeFilter === 'completed') {
    visibleTasks = scopedTasks.filter((task) => task.completed);
  }

  if (focusModeActive) {
    const priorityRank = { alta: 3, media: 2, baja: 1, '': 0 };
    return scopedTasks
      .filter((task) => !task.completed)
      .sort((first, second) => priorityRank[second.priority] - priorityRank[first.priority] || second.createdAt.localeCompare(first.createdAt))
      .slice(0, 3);
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

  const locale = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(date);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDueDateState(dateValue) {
  if (!dateValue) return '';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dateKey = getLocalDateKey(new Date(`${dateValue}T00:00:00`));
  if (dateKey === getLocalDateKey(today)) return 'today';
  if (dateKey === getLocalDateKey(tomorrow)) return 'tomorrow';
  return '';
}

function renderSubtasksEditor() {
  if (!draftSubtasks.length) {
    subtaskList.innerHTML = `<li class="empty-state">${t('subtaskEmpty')}</li>`;
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
          <button type="button" class="task-subtask-delete" data-subtask-action="delete" data-subtask-id="${subtask.id}" aria-label="${t('remove')}">×</button>
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
        ${t('emptyTasks')}
      </li>
    `;
    return;
  }

  taskList.innerHTML = visibleTasks
    .map((task) => {
      const dueState = getDueDateState(task.dueDate);
      const dueText = dueState === 'today' ? dateLabel('todayLabel') : dueState === 'tomorrow' ? dateLabel('tomorrow') : task.dueDate ? formatDueDate(task.dueDate) : '';
      const timeText = task.dueTime ? ` ${task.dueTime}` : '';
      const isOverdue = task.dueDate && !task.completed && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString());
      return `
        <li class="task-item ${task.completed ? 'completed' : ''} ${dueState ? `due-${dueState}` : ''}" data-id="${task.id}">
          <div class="task-header" data-action="detail" data-id="${task.id}">
            <button
              type="button"
              class="task-toggle"
              data-action="toggle"
              data-id="${task.id}"
              aria-label="${task.completed ? t('pendingTask') : t('completedTask')}"
            >
              ${task.completed ? '✓' : ''}
            </button>

            <div class="task-text-wrap">
              <span class="task-text">${sanitizeInput(task.text)}</span>
              <div class="task-meta-row">
                <span class="task-badge priority-${task.priority || 'none'}" style="${getPriorityColor(task.priority) ? `--task-priority-color:${getPriorityColor(task.priority)}` : ''}">${getPriorityLabel(task.priority)}</span>
                ${getPomodoroMinutesForTask(task.id).map((minutes) => `<span class="task-pomodoro-badge">◷ ${minutes} min</span>`).join('')}
                ${dueText ? `<span class="task-badge due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueText}${timeText}</span>` : ''}
              </div>
            </div>

            <div class="task-actions">
              <button type="button" class="task-pomodoro" data-action="pomodoro" data-id="${task.id}" aria-label="${t('linkPomodoro')}" title="${t('linkPomodoro')}">◷</button>
              <button type="button" class="task-more" aria-label="${t('more')}" aria-expanded="false">•••</button>
              <div class="task-menu hidden">
                <button type="button" data-action="edit" data-id="${task.id}">${t('edit')}</button>
                <button type="button" data-action="delete" data-id="${task.id}">${t('remove')}</button>
                <button type="button" data-action="move-up" data-id="${task.id}">${t('moveUp')}</button>
                <button type="button" data-action="move-down" data-id="${task.id}">${t('moveDown')}</button>
              </div>
            </div>
          </div>
        </li>
      `;
    })
    .join('');
}

function resetTaskForm() {
  closeCustomSelectMenus();
  taskForm.classList.remove('is-expanded');
  taskForm.reset();
  taskPriority.value = '';
  taskForm.dataset.mode = 'create';
  cancelEditTaskButton.classList.add('hidden');
  taskInput.placeholder = t('addTask');
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

  closeTaskMenus();
  closeCustomSelectMenus();
  editingTaskId = taskId;
  taskForm.dataset.mode = 'edit';
  taskForm.classList.add('is-expanded');
  taskInput.value = task.text;
  taskDueDate.value = task.dueDate || '';
  taskDueTime.value = task.dueTime || '';
  taskPriority.value = task.priority ?? '';
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
    dueTime: taskDueTime.value || '',
    priority: taskPriority.value,
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
  const taskBeforeToggle = tasks.find((task) => task.id === taskId);
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return { ...task, completed: !task.completed };
  });

  persistState();
  if (taskBeforeToggle && !taskBeforeToggle.completed) recordTaskCompletion();
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
          <button type="button" class="task-subtask-delete" data-detail-subtask-action="delete" data-subtask-id="${subtask.id}" aria-label="${t('remove')}">×</button>
        </li>`).join('')
    : `<li class="empty-state">${t('subtaskEmpty')}</li>`;
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
    const isOpen = menu && !menu.classList.contains('hidden');
    closeTaskMenus();
    if (menu && !isOpen) {
      menu.classList.remove('hidden');
      moreButton.setAttribute('aria-expanded', 'true');
    }
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

  if (action === 'pomodoro') {
    linkPomodoroTask(id);
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
  const cleanName = sanitizeInput(name).slice(0, 30);
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
  const cleanName = sanitizeInput(newName).slice(0, 30);
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

function moveList(listId, direction) {
  const currentIndex = lists.findIndex((list) => list.id === listId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= lists.length) {
    return;
  }

  const nextLists = [...lists];
  [nextLists[currentIndex], nextLists[nextIndex]] = [nextLists[nextIndex], nextLists[currentIndex]];
  lists = nextLists;
  persistState();
  renderSidebarLists();
  renderListOptions();
}

function deleteList(listId) {
  if (lists.length <= 1) {
    return;
  }

  pendingDeleteListId = listId;
  deleteListDialog.classList.remove('hidden');
  deleteListOverlay.classList.remove('hidden');
  deleteListOverlay.setAttribute('aria-hidden', 'false');
  confirmDeleteListButton.focus();
}

function closeDeleteListDialog() {
  pendingDeleteListId = null;
  deleteListDialog.classList.add('hidden');
  deleteListOverlay.classList.add('hidden');
  deleteListOverlay.setAttribute('aria-hidden', 'true');
}

function confirmDeleteList() {
  const listId = pendingDeleteListId;
  if (!listId) {
    return;
  }

  if (lists.length <= 1) {
    closeDeleteListDialog();
    return;
  }

  const fallbackListId = lists.find((list) => list.id !== listId)?.id;
  lists = lists.filter((list) => list.id !== listId);
  tasks = tasks.map((task) => ({
    ...task,
    listId: task.listId === listId ? fallbackListId : task.listId,
  }));

  if (selectedListId === listId) {
    selectedListId = 'all';
    activeFilter = 'all-lists';
  }

  persistState();
  renderSidebarLists();
  renderListOptions();
  updateFilterButtons();
  renderTasks();
  closeDeleteListDialog();
}

function onFilterChange(nextFilter) {
  if (nextFilter === 'all-lists') {
    selectedListId = 'all';
  } else if (selectedListId === 'all' && lists.length) {
    selectedListId = lists[0].id;
  }
  activeFilter = nextFilter;
  renderSidebarLists();
  renderListOptions();
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

  const { listAction } = listButton.dataset;
  if (listAction.endsWith('-selected') && selectedListId === 'all') {
    return;
  }
  const listId = listButton.dataset.listId || selectedListId;
  if (!listId) {
    return;
  }

  if (listAction === 'toggle-menu') {
    const menu = listButton.closest('.list-actions')?.querySelector('.list-tab-menu');
    const isOpen = menu && !menu.classList.contains('hidden');
    document.querySelectorAll('.list-tab-menu').forEach((item) => item.classList.add('hidden'));
    document.querySelectorAll('[data-list-action="toggle-menu"]').forEach((item) => item.setAttribute('aria-expanded', 'false'));
    if (menu && !isOpen) {
      const tabRect = listButton.closest('.list-tab')?.getBoundingClientRect();
      if (tabRect) {
        menu.style.top = `${tabRect.bottom + 4}px`;
        menu.style.left = `${Math.max(8, tabRect.right - 170)}px`;
      }
      menu.classList.remove('hidden');
      listButton.setAttribute('aria-expanded', 'true');
    }
    return;
  }

  if (listAction === 'rename') {
    const list = getListById(listId);
    const nextName = window.prompt(t('renameListPrompt'), list?.name || '');
    if (nextName !== null) {
      renameList(listId, nextName);
    }
  }

  if (listAction === 'delete') {
    deleteList(listId);
  }

  if (listAction === 'move-right') {
    moveList(listId, 1);
  }

  if (listAction === 'move-left') {
    moveList(listId, -1);
  }

  if (listAction === 'rename-selected') {
    const list = getListById(selectedListId);
    const nextName = window.prompt(t('renameListPrompt'), list?.name || '');
    if (nextName !== null) {
      renameList(selectedListId, nextName);
    }
  }

  if (listAction === 'delete-selected') {
    deleteList(selectedListId);
  }

  document.querySelectorAll('.list-tab-menu').forEach((menu) => menu.classList.add('hidden'));
}

function bindEvents() {
  focusModeToggle.addEventListener('click', () => {
    focusModeActive = !focusModeActive;
    updateFocusMode();
    renderTasks();
  });
  pomodoroPlay.addEventListener('click', togglePomodoro);
  pomodoroReset.addEventListener('click', resetPomodoro);
  pomodoroClose.addEventListener('click', closePrimaryPomodoro);
  pomodoroMinutes.addEventListener('change', setPomodoroDuration);
  addPomodoroButton.addEventListener('click', addPomodoro);
  pomodoroTask.addEventListener('click', () => { if (pomodoroTaskId) openTaskEditor(pomodoroTaskId); });
  pomodoroWidget.querySelector('.pomodoro-minimize').addEventListener('click', () => pomodoroWidget.classList.toggle('minimized'));
  pomodoroWidget.querySelector('.pomodoro-size').addEventListener('change', (event) => {
    pomodoroWidget.classList.remove('pomodoro-small', 'pomodoro-large');
    if (event.target.value !== 'normal') pomodoroWidget.classList.add(`pomodoro-${event.target.value}`);
  });
  pomodoroWidgets.addEventListener('click', (event) => {
    const widget = event.target.closest('.extra-pomodoro');
    if (!widget) return;
    const pomodoro = extraPomodoros.find((item) => item.id === widget.dataset.pomodoroId);
    const action = event.target.closest('[data-extra-action]')?.dataset.extraAction;
    if (!pomodoro || !action) return;
    if (action === 'close') { closeExtraPomodoro(pomodoro.id); return; }
    if (action === 'edit-task' && pomodoro.taskId) openTaskEditor(pomodoro.taskId);
    if (action === 'minimize') { pomodoro.minimized = !pomodoro.minimized; renderExtraPomodoros(); }
    if (action === 'reset') { window.clearInterval(pomodoro.timer); pomodoro.timer = null; pomodoro.seconds = pomodoro.duration * 60; renderExtraPomodoros(); }
    if (action === 'play') {
      if (pomodoro.timer) { window.clearInterval(pomodoro.timer); pomodoro.timer = null; }
      else pomodoro.timer = window.setInterval(() => { pomodoro.seconds = Math.max(0, pomodoro.seconds - 1); if (!pomodoro.seconds) { window.clearInterval(pomodoro.timer); pomodoro.timer = null; } renderExtraPomodoros(); }, 1000);
      renderExtraPomodoros();
    }
  });
  pomodoroWidgets.addEventListener('change', (event) => {
    const widget = event.target.closest('.extra-pomodoro');
    const pomodoro = extraPomodoros.find((item) => item.id === widget?.dataset.pomodoroId);
    if (!pomodoro) return;
    if (event.target.classList.contains('extra-duration')) { pomodoro.duration = Math.min(180, Math.max(1, Number(event.target.value) || 25)); pomodoro.seconds = pomodoro.duration * 60; }
    if (event.target.classList.contains('extra-size')) pomodoro.size = event.target.value;
    renderExtraPomodoros();
  });
  enablePomodoroDragging(pomodoroWidget);
  taskForm.addEventListener('submit', submitTask);
  taskForm.addEventListener('click', (event) => {
    const clearButton = event.target.closest('[data-clear-control]');
    if (!clearButton) return;
    const control = document.querySelector(`#${clearButton.dataset.clearControl}`);
    if (!control) return;
    control.value = '';
    if (control !== taskListSelect) {
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    control.focus();
  });
  taskForm.querySelectorAll('.task-form-meta > label').forEach((metaLabel) => {
    metaLabel.addEventListener('click', (event) => {
      if (event.target.matches('input, select, option, button') || event.target.closest('[data-clear-control]')) {
        return;
      }

      const control = metaLabel.querySelector('input, select');
      if (!control) return;
      control.focus();
      if (typeof control.showPicker === 'function' && control.matches('input[type="date"], input[type="time"]')) {
        control.showPicker();
      }
    });
  });
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

  const openListForm = () => {
    listForm.classList.toggle('hidden');
    if (!listForm.classList.contains('hidden')) {
      listInput.focus();
    }
  };

  addListButton.addEventListener('click', openListForm);
  document.querySelectorAll('[data-add-list]').forEach((button) => button.addEventListener('click', openListForm));

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
    activeFilter = 'current-all';
    updateFilterButtons();
    renderSidebarLists();
    renderListOptions();
    renderTasks();
  });

  listList.addEventListener('click', handleSidebarListActions);
  document.querySelector('.selected-list-actions')?.addEventListener('click', handleSidebarListActions);
  document.querySelectorAll('[data-list-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      listList.scrollBy({ left: button.dataset.listScroll === 'right' ? 220 : -220, behavior: 'smooth' });
    });
  });
  window.addEventListener('resize', updateListScrollControls);
  cancelDeleteListButton.addEventListener('click', closeDeleteListDialog);
  confirmDeleteListButton.addEventListener('click', confirmDeleteList);
  deleteListOverlay.addEventListener('click', closeDeleteListDialog);

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
        closeDeleteListDialog();
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

    if (menuItem.dataset.language) {
      currentLanguage = menuItem.dataset.language;
      persistState();
      applyTranslations();
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
    if (taskListSelect.value === '__add__') {
      createList('Nueva lista');
      return;
    }
    if (taskForm.dataset.mode === 'create' && taskListSelect.value) {
      selectedListId = taskListSelect.value; 
    }
  });

  taskPriority.addEventListener('change', () => {
    if (taskPriority.value === '__add__') addPriorityOption();
  });
  editPriorityOptionButton.addEventListener('click', editSelectedPriority);
  editListOptionButton.addEventListener('click', () => {
    const list = lists.find((item) => item.id === taskListSelect.value);
    if (!list) return;
    const name = window.prompt(t('renameListPrompt'), list.name);
    if (name !== null) renameList(list.id, name);
  });
  priorityColorPicker.addEventListener('click', (event) => {
    const button = event.target.closest('[data-priority-color]');
    const option = priorityOptions.find((item) => item.id === priorityColorPicker.dataset.priorityId);
    if (!button || !option) return;
    option.color = button.dataset.priorityColor;
    savePriorityOptions();
    priorityColorPicker.classList.add('hidden');
    renderTasks();
  });
  priorityColorPicker.addEventListener('input', (event) => {
    if (!event.target.matches('.priority-name-input')) return;
    const option = priorityOptions.find((item) => item.id === priorityColorPicker.dataset.priorityId);
    if (!option) return;
    option.name = sanitizeInput(event.target.value).slice(0, 30) || option.name;
    savePriorityOptions();
    renderPriorityOptions();
    taskPriority.value = option.id;
    renderTasks();
  });
  document.querySelectorAll('.custom-select-trigger').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openCustomSelect(button.dataset.customSelect, button);
    });
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('#task-form')) {
      return;
    }
    closeCustomSelectMenus();
    if (!event.target.closest('.task-actions, .task-menu')) {
      closeTaskMenus();
    }
  });

  taskSortSelect.addEventListener('change', () => {
    taskOrder = taskSortSelect.value;
    persistState();
    renderTasks();
  });

  quickLanguageSelect.addEventListener('change', () => {
    currentLanguage = quickLanguageSelect.value;
    persistState();
    applyTranslations();
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
  activeFilter = 'all-lists';
  const isDark = currentTheme === 'dark';
  applyTheme(isDark ? 'dark' : 'light');
  applyTranslations();
  updateFocusMode();
  updateStreakDisplay();
  restorePomodoroPosition();
  renderPomodoro();
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
