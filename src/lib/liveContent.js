// Keeps an open page in step with what the admin publishes, so visitors never have to refresh.
//
//   1. Live push (needs supabase-realtime.sql): Supabase tells the page the moment the published content
//      changes, and the new content arrives inside that message.
//   2. A safety net that works without any setup: the page asks for just the version of the published
//      content (a few bytes) every 30 seconds while it has no live connection, every 2 minutes while it does,
//      when the visitor comes back to the tab, and when the network returns. Only a different version
//      makes it download the content.
//
// A tab left in the background for 2 minutes gives its live connection back (the free Supabase plan allows
// 200 at once) and takes it again when the visitor returns.

// This module has no imports on purpose: the three server calls are handed in, which keeps the timing logic
// below testable without a browser or a database.

const CONTENT_ROW_ID = 'main'
const POLL_LIVE_MS = 120000
const POLL_FALLBACK_MS = 30000
const IDLE_LEAVE_MS = 120000
const RECHECK_AFTER_MS = 10000

/** The publish time as a number, or null when there is none. */
export const stampOf = (value) => {
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

const parseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * @param api         { fetchVersion, fetchContent, subscribe }: fetchSiteContentVersion, fetchSiteContent and
 *                    subscribeToSiteContent from lib/supabase.js
 * @param getVersion  () => the version (see stampOf) of the content the page shows now, or null
 * @param onRemote    (config | null, updatedAt | null) => void. New content from the server; null means the
 *                    published content was removed (the admin's "Reset") and the page goes back to the defaults
 * @param onStatus    ('connecting' | 'live' | 'polling') => void. 'live' = pushed instantly, 'polling' = checked
 *                    every 30 seconds (live updates are not set up, or the connection is down)
 * @param onEvent     optional (version | null) => void, called for every change the server pushes, even one the page
 *                    already has. The admin portal uses it to see that its own save came back through the live
 *                    connection, which proves that live updates really work
 * @returns a function that stops everything
 */
export function startLiveContent({ api, getVersion, onRemote, onStatus, onEvent }) {
  const { fetchVersion, fetchContent, subscribe } = api
  let stopped = false
  let live = false
  let leave = null // closes the live connection while there is one
  let pollTimer = 0
  let idleTimer = 0
  let lastCheck = 0
  let deliveries = 0 // how often content was handed over, to throw away a slower, older answer
  let checking = false
  let hinted = false
  let refused = false // live updates are not set up on the server: do not keep asking

  const deliver = (config, updatedAt) => {
    deliveries += 1
    onRemote(config, updatedAt)
  }

  const check = async () => {
    if (stopped || checking || document.visibilityState === 'hidden') return
    checking = true
    lastCheck = Date.now()
    const deliveriesAtStart = deliveries
    try {
      const latest = await fetchVersion()
      // if something was handed over while the server was answering, this answer may be the older one
      if (stopped || !latest.ok || deliveries !== deliveriesAtStart) return

      const known = getVersion()
      if (!latest.exists) {
        if (known !== null) deliver(null, null)
        return
      }
      const stamp = stampOf(latest.updatedAt)
      if (stamp !== null && stamp === known) return

      const full = await fetchContent()
      if (stopped || full.status !== 'ready' || deliveries !== deliveriesAtStart) return
      if (full.config) deliver(full.config, full.updatedAt)
      else if (getVersion() !== null) deliver(null, null)
    } finally {
      checking = false
    }
  }

  const handleChange = (payload) => {
    if (stopped) return

    if (payload.eventType === 'DELETE') {
      if (!payload.old?.id || payload.old.id === CONTENT_ROW_ID) deliver(null, null)
      return
    }

    const row = payload.new
    if (row && row.id && row.id !== CONTENT_ROW_ID) return
    if (onEvent) onEvent(stampOf(row?.updated_at))

    // A message that arrives without the whole content (too big for one message, or the config column was not
    // part of the change) is a signal, not the content: ask the server for it
    const config = typeof row?.config === 'string' ? parseJson(row.config) : row?.config
    if (!config || typeof config !== 'object' || Array.isArray(config) || payload.errors) {
      check()
      return
    }
    // the page already shows this version (the admin's own save coming back)
    const stamp = stampOf(row.updated_at)
    if (stamp !== null && stamp === getVersion()) return
    deliver(config, row.updated_at)
  }

  let shown = ''
  const setStatus = (status) => {
    if (stopped || status === shown) return
    shown = status
    onStatus(status)
  }

  // The server says live updates are not set up for this table (supabase-realtime.sql has not been run).
  // Retrying would only repeat the same refusal, so this page stays on the 30-second checks.
  const refusedForGood = (error) =>
    /RealtimeDisabledForConfiguration|unable to subscribe to changes|mismatch between server and client/i.test(error?.message || '')

  const handleStatus = (status, error) => {
    const wasLive = live
    live = status === 'SUBSCRIBED'
    setStatus(live ? 'live' : 'polling')
    // the rhythm changes only when the connection starts or stops working, not on every retry of a broken one
    if (live !== wasLive) schedule()
    if (live) check() // anything published while the connection was down

    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      if (refusedForGood(error)) {
        refused = true
        giveBackConnection()
      }
      if (!hinted) {
        hinted = true
        console.info(
          'Live updates are not active, so this page checks for new content every 30 seconds instead. ' +
          'To make them instant, run supabase-realtime.sql once in the Supabase SQL Editor.',
          error?.message || ''
        )
      }
    }
  }

  const join = () => {
    if (stopped || leave || refused) return
    setStatus('connecting')
    leave = subscribe({ onChange: handleChange, onStatus: handleStatus })
  }

  function giveBackConnection() {
    if (!leave) return
    const close = leave
    leave = null
    live = false
    setStatus('polling')
    schedule()
    close()
  }

  function schedule() {
    clearTimeout(pollTimer)
    if (stopped) return
    pollTimer = setTimeout(async () => {
      await check()
      schedule()
    }, live ? POLL_LIVE_MS : POLL_FALLBACK_MS)
  }

  const onVisibility = () => {
    clearTimeout(idleTimer)
    if (document.visibilityState === 'visible') {
      join()
      if (Date.now() - lastCheck > RECHECK_AFTER_MS) check()
      schedule()
    } else {
      idleTimer = setTimeout(giveBackConnection, IDLE_LEAVE_MS)
    }
  }

  const onOnline = () => {
    join()
    check()
  }

  // a page restored from the back/forward cache is as old as when it was left
  const onPageShow = (event) => {
    if (event.persisted) onOnline()
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('online', onOnline)
  window.addEventListener('pageshow', onPageShow)

  join()
  schedule()
  if (document.visibilityState === 'hidden') idleTimer = setTimeout(giveBackConnection, IDLE_LEAVE_MS)

  return () => {
    stopped = true
    clearTimeout(pollTimer)
    clearTimeout(idleTimer)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('pageshow', onPageShow)
    if (leave) leave()
    leave = null
  }
}
