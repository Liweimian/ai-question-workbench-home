import { MetisButton, MetisMessage } from '@yuanfudao/metis-web-component'
import { BarChart3, BookOpenCheck, ClipboardCheck, Home, Sparkles } from 'lucide-react'

const navItems = [
  { label: '首页', icon: Home },
  { label: 'AI 题库', icon: BookOpenCheck, active: true },
  { label: '作业批改', icon: ClipboardCheck },
  { label: '学情分析', icon: BarChart3 },
]

export function AppSider() {
  return (
    <aside className="fx-sider app-sider" aria-label="主导航">
      <div className="brand-mark" aria-label="飞象星球">
        <Sparkles size={22} strokeWidth={2.3} />
      </div>
      <nav className="sider-nav">
        {navItems.map(({ label, icon: Icon, active }) => (
          <MetisButton
            key={label}
            type="borderless"
            className={`sider-nav-button${active ? ' is-active' : ''}`}
            aria-label={label}
            title={label}
            icon={<Icon size={20} />}
            onClick={() => MetisMessage.info(active ? '当前已在 AI 题库工作台' : `${label}为现有系统导航，本原型不切换页面`)}
            data-track={`/click/aiQuestionHome/nav${label} | 点击${label}导航 | 无`}
          />
        ))}
      </nav>
      <div className="sider-avatar" aria-label="用户李老师">李</div>
    </aside>
  )
}
