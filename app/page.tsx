'use client'

import GeneratorClient from '@/components/GeneratorClient'
import BatchGenerator from '@/components/BatchGenerator'
import SettingsPanel from '@/components/SettingsPanel'
import { ToastContainer, useToast } from '@/components/Toast'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { CheckCircle, Settings } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [enableImprovement, setEnableImprovement] = useState(true)
  const [aiModel, setAiModel] = useState('gemini-2.5-pro,gemini-2.5-flash')
  const [enableScraping, setEnableScraping] = useState(true)
  const [xhsCookie, setXhsCookie] = useState('')
  const { toasts, addToast, removeToast, info } = useToast()

  // 从localStorage加载设置
  useEffect(() => {
    const savedImprovement = localStorage.getItem('enableImprovement')
    const savedModel = localStorage.getItem('aiModel')
    const savedScraping = localStorage.getItem('enableScraping')
    const savedCookie = localStorage.getItem('xhsCookie')

    if (savedImprovement !== null) {
      setEnableImprovement(JSON.parse(savedImprovement))
    }
    if (savedModel) {
      setAiModel(savedModel)
    }
    if (savedScraping !== null) {
      setEnableScraping(JSON.parse(savedScraping))
    }
    if (savedCookie) {
      setXhsCookie(savedCookie)
    }
  }, [])

  // 保存设置到localStorage
  const toggleImprovement = () => {
    const newValue = !enableImprovement
    setEnableImprovement(newValue)
    localStorage.setItem('enableImprovement', JSON.stringify(newValue))
  }

  const changeModel = (newModel: string) => {
    setAiModel(newModel)
    localStorage.setItem('aiModel', newModel)
  }

  const toggleScraping = (value: boolean) => {
    setEnableScraping(value)
    localStorage.setItem('enableScraping', JSON.stringify(value))
    info(value ? '已启用数据抓取功能' : '已禁用数据抓取功能')
  }

  const changeCookie = (newCookie: string) => {
    setXhsCookie(newCookie)
    if (newCookie) {
      localStorage.setItem('xhsCookie', newCookie)
      info('Cookie已更新')
    } else {
      localStorage.removeItem('xhsCookie')
      info('Cookie已清除')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 左上角设置面板 */}
      <SettingsPanel
        enableImprovement={enableImprovement}
        onToggleImprovement={toggleImprovement}
        aiModel={aiModel}
        onChangeModel={changeModel}
        enableScraping={enableScraping}
        onToggleScraping={toggleScraping}
        xhsCookie={xhsCookie}
        onChangeCookie={changeCookie}
      />

      {/* 右上角历史记录按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <a
          href="/history"
          className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-lg hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          查看历史记录
        </a>
      </div>

      {/* Toast容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-100/40 to-purple-100/40 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-gradient-to-l from-blue-100/40 to-indigo-100/40 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-gradient-to-r from-purple-100/90 to-blue-100/90 rounded-full border border-purple-200/60 backdrop-blur-sm shadow-xl">
              <span className="text-2xl animate-bounce">✨</span>
              <span className="text-sm font-semibold text-purple-800">AI 智能文案创作平台</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-800 via-blue-600 to-indigo-700 bg-clip-text text-transparent leading-tight">
              小红书爆款文案生成器
            </h1>
        

            {/* 特性展示 */}
            <div className="flex justify-center gap-4 sm:gap-6 flex-wrap mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-purple-200/50 shadow-md">
                <span className="text-sm font-medium text-purple-800">爆款分析</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-md">
                <span className="text-sm font-medium text-blue-800">实时生成</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-indigo-200/50 shadow-md">
                <span className="text-sm font-medium text-indigo-800">精准定制</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-pink-200/50 shadow-md">
                <span className="text-sm font-medium text-pink-800">流量提升</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-green-200/50 shadow-md">
                <span className="text-sm font-medium text-green-800">批量生成</span>
              </div>
           
            </div>

            {/* 导航标签 */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/50 p-1">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'single'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-700'
                  }`}
                >
                  单次生成
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'batch'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-700'
                  }`}
                >
                  批量生成
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 根据选择的标签显示不同组件 */}
          {activeTab === 'single' ? (
            <GeneratorClient
              enableImprovement={enableImprovement}
              aiModel={aiModel}
              enableScraping={enableScraping}
              onShowToast={info}
            />
          ) : (
            <BatchGenerator
              enableImprovement={enableImprovement}
              aiModel={aiModel}
              enableScraping={enableScraping}
              onShowToast={info}
            />
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