import React, { useId } from 'react'
import { AlertTriangle, CheckCircle, Info, Save } from 'lucide-react'

export const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-red-600 focus:outline-none text-xs font-tech text-white'

// A label tied to its field, with an optional hint underneath
export function AdminField({ label, hint, as: Control = 'input', className = '', children, ...props }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-tech font-semibold text-neutral-300 mb-1">
        {label}
      </label>
      <Control id={id} className={`${INPUT_CLASS} ${className}`} {...props}>
        {children}
      </Control>
      {hint && <p className="mt-1 text-[10px] font-tech text-neutral-500">{hint}</p>}
    </div>
  )
}

export function TabHeader({ title, text, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h4 className="font-bebas text-3xl text-white tracking-wide">{title}</h4>
        {text && <p className="text-xs font-tech text-neutral-400">{text}</p>}
      </div>
      {children}
    </div>
  )
}

export function PrimaryButton({ icon: Icon = Save, children, className = '', ...props }) {
  return (
    <button
      type="submit"
      className={`px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-tech font-bold uppercase tracking-wider transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const TONES = {
  info: { box: 'bg-neutral-900 border-neutral-700 text-neutral-300', Icon: Info, icon: 'text-neutral-400' },
  ok: { box: 'bg-green-950/50 border-green-800 text-green-300', Icon: CheckCircle, icon: 'text-green-400' },
  warn: { box: 'bg-amber-950/60 border-amber-800/80 text-amber-200', Icon: AlertTriangle, icon: 'text-amber-400' },
  error: { box: 'bg-red-950/70 border-red-700/80 text-red-200', Icon: AlertTriangle, icon: 'text-red-400' }
}

export function Banner({ tone = 'info', children, className = '' }) {
  const { box, Icon, icon } = TONES[tone]
  return (
    <div className={`p-3 rounded-xl border text-xs font-tech flex items-start gap-2 ${box} ${className}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${icon}`} />
      <span>{children}</span>
    </div>
  )
}
