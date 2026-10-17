import React, { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { AdminField, Banner, PrimaryButton, TabHeader } from './ui'
import MediaField from '../MediaField'
import { SINGLES_DISCOGRAPHY } from '../../data/bandData'
import { externalUrl } from '../../lib/contactInfo'

const RIFF_STYLES = [
  ['', 'Classic grunge'],
  ['fast_punk', 'Fast punk'],
  ['heavy_grunge', 'Heavy grunge'],
  ['quiet_loud', 'Quiet / loud'],
  ['melodic_grunge', 'Melodic grunge']
]

const newSingle = () => ({
  id: `single-${Date.now()}`,
  title: '',
  releaseDate: '',
  year: '',
  coverArt: '/logo.png',
  description: '',
  spotifyUrl: '',
  youtubeUrl: '',
  soundcloudUrl: '',
  riffType: '',
  audioUrl: '',
  audioName: ''
})

// The year badge and the "(2021 - 2022)" label follow the release date
const withYear = (single) => ({ ...single, year: (single.releaseDate.match(/\b(19|20)\d{2}\b/) || [single.year || ''])[0] })

const linkHint = (value) => {
  const typed = value.trim()
  if (!typed) return 'Leave empty to hide this button.'
  const link = externalUrl(typed)
  if (!link) return 'This link is not allowed (only web addresses work), so the button will be hidden.'
  return link !== typed ? `The button will open ${link}` : undefined
}

export default function SinglesTab({ singles, onSave, canUpload, onDiscard }) {
  const [list, setList] = useState(singles)
  const [error, setError] = useState('')

  const update = (index, patch) => setList((prev) => prev.map((single, i) => (i === index ? { ...single, ...patch } : single)))
  const bind = (index, key) => ({ value: list[index][key] ?? '', onChange: (e) => update(index, { [key]: e.target.value }) })

  // Everything that publishes goes through here, so a single without a title can never go live
  const publish = (next, message) => {
    setList(next)
    if (next.some((single) => !single.title.trim())) {
      setError('Give every single a title before saving.')
      return false
    }
    setError('')
    onSave(next.map(withYear), message)
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    publish(list, 'Discography & songs updated!')
  }

  const handleMedia = (index, patch) => publish(list.map((single, i) => (i === index ? { ...single, ...patch } : single)))

  const handleAdd = () => {
    setList((prev) => [...prev, newSingle()])
    setError('')
  }

  const handleDelete = (index) => {
    const single = list[index]
    if (!window.confirm(`Delete "${single.title || 'this single'}"? Its cover and song file are removed too.`)) return
    if (publish(list.filter((_, i) => i !== index), 'Single deleted!')) {
      onDiscard(single.coverArt)
      onDiscard(single.audioUrl)
    }
  }

  const handleMove = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    publish(next, 'Order updated. The first single is the one the home page button plays.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <TabHeader
        title="EDIT THE OFFICIAL DISCOGRAPHY"
        text="Edit titles, release dates, descriptions, streaming links (Spotify, YouTube, SoundCloud), cover art, and the MP3 of each single. Add or remove singles, and use the arrows to change the order."
      >
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Single
        </button>
      </TabHeader>

      {error && <Banner tone="error">{error}</Banner>}

      {list.length === 0 && <p className="text-xs font-tech text-neutral-500">There are no singles yet. Add one above.</p>}

      <div className="space-y-4">
        {list.map((single, idx) => (
          <div key={single.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h5 className="font-bebas text-2xl text-white tracking-wide">
                  #{idx + 1}. {single.title || 'New single'}
                </h5>
                {idx === 0 && (
                  <span className="text-[10px] font-tech font-bold uppercase tracking-widest text-red-400">
                    Featured: the home page button plays this one
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-xs font-mono text-neutral-400">{single.releaseDate}</span>
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${single.title || 'this single'} up`}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === list.length - 1}
                  aria-label={`Move ${single.title || 'this single'} down`}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  aria-label={`Delete ${single.title || 'this single'}`}
                  className="p-2 rounded-lg bg-neutral-800 text-red-400 hover:bg-red-950 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <MediaField
                label="Cover art"
                hint="Uploading saves this form."
                folder={`images/covers/${single.id}`}
                value={single.coverArt}
                fallback={SINGLES_DISCOGRAPHY.find((item) => item.id === single.id)?.coverArt || ''}
                maxEdge={1200}
                compact
                canUpload={canUpload}
                onChange={(url) => handleMedia(idx, { coverArt: url })}
                onDiscard={onDiscard}
              />
              <MediaField
                label="Song (MP3)"
                hint="Visitors play this file on the website, up to 25 MB."
                kind="audio"
                folder={`songs/${single.id}`}
                value={single.audioUrl || ''}
                fileName={single.audioName}
                canUpload={canUpload}
                onChange={(url, meta) => handleMedia(idx, { audioUrl: url, audioName: meta?.name || '' })}
                onDiscard={onDiscard}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminField label="Song Title *" type="text" required {...bind(idx, 'title')} />
              <AdminField label="Release Date" type="text" placeholder="January 2024" {...bind(idx, 'releaseDate')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AdminField label="Spotify Link" type="text" hint={linkHint(single.spotifyUrl || '')} {...bind(idx, 'spotifyUrl')} />
              <AdminField label="YouTube Link" type="text" hint={linkHint(single.youtubeUrl || '')} {...bind(idx, 'youtubeUrl')} />
              <AdminField label="SoundCloud Link" type="text" hint={linkHint(single.soundcloudUrl || '')} {...bind(idx, 'soundcloudUrl')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <AdminField label="Single Description" type="text" {...bind(idx, 'description')} />
              </div>
              <AdminField
                label="Riff preview style"
                as="select"
                hint="The guitar riff played until an MP3 is uploaded."
                value={RIFF_STYLES.some(([value]) => value === single.riffType) ? single.riffType : ''}
                onChange={(e) => update(idx, { riffType: e.target.value })}
              >
                {RIFF_STYLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </AdminField>
            </div>
          </div>
        ))}
      </div>

      <PrimaryButton icon={Save}>Save Discography</PrimaryButton>
    </form>
  )
}
