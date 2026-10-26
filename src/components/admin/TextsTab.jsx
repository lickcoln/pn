import React, { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { AdminField, PrimaryButton, TabHeader } from './ui'
import { SITE_TEXTS } from '../../data/bandData'

// [key in config.texts, label, input or textarea, hint]
const GROUPS = [
  {
    title: 'Browser tab',
    fields: [
      ['pageTitle', 'Browser tab title', 'input', 'The title on the browser tab, in the history and in bookmarks. Leave empty to use the site name. Link previews (WhatsApp, Instagram and the like) cannot follow this: they read the wording that is built into the site.']
    ]
  },
  {
    title: 'Top bar & footer',
    fields: [
      ['siteName', 'Site name', 'input', 'The name in the top bar, the footer and the copyright line. The big headline at the top of the home page is edited in Theme & Look.'],
      ['navTagline', 'Top bar tagline', 'input', 'The small line under the name in the top bar. Leave empty to hide it.'],
      ['footerGenre', 'Footer genre line', 'input', 'The small line under the name in the footer. Leave empty to hide it.'],
      ['footerAbout', 'Footer description', 'textarea', 'The paragraph in the footer. Leave empty to hide it.']
    ]
  },
  {
    title: 'Home page',
    fields: [
      ['tickerText', 'Scrolling tape', 'textarea', 'The words that scroll across the two strips of tape at the bottom of the home page. Separate them with a bullet (•) or put each on its own line. Leave empty to remove the animation.']
    ]
  },
  {
    title: 'Music section heading',
    fields: [
      ['musicBadge', 'Small label above the title', 'input', 'The red pill above the title. Write {years} where the release years should appear: it becomes "(2021 - 2022)" from the dates of your singles, and nothing when none has a date. Leave empty to hide the label.'],
      ['musicTitle', 'Title, white part', 'input', 'The first part of the big title, in white. It can be left empty when the whole title is in the red part.'],
      ['musicTitleAccent', 'Title, red part', 'input', 'The second part of the big title, in red, written right after the white part. Leave both parts empty to hide the title.'],
      ['musicIntro', 'Sentence under the title', 'textarea', 'Write {count} where the number of singles should appear: it becomes "7 singles" (or "1 single") by itself. Leave empty to hide it.']
    ]
  },
  {
    title: 'Section introductions',
    fields: [
      ['aboutIntro', 'About section', 'textarea', 'Under the "About Paranoid Noise" title. Leave empty to hide it.'],
      ['lineupIntro', 'Lineup section', 'textarea', 'Under the "The Punk Rock Trio" title. Leave empty to hide it.'],
      ['gigsIntro', 'Gigs section', 'textarea', 'Under the "Tour & Live Dates" title. Leave empty to hide it.'],
      ['merchIntro', 'Merchandise section', 'textarea', 'Under the "Paranoid Noise Gear" title. Leave empty to hide it.'],
      ['bookingIntro', 'Contact & booking section', 'textarea', 'Under the "Contact Paranoid Noise" title. Leave empty to hide it.']
    ]
  }
]

export default function TextsTab({ texts, onSave }) {
  const [draft, setDraft] = useState(texts)
  const changed = Object.keys(SITE_TEXTS).some((key) => draft[key] !== texts[key])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ ...draft, siteName: draft.siteName.trim() }, 'Site texts updated!')
      }}
      className="space-y-8 max-w-3xl"
    >
      <TabHeader
        title="EDIT SITE TEXTS"
        text="The sentences around the content: the browser tab title, the top bar, the footer, the heading of the Music section and the introduction under each section title. The band bio, the singles, gigs and products have their own tabs."
      />

      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <h5 className="font-bebas text-2xl text-white tracking-wider border-b border-neutral-800 pb-1">
            {group.title.toUpperCase()}
          </h5>
          {group.fields.map(([key, label, kind, hint]) => (
            <div key={key} className="space-y-1">
              <AdminField
                label={label}
                hint={hint}
                as={kind === 'textarea' ? 'textarea' : 'input'}
                rows={kind === 'textarea' ? 3 : undefined}
                required={key === 'siteName'}
                value={draft[key] ?? ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                className={kind === 'textarea' ? 'resize-y leading-relaxed' : ''}
              />
              {draft[key] !== SITE_TEXTS[key] && (
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, [key]: SITE_TEXTS[key] }))}
                  className="flex items-center gap-1.5 text-[11px] font-tech text-red-400 hover:text-red-300 underline"
                >
                  <RotateCcw className="w-3 h-3" /> Use the original text
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      <PrimaryButton icon={Save} disabled={!changed}>Save Site Texts</PrimaryButton>
    </form>
  )
}
