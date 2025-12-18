'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Play, RefreshCw, Zap, Layers, CheckCircle, AlertCircle } from 'lucide-react'
import { BatchGenerationRequest } from '@/lib/generation-types'

interface BatchItem {
  id: string
  keyword: string
  userInfo: string
}

interface BatchGeneratorProps {
  enableImprovement: boolean;
  aiModel?: string;
  enableScraping?: boolean;
  onShowToast?: (message: string) => void;
}

export default function BatchGenerator({
  enableImprovement,
  aiModel,
  enableScraping,
  onShowToast
}: BatchGeneratorProps) {
  const [items, setItems] = useState<BatchItem[]>([
    { id: '1', keyword: '', userInfo: '' }
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const addItem = () => {
    const newItem: BatchItem = {
      id: Date.now().toString(),
      keyword: '',
      userInfo: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BatchItem, value: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const validateItems = (): string[] => {
    const errors: string[] = []
    items.forEach((item, index) => {
      if (!item.keyword.trim()) {
        errors.push(`第 ${index + 1} 项：请填写关键词`)
      }
      if (!item.userInfo.trim()) {
        errors.push(`第 ${index + 1} 项：请填写素材内容`)
      }
    })
    return errors
  }

  const handleGenerate = async () => {
    const errors = validateItems()
    if (errors.length > 0) {
      alert('请完善以下信息：\n' + errors.join('\n'))
      return
    }

    const validItems = items.filter(item => item.keyword.trim() && item.userInfo.trim())
    if (validItems.length === 0) {
      alert('请至少添加一个有效的生成项目')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const request: BatchGenerationRequest = {
        items: validItems.map(item => ({
          id: item.id,
          keyword: item.keyword.trim(),
          userInfo: item.userInfo.trim()
        })),
        enableImprovement,
        aiModel,
        enableScraping
      }

      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      if (data.success) {
        setTaskId(data.taskId)
        onShowToast?.(`批量任务已提交，共${validItems.length}个项目，可在历史记录中查看状态`)
        monitorProgress(data.taskId)
      } else {
        alert('批量生成失败: ' + data.error)
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('批量生成失败:', error)
      alert('批量生成失败')
      setIsGenerating(false)
    }
  }

  const monitorProgress = async (taskId: string) => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/generation-status?taskId=${taskId}`)
        const data = await response.json()

        if (data.success && data.task) {
          setProgress(data.task.progress)

          if (data.task.status === 'completed') {
            setIsGenerating(false)
            onShowToast?.(`批量生成完成！共生成 ${data.task.records.length} 条记录`)
            // 延迟跳转到历史记录
            setTimeout(() => {
              window.location.href = '/history'
            }, 1000)
          } else if (data.task.status === 'failed') {
            setIsGenerating(false)
            onShowToast?.('批量生成失败，请查看历史记录了解详情')
          } else {
            setTimeout(checkProgress, 2000)
          }
        }
      } catch (error) {
        console.error('检查进度失败:', error)
        setTimeout(checkProgress, 2000)
      }
    }

    checkProgress()
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-16">

      {/* 项目列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-xl">生成队列</h2>
              <p className="text-gray-600 text-sm">共 {items.length} 个项目待生成</p>
            </div>
          </div>
          <Button
            onClick={addItem}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加项目
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <Card key={item.id} className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-purple-300/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-700">生成项目</span>
                  </div>
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(item.id)}
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">关键词</label>
                    <Input
                      placeholder="例如：护肤心得、美食探店..."
                      value={item.keyword}
                      onChange={(e) => updateItem(item.id, 'keyword', e.target.value)}
                      className="border-gray-200 focus:border-purple-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">素材内容</label>
                    <Textarea
                      placeholder="产品特点、使用感受、具体细节..."
                      value={item.userInfo}
                      onChange={(e) => updateItem(item.id, 'userInfo', e.target.value)}
                      className="border-gray-200 focus:border-purple-400 text-sm min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {item.keyword && item.userInfo ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已完成
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        待完善
                      </Badge>
                    )}
                    {enableImprovement && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        <span className="w-3 h-3 mr-1">✨</span>
                        将改进
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 进度显示 */}
      {isGenerating && taskId && (
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">批量生成进行中</h3>
                  <p className="text-blue-600 text-sm">AI正在后台处理您的任务</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-800">{progress}%</div>
                <div className="text-xs text-blue-600">完成进度</div>
              </div>
            </div>

            <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>正在处理，请稍候...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="mt-8 flex gap-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              开始批量生成
            </>
          )}
        </Button>

        <Button
          onClick={() => window.location.href = '/history'}
          variant="outline"
          disabled={isGenerating}
          className="px-6 py-3 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300"
        >
          查看历史
        </Button>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg">
          <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-800">后台处理</p>
            <p className="text-xs text-purple-600">任务在后台运行，可关闭页面</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
          <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700">✨</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">AI改进</p>
            <p className="text-xs text-blue-600">自动优化内容，提升质量</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg">
          <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">自动保存</p>
            <p className="text-xs text-green-600">生成记录自动保存管理</p>
          </div>
        </div>
      </div>
    </div>
  )
}