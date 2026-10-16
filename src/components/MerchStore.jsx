import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Check, Plus, Minus, Trash2, Send, X, Flame, Sparkles } from 'lucide-react'
import { useBandData } from '../context/BandDataContext'

export default function MerchStore({ cart, onAddToCart, onUpdateCartQuantity, onRemoveFromCart, isCartOpen, onCloseCart }) {
  const { config, currentTheme } = useBandData()
  const merchItems = config.merch
  const [selectedSizes, setSelectedSizes] = useState({})
  const [addedItemNotice, setAddedItemNotice] = useState(null)

  const handleSizeChange = (itemId, size) => {
    setSelectedSizes(prev => ({ ...prev, [itemId]: size }))
  }

  const handleAddToCartClick = (item) => {
    const size = selectedSizes[item.id] || (item.sizes && item.sizes[0]) || 'All Size'
    onAddToCart({ ...item, selectedSize: size })
    setAddedItemNotice(item.id)
    setTimeout(() => setAddedItemNotice(null), 2000)
  }

  const handleDirectWhatsAppOrder = (item) => {
    const size = selectedSizes[item.id] || (item.sizes && item.sizes[0]) || 'All Size'
    const text = `Hello Paranoid Noise! I would like to order official merchandise:\n\n*Item:* ${item.name}\n*Size/Variant:* ${size}\n*Price:* ${item.priceFormatted}\n\nPlease let me know about stock availability and shipping to my address. Thank you!`
    const url = `https://wa.me/${config.contact.whatsappRaw}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const cartTotalFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cartTotal)

  const handleCheckoutViaWhatsApp = () => {
    if (cart.length === 0) return
    let text = `Hello Paranoid Noise! I would like to order the following merchandise:\n\n`
    cart.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.selectedSize}) x ${item.quantity} = IDR ${(item.price * item.quantity).toLocaleString('en-US')}\n`
    })
    text += `\n*TOTAL:* ${cartTotalFormatted}\n\nPlease send me the payment account details and the shipping form. Rock on!`
    const url = `https://wa.me/${config.contact.whatsappRaw}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <section id="merch" className="py-24 bg-[#080808] relative overflow-hidden border-t border-neutral-900">
      
      {/* Background Ambience */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-neutral-800">
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
          <p className="mt-4 md:mt-0 font-tech text-sm text-neutral-400 max-w-md">
            Support the independent musicianship of Paranoid Noise. Official merchandise with premium quality, grunge discharge prints, and authentic details.
          </p>
        </div>

        {/* Merch Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {merchItems.map((item, idx) => {
            const currentSize = selectedSizes[item.id] || (item.sizes && item.sizes[0]) || 'All Size'
            const isJustAdded = addedItemNotice === item.id

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-red-600/80 p-5 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1.5 shadow-xl"
              >
                <div>
                  
                  {/* Product Image */}
                  <div className="relative rounded-xl overflow-hidden aspect-square border border-neutral-800 mb-4 bg-black group-hover:border-red-600/50 transition-colors flex items-center justify-center p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-800 text-[10px] font-tech font-bold uppercase tracking-wider text-green-400">
                      {item.stock}
                    </div>

                    <div className="absolute top-2.5 right-2.5 bg-red-950/80 border border-red-800 text-[10px] font-tech font-bold uppercase tracking-wider text-red-300 px-2 py-1 rounded">
                      {item.category}
                    </div>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide leading-tight group-hover:text-red-500 transition-colors mb-1">
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div className="font-tech text-lg font-bold text-red-500 mb-2">
                    {item.priceFormatted}
                  </div>

                  {/* Description */}
                  <p className="text-xs font-tech text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Size Selector */}
                  <div className="mb-4">
                    <span className="text-[11px] font-tech font-bold text-neutral-400 uppercase block mb-1.5">
                      SELECT SIZE / VARIANT:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => handleSizeChange(item.id, sz)}
                          className={`px-3 py-1 rounded-md text-xs font-tech font-bold border transition-colors ${
                            currentSize === sz
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-neutral-900 space-y-2">
                  <button
                    onClick={() => handleAddToCartClick(item)}
                    className={`w-full py-2.5 rounded-xl font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
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
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-950/50"
                  >
                    <Send className="w-3.5 h-3.5" /> ORDER DIRECTLY VIA WHATSAPP
                  </button>
                </div>

              </motion.div>
            )
          })}
        </div>

      </div>

      {/* Shopping Cart Drawer / Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 p-6 flex flex-col justify-between text-left shadow-2xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-red-500" />
                    <h3 className="font-bebas text-2xl text-white tracking-wide">
                      MERCHANDISE CART ({cart.length})
                    </h3>
                  </div>
                  <button
                    onClick={onCloseCart}
                    className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500 font-tech">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Your cart is empty.</p>
                    <button
                      onClick={onCloseCart}
                      className="mt-4 px-4 py-2 rounded-lg bg-neutral-900 text-red-400 text-xs font-bold uppercase"
                    >
                      Browse the Merch Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.id}-${item.selectedSize}-${idx}`}
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
                            Size: <strong className="text-neutral-200">{item.selectedSize}</strong> &bull; IDR {item.price.toLocaleString('en-US')}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onUpdateCartQuantity(item.id, item.selectedSize, Math.max(1, item.quantity - 1))}
                            className="p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateCartQuantity(item.id, item.selectedSize, item.quantity + 1)}
                            className="p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onRemoveFromCart(item.id, item.selectedSize)}
                            className="p-1 rounded bg-red-950/80 text-red-400 hover:text-red-300 ml-1"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="pt-4 border-t border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between font-tech">
                    <span className="text-xs text-neutral-400 uppercase font-semibold">Subtotal:</span>
                    <span className="text-lg font-bold text-white font-mono">{cartTotalFormatted}</span>
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
          </div>
        )}
      </AnimatePresence>

    </section>
  )
}
