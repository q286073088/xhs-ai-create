import { Card, CardContent } from '@/components/ui/card'

export default function AuthorCard() {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg font-semibold text-gray-800">
            ✨ AI文案创作助手
          </div>
          <p className="text-gray-600 max-w-2xl text-center">
            基于深度学习技术，智能分析小红书热门笔记特征，
            为您创作更自然、更有吸引力的爆款文案内容。
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              🤖 AI智能分析
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              📝 爆款文案生成
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              🎯 个性化定制
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              ⚡ 实时生成
            </span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            让每个文字都充满生命力 • 提升内容创作效率 • 助力流量增长
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
