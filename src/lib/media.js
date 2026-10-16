// Picking and preparing files for upload from the admin portal.

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // same limit as the storage bucket (supabase-media.sql)

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const SHRINKABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Phone photos are often 4000 px wide and several MB; they only ever show at screen size.
const SKIP_SHRINK_BELOW_BYTES = 400 * 1024

const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(1)

/** Returns an error message, or '' when the file can be uploaded as kind 'image' or 'audio'. */
export function validateMediaFile(file, kind) {
  if (!file) return 'No file selected.'
  if (file.size > MAX_UPLOAD_BYTES) {
    return `This file is ${mb(file.size)} MB, the limit is ${mb(MAX_UPLOAD_BYTES)} MB.`
  }
  if (kind === 'audio') {
    const isMp3 = file.type === 'audio/mpeg' || file.type === 'audio/mp3' || /\.mp3$/i.test(file.name)
    return isMp3 ? '' : 'Only MP3 files can be used for songs.'
  }
  return IMAGE_TYPES.includes(file.type) ? '' : 'Use a JPG, PNG, WebP or GIF image.'
}

export function safeFileName(name) {
  const cleaned = String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'file'
}

/**
 * Scales an image down so its longest side is at most maxEdge, keeping its format (PNG keeps its
 * transparency). Falls back to the original file whenever the browser cannot do it or it would not help.
 */
export async function prepareImage(file, { maxEdge = 2000, quality = 0.85 } = {}) {
  if (!SHRINKABLE_TYPES.includes(file.type)) return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SKIP_SHRINK_BELOW_BYTES) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type, quality))
    if (!blob || (scale === 1 && blob.size >= file.size)) return file
    return new File([blob], file.name, { type: blob.type || file.type })
  } finally {
    bitmap.close?.()
  }
}
