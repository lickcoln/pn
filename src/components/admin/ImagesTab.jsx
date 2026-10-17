import React from 'react'
import { CloudOff } from 'lucide-react'
import MediaField from '../MediaField'
import { IMAGE_SLOTS } from '../../data/bandData'

const GROUPS = ['Logo', 'Backgrounds', 'Photos', 'Downloads']

export default function ImagesTab({ images, canUpload, updateImages, onDiscard, goToTab }) {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h4 className="font-bebas text-3xl text-white tracking-wide">
          IMAGES &amp; BACKGROUNDS
        </h4>
        <p className="text-xs font-tech text-neutral-400">
          Replace any photo on the website, including the logo and the background images. Pick a photo
          from your device and it goes live for every visitor right away. Large photos are shrunk
          automatically before they are uploaded.
        </p>
      </div>

      {!canUpload && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs font-tech text-amber-200 flex items-start gap-2">
          <CloudOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Uploading needs the shared server mode and the Supabase admin sign-in (see supabase-admin.sql and
            supabase-media.sql). Until then you can still point an image to a web link with "Use a link".
          </span>
        </div>
      )}

      {GROUPS.map((group) => (
        <div key={group} className="space-y-3">
          <h5 className="font-bebas text-2xl text-white tracking-wider border-b border-neutral-800 pb-1">
            {group.toUpperCase()}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IMAGE_SLOTS.filter((slot) => slot.group === group).map((slot) => (
              <MediaField
                key={slot.key}
                label={slot.label}
                hint={slot.where}
                folder={`images/${slot.key}`}
                value={images[slot.key]}
                fallback={slot.fallback}
                maxEdge={slot.maxEdge}
                canUpload={canUpload}
                onChange={(url) => updateImages({ [slot.key]: url })}
                onDiscard={onDiscard}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-tech text-neutral-400 space-y-2">
        <p>
          <strong className="text-neutral-200">More photos live in their own tabs:</strong> each band member's
          photo, the cover art and MP3 of every single, and the product photos of the merchandise.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['members', 'Member photos'],
            ['singles', 'Cover art & songs'],
            ['merch', 'Merchandise photos']
          ].map(([tab, text]) => (
            <button
              key={tab}
              type="button"
              onClick={() => goToTab(tab)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
