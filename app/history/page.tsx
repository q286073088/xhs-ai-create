'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GenerationRecord, GenerationTask } from '@/lib/generation-types'
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Trash2, Eye, Zap, Copy, TrendingUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function HistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<GenerationRecord[]>([])
  const [tasks, setTasks] = useState<GenerationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'records' | 'tasks'>('records')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000) // 每3秒刷新一次
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/generation-status')
      const data = await response.json()
      if (data.success) {
        setRecords(data.tasks.flatMap((task: GenerationTask) => task.records))
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('获取历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProcessingTasks = () => {
    return tasks.filter(task => task.status === 'processing' || task.status === 'pending')
  }

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === 'completed')
  }

  const handleImprove = async (recordId: string) => {
    try {
      const response = await fetch('/api/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      })

      const data = await response.json()
      if (data.success) {
        alert('改进任务已创建，正在后台处理')
        fetchData()
      } else {
        alert('改进失败: ' + data.error)
      }
    } catch (error) {
      console.error('改进失败:', error)
      alert('改进失败')
    }
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const response = await fetch(`/api/generation-status?recordId=${recordId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        alert('删除成功')
        fetchData()
        if (selectedRecord?.id === recordId) {
          setSelectedRecord(null)
        }
      } else {
        alert('删除失败: ' + data.error)
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'generating':
      case 'improving':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'generating':
        return '生成中'
      case 'improving':
        return '改进中'
      case 'failed':
        return '失败'
      default:
        return '未知'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">加载历史记录中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-16">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              返回首页
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
              生成历史
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              共 {records.length} 条记录
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <Zap size={16} />
              {getProcessingTasks().length} 个进行中
            </div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/50 p-1">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'records'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-700'
              }`}
            >
              生成记录
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-purple-700'
              }`}
            >
              任务列表
            </button>
          </div>
        </div>

        {/* 任务列表视图 */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* 进行中的任务 */}
            {getProcessingTasks().length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  进行中的任务
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getProcessingTasks().map((task) => (
                    <Card key={task.id} className="bg-white/80 backdrop-blur-sm border-purple-200/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className="font-medium text-purple-800">
                              {getStatusText(task.status)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {task.totalItems} 项
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">进度</span>
                            <span className="text-purple-700 font-medium">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          <p>创建时间: {formatDate(task.createdAt)}</p>
                          <p>已完成: {task.completedItems}/{task.totalItems}</p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(task.records[task.records.length - 1]);
                              setActiveTab('records');
                            }}
                            className="text-xs"
                          >
                            查看详情
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 已完成的任务 */}
            {getCompletedTasks().length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  已完成的任务
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCompletedTasks().map((task) => (
                    <Card key={task.id} className="bg-white/80 backdrop-blur-sm border-green-200/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-800">
                              已完成
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {task.records.length} 条记录
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500 mb-3">
                          <p>创建时间: {formatDate(task.createdAt)}</p>
                          <p>完成时间: {task.completedAt ? formatDate(task.completedAt) : '-'}</p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(task.records[0]);
                              setActiveTab('records');
                            }}
                            className="text-xs"
                          >
                            查看记录
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {getProcessingTasks().length === 0 && getCompletedTasks().length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">暂无任务记录</p>
              </div>
            )}
          </div>
        )}

        {/* 记录列表视图 */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 记录列表 */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    历史记录
                  </CardTitle>
                  <CardDescription>
                    点击查看详细内容
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {records.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">暂无记录</p>
                  ) : (
                    records.map((record) => (
                      <div
                        key={record.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedRecord?.id === record.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className="text-sm font-medium">
                              {getStatusText(record.status)}
                            </span>
                          </div>
                          {record.isImproved && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              改进版
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm mb-1 line-clamp-1">
                          {record.keyword}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(record.createdAt)}
                        </p>
                        {record.improvementCount && record.improvementCount > 0 && (
                          <p className="text-xs text-purple-600 mt-1">
                            已改进 {record.improvementCount} 次
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 详细内容 */}
            <div className="lg:col-span-2">
              {selectedRecord ? (
                <Card className="bg-white/80 backdrop-blur-sm border-purple-200/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {selectedRecord.keyword}
                          </span>
                          {getStatusIcon(selectedRecord.status)}
                        </CardTitle>
                        <CardDescription>
                          创建时间: {formatDate(selectedRecord.createdAt)}
                          {selectedRecord.completedAt && (
                            <span className="ml-2">
                              完成时间: {formatDate(selectedRecord.completedAt)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedRecord.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleImprove(selectedRecord.id)}
                            className="flex items-center gap-1"
                          >
                            <Zap size={14} />
                            改进
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(selectedRecord.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {selectedRecord.status === 'failed' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">{selectedRecord.errorMessage}</p>
                      </div>
                    )}

                    {selectedRecord.status === 'generating' || selectedRecord.status === 'improving' ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                        <p className="text-gray-600">
                          {selectedRecord.status === 'improving' ? '正在改进内容...' : '正在生成内容...'}
                        </p>
                      </div>
                    ) : selectedRecord.status === 'completed' && (
                      <>
                        {/* 标题 */}
                        {selectedRecord.generatedContent.titles && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-800">🎯 标题</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(selectedRecord.generatedContent.titles, 'titles')}
                              >
                                {copiedSection === 'titles' ? (
                                  <><CheckCircle size={14} className="mr-1" />已复制</>
                                ) : (
                                  <><Copy size={14} className="mr-1" />复制</>
                                )}
                              </Button>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.titles}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* 正文 */}
                        {selectedRecord.generatedContent.body && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-800">📄 正文</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(selectedRecord.generatedContent.body, 'body')}
                              >
                                {copiedSection === 'body' ? (
                                  <><CheckCircle size={14} className="mr-1" />已复制</>
                                ) : (
                                  <><Copy size={14} className="mr-1" />复制</>
                                )}
                              </Button>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.body}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* 标签 */}
                        {selectedRecord.generatedContent.tags.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-800">🏷️ 标签</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(selectedRecord.generatedContent.tags.map(tag => `#${tag}`).join(' '), 'tags')}
                              >
                                {copiedSection === 'tags' ? (
                                  <><CheckCircle size={14} className="mr-1" />已复制</>
                                ) : (
                                  <><Copy size={14} className="mr-1" />复制</>
                                )}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedRecord.generatedContent.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-purple-100 text-purple-800"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI绘画提示词 */}
                        {selectedRecord.generatedContent.imagePrompt && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-800">🎨 AI绘画提示词</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(selectedRecord.generatedContent.imagePrompt, 'imagePrompt')}
                              >
                                {copiedSection === 'imagePrompt' ? (
                                  <><CheckCircle size={14} className="mr-1" />已复制</>
                                ) : (
                                  <><Copy size={14} className="mr-1" />复制</>
                                )}
                              </Button>
                            </div>
                            <div className="bg-indigo-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.imagePrompt}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* 首评关键词引导 */}
                        {selectedRecord.generatedContent.selfComment && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-800">💬 首评关键词引导</h3>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(selectedRecord.generatedContent.selfComment, 'selfComment')}
                              >
                                {copiedSection === 'selfComment' ? (
                                  <><CheckCircle size={14} className="mr-1" />已复制</>
                                ) : (
                                  <><Copy size={14} className="mr-1" />复制</>
                                )}
                              </Button>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.selfComment}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* 发布策略建议 */}
                        {selectedRecord.generatedContent.strategy && (
                          <div>
                            <h3 className="font-semibold text-purple-800 mb-2">🚀 发布策略建议</h3>
                            <div className="bg-yellow-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.strategy}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* 增长Playbook */}
                        {selectedRecord.generatedContent.playbook && (
                          <div>
                            <h3 className="font-semibold text-purple-800 mb-2">📊 增长 Playbook</h3>
                            <div className="bg-orange-50 rounded-lg p-4">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedRecord.generatedContent.playbook}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-purple-200/50">
                  <CardContent className="text-center py-16">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">选择一条记录查看详细内容</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 固定底部 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-purple-200/30 py-3 z-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            © 2025 小红书爆款文案生成器 · 让 AI 赋能内容创作
          </p>
        </div>
      </div>
    </div>
  )
}