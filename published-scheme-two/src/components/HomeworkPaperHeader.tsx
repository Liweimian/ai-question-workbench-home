import type { ReactNode } from 'react'

interface HomeworkPaperHeaderProps {
  titleEditor: ReactNode
  saveState?: ReactNode
}

export function HomeworkPaperHeader({ titleEditor, saveState }: HomeworkPaperHeaderProps) {
  return (
    <div className="homework-paper-header">
      <div className="homework-paper-identity-row" aria-label="学生信息填写区">
        <span className="homework-paper-field is-student-number"><strong>学号</strong><i aria-hidden="true" /></span>
        <span className="homework-paper-field is-student-name"><strong>姓名</strong><i aria-hidden="true" /></span>
        <span className="homework-paper-field is-grade-class"><i aria-hidden="true" /><strong>年级</strong><i aria-hidden="true" /><strong>班</strong></span>
      </div>
      <div className="homework-paper-title-row">
        {titleEditor}
        {saveState}
      </div>
    </div>
  )
}
