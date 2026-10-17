import React, { useId } from 'react'

export const FIELD_CLASS =
  'w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:outline-none text-white text-xs font-tech'

// A label that is tied to its input, so tapping the label focuses the field and screen readers announce it
export default function Field({ label, as: Control = 'input', className = '', ...props }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-tech font-semibold text-neutral-300 mb-1">
        {label}
      </label>
      <Control id={id} className={`${FIELD_CLASS} ${className}`} {...props} />
    </div>
  )
}
