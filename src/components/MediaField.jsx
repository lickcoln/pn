import React, { useRef, useState } from 'react'
import { Upload, RotateCcw, Trash2, LoaderCircle, AlertTriangle, ImageOff, Link2, Music } from 'lucide-react'
import { uploadMedia } from '../lib/supabase'
import { prepareImage, validateMediaFile } from '../lib/media'

/**
 * One image (or one MP3) in the admin portal: a preview, an upload button, and a box to paste a URL.
 * Uploads go to the public site-media bucket, so they need the shared server mode and an admin
 * session (canUpload); without them the URL box still works.
 *
 * onChange(url, { name }) is called with the new value. onDiscard(oldUrl) lets the parent clean up
 * the file that was replaced.
 */
export default function MediaField({
  label,
  hint,
  kind = 'image',
  folder,
  value,
  fallback = '',
  maxEdge = 1600,
  fileName = '',
  canUpload,
  onChange,
  onDiscard,
  compact = false
}) {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [broken, setBroken] = useState(false)

  const isAudio = kind === 'audio'
  const canReset = !isAudio && Boolean(fallback) && value !== fallback

  const change = (next, meta) => {
    setBroken(false)
    onChange(next, meta)
    if (value && value !== next && onDiscard) onDiscard(value)
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be picked again later
    if (!file) return

    setError('')
    const problem = validateMediaFile(file, kind)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    try {
      const prepared = isAudio ? file : await prepareImage(file, { maxEdge })
      const result = await uploadMedia(folder, prepared)
      if (result.success) change(result.url, { name: file.name })
      else setError(result.error)
    } catch (err) {
      setError(err?.message || 'The upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const applyUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    change(url, { name: '' })
    setUrlDraft('')
    setShowUrl(false)
  }

  const previewSize = compact ? 'w-20 h-20' : 'w-full aspect-video'

  return (
    <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
      <div>
        <span className="block text-xs font-tech font-bold text-white">{label}</span>
        {hint && <span className="block text-[11px] font-tech text-neutral-500">{hint}</span>}
      </div>

      <div className={compact ? 'flex items-start gap-3' : 'space-y-3'}>
        {/* Preview */}
        {isAudio ? (
          <div className="grow min-w-0 space-y-1.5">
            {value ? (
              <>
                <div className="flex items-center gap-2 text-[11px] font-tech text-neutral-300">
                  <Music className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{fileName || 'MP3 uploaded'}</span>
                </div>
                <audio controls preload="none" src={value} className="w-full h-9" />
              </>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-tech text-neutral-500">
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span>No MP3 yet. The site plays a guitar riff preview instead.</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`${previewSize} shrink-0 rounded-lg bg-black border border-neutral-800 overflow-hidden flex items-center justify-center`}>
            {value && !broken ? (
              <img
                src={value}
                alt={label}
                onError={() => setBroken(true)}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <ImageOff className="w-6 h-6 text-neutral-700" aria-label="No image" />
            )}
          </div>
        )}

        {/* Actions */}
        <div className={`flex flex-wrap items-center gap-2 ${compact ? 'grow min-w-0' : ''}`}>
          <button
            type="button"
            disabled={!canUpload || busy}
            onClick={() => fileInput.current?.click()}
            title={canUpload ? undefined : 'Uploads need the shared server mode and the admin sign-in'}
            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            {busy ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {busy ? 'Uploading...' : isAudio ? (value ? 'Replace MP3' : 'Upload MP3') : 'Upload photo'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={isAudio ? '.mp3,audio/mpeg' : 'image/jpeg,image/png,image/webp,image/gif'}
            onChange={handleFile}
            className="hidden"
            aria-label={`${label}: choose a file`}
          />

          {canReset && (
            <button
              type="button"
              onClick={() => change(fallback, { name: '' })}
              className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}

          {isAudio && value && (
            <button
              type="button"
              onClick={() => change('', { name: '' })}
              className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-red-950 text-red-300 text-[11px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUrl((open) => !open)}
            className="px-2 py-2 rounded-lg text-neutral-400 hover:text-white text-[11px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" /> Use a link
          </button>
        </div>
      </div>

      {showUrl && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyUrl()
              }
            }}
            placeholder={isAudio ? 'https://example.com/song.mp3' : 'https://example.com/photo.jpg'}
            className="grow min-w-0 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-red-600 focus:outline-none text-xs font-tech text-white"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-tech font-bold uppercase"
          >
            Apply
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="p-2.5 rounded-lg bg-red-950/70 border border-red-800/80 text-[11px] font-tech text-red-200 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
