import { NextRequest, NextResponse } from 'next/server';
import { generationManager } from '@/lib/generation-manager';
import { aiManager } from '@/lib/ai-manager';
import { getAnalysisPrompt, getGenerationPrompt } from '@/lib/prompts';
import { detectSensitiveWords, filterSensitiveContent } from '@/lib/sensitive-words';
import { sanitizeText } from '@/lib/utils';
import { fetchHotPostsWithCache } from '@/app/api/generate-combined/route';
import { BatchGenerationRequest } from '@/lib/generation-types';

export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerationRequest = await request.json();
    const { items, enableImprovement, aiModel, enableScraping } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的生成项目列表' },
        { status: 400 }
      );
    }

    // 创建任务（单次或批量）
    const taskType = items.length === 1 ? 'single' : 'batch';
    const task = generationManager.createBatchTask({ items, enableImprovement });
    task.type = taskType; // 设置任务类型

    // 在后台处理批量生成
    processBatchGeneration(task.id, items, enableImprovement, aiModel, enableScraping).catch(error => {
      console.error('批量生成失败:', error);
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      totalItems: items.length,
      message: '批量生成任务已创建，正在后台处理'
    });

  } catch (error) {
    console.error('批量生成请求失败:', error);
    return NextResponse.json(
      { error: '批量生成请求失败' },
      { status: 500 }
    );
  }
}

// 后台处理批量生成
async function processBatchGeneration(taskId: string, items: any[], enableImprovement: boolean, aiModel?: string, enableScraping?: boolean) {
  const task = generationManager.getTask(taskId);
  if (!task) return;

  task.status = 'processing';
  let completedCount = 0;

  for (const item of items) {
    try {
      // 创建生成记录
      const record = generationManager.createRecord(item.keyword, item.userInfo);
      generationManager.addRecordToTask(taskId, record);

      // 生成内容
      const content = await generateSingleContent(item.keyword, item.userInfo, aiModel, enableScraping);

      if (content) {
        generationManager.updateRecord(record.id, content, 'completed');

        // 如果启用改进功能，生成改进版本
        if (enableImprovement) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 短暂延迟
            const improvedContent = await generateImprovedContent(item.keyword, item.userInfo, content, aiModel);
            const improvedRecord = generationManager.createImprovedVersion(record.id);
            if (improvedRecord) {
              generationManager.updateRecord(improvedRecord.id, improvedContent, 'completed');
              generationManager.addRecordToTask(taskId, improvedRecord);
            }
          } catch (improveError) {
            console.error('生成改进版本失败:', improveError);
          }
        }
      } else {
        generationManager.markRecordFailed(record.id, '生成内容失败');
      }

      completedCount++;
      generationManager.updateTaskProgress(taskId, completedCount);

    } catch (error) {
      console.error(`生成项目失败 (${item.keyword}):`, error);
      const record = generationManager.createRecord(item.keyword, item.userInfo);
      generationManager.markRecordFailed(record.id, error instanceof Error ? error.message : '未知错误');
      generationManager.addRecordToTask(taskId, record);

      completedCount++;
      generationManager.updateTaskProgress(taskId, completedCount);
    }
  }
}

// 生成单个内容
async function generateSingleContent(keyword: string, userInfo: string, aiModel?: string, enableScraping?: boolean): Promise<any> {
  try {
    // 获取热门数据
    let scrapedContent = null;
    if (enableScraping !== false) { // 默认启用爬取
      scrapedContent = await fetchHotPostsWithCache(keyword);
    }

    // 创建提示词
    const prompt = scrapedContent
      ? createPromptWithReference(scrapedContent, userInfo, keyword)
      : createPromptWithoutReference(userInfo, keyword);

    // 使用AI生成内容
    let content = '';
    await new Promise<void>((resolve, reject) => {
      aiManager.generateStreamWithRetry(
        prompt,
        (chunk) => {
          content += chunk;
        },
        (error) => {
          reject(error);
        },
        aiModel
      ).then(() => resolve()).catch(reject);
    });

    if (!content) {
      throw new Error('AI生成内容为空');
    }

    // 解析内容
    return parseGeneratedContent(content);

  } catch (error) {
    console.error('生成单个内容失败:', error);
    throw error;
  }
}

// 生成改进版本
async function generateImprovedContent(keyword: string, userInfo: string, originalContent: any, aiModel?: string): Promise<any> {
  try {
    // 创建改进提示词
    const improvementPrompt = createImprovementPrompt(keyword, userInfo, originalContent);

    // 使用AI生成改进版本
    let improvedContent = '';
    await new Promise<void>((resolve, reject) => {
      aiManager.generateStreamWithRetry(
        improvementPrompt,
        (chunk) => {
          improvedContent += chunk;
        },
        (error) => {
          reject(error);
        },
        aiModel
      ).then(() => resolve()).catch(reject);
    });

    if (!improvedContent) {
      throw new Error('AI生成改进内容为空');
    }

    // 解析改进内容
    return parseGeneratedContent(improvedContent);

  } catch (error) {
    console.error('生成改进内容失败:', error);
    throw error;
  }
}

// 创建带参考数据的提示词
function createPromptWithReference(scrapedContent: string, user_info: string, keyword: string): string {
  let safeContent = scrapedContent
    .replace(/```/g, '´´´')
    .trim();

  if (safeContent.length > 8000) {
    safeContent = safeContent.substring(0, 8000) + '\n\n[内容因长度限制被截断...]';
  }

  const hotPostRules = `
**【小红书热门笔记数据 - 供你内化分析】**

以下是小红书上关于"${keyword}"的热门笔记数据：

${safeContent}

**内化要求：**
请默默阅读并提取爆款规律（标题公式、内容结构、标签策略等），将其转化为你的创作直觉，但绝对不要在输出中体现任何分析过程。
`;

  return getGenerationPrompt(hotPostRules, user_info, keyword);
}

// 创建不带参考数据的提示词
function createPromptWithoutReference(user_info: string, keyword: string): string {
  const hotPostRules = `
**【创作说明】**

用户没有提供小红书热门笔记的参考数据。请基于你对小红书爆款内容的理解和经验，直接为用户创作内容。

**注意：**
- 没有具体的热门笔记数据可供分析
- 请依靠你对小红书平台特点和爆款规律的内在理解进行创作
- 仍需严格遵守所有降低 AIGC 检测率的策略
`;

  return getGenerationPrompt(hotPostRules, user_info, keyword);
}

// 创建改进提示词
function createImprovementPrompt(keyword: string, userInfo: string, originalContent: any): string {
  return `
请基于以下原始生成内容，进行深度优化和改进，使其更具吸引力和爆款潜力：

**原始内容：**
标题：${originalContent.titles}
正文：${originalContent.body}
标签：${originalContent.tags.join(', ')}

**改进要求：**
1. **标题优化**：让标题更具吸引力，增加点击欲望
2. **内容强化**：增强内容的情感共鸣和实用价值
3. **语言优化**：使用更生动的表达，避免AI痕迹
4. **结构优化**：改进内容结构，提升可读性
5. **情绪增强**：注入更多真实情感和生活细节

**输出格式：**
请按照以下格式输出改进后的内容：

## 1. 爆款标题创作（3个）

## 2. 正文内容

## 3. 关键词标签（10-15个）

## 4. AI绘画提示词

## 5. 首评关键词引导

## 6. 发布策略建议

## 7. 小红书增长 Playbook (高级策略)

**重要提醒：**
- 保持原有的核心信息不变
- 优化表达方式，让内容更自然生动
- 增加更多生活化细节和真实感
- 确保改进后的内容更加吸引人

用户素材：${userInfo}
关键词：${keyword}
`;
}

// 解析生成的内容
function parseGeneratedContent(content: string): any {
  const titleRegex = /##\s*1[.、]?\s*(爆款标题创作|标题|生成标题)(\s*（\d+个）)?/i;
  const bodyRegex = /##\s*2[.、]?\s*(正文内容|笔记正文|内容|正文|文案内容)/i;
  const tagsRegex = /##\s*3[.、]?\s*(关键词标签|标签|关键词)(\s*（\d+-\d+个）)?/i;
  const imagePromptRegex = /##\s*4[.、]?\s*(AI绘画提示词|绘画提示词|AI绘画|绘画提示)/i;
  const selfCommentRegex = /##\s*5[.、]?\s*(首评关键词引导|首评)/i;
  const strategyRegex = /##\s*6[.、]?\s*(发布策略建议|发布策略)/i;
  const playbookRegex = /##\s*7[.、]?\s*(小红书增长 Playbook|增长 Playbook)/i;

  const sections = [
    { name: 'title', match: content.match(titleRegex), index: content.search(titleRegex) },
    { name: 'body', match: content.match(bodyRegex), index: content.search(bodyRegex) },
    { name: 'tags', match: content.match(tagsRegex), index: content.search(tagsRegex) },
    { name: 'imagePrompt', match: content.match(imagePromptRegex), index: content.search(imagePromptRegex) },
    { name: 'selfComment', match: content.match(selfCommentRegex), index: content.search(selfCommentRegex) },
    { name: 'strategy', match: content.match(strategyRegex), index: content.search(strategyRegex) },
    { name: 'playbook', match: content.match(playbookRegex), index: content.search(playbookRegex) }
  ].filter(section => section.index !== -1).sort((a, b) => a.index - b.index);

  let titles = '';
  let body = '';
  let tags: string[] = [];
  let imagePrompt = '';
  let selfComment = '';
  let strategy = '';
  let playbook = '';

  if (sections.length > 0) {
    const firstSectionIndex = sections[0].index;
    if (firstSectionIndex > 0) {
      titles = content.substring(0, firstSectionIndex).trim();
    }
  }

  for (let i = 0; i < sections.length; i++) {
    const currentSection = sections[i];
    const nextSection = sections[i + 1];

    const startIndex = currentSection.index + (currentSection.match?.[0].length || 0);
    const endIndex = nextSection ? nextSection.index : content.length;

    const sectionContent = content.substring(startIndex, endIndex).trim();

    switch (currentSection.name) {
      case 'title':
        titles = sectionContent;
        break;
      case 'body':
        body = sectionContent;
        break;
      case 'tags':
        const tagMatches = sectionContent.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || [];
        const listTagMatches = sectionContent.match(/[-*]\s*([^\n]+)/g) || [];
        const extractedTags = [
          ...tagMatches.map(tag => tag.replace(/^#/, '')),
          ...listTagMatches.map(item => item.replace(/[-*]\s*/, '').trim())
        ];
        tags = Array.from(new Set(extractedTags)).filter(Boolean);
        break;
      case 'imagePrompt':
        imagePrompt = sectionContent;
        break;
      case 'selfComment':
        selfComment = sectionContent;
        break;
      case 'strategy':
        strategy = sectionContent;
        break;
      case 'playbook':
        playbook = sectionContent;
        break;
    }
  }

  return { titles, body, tags, imagePrompt, selfComment, strategy, playbook };
}