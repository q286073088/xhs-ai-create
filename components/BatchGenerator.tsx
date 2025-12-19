'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  initialFormData?: Array<{ id: string; keyword: string; userInfo: string }>;
  onSaveFormData?: (data: Array<{ id: string; keyword: string; userInfo: string }>) => void;
}

export default function BatchGenerator({
  enableImprovement,
  aiModel,
  enableScraping,
  onShowToast,
  initialFormData,
  onSaveFormData
}: BatchGeneratorProps) {
  const [items, setItems] = useState<BatchItem[]>(
    initialFormData || [{ id: '1', keyword: '', userInfo: '' }]
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const addItem = () => {
    const newItem: BatchItem = {
      id: Date.now().toString(),
      keyword: '',
      userInfo: ''
    }
    const newItems = [...items, newItem]
    setItems(newItems)
    onSaveFormData?.(newItems)
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      const newItems = items.filter(item => item.id !== id)
      setItems(newItems)
      onSaveFormData?.(newItems)
    }
  }

  const updateItem = (id: string, field: keyof BatchItem, value: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    )
    setItems(newItems)
    onSaveFormData?.(newItems)
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

    try {
      // 从localStorage获取Cookie
      const savedCookie = typeof window !== 'undefined' ? localStorage.getItem('xhsCookie') : null;

      const request: BatchGenerationRequest = {
        items: validItems.map(item => ({
          id: item.id,
          keyword: item.keyword.trim(),
          userInfo: item.userInfo.trim()
        })),
        enableImprovement,
        aiModel,
        enableScraping,
        xhsCookie: savedCookie || undefined
      }

      const response = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      if (data.success) {
        onShowToast?.(`批量任务已提交，共${validItems.length}个项目，可在历史记录中查看状态`)

        // 重置状态
        setIsGenerating(false)

        // 延迟跳转到历史记录
        setTimeout(() => {
          window.location.href = '/history'
        }, 1000)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-indigo-100/50 relative overflow-hidden pb-16">
      {/* 背景装饰 - 与单次生成保持一致 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-200/15 to-indigo-200/15 rounded-full blur-3xl animate-float" style={{animationDelay: '0s'}}></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-indigo-200/15 to-purple-200/15 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-slate-200/10 to-blue-200/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">

          {/* 批量生成主卡片 */}
          <Card className="glass-card animate-fade-in shadow-2xl hover:shadow-3xl overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/80 to-blue-50/90 backdrop-blur-lg border border-purple-100/50 relative transition-all duration-500">
            {/* Header decoration - 与单次生成保持一致 */}
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600"></div>

            {/* Background texture */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.1) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <CardHeader className="pb-4 px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent font-bold leading-tight mb-3">
                    🚀 批量智能文案工厂
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-600 mt-4 font-medium text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                  批量处理多个文案任务 · 高效提升创作效率
                </div>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-4 sm:px-6 lg:px-8 pb-8 relative z-10">

              {/* 统计信息区域 */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">生成队列</h3>
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

              {/* 项目列表 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map((item, index) => (
                  <div key={item.id} className="relative group">
                    {/* 项目卡片 */}
                    <div className="glass-card p-6 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-50/90 via-blue-50/80 to-indigo-50/90 border border-purple-200/30">
                      {/* 序号标识 */}
                      {/* <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {index + 1}
                      </div> */}

                      {/* 删除按钮 */}
                      {items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-400 hover:text-red-600 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}

                      <div className="space-y-4">
                        {/* 关键词输入 */}
                        <div>
                          <label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-3 mb-3">
                            <span className="flex-1">文案主题</span>
                            <div className="text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">必填</div>
                          </label>
                          <Input
                            placeholder="例如：护肤心得、美食探店、旅行攻略..."
                            value={item.keyword}
                            onChange={(e) => updateItem(item.id, 'keyword', e.target.value)}
                            className="border-2 border-purple-200/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-base shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 placeholder:text-gray-400 font-medium h-14"
                          />
                        </div>

                        {/* 素材内容输入 */}
                        <div>
                          <label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-3 mb-3">
                            <span className="flex-1">素材内容</span>
                            <div className="text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">必填</div>
                          </label>
                          <Textarea
                            placeholder="产品特点、使用感受、具体细节...越详细生成的文案越精准 ✨"
                            value={item.userInfo}
                            onChange={(e) => updateItem(item.id, 'userInfo', e.target.value)}
                            className="border-2 border-purple-200/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-base shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 placeholder:text-gray-400 font-medium min-h-[120px] resize-none leading-relaxed"
                            rows={4}
                          />
                        </div>

                        {/* 状态标签 */}
                        <div className="flex items-center gap-3 pt-2">
                          {item.keyword && item.userInfo ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 rounded-full text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              信息完整
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200 rounded-full text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              待完善
                            </div>
                          )}
                          {enableImprovement && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 rounded-full text-sm font-medium">
                              <span className="text-sm">✨</span>
                              将改进
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 操作按钮区域 */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-12 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-500 w-full sm:w-auto max-w-md group relative overflow-hidden bg-gradient-to-r from-purple-500 via-blue-600 to-indigo-600 hover:from-purple-400 hover:via-blue-500 hover:to-indigo-500 text-white border-0 rounded-2xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span>{isGenerating ? '正在提交批量任务...' : `开始批量生成 (${items.length}个项目)`}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}