import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useModal } from '../lib/useModal'

// zoom levels of the + and - buttons, as a multiple of the "fits the screen" size; a click on the
// picture jumps to CLICK_ZOOM and back
const ZOOM_STEPS = [1, 1.75, 2.5, 3.5]
const CLICK_ZOOM = 2.5
// a pointer that moves less than this between press and release is a click, not a drag
const DRAG_SLOP = 5
// breathing room around the picture when it fits the screen
const MARGIN = 16

/**
 * A full-screen look at one picture with zoom: the buttons (or + and -) change the zoom, a click or tap
 * on the picture zooms in where it was pressed and back out, a mouse drags the zoomed picture around and a
 * finger scrolls it. Escape, the close button or a click beside the picture close it.
 */
export default function ImageZoom({ src, alt, title, caption, onClose }) {
  const [zoom, setZoom] = useState(1)
  const [natural, setNatural] = useState(null) // the picture's own size, known once it has loaded
  const [area, setArea] = useState({ width: 0, height: 0 }) // the room the picture has on screen
  const roomRef = useRef(null)
  const viewRef = useRef(null)
  const imageRef = useRef(null)
  const closeRef = useRef(null)
  const keepRef = useRef(null) // the spot of the picture to hold still under the pointer while the zoom changes
  const dragRef = useRef(null)
  const movedRef = useRef(false)

  useModal(true, onClose)

  // focus goes to the close button and comes back to where it was when the picture closes
  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [])

  // the room for the picture follows the window (a phone turned sideways, a resized browser); it is measured on the
  // box around the scrolling view, because the scrollbars of a zoomed picture would shrink the view itself
  useLayoutEffect(() => {
    const room = roomRef.current
    if (!room) return undefined
    const measure = () => setArea({ width: room.clientWidth, height: room.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(room)
    return () => observer.disconnect()
  }, [])

  // a picture that is already in the cache can be done loading before the load listener is attached
  useEffect(() => {
    const image = imageRef.current
    if (image?.complete && image.naturalWidth) setNatural({ width: image.naturalWidth, height: image.naturalHeight })
  }, [src])

  const fit = natural && area.width
    ? Math.min((area.width - MARGIN * 2) / natural.width, (area.height - MARGIN * 2) / natural.height)
    : 0
  const shown = natural && fit > 0 ? { width: natural.width * fit * zoom, height: natural.height * fit * zoom } : null

  // change the zoom and remember which spot of the picture sits under (x, y) in the window, so that spot stays there
  const zoomTo = useCallback((next, at) => {
    if (!imageRef.current || !viewRef.current) return
    const box = imageRef.current.getBoundingClientRect()
    const room = viewRef.current.getBoundingClientRect()
    const x = at ? at.x : room.left + room.width / 2
    const y = at ? at.y : room.top + room.height / 2
    keepRef.current = {
      x,
      y,
      fx: Math.min(1, Math.max(0, (x - box.left) / box.width)),
      fy: Math.min(1, Math.max(0, (y - box.top) / box.height))
    }
    setZoom(next)
  }, [])

  useLayoutEffect(() => {
    const keep = keepRef.current
    const view = viewRef.current
    const image = imageRef.current
    keepRef.current = null
    if (!keep || !view || !image) return
    const box = image.getBoundingClientRect()
    view.scrollLeft += box.left + keep.fx * box.width - keep.x
    view.scrollTop += box.top + keep.fy * box.height - keep.y
  }, [zoom])

  const step = useCallback((direction) => {
    const index = ZOOM_STEPS.indexOf(zoom)
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction))]
    if (next !== zoom) zoomTo(next)
  }, [zoom, zoomTo])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '+' || event.key === '=') step(1)
      else if (event.key === '-' || event.key === '_') step(-1)
      else if (event.key === '0') zoomTo(1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [step, zoomTo])

  // a mouse drags the zoomed picture; fingers scroll it by themselves
  const onPointerDown = (event) => {
    movedRef.current = false
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    dragRef.current = { x: event.clientX, y: event.clientY, left: viewRef.current.scrollLeft, top: viewRef.current.scrollTop }
  }
  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!movedRef.current && Math.abs(dx) + Math.abs(dy) > DRAG_SLOP) {
      movedRef.current = true
      viewRef.current.setPointerCapture(event.pointerId)
    }
    if (movedRef.current) {
      viewRef.current.scrollLeft = drag.left - dx
      viewRef.current.scrollTop = drag.top - dy
    }
  }
  const onPointerEnd = () => {
    dragRef.current = null
  }

  const onPictureClick = (event) => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    zoomTo(zoom === 1 ? CLICK_ZOOM : 1, { x: event.clientX, y: event.clientY })
  }

  const onViewClick = (event) => {
    if (event.target !== event.currentTarget) return
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    onClose()
  }

  const zoomed = zoom > 1
  const controlClass = 'w-11 h-11 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-red-600 disabled:opacity-30 disabled:hover:text-neutral-300 disabled:hover:border-neutral-800 flex items-center justify-center transition-colors'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, enlarged picture`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-neutral-900 shrink-0">
        <div className="min-w-0">
          <h3 className="font-bebas text-xl sm:text-2xl text-white tracking-wide truncate">{title}</h3>
          {caption && <div className="font-tech text-xs sm:text-sm font-bold text-red-500">{caption}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => step(-1)} disabled={zoom === ZOOM_STEPS[0]} aria-label="Zoom out" className={controlClass}>
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="hidden sm:block w-12 text-center font-mono text-xs font-bold text-neutral-400" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => step(1)} disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]} aria-label="Zoom in" className={controlClass}>
            <ZoomIn className="w-5 h-5" />
          </button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={`${controlClass} ml-1`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* The picture: it fits the screen at 100% and scrolls (finger) or drags (mouse) once it is zoomed */}
      <div ref={roomRef} className="relative grow min-h-0">
        <div
          ref={viewRef}
          data-testid="zoom-view"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClick={onViewClick}
          className="absolute inset-0 overflow-auto overscroll-contain flex touch-pan-x touch-pan-y"
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onClick={onPictureClick}
            style={shown ? { width: shown.width, height: shown.height } : undefined}
            // max-w-none: the base stylesheet gives every picture max-width 100%, which would stop a zoomed picture at the screen's width
            className={`m-auto shrink-0 select-none ${shown ? 'max-w-none max-h-none' : 'max-w-full max-h-full object-contain'} ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="px-4 py-2.5 shrink-0 text-center font-tech text-[11px] text-neutral-500 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {zoomed ? 'Drag or swipe to look around. Click or tap the picture to zoom out.' : 'Click or tap the picture to zoom in on the details.'}
      </p>
    </motion.div>
  )
}
