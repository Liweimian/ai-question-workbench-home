import { Clock3, RefreshCw } from 'lucide-react'
import type { RecentBrowseEntry } from '../utils/recentBrowseHistory'

interface RecentBrowsePanelProps {
  entries: RecentBrowseEntry[]
  onOpenEntry: (entry: RecentBrowseEntry) => void
}

export function RecentBrowsePanel({ entries, onOpenEntry }: RecentBrowsePanelProps) {
  return (
    <section className="recent-browse-panel" aria-label="最近浏览">
      <header className="recent-browse-panel-header">
        <div>
          <RefreshCw size={18} aria-hidden="true" />
          <div>
            <h2>最近浏览</h2>
            <p>继续上次看过的练习册、试卷、同步练习等资源</p>
          </div>
        </div>
        <span>{entries.length} 条记录</span>
      </header>

      {entries.length ? (
        <div className="recent-browse-table-wrap">
          <table className="recent-browse-table">
            <thead>
              <tr>
                <th scope="col">类型</th>
                <th scope="col">名称</th>
                <th scope="col">时间</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td><span className="recent-browse-type">{entry.typeLabel}</span></td>
                  <td>
                    <button
                      type="button"
                      className="recent-browse-link"
                      onClick={() => onOpenEntry(entry)}
                      data-track="/click/aiQuestionHome/openRecentBrowseItem | 打开最近浏览资源 | resourceId#STRING"
                    >
                      {entry.title}
                    </button>
                  </td>
                  <td>
                    <span className="recent-browse-time">
                      <Clock3 size={14} aria-hidden="true" />
                      {entry.viewedAt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="recent-browse-empty" role="status">
          <strong>还没有浏览记录</strong>
          <p>近 3 天内从飞象题库或校本题库打开过的练习册、试卷会出现在这里。</p>
        </div>
      )}
    </section>
  )
}
