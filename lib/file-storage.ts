import { GenerationRecord, GenerationTask } from './generation-types';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// 数据存储目录
const DATA_DIR = path.join(process.cwd(), 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 保存记录到文件
export function saveRecordsToFile(records: GenerationRecord[]) {
  try {
    ensureDataDir();
    writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('保存记录到文件失败:', error);
  }
}

// 从文件加载记录
export function loadRecordsFromFile(): GenerationRecord[] {
  try {
    if (!existsSync(RECORDS_FILE)) {
      return [];
    }
    const data = readFileSync(RECORDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('从文件加载记录失败:', error);
    return [];
  }
}

// 保存任务到文件
export function saveTasksToFile(tasks: GenerationTask[]) {
  try {
    ensureDataDir();
    writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('保存任务到文件失败:', error);
  }
}

// 从文件加载任务
export function loadTasksFromFile(): GenerationTask[] {
  try {
    if (!existsSync(TASKS_FILE)) {
      return [];
    }
    const data = readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('从文件加载任务失败:', error);
    return [];
  }
}