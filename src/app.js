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
let currentLanguage = appState.language || 'es';
let editingTaskId = null;
let draftSubtasks = [];
let detailTaskId = null;
let taskOrder = appState.taskOrder || 'created-desc';
let manualTaskOrder = [...(appState.manualTaskOrder || [])];
let touchStartX = 0;
let touchStartY = 0;

const priorityLabels = {
  alta: 'high',
  media: 'medium',
  baja: 'low',
};

const translations = {
  es: {
    brand: 'Tareasy', today: 'Hoy', myTasks: 'Mis tareas', addTask: 'Añadir una tarea...', save: 'Guardar',
    all: 'Todas', active: 'Pendientes', completed: 'Completadas', done: 'Hechas', lists: 'Listas', newList: 'Nueva lista', cancel: 'Cancelar',
    dueDate: 'Fecha de vencimiento', priority: 'Prioridad', list: 'Lista', low: 'Baja', medium: 'Media', high: 'Alta',
    sort: 'Ordenar', lastAdded: 'Última tarea agregada', dueAsc: 'Fecha: menor a mayor', dueDesc: 'Fecha: mayor a menor', nameAsc: 'Nombre: A-Z', nameDesc: 'Nombre: Z-A', manual: 'Orden manual',
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
    brand: 'Tareasy', today: 'Today', myTasks: 'My tasks', addTask: 'Add a task...', save: 'Save', all: 'All', active: 'Pending', completed: 'Completed', done: 'Done', lists: 'Lists', newList: 'New list', cancel: 'Cancel', dueDate: 'Due date', priority: 'Priority', list: 'List', low: 'Low', medium: 'Medium', high: 'High', sort: 'Sort', lastAdded: 'Last added', dueAsc: 'Date: oldest first', dueDesc: 'Date: newest first', nameAsc: 'Name: A-Z', nameDesc: 'Name: Z-A', manual: 'Manual order', settings: 'Settings', close: 'Close settings', account: 'Account', personalization: 'Personalization', themes: 'Themes', language: 'Language', support: 'Support', profile: 'Profile', accountPage: 'My account', manageProfile: 'Manage profile', sync: 'Sync', drive: 'Google Drive', icloud: 'iCloud', manualSync: 'Sync manually', style: 'Style', minimal: 'Minimal', compact: 'Compact', premium: 'Premium', view: 'View', compactList: 'Compact list', wideList: 'Wide list', board: 'Board view', mode: 'Mode', light: 'Light', dark: 'Dark', system: 'System', help: 'Help center', faq: 'Frequently asked questions', contact: 'Contact', sendMessage: 'Send a message', email: 'Email', chat: 'Chat', languageOptions: 'Language options', emptyTasks: 'No tasks in this view. Add a new task or change lists.', subtaskEmpty: 'No subtasks yet.', addSubtask: 'Add subtask...', add: 'Add', edit: 'Edit', remove: 'Delete', moveUp: 'Move up', moveDown: 'Move down', more: 'More options', completedTask: 'Mark as completed', pendingTask: 'Mark as pending', detail: 'Detail', backSettings: '‹ Back to Settings', saveChanges: 'Save changes', configuration: 'Specific settings for', detailCopy: { accountPage: 'Review your account details.', manageProfile: 'Customize the information shown on your profile.', drive: 'Choose how to sync your tasks with Google Drive.', icloud: 'Configure the iCloud account you want to use.', manualSync: 'Start a manual data sync.', help: 'Find answers and guides for using Tareasy.', faq: 'Browse answers to common questions.', sendMessage: 'Write a message for our support team.', email: 'Send your question by email.', chat: 'Chat with support from the app.' },
  },
  zh: {
    brand: 'Tareasy', today: '今天', myTasks: '我的任务', addTask: '添加任务...', save: '保存', all: '全部', active: '待办', completed: '已完成', done: '完成', lists: '列表', newList: '新列表', cancel: '取消', dueDate: '截止日期', priority: '优先级', list: '列表', low: '低', medium: '中', high: '高', sort: '排序', lastAdded: '最近添加', dueAsc: '日期：从早到晚', dueDesc: '日期：从晚到早', nameAsc: '名称：A-Z', nameDesc: '名称：Z-A', manual: '手动排序', settings: '设置', close: '关闭设置', account: '账户', personalization: '个性化', themes: '主题', language: '语言', support: '支持', profile: '个人资料', accountPage: '我的账户', manageProfile: '管理个人资料', sync: '同步', drive: 'Google Drive', icloud: 'iCloud', manualSync: '手动同步', style: '样式', minimal: '简约', compact: '紧凑', premium: '高级', view: '视图', compactList: '紧凑列表', wideList: '宽列表', board: '看板视图', mode: '模式', light: '浅色', dark: '深色', system: '系统', help: '帮助中心', faq: '常见问题', contact: '联系', sendMessage: '发送消息', email: '电子邮件', chat: '聊天', languageOptions: '语言选项', emptyTasks: '此视图中没有任务。添加新任务或切换列表。', subtaskEmpty: '还没有子任务。', addSubtask: '添加子任务...', add: '添加', edit: '编辑', remove: '删除', moveUp: '上移', moveDown: '下移', more: '更多选项', completedTask: '标记为已完成', pendingTask: '标记为待办', detail: '详情', backSettings: '‹ 返回设置', saveChanges: '保存更改', configuration: '具体设置：', detailCopy: { accountPage: '查看账户信息。', manageProfile: '自定义个人资料信息。', drive: '选择 Google Drive 任务同步方式。', icloud: '配置要使用的 iCloud 账户。', manualSync: '开始手动同步数据。', help: '查找 Tareasy 使用帮助和指南。', faq: '查看常见问题的答案。', sendMessage: '给支持团队留言。', email: '通过电子邮件发送问题。', chat: '在应用中联系支持。' },
  },
  pt: {
    brand: 'Tareasy', today: 'Hoje', myTasks: 'Minhas tarefas', addTask: 'Adicionar tarefa...', save: 'Salvar', all: 'Todas', active: 'Pendentes', completed: 'Concluídas', done: 'Feitas', lists: 'Listas', newList: 'Nova lista', cancel: 'Cancelar', dueDate: 'Data de vencimento', priority: 'Prioridade', list: 'Lista', low: 'Baixa', medium: 'Média', high: 'Alta', sort: 'Ordenar', lastAdded: 'Última adicionada', dueAsc: 'Data: menor para maior', dueDesc: 'Data: maior para menor', nameAsc: 'Nome: A-Z', nameDesc: 'Nome: Z-A', manual: 'Ordem manual', settings: 'Configurações', close: 'Fechar configurações', account: 'Conta', personalization: 'Personalização', themes: 'Temas', language: 'Idioma', support: 'Suporte', profile: 'Perfil', accountPage: 'Minha conta', manageProfile: 'Administrar perfil', sync: 'Sincronização', drive: 'Google Drive', icloud: 'iCloud', manualSync: 'Sincronizar manualmente', style: 'Estilo', minimal: 'Minimal', compact: 'Compacto', premium: 'Premium', view: 'Visualização', compactList: 'Lista compacta', wideList: 'Lista ampla', board: 'Visualização em quadro', mode: 'Modo', light: 'Claro', dark: 'Escuro', system: 'Sistema', help: 'Central de ajuda', faq: 'Perguntas frequentes', contact: 'Contato', sendMessage: 'Enviar mensagem', email: 'Email', chat: 'Chat', languageOptions: 'Opções de idioma', emptyTasks: 'Não há tarefas nesta visualização. Adicione uma tarefa ou troque de lista.', subtaskEmpty: 'Ainda não há subtarefas.', addSubtask: 'Adicionar subtarefa...', add: 'Adicionar', edit: 'Editar', remove: 'Excluir', moveUp: 'Mover para cima', moveDown: 'Mover para baixo', more: 'Mais opções', completedTask: 'Marcar como concluída', pendingTask: 'Marcar como pendente', detail: 'Detalhes', backSettings: '‹ Voltar às configurações', saveChanges: 'Salvar alterações', configuration: 'Configurações específicas de', detailCopy: { accountPage: 'Revise os dados da sua conta.', manageProfile: 'Personalize as informações do seu perfil.', drive: 'Escolha como sincronizar suas tarefas com o Google Drive.', icloud: 'Configure a conta do iCloud que deseja usar.', manualSync: 'Inicie uma sincronização manual dos dados.', help: 'Encontre respostas e guias para usar o Tareasy.', faq: 'Consulte respostas para dúvidas comuns.', sendMessage: 'Escreva uma mensagem para nossa equipe de suporte.', email: 'Envie sua dúvida por email.', chat: 'Converse com o suporte pelo aplicativo.' },
  },
};

function t(key) {
  return translations[currentLanguage]?.[key] ?? translations.es[key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
  document.querySelector('.brand-name').textContent = t('brand');
  document.querySelector('.main-heading .eyebrow').textContent = t('today');
  document.querySelector('#view-title').textContent = getCurrentListName();
  document.querySelectorAll('[data-filter]').forEach((button) => { button.textContent = t(button.dataset.filter); });
  document.querySelector('.section-header span').textContent = t('lists');
  taskInput.placeholder = t('addTask');
  listInput.placeholder = t('newList');
  document.querySelector('#add-list-button').setAttribute('aria-label', t('newList'));
  document.querySelector('#task-due-date').setAttribute('aria-label', t('dueDate'));
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
  document.querySelector('#subtask-input').placeholder = t('addSubtask');
  document.querySelector('#add-subtask-button').textContent = t('add');
  document.querySelector('#cancel-edit-task').textContent = t('cancel');
  document.querySelector('#list-form .primary-button').textContent = t('save');
  document.querySelector('#cancel-list-button').textContent = t('cancel');
  document.querySelector('#close-task-detail').setAttribute('aria-label', t('cancel'));
  document.querySelector('#task-detail-panel .eyebrow').textContent = t('detail');
  document.querySelector('#settings-back').textContent = t('backSettings');
  renderSidebarLists();
  renderListOptions();
  renderTasks();
}

function persistState() {
  saveAppState({ theme: currentTheme, language: currentLanguage, lists, tasks, taskOrder, manualTaskOrder });
}

function getPriorityLabel(priority) {
  return t(priorityLabels[priority] || 'medium');
}

function getListById(listId) {
  return lists.find((list) => list.id === listId) || lists[0];
}

function getCurrentListName() {
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
            <button type="button" class="list-action" data-list-action="rename" data-list-id="${list.id}" aria-label="${t('edit')}">✎</button>
            <button type="button" class="list-action" data-list-action="delete" data-list-id="${list.id}" aria-label="${t('remove')}">🗑</button>
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

  const locale = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(date);
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
              aria-label="${task.completed ? t('pendingTask') : t('completedTask')}"
            >
              ${task.completed ? '✓' : ''}
            </button>

            <div class="task-text-wrap">
              <span class="task-text">${sanitizeInput(task.text)}</span>
              <div class="task-meta-row">
                <span class="task-badge priority-${task.priority}">${getPriorityLabel(task.priority)}</span>
                ${dueText ? `<span class="task-badge due-date ${isOverdue ? 'overdue' : ''}">📅 ${dueText}</span>` : ''}
              </div>
            </div>

            <div class="task-actions">
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
  taskForm.reset();
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
    if (taskForm.dataset.mode === 'create') {
      selectedListId = taskListSelect.value; 
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
  const isDark = currentTheme === 'dark';
  applyTheme(isDark ? 'dark' : 'light');
  applyTranslations();
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
