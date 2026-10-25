import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check, Plus, Minus, Trash2, Send, X, ZoomIn } from 'lucide-react'
import { whatsappLink } from '../lib/contactInfo'
import { formatIdr, isSoldOutLabel } from '../lib/format'
import { useModal } from '../lib/useModal'
import { useBandData } from '../context/BandDataContext'
import ImageZoom from './ImageZoom'

export default function MerchStore({ cart, onAddToCart, onUpdateCartQuantity, onRemoveFromCart, isCartOpen, onCloseCart }) {
  const { config, currentTheme } = useBandData()
  const merchItems = config.merch
  const [selectedSizes, setSelectedSizes] = useState({})
  const [addedItemNotice, setAddedItemNotice] = useState(null)
  const [zoomId, setZoomId] = useState(null)
  const noticeTimer = useRef(null)

  // looked up on every render, so a product the admin edits or removes while its picture is open never lingers
  const zoomItem = merchItems.find((item) => item.id === zoomId) || null

  useModal(isCartOpen, onCloseCart)
  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const sizeFor = (item) => (item.sizes.includes(selectedSizes[item.id]) ? selectedSizes[item.id] : item.sizes[0])

  const handleAddToCartClick = (item) => {
    onAddToCart({ ...item, selectedSize: sizeFor(item) })
    setAddedItemNotice(item.id)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setAddedItemNotice(null), 2000)
  }

  const handleDirectWhatsAppOrder = (item) => {
    const text = `Hello Paranoid Noise! I would like to order official merchandise:\n\n*Item:* ${item.name}\n*Size/Variant:* ${sizeFor(item)}\n*Price:* ${formatIdr(item.price)}\n\nPlease let me know about stock availability and shipping to my address. Thank you!`
    window.open(whatsappLink(config.contact.whatsappRaw, text), '_blank')
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const handleCheckoutViaWhatsApp = () => {
    if (cart.length === 0) return
    let text = `Hello Paranoid Noise! I would like to order the following merchandise:\n\n`
    cart.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.selectedSize}) x ${item.quantity} = ${formatIdr(item.price * item.quantity)}\n`
    })
    text += `\n*TOTAL:* ${formatIdr(cartTotal)}\n\nPlease send me the payment account details and the shipping form. Rock on!`
    window.open(whatsappLink(config.contact.whatsappRaw, text), '_blank')
  }

  return (
    <section id="merch" className="py-16 sm:py-24 bg-[#080808] relative overflow-hidden border-t border-neutral-900">

      {/* Background Ambience */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 pb-6 border-b border-neutral-800">
          <div>
            <div
              className="flex items-center gap-2 font-tech font-bold text-xs uppercase tracking-widest mb-2"
              style={{ color: currentTheme.primaryColor }}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> OFFICIAL BAND MERCHANDISE
            </div>
            <h2 className="font-bebas text-5xl sm:text-7xl tracking-wider text-white">
              PARANOID <span style={{ color: currentTheme.primaryColor }}>NOISE GEAR</span>
            </h2>
          </div>
          {config.texts.merchIntro && (
            <p className="mt-4 md:mt-0 font-tech text-sm text-neutral-400 max-w-md text-pretty">
              {config.texts.merchIntro}
            </p>
          )}
        </div>

        {/* Merch Products Grid */}
        {merchItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center font-tech text-sm text-neutral-400">
            The merch table is empty right now. New gear is coming soon.
          </div>
        ) : (
          // two small cards per row on a phone, so six products are not six screens
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {merchItems.map((item, idx) => {
              const currentSize = sizeFor(item)
              const isJustAdded = addedItemNotice === item.id
              const soldOut = isSoldOutLabel(item.stock)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(idx, 5) * 0.1 }}
                  className="relative rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-red-600/80 p-3 sm:p-5 flex flex-col justify-between transition-all duration-300 group sm:hover:-translate-y-1.5 shadow-xl"
                >
                  <div>

                    {/* Product Image */}
                    <div className="relative rounded-xl overflow-hidden aspect-square border border-neutral-800 mb-3 sm:mb-4 bg-black group-hover:border-red-600/50 transition-colors flex items-center justify-center p-2 sm:p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className={`max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ${soldOut ? 'opacity-50 grayscale' : ''}`}
                      />

                      {/* Stock Status Badge */}
                      {item.stock && (
                        <div
                          className={`absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-neutral-800 text-[9px] sm:text-[10px] font-tech font-bold uppercase tracking-wider ${
                            soldOut ? 'text-neutral-400' : 'text-green-400'
                          }`}
                        >
                          {item.stock}
                        </div>
                      )}

                      {/* The category would collide with the stock badge on a small phone card */}
                      {item.category && (
                        <div className="hidden sm:block absolute top-2.5 right-2.5 bg-red-950/80 border border-red-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-300 px-2 py-1 rounded">
                          {item.category}
                        </div>
                      )}

                      {/* The whole picture opens the zoom view (a clear button over everything, so the badges do not get in the way) */}
                      <button
                        type="button"
                        onClick={() => setZoomId(item.id)}
                        aria-label={`Zoom in on the picture of ${item.name}`}
                        className="absolute inset-0 z-10 cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute z-20 bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 border border-neutral-700 text-neutral-300 group-hover:text-white group-hover:border-red-600 transition-colors flex items-center justify-center"
                      >
                        <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-bebas text-lg sm:text-3xl text-white tracking-wide leading-tight group-hover:text-red-500 transition-colors mb-1 line-clamp-3 sm:line-clamp-none">
                      {item.name}
                    </h3>

                    {/* Price */}
                    <div className="font-tech text-base sm:text-lg font-bold text-red-500 mb-2">
                      {formatIdr(item.price)}
                    </div>

                    {/* Description (the card is too narrow for it on a phone) */}
                    <p className="hidden sm:block text-xs font-tech text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Size Selector (a single variant needs no choosing) */}
                    <div className="mb-3 sm:mb-4">
                      {item.sizes.length > 1 ? (
                        <>
                          <span className="text-[10px] sm:text-[11px] font-tech font-bold text-neutral-400 uppercase block mb-1.5">
                            SELECT SIZE / VARIANT:
                          </span>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label={`Size for ${item.name}`}>
                            {item.sizes.map((sz) => (
                              <button
                                key={sz}
                                onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.id]: sz }))}
                                aria-pressed={currentSize === sz}
                                className={`min-w-9 sm:min-w-10 px-2.5 sm:px-3 py-2 rounded-md text-[11px] sm:text-xs font-tech font-bold border transition-colors ${
                                  currentSize === sz
                                    ? 'bg-red-600 border-red-500 text-white'
                                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <span className="inline-block px-3 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 text-[11px] sm:text-xs font-tech font-bold text-neutral-300">
                          {item.sizes[0]}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-900 space-y-2">
                    {soldOut ? (
                      <div className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 font-tech font-bold text-xs uppercase tracking-wider text-center">
                        SOLD OUT
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAddToCartClick(item)}
                          className={`w-full py-3 rounded-xl font-tech font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                            isJustAdded
                              ? 'bg-green-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-red-600'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4" /> ADDED TO CART
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4 text-red-500" /> ADD TO CART
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDirectWhatsAppOrder(item)}
                          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-colors shadow-md shadow-red-950/50"
                        >
                          <Send className="w-3.5 h-3.5" /> ORDER VIA WHATSAPP
                        </button>
                      </>
                    )}
                  </div>

                </motion.div>
              )
            })}
          </div>
        )}

      </div>

      {/* Zoom view of one product picture */}
      <AnimatePresence>
        {zoomItem && (
          <ImageZoom
            key="zoom"
            src={zoomItem.image}
            alt={zoomItem.name}
            title={zoomItem.name}
            caption={formatIdr(zoomItem.price)}
            onClose={() => setZoomId(null)}
          />
        )}
      </AnimatePresence>

      {/* Shopping Cart Drawer / Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            key="cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/80 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) onCloseCart()
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Merchandise cart"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 p-5 sm:p-6 flex flex-col text-left shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-red-500" />
                  <h3 className="font-bebas text-2xl text-white tracking-wide">
                    MERCHANDISE CART ({cartCount})
                  </h3>
                </div>
                <button
                  onClick={onCloseCart}
                  aria-label="Close cart"
                  className="p-2.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List: this is the part that scrolls, so the total and the checkout button never leave the screen */}
              {cart.length === 0 ? (
                <div className="grow text-center py-16 text-neutral-500 font-tech">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Your cart is empty.</p>
                  <button
                    onClick={onCloseCart}
                    className="mt-4 px-4 py-2.5 rounded-lg bg-neutral-900 text-red-400 text-xs font-bold uppercase"
                  >
                    Browse the Merch Collection
                  </button>
                </div>
              ) : (
                <div className="grow min-h-0 space-y-3 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize}`}
                      className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg bg-black border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>

                      <div className="grow min-w-0">
                        <h4 className="font-tech text-xs font-bold text-white truncate">
                          {item.name}
                        </h4>
                        <span className="text-[11px] font-tech text-neutral-400">
                          Size: <strong className="text-neutral-200">{item.selectedSize}</strong> &bull; {formatIdr(item.price)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onUpdateCartQuantity(item.id, item.selectedSize, Math.max(1, item.quantity - 1))}
                          aria-label={`One less ${item.name}`}
                          className="p-2 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-bold text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateCartQuantity(item.id, item.selectedSize, item.quantity + 1)}
                          aria-label={`One more ${item.name}`}
                          className="p-2 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveFromCart(item.id, item.selectedSize)}
                          aria-label={`Remove ${item.name} from the cart`}
                          className="p-2 rounded bg-red-950/80 text-red-400 hover:text-red-300 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="pt-4 mt-4 border-t border-neutral-800 space-y-4 shrink-0">
                  <div className="flex items-center justify-between font-tech">
                    <span className="text-xs text-neutral-400 uppercase font-semibold">Subtotal:</span>
                    <span className="text-lg font-bold text-white font-mono">{formatIdr(cartTotal)}</span>
                  </div>

                  <button
                    onClick={handleCheckoutViaWhatsApp}
                    className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Send className="w-4 h-4" /> CHECKOUT VIA BAND WHATSAPP
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  )
}
