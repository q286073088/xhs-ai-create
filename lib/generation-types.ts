export interface GenerationRecord {
  id: string;
  keyword: string;
  userInfo: string;
  generatedContent: {
    titles: string;
    body: string;
    tags: string[];
    imagePrompt: string;
    selfComment: string;
    strategy: string;
    playbook: string;
  };
  status: 'generating' | 'completed' | 'failed' | 'improving';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  improvementCount?: number;
  isImproved?: boolean;
}

export interface BatchGenerationRequest {
  items: {
    id: string;
    keyword: string;
    userInfo: string;
  }[];
  enableImprovement: boolean;
  aiModel?: string;
  enableScraping?: boolean;
  xhsCookie?: string;
}

export interface GenerationTask {
  id: string;
  type: 'single' | 'batch' | 'improvement';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  completedItems: number;
  createdAt: string;
  completedAt?: string;
  records: GenerationRecord[];
}