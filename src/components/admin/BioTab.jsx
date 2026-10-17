import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { PrimaryButton } from './ui'
import { BAND_BIO } from '../../data/bandData'

export default function BioTab({ bio, onSave }) {
  const [text, setText] = useState(bio)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(text, 'Band profile & bio updated!')
      }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h4 className="font-bebas text-3xl text-white tracking-wide">
          EDIT BAND PROFILE &amp; STORY
        </h4>
        <p className="text-xs font-tech text-neutral-400">
          Edit the band story shown in the "ABOUT PARANOID NOISE" section.
        </p>
      </div>

      <div>
        <label htmlFor="bio-text" className="block text-xs font-tech font-bold uppercase text-neutral-300 mb-1.5">
          Official Band Profile Text:
        </label>
        <textarea
          id="bio-text"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-red-600 text-white text-xs font-tech leading-relaxed resize-y"
        />
        <div className="flex justify-between text-[11px] font-tech text-neutral-500 mt-1">
          <span>{text.length} characters</span>
          <button
            type="button"
            onClick={() => setText(BAND_BIO)}
            className="text-red-400 hover:text-red-300 underline"
          >
            Reset to the Original Text
          </button>
        </div>
      </div>

      <PrimaryButton icon={Save}>Save Profile Changes</PrimaryButton>
    </form>
  )
}
