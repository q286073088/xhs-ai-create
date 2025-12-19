import { GenerationRecord, BatchGenerationRequest, GenerationTask } from './generation-types';
import { GeneratedContent } from './types';
import { saveRecordsToFile, loadRecordsFromFile, saveTasksToFile, loadTasksFromFile } from './file-storage';

// 内存存储 + 文件持久化
class GenerationManager {
  private records: Map<string, GenerationRecord> = new Map();
  private tasks: Map<string, GenerationTask> = new Map();

  constructor() {
    this.loadFromFile();
  }

  // 从文件加载数据
  private loadFromFile() {
    try {
      const records = loadRecordsFromFile();
      const tasks = loadTasksFromFile();

      // 加载记录到内存
      records.forEach(record => {
        this.records.set(record.id, record);
      });

      // 加载任务到内存
      tasks.forEach(task => {
        this.tasks.set(task.id, task);
      });

      console.log(`从文件加载了 ${records.length} 条记录和 ${tasks.length} 个任务`);
    } catch (error) {
      console.error('从文件加载数据失败:', error);
    }
  }

  // 保存数据到文件
  private saveToFile() {
    try {
      const records = Array.from(this.records.values());
      const tasks = Array.from(this.tasks.values());

      saveRecordsToFile(records);
      saveTasksToFile(tasks);
    } catch (error) {
      console.error('保存数据到文件失败:', error);
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 创建生成记录
  createRecord(keyword: string, userInfo: string): GenerationRecord {
    const id = this.generateId();
    const record: GenerationRecord = {
      id,
      keyword,
      userInfo,
      generatedContent: {
        titles: '',
        body: '',
        tags: [],
        imagePrompt: '',
        selfComment: '',
        strategy: '',
        playbook: ''
      },
      status: 'generating',
      createdAt: new Date().toISOString(),
      improvementCount: 0,
      isImproved: false
    };

    this.records.set(id, record);
    this.saveToFile(); // 自动保存
    return record;
  }

  // 更新生成记录
  updateRecord(id: string, content: Partial<GeneratedContent>, status: GenerationRecord['status'] = 'completed'): GenerationRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    record.generatedContent = { ...record.generatedContent, ...content };
    record.status = status;
    if (status === 'completed') {
      record.completedAt = new Date().toISOString();
    }

    this.records.set(id, record);
    this.saveToFile(); // 自动保存
    return record;
  }

  // 标记记录失败
  markRecordFailed(id: string, errorMessage: string): GenerationRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    record.status = 'failed';
    record.errorMessage = errorMessage;
    record.completedAt = new Date().toISOString();

    this.records.set(id, record);
    return record;
  }

  // 获取记录
  getRecord(id: string): GenerationRecord | null {
    return this.records.get(id) || null;
  }

  // 获取所有记录
  getAllRecords(): GenerationRecord[] {
    return Array.from(this.records.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 创建批量生成任务
  createBatchTask(request: BatchGenerationRequest): GenerationTask {
    const taskId = this.generateId();
    const task: GenerationTask = {
      id: taskId,
      type: 'batch',
      status: 'pending',
      progress: 0,
      totalItems: request.items.length,
      completedItems: 0,
      createdAt: new Date().toISOString(),
      records: []
    };

    this.tasks.set(taskId, task);
    this.saveToFile(); // 自动保存
    return task;
  }

  // 更新任务进度
  updateTaskProgress(taskId: string, completedItems: number): GenerationTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.completedItems = completedItems;
    task.progress = Math.round((completedItems / task.totalItems) * 100);
    task.status = completedItems >= task.totalItems ? 'completed' : 'processing';

    if (task.status === 'completed') {
      task.completedAt = new Date().toISOString();
    }

    this.tasks.set(taskId, task);
    this.saveToFile(); // 自动保存
    return task;
  }

  // 添加记录到任务
  addRecordToTask(taskId: string, record: GenerationRecord): GenerationTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.records.push(record);
    this.tasks.set(taskId, task);
    this.saveToFile(); // 自动保存
    return task;
  }

  // 获取任务
  getTask(taskId: string): GenerationTask | null {
    return this.tasks.get(taskId) || null;
  }

  // 获取所有任务
  getAllTasks(): GenerationTask[] {
    return Array.from(this.tasks.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 创建改进版本
  createImprovedVersion(originalId: string): GenerationRecord | null {
    const original = this.records.get(originalId);
    if (!original) return null;

    const improvedId = this.generateId();
    const improved: GenerationRecord = {
      ...original,
      id: improvedId,
      status: 'improving',
      createdAt: new Date().toISOString(),
      improvementCount: (original.improvementCount || 0) + 1,
      isImproved: true
    };

    this.records.set(improvedId, improved);
    return improved;
  }

  // 删除记录
  deleteRecord(id: string): boolean {
    const deleted = this.records.delete(id);
    if (deleted) {
      // 同时从所有任务中移除该记录
      for (const task of this.tasks.values()) {
        task.records = task.records.filter(record => record.id !== id);

        // 如果任务的所有记录都被删除了，也删除任务
        if (task.records.length === 0) {
          this.tasks.delete(task.id);
        }
      }
      this.saveToFile(); // 删除后保存到文件
    }
    return deleted;
  }

  // 删除任务
  deleteTask(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.saveToFile(); // 删除后保存到文件
    }
    return deleted;
  }

  // 清理旧记录（保留最近的100条）
  cleanupOldRecords(): void {
    const allRecords = this.getAllRecords();
    if (allRecords.length > 100) {
      const toDelete = allRecords.slice(100);
      toDelete.forEach(record => this.records.delete(record.id));
      this.saveToFile(); // 清理后保存到文件
    }
  }
}

// 导出单例
export const generationManager = new GenerationManager();