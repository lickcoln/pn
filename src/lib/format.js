/** 185000 -> 'IDR 185,000' (the same everywhere: shop cards, cart and WhatsApp orders). */
export function formatIdr(amount) {
  const value = Number.isFinite(amount) ? amount : 0
  return `IDR ${Math.round(value).toLocaleString('en-US')}`
}

/** True for stock labels such as "Sold Out" or "Out of stock". */
export const isSoldOutLabel = (label) => /sold\s*out|out\s*of\s*stock/i.test(String(label || ''))
