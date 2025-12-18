import { NextRequest, NextResponse } from 'next/server';
import { generationManager } from '@/lib/generation-manager';
import { aiManager } from '@/lib/ai-manager';
import { sanitizeText } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: '缺少记录ID' },
        { status: 400 }
      );
    }

    // 获取原始记录
    const originalRecord = generationManager.getRecord(recordId);
    if (!originalRecord) {
      return NextResponse.json(
        { error: '原始记录不存在' },
        { status: 404 }
      );
    }

    if (originalRecord.status !== 'completed') {
      return NextResponse.json(
        { error: '只能对已完成的记录进行改进' },
        { status: 400 }
      );
    }

    // 创建改进版本记录
    const improvedRecord = generationManager.createImprovedVersion(recordId);
    if (!improvedRecord) {
      return NextResponse.json(
        { error: '创建改进版本失败' },
        { status: 500 }
      );
    }

    // 在后台生成改进内容
    generateImprovedInBackground(improvedRecord.id, originalRecord).catch(error => {
      console.error('生成改进内容失败:', error);
      generationManager.markRecordFailed(improvedRecord.id, error instanceof Error ? error.message : '改进失败');
    });

    return NextResponse.json({
      success: true,
      improvedRecord,
      message: '改进任务已创建，正在后台处理'
    });

  } catch (error) {
    console.error('改进内容请求失败:', error);
    return NextResponse.json(
      { error: '改进内容请求失败' },
      { status: 500 }
    );
  }
}

async function generateImprovedInBackground(improvedRecordId: string, originalRecord: any) {
  try {
    const improvementPrompt = createImprovementPrompt(
      originalRecord.keyword,
      originalRecord.userInfo,
      originalRecord.generatedContent
    );

    let improvedContent = '';
    await new Promise<void>((resolve, reject) => {
      aiManager.generateStreamWithRetry(
        improvementPrompt,
        (chunk) => {
          improvedContent += chunk;
        },
        (error) => {
          reject(error);
        }
      ).then(() => resolve()).catch(reject);
    });

    if (!improvedContent) {
      throw new Error('AI生成改进内容为空');
    }

    const parsedContent = parseGeneratedContent(improvedContent);
    generationManager.updateRecord(improvedRecordId, parsedContent, 'completed');

  } catch (error) {
    console.error('生成改进内容失败:', error);
    throw error;
  }
}

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