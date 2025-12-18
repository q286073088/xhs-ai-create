'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Settings, CheckCircle, Sparkles, Zap } from 'lucide-react'

interface SettingsPanelProps {
  enableImprovement: boolean
  onToggleImprovement: () => void
  aiModel: string
  onChangeModel: (model: string) => void
  enableScraping: boolean
  onToggleScraping: (value: boolean) => void
  xhsCookie: string
  onChangeCookie: (cookie: string) => void
}

export default function SettingsPanel({
  enableImprovement,
  onToggleImprovement,
  aiModel,
  onChangeModel,
  enableScraping,
  onToggleScraping,
  xhsCookie,
  onChangeCookie
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* 设置按钮 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 backdrop-blur-sm border border-purple-200/50 rounded-lg hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl p-3"
        size="sm"
      >
        <Settings className="w-5 h-5 text-purple-700" />
      </Button>

      {/* 设置面板 */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-80 bg-white/95 backdrop-blur-lg border border-purple-200/50 rounded-xl shadow-2xl z-50">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">系统设置</h3>
                  <p className="text-gray-600 text-sm">配置生成参数和模型</p>
                </div>
              </div>

              {/* AI智能改进设置 */}
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800 text-sm">AI 智能改进</h4>
                        <p className="text-purple-600 text-xs">自动优化内容质量</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleImprovement}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enableImprovement ? 'bg-gradient-to-r from-purple-500 to-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableImprovement ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {enableImprovement && (
                    <div className="flex items-center gap-2 text-xs text-purple-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>启用后将生成改进版本</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 小红书抓取设置 */}
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🌐</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 text-sm">数据抓取</h4>
                        <p className="text-green-600 text-xs">小红书热门数据</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onToggleScraping(true)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          enableScraping
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        启用
                      </button>
                      <button
                        onClick={() => onToggleScraping(false)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          !enableScraping
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        禁用
                      </button>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100/50 rounded-lg">
                    <p className="text-xs text-green-700">
                      {enableScraping
                        ? '✅ 正在获取真实热门数据，生成内容更精准'
                        : '❌ 仅使用AI知识创作，响应速度更快'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 小红书Cookie设置 */}
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🍪</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800 text-sm">小红书 Cookie</h4>
                      <p className="text-orange-600 text-xs">数据抓取认证</p>
                    </div>
                  </div>
                  <Input
                    value={xhsCookie}
                    onChange={(e) => onChangeCookie(e.target.value)}
                    placeholder="请输入小红书Cookie..."
                    className="border-orange-200 focus:border-orange-400 text-sm h-10 font-mono text-xs"
                    type="password"
                  />
                  <p className="text-xs text-orange-500 mt-2">
                    从浏览器开发者工具中获取，用于小红书数据抓取认证
                  </p>
                  <div className="mt-2 p-2 bg-orange-100/50 rounded-lg">
                    <p className="text-xs text-orange-700">
                      {xhsCookie ? '✅ Cookie已配置' : '⚠️ 未配置Cookie，数据抓取将失败'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI模型设置 */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm">AI 模型</h4>
                      <p className="text-blue-600 text-xs">选择生成模型</p>
                    </div>
                  </div>
                  <Input
                    value={aiModel}
                    onChange={(e) => onChangeModel(e.target.value)}
                    placeholder="例如: gemini-2.5-pro,gpt-4o"
                    className="border-blue-200 focus:border-blue-400 text-sm h-10"
                  />
                  <p className="text-xs text-blue-500 mt-2">
                    支持多个模型，用逗号分隔。系统会按顺序尝试。
                  </p>
                </div>
              </div>

              {/* 关闭按钮 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                >
                  完成设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}