import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { aiModel } = await request.json()

    if (!aiModel || typeof aiModel !== 'string') {
      return NextResponse.json(
        { error: '无效的模型配置' },
        { status: 400 }
      )
    }

    // 这里可以将模型配置保存到数据库或环境变量
    // 目前只是返回成功响应，实际使用时由前端localStorage管理

    return NextResponse.json({
      success: true,
      aiModel,
      message: '模型配置已更新'
    })

  } catch (error) {
    console.error('更新模型配置失败:', error)
    return NextResponse.json(
      { error: '更新模型配置失败' },
      { status: 500 }
    )
  }
}