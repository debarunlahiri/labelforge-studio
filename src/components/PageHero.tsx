import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

type PageHeroProps = {
  eyebrow?: string
  title: string
  description: string
  icon: IconDefinition
  actions?: React.ReactNode
  accent?: 'blue' | 'violet' | 'emerald' | 'amber' | 'cyan'
}

const accents = {
  blue: 'bg-blue-500/20 text-blue-200',
  violet: 'bg-violet-500/20 text-violet-200',
  emerald: 'bg-emerald-500/20 text-emerald-200',
  amber: 'bg-amber-500/20 text-amber-200',
  cyan: 'bg-cyan-500/20 text-cyan-200',
}

export default function PageHero({
  eyebrow,
  title,
  description,
  icon,
  actions,
  accent = 'blue',
}: PageHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-xl shadow-slate-200/70">
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute right-48 top-12 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accents[accent]}`}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div>
            {eyebrow && <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-300">{description}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
