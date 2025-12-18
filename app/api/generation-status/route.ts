import { NextRequest, NextResponse } from 'next/server';
import { generationManager } from '@/lib/generation-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      // 获取特定任务状态
      const task = generationManager.getTask(taskId);
      if (!task) {
        return NextResponse.json(
          { error: '任务不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        task
      });
    } else {
      // 获取所有任务
      const tasks = generationManager.getAllTasks();
      return NextResponse.json({
        success: true,
        tasks
      });
    }
  } catch (error) {
    console.error('获取生成状态失败:', error);
    return NextResponse.json(
      { error: '获取生成状态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { error: '缺少记录ID' },
        { status: 400 }
      );
    }

    const deleted = generationManager.deleteRecord(recordId);
    if (!deleted) {
      return NextResponse.json(
        { error: '记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '记录已删除'
    });
  } catch (error) {
    console.error('删除记录失败:', error);
    return NextResponse.json(
      { error: '删除记录失败' },
      { status: 500 }
    );
  }
}