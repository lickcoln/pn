import React, { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { AdminField, GhostButton, PrimaryButton, TabHeader } from './ui'
import MediaField from '../MediaField'
import { MERCH_ITEMS } from '../../data/bandData'
import { formatIdr, isSoldOutLabel } from '../../lib/format'

const EMPTY_MERCH = {
  name: '',
  price: 150000,
  category: 'Apparel',
  sizes: 'S, M, L, XL',
  stock: 'In Stock',
  description: '',
  image: '/logo.png'
}

const STOCK_SUGGESTIONS = ['In Stock', 'Only 10 Left', 'Pre-order', 'Sold Out']

const parseSizes = (text) => {
  const sizes = text.split(',').map((size) => size.trim()).filter(Boolean)
  return sizes.length ? sizes : ['One Size']
}

function MerchForm({ initial, title, submitLabel, canUpload, onDiscard, onSubmit, onCancel }) {
  const [item, setItem] = useState({ ...initial, sizes: Array.isArray(initial.sizes) ? initial.sizes.join(', ') : initial.sizes })
  const bind = (key) => ({ value: item[key], onChange: (e) => setItem((prev) => ({ ...prev, [key]: e.target.value })) })
  const fallback = MERCH_ITEMS.find((product) => product.id === initial.id)?.image || ''

  const handleSubmit = (e) => {
    e.preventDefault()
    const price = Math.max(0, Math.round(Number(item.price) || 0))
    onSubmit({ ...item, price, priceFormatted: formatIdr(price), sizes: parseSizes(item.sizes) })
  }

  // A photo uploaded for a form that is then abandoned would stay in storage for nothing
  const handleCancel = () => {
    if (item.image !== initial.image) onDiscard(item.image)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-neutral-900 border border-red-700/80 space-y-4">
      <h5 className="font-bebas text-2xl text-white tracking-wide">{title}</h5>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminField label="Product Name *" type="text" required placeholder="e.g. PN Grunge Skull T-Shirt" {...bind('name')} />
        <AdminField
          label="Price (IDR, numbers only) *"
          type="number"
          required
          min="0"
          step="1"
          inputMode="numeric"
          hint={`Shown on the website as ${formatIdr(Number(item.price) || 0)}`}
          {...bind('price')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminField label="Category" type="text" placeholder="Apparel / Accessories / Audio" {...bind('category')} />
        <AdminField
          label="Size Options (comma separated)"
          type="text"
          placeholder="S, M, L, XL, XXL"
          hint="One option only (like One Size) hides the size chooser."
          {...bind('sizes')}
        />
        <AdminField
          label="Stock Status"
          type="text"
          list="merch-stock"
          placeholder="In Stock / Only 10 Left"
          hint='Writing "Sold Out" disables buying.'
          {...bind('stock')}
        />
      </div>

      <datalist id="merch-stock">
        {STOCK_SUGGESTIONS.map((value) => <option key={value} value={value} />)}
      </datalist>

      <AdminField
        label="Product Description"
        as="textarea"
        rows={2}
        className="resize-none"
        placeholder="Fabric, printing, and other details..."
        {...bind('description')}
      />

      <MediaField
        label="Product photo"
        hint="Shown on the product card and in the cart, and visitors can click it to zoom in on the design, so upload a large, sharp photo. It is saved with the product."
        folder="images/merch"
        value={item.image}
        fallback={fallback}
        maxEdge={2400}
        compact
        canUpload={canUpload}
        onChange={(url) => setItem((prev) => ({ ...prev, image: url }))}
        onDiscard={onDiscard}
      />

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton icon={Plus}>{submitLabel}</PrimaryButton>
        {onCancel && <GhostButton onClick={handleCancel}>Cancel</GhostButton>}
      </div>
    </form>
  )
}

function MerchRow({ item, onEdit, onToggleSoldOut, onDelete }) {
  const soldOut = isSoldOutLabel(item.stock)
  return (
    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <img src={item.image} alt={item.name} className="w-12 h-12 shrink-0 object-contain bg-black rounded p-1 border border-neutral-800" />
        <div className="min-w-0">
          <h5 className="font-bebas text-2xl text-white tracking-wide leading-none">{item.name}</h5>
          <span className="text-xs font-tech text-red-400 font-bold">{formatIdr(item.price)}</span>
          <span className={`text-[11px] font-tech ml-2 ${soldOut ? 'text-amber-400' : 'text-neutral-400'}`}>({item.stock || 'no stock label'})</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleSoldOut}
          className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-tech font-bold uppercase transition-colors"
        >
          {soldOut ? 'Back in stock' : 'Mark sold out'}
        </button>
        <button
          onClick={onEdit}
          aria-label={`Edit ${item.name}`}
          className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          title="Edit product"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${item.name}`}
          className="p-2 rounded-lg bg-neutral-800 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors"
          title="Delete merchandise"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function MerchTab({ merch, onSave, canUpload, onDiscard }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const handleAdd = (item) => {
    onSave([{ ...item, id: `merch-${Date.now()}` }, ...merch], 'New merchandise product added!')
    setShowAdd(false)
  }

  const handleEdit = (item) => {
    const previous = merch.find((product) => product.id === item.id)
    onSave(merch.map((product) => (product.id === item.id ? item : product)), 'Product updated!')
    if (previous && previous.image !== item.image) onDiscard(previous.image)
    setEditingId(null)
  }

  const handleToggleSoldOut = (item) => {
    const stock = isSoldOutLabel(item.stock) ? 'In Stock' : 'Sold Out'
    onSave(merch.map((product) => (product.id === item.id ? { ...product, stock } : product)), stock === 'Sold Out' ? 'Marked as sold out.' : 'Back in stock.')
  }

  const handleDelete = (item) => {
    if (window.confirm('Are you sure you want to delete this merchandise?')) {
      onSave(merch.filter((product) => product.id !== item.id), 'Merchandise deleted!')
      onDiscard(item.image)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <TabHeader
        title="OFFICIAL MERCHANDISE MANAGEMENT"
        text="Manage the product catalog, prices, stock, and descriptions of the Paranoid Noise merchandise."
      >
        <button
          onClick={() => { setEditingId(null); setShowAdd(!showAdd) }}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{showAdd ? 'Cancel' : 'Add Merchandise'}</span>
        </button>
      </TabHeader>

      {showAdd && (
        <MerchForm
          initial={EMPTY_MERCH}
          title="ADD A NEW MERCHANDISE PRODUCT"
          submitLabel="Save Merchandise Product"
          canUpload={canUpload}
          onDiscard={onDiscard}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-3">
        {merch.length === 0 && <p className="text-xs font-tech text-neutral-500">The shop is empty. Add a product above.</p>}
        {merch.map((item) =>
          editingId === item.id ? (
            <MerchForm
              key={item.id}
              initial={item}
              title={`EDIT: ${item.name}`}
              submitLabel="Save Changes"
              canUpload={canUpload}
              onDiscard={onDiscard}
              onSubmit={(updated) => handleEdit({ ...updated, id: item.id })}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <MerchRow
              key={item.id}
              item={item}
              onEdit={() => { setShowAdd(false); setEditingId(item.id) }}
              onToggleSoldOut={() => handleToggleSoldOut(item)}
              onDelete={() => handleDelete(item)}
            />
          )
        )}
      </div>
    </div>
  )
}
