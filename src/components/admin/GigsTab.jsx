import React, { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { AdminField, Banner, GhostButton, PrimaryButton, TabHeader } from './ui'
import { MONTH_ABBREVIATIONS, isPastGig, parseGigDate, splitGigs } from '../../lib/gigs'
import { externalUrl } from '../../lib/contactInfo'

const EMPTY_GIG = {
  title: '',
  date: '',
  time: '19:00 WIB',
  venue: '',
  city: '',
  category: 'Club Gig',
  status: 'Tickets Available',
  price: 'IDR 50,000',
  description: '',
  mapsUrl: ''
}

const CATEGORY_SUGGESTIONS = ['Club Gig', 'Festival', 'Showcase', 'Tour Date', 'Past Gig']
const STATUS_SUGGESTIONS = ['Tickets Available', 'Presale 1', 'Limited Tickets', 'Coming Soon', 'Sold Out', 'Free Entry']

// Tells the admin how the site will read the typed date (it decides the order and when a show becomes "past")
function DateHint({ value }) {
  if (!value.trim()) return null
  const date = parseGigDate(value)
  if (!date) {
    return (
      <Banner tone="warn">
        This date could not be read, so the show is listed exactly as typed, after the dated shows, and it will not move to
        Past shows by itself. Write it like 24 OCTOBER 2026 (or 2026-10-24).
      </Banner>
    )
  }
  const text = `${date.day}${date.endDay !== date.day ? `-${date.endDay}` : ''} ${MONTH_ABBREVIATIONS[date.month]} ${date.year}`
  return (
    <Banner tone="ok">
      Understood as {text}.
      {isPastGig({ category: '', date: value }) ? ' That day has passed, so it is listed under Past shows.' : ' It is listed in date order and moves to Past shows the day after.'}
    </Banner>
  )
}

function GigForm({ initial, title, submitLabel, onSubmit, onCancel }) {
  const [gig, setGig] = useState(initial)
  const bind = (key) => ({ value: gig[key], onChange: (e) => setGig((prev) => ({ ...prev, [key]: e.target.value })) })
  const mapsLink = gig.mapsUrl.trim() ? externalUrl(gig.mapsUrl) : null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(gig)
      }}
      className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4"
    >
      <h5 className="font-bebas text-2xl text-white tracking-wide">{title}</h5>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminField label="Event Name *" type="text" required placeholder="e.g. Bandung Rockfest 2026" {...bind('title')} />
        <div className="space-y-2">
          <AdminField label="Date (e.g. 15 NOVEMBER 2026) *" type="text" required placeholder="DAY MONTH YEAR" {...bind('date')} />
          <DateHint value={gig.date} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminField label="Venue / Location *" type="text" required placeholder="Venue name" {...bind('venue')} />
        <AdminField label="City *" type="text" required placeholder="Jakarta / Bandung" {...bind('city')} />
        <AdminField label="Start Time" type="text" placeholder="19:30 WIB" {...bind('time')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminField
          label="Category"
          type="text"
          list="gig-categories"
          hint='"Past Gig" puts the show under Past shows right away.'
          {...bind('category')}
        />
        <AdminField
          label="Ticket Status"
          type="text"
          list="gig-statuses"
          hint='Type or pick "Sold Out" to close reservations.'
          placeholder="Tickets Available / Presale 1 / Sold Out"
          {...bind('status')}
        />
        <AdminField label="Ticket Price" type="text" placeholder="IDR 50,000 / Free Entry" {...bind('price')} />
      </div>

      <datalist id="gig-categories">
        {CATEGORY_SUGGESTIONS.map((value) => <option key={value} value={value} />)}
      </datalist>
      <datalist id="gig-statuses">
        {STATUS_SUGGESTIONS.map((value) => <option key={value} value={value} />)}
      </datalist>

      <AdminField
        label="Google Maps Link (Optional)"
        type="text"
        placeholder="https://maps.google.com/..."
        hint={
          mapsLink === null
            ? 'Leave empty to hide the map button.'
            : mapsLink === ''
              ? 'This link is not allowed (only web addresses work), so the map button will be hidden.'
              : mapsLink !== gig.mapsUrl.trim()
                ? `The map button will open ${mapsLink}`
                : undefined
        }
        {...bind('mapsUrl')}
      />

      <AdminField label="Short Description" type="text" placeholder="A short note about the gig..." {...bind('description')} />

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton icon={Plus}>{submitLabel}</PrimaryButton>
        {onCancel && <GhostButton onClick={onCancel}>Cancel</GhostButton>}
      </div>
    </form>
  )
}

function GigRow({ gig, past, onEdit, onDelete }) {
  const date = parseGigDate(gig.date)
  return (
    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {gig.status && (
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-[10px] font-tech font-bold text-red-400">
              {gig.status}
            </span>
          )}
          <span className="text-xs font-mono text-neutral-400">
            {gig.date}
            {gig.price ? ` (${gig.price})` : ''}
          </span>
          {past && (
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-tech font-bold text-neutral-400 uppercase">Past show</span>
          )}
          {!date && gig.date && (
            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-[10px] font-tech font-bold text-amber-300 uppercase">
              Date not read
            </span>
          )}
        </div>
        <h5 className="font-bebas text-2xl text-white tracking-wide">{gig.title}</h5>
        <span className="text-xs font-tech text-neutral-400">{[gig.venue, gig.city].filter(Boolean).join(', ')}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          aria-label={`Edit ${gig.title}`}
          className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Edit gig"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${gig.title}`}
          className="p-2 rounded-lg bg-neutral-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
          title="Delete gig"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function GigsTab({ gigs, onSave }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { upcoming, past } = splitGigs(gigs)

  const handleAdd = (gig) => {
    onSave([{ ...gig, id: `gig-${Date.now()}` }, ...gigs], 'New gig added to the schedule!')
    setShowAdd(false)
  }

  const handleEdit = (gig) => {
    onSave(gigs.map((item) => (item.id === gig.id ? gig : item)), 'Gig updated!')
    setEditingId(null)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this gig?')) {
      onSave(gigs.filter((gig) => gig.id !== id), 'Gig deleted!')
    }
  }

  const renderEntry = ({ gig }, isPast) =>
    editingId === gig.id ? (
      <GigForm
        key={gig.id}
        initial={{ ...EMPTY_GIG, ...gig }}
        title={`EDIT: ${gig.title}`}
        submitLabel="Save Changes"
        onSubmit={(updated) => handleEdit({ ...updated, id: gig.id })}
        onCancel={() => setEditingId(null)}
      />
    ) : (
      <GigRow key={gig.id} gig={gig} past={isPast} onEdit={() => { setShowAdd(false); setEditingId(gig.id) }} onDelete={() => handleDelete(gig.id)} />
    )

  return (
    <div className="space-y-6 max-w-4xl">
      <TabHeader
        title="GIGS & TOUR SCHEDULE MANAGEMENT"
        text="Add, edit or delete Paranoid Noise live show dates. The website lists upcoming shows soonest first and moves a show to Past shows by itself the day after it happened."
      >
        <button
          onClick={() => { setEditingId(null); setShowAdd(!showAdd) }}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{showAdd ? 'Cancel' : 'Add Gig'}</span>
        </button>
      </TabHeader>

      {showAdd && (
        <GigForm initial={EMPTY_GIG} title="ADD A NEW GIG" submitLabel="Save & Publish Gig" onSubmit={handleAdd} />
      )}

      <div className="space-y-3">
        <h5 className="text-[11px] font-tech font-bold uppercase tracking-widest text-neutral-400">
          Upcoming shows ({upcoming.length})
        </h5>
        {upcoming.length === 0 && <p className="text-xs font-tech text-neutral-500">No upcoming shows. Add one above.</p>}
        {upcoming.map((entry) => renderEntry(entry, false))}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[11px] font-tech font-bold uppercase tracking-widest text-neutral-400">
            Past shows ({past.length})
          </h5>
          {past.map((entry) => renderEntry(entry, true))}
        </div>
      )}
    </div>
  )
}
