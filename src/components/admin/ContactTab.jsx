import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { AdminField, Banner, PrimaryButton, TabHeader } from './ui'
import { externalUrl, formatWhatsApp, isValidEmail, isValidWhatsApp, normalizeWhatsApp } from '../../lib/contactInfo'

const CHANNELS = [
  ['instagram', 'Instagram', 'https://instagram.com/yourband', '@yourband'],
  ['spotify', 'Spotify', 'https://open.spotify.com/artist/...', 'Your Band'],
  ['youtube', 'YouTube', 'https://youtube.com/@yourband', '@yourband'],
  ['soundcloud', 'SoundCloud', 'https://soundcloud.com/yourband', 'yourband']
]

// What a link will really open, or why it will not
function linkHint(value) {
  const typed = (value || '').trim()
  if (!typed) return 'Leave empty to hide this link everywhere on the website.'
  const link = externalUrl(typed)
  if (!link) return 'This is not a web address, so the link will be hidden.'
  return link !== typed ? `It will open ${link}` : undefined
}

export default function ContactTab({ contact, onSave }) {
  const [form, setForm] = useState(contact)
  const bind = (key) => ({ value: form[key] ?? '', onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })) })

  const whatsappOk = isValidWhatsApp(form.whatsappRaw)
  const emailOk = isValidEmail(form.email)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!whatsappOk || !emailOk) return
    // One stored number: the formatted text on the site and the wa.me link both come from it
    onSave({ ...form, whatsappRaw: normalizeWhatsApp(form.whatsappRaw), email: form.email.trim() }, 'Contact details & social links updated!')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <TabHeader
        title="EDIT CONTACT DETAILS & SOCIAL LINKS"
        text="Update the booking WhatsApp number, email, and official Paranoid Noise account links."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <AdminField
            label="WhatsApp Number"
            type="text"
            inputMode="tel"
            placeholder="0812 3456 7890 or +62 812-3456-7890"
            hint="Type it any way you like. Every WhatsApp button on the site uses this one number."
            {...bind('whatsappRaw')}
          />
          {whatsappOk ? (
            <Banner tone="ok">
              Visitors will read {formatWhatsApp(form.whatsappRaw)} and the buttons will open wa.me/{normalizeWhatsApp(form.whatsappRaw)}.
            </Banner>
          ) : (
            <Banner tone="error">This does not look like a phone number (8 to 15 digits, with the country code or a leading 0).</Banner>
          )}
        </div>

        <div className="space-y-2">
          <AdminField label="Official Band Email" type="email" {...bind('email')} />
          {!emailOk && <Banner tone="error">This is not a valid email address.</Banner>}
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-[11px] font-tech font-bold uppercase tracking-widest text-neutral-400">Social channels</h5>
        {CHANNELS.map(([key, label, urlPlaceholder, handlePlaceholder]) => (
          <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <AdminField label={`${label} URL`} type="text" placeholder={urlPlaceholder} hint={linkHint(form[key])} {...bind(key)} />
            </div>
            <AdminField
              label={`${label} name shown`}
              type="text"
              placeholder={handlePlaceholder}
              hint="The small text under the channel name."
              {...bind(`${key}Handle`)}
            />
          </div>
        ))}
      </div>

      <PrimaryButton icon={Save} disabled={!whatsappOk || !emailOk}>Save Contact &amp; Social Links</PrimaryButton>
    </form>
  )
}
