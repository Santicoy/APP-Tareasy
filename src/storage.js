import { sanitizeInput } from './security.js';

const STORAGE_KEY = 'tareasy.app.v2';
const LEGACY_TASKS_KEY = 'tareasy.tasks.v1';
const DEFAULT_LISTS = [{ id: 'inbox', name: 'Inbox' }];
const PRIORITY_LEVELS = ['', 'alta', 'media', 'baja'];

function readFromStorage(key) {
  try {
    if (!window || !window.localStorage) {
      return null;
    }

    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeToStorage(key, value) {
  try {
    if (!window || !window.localStorage) {
      return false;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function readFromNativeStorage(key) {
  if (!globalThis.Capacitor || !globalThis.Capacitor.isPluginAvailable?.('Storage')) {
    return null;
  }

  const storage = globalThis.Capacitor.Plugins?.Storage;
  if (!storage || typeof storage.get !== 'function') {
    return null;
  }

  try {
    const result = storage.get({ key });
    const parsed = result && result.value ? JSON.parse(result.value) : null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeToNativeStorage(key, value) {
  if (!globalThis.Capacitor || !globalThis.Capacitor.isPluginAvailable?.('Storage')) {
    return false;
  }

  const storage = globalThis.Capacitor.Plugins?.Storage;
  if (!storage || typeof storage.set !== 'function') {
    return false;
  }

  try {
    storage.set({ key, value: JSON.stringify(value) });
    return true;
  } catch (error) {
    return false;
  }
}

function persistValue(key, value) {
  const savedLocally = writeToStorage(key, value);
  if (savedLocally) {
    return true;
  }

  return writeToNativeStorage(key, value);
}

function normalizeSubtask(subtask) {
  if (!subtask || typeof subtask !== 'object') {
    return null;
  }

  const text = sanitizeInput(typeof subtask.text === 'string' ? subtask.text : '');
  if (!text) {
    return null;
  }

  return {
    id: typeof subtask.id === 'string' && subtask.id ? subtask.id : createSubtaskId(),
    text,
    completed: Boolean(subtask.completed),
  };
}

function normalizeList(list) {
  if (!list || typeof list !== 'object') {
    return null;
  }

  const name = sanitizeInput(typeof list.name === 'string' ? list.name : '').slice(0, 30);
  if (!name) {
    return null;
  }

  return {
    id: typeof list.id === 'string' && list.id ? list.id : createListId(),
    name,
    createdAt: typeof list.createdAt === 'string' ? list.createdAt : new Date().toISOString(),
  };
}

function normalizeTask(task, fallbackListId = 'inbox') {
  if (!task || typeof task !== 'object') {
    return null;
  }

  const text = sanitizeInput(typeof task.text === 'string' ? task.text : '');
  if (!text) {
    return null;
  }

  const priority = typeof task.priority === 'string' && task.priority.length <= 40
    ? task.priority
    : 'media';
  const listId = typeof task.listId === 'string' && task.listId ? task.listId : fallbackListId;

  return {
    id: typeof task.id === 'string' && task.id ? task.id : createTaskId(),
    text,
    completed: Boolean(task.completed),
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
    dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
    dueTime: typeof task.dueTime === 'string' ? task.dueTime : '',
    priority,
    listId,
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map(normalizeSubtask).filter(Boolean)
      : [],
  };
}

export function loadAppState() {
  const stored = readFromStorage(STORAGE_KEY) || readFromNativeStorage(STORAGE_KEY);
  if (stored && typeof stored === 'object') {
    const normalizedLists = Array.isArray(stored.lists) && stored.lists.length
      ? stored.lists.map(normalizeList).filter(Boolean)
      : DEFAULT_LISTS;

    const normalizedTasks = Array.isArray(stored.tasks)
      ? stored.tasks.map((task) => normalizeTask(task, normalizedLists[0]?.id || 'inbox')).filter(Boolean)
      : [];

    return {
      theme: stored.theme === 'dark' ? 'dark' : 'light',
      language: ['es', 'en', 'zh', 'pt'].includes(stored.language) ? stored.language : 'es',
      lists: normalizedLists,
      tasks: normalizedTasks,
      taskOrder: ['due-asc', 'due-desc', 'name-asc', 'name-desc', 'created-desc', 'manual'].includes(stored.taskOrder)
        ? stored.taskOrder
        : 'created-desc',
      manualTaskOrder: Array.isArray(stored.manualTaskOrder)
        ? stored.manualTaskOrder.filter((id) => typeof id === 'string')
        : [],
    };
  }

  const legacyTasks = readFromStorage(LEGACY_TASKS_KEY) || readFromNativeStorage(LEGACY_TASKS_KEY);
  if (Array.isArray(legacyTasks)) {
    return {
      theme: 'light',
      language: 'es',
      lists: DEFAULT_LISTS,
      tasks: legacyTasks.map((task) => normalizeTask(task, 'inbox')).filter(Boolean),
      taskOrder: 'created-desc',
      manualTaskOrder: [],
    };
  }

  return {
    theme: 'light',
    language: 'es',
    lists: DEFAULT_LISTS,
    tasks: [],
    taskOrder: 'created-desc',
    manualTaskOrder: [],
  };
}

export function saveAppState(state) {
  const safeState = {
    theme: state && state.theme === 'dark' ? 'dark' : 'light',
    language: ['es', 'en', 'zh', 'pt'].includes(state?.language) ? state.language : 'es',
    lists: Array.isArray(state?.lists)
      ? state.lists.map(normalizeList).filter(Boolean)
      : DEFAULT_LISTS,
    tasks: Array.isArray(state?.tasks)
      ? state.tasks.map((task) => normalizeTask(task, state.lists?.[0]?.id || 'inbox')).filter(Boolean)
      : [],
    taskOrder: ['due-asc', 'due-desc', 'name-asc', 'name-desc', 'created-desc', 'manual'].includes(state?.taskOrder)
      ? state.taskOrder
      : 'created-desc',
    manualTaskOrder: Array.isArray(state?.manualTaskOrder)
      ? state.manualTaskOrder.filter((id) => typeof id === 'string')
      : [],
  };

  const saved = persistValue(STORAGE_KEY, safeState);
  if (saved) {
    return safeState;
  }

  return safeState;
}

export function loadTasks() {
  return loadAppState().tasks;
}

export function saveTasks(tasks) {
  const current = loadAppState();
  const newState = {
    ...current,
    tasks: Array.isArray(tasks) ? tasks.map((task) => normalizeTask(task, current.lists[0]?.id || 'inbox')).filter(Boolean) : [],
  };

  return saveAppState(newState).tasks;
}

export function loadLists() {
  return loadAppState().lists;
}

export function saveLists(lists) {
  const current = loadAppState();
  const newState = {
    ...current,
    lists: Array.isArray(lists) ? lists.map(normalizeList).filter(Boolean) : DEFAULT_LISTS,
  };

  return saveAppState(newState).lists;
}

export function loadTheme() {
  return loadAppState().theme;
}

export function saveTheme(theme) {
  const current = loadAppState();
  const newState = {
    ...current,
    theme: theme === 'dark' ? 'dark' : 'light',
  };

  saveAppState(newState);
  return newState.theme;
}

export function createTaskId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createListId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `list-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSubtaskId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `subtask-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { STORAGE_KEY, LEGACY_TASKS_KEY, DEFAULT_LISTS, PRIORITY_LEVELS };
