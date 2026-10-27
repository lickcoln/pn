import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { AdminField, PrimaryButton, TabHeader } from './ui'
import MediaField from '../MediaField'
import { BAND_MEMBERS } from '../../data/bandData'
import { MEMBER_SOUND_MAX_SECONDS } from '../../lib/media'

export default function MembersTab({ members, onSave, canUpload, onDiscard }) {
  const [list, setList] = useState(members)

  const change = (index, key, value) => setList((prev) => prev.map((member, i) => (i === index ? { ...member, [key]: value } : member)))
  const bind = (index, key) => ({ value: list[index][key] ?? '', onChange: (e) => change(index, key, e.target.value) })

  // An uploaded photo or sound is on the server already, so it saves this form right away
  const handlePhoto = (id, url) => {
    const next = list.map((member) => (member.id === id ? { ...member, image: url } : member))
    setList(next)
    onSave(next)
  }
  const handleSound = (id, url, name) => {
    const next = list.map((member) => (member.id === id ? { ...member, soundUrl: url, soundName: name } : member))
    setList(next)
    onSave(next, url ? 'Signature sound updated!' : 'Signature sound removed!')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(list, 'Band member details updated!')
      }}
      className="space-y-6 max-w-4xl"
    >
      <TabHeader
        title="EDIT BAND MEMBER INFORMATION"
        text="Edit each member's name, role, gear, description, photo and signature sound."
      />

      <div className="space-y-6">
        {list.map((member, idx) => (
          <div key={member.id || idx} className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
              <img src={member.image} alt={member.name} className="w-12 h-12 rounded-lg object-cover border border-neutral-700" />
              <div>
                <h5 className="font-bebas text-2xl text-white tracking-wider leading-none">
                  {member.name} &bull; <span className="text-red-500">{member.role}</span>
                </h5>
                <span className="text-[11px] font-tech text-neutral-400">ID: {member.id}</span>
              </div>
            </div>

            <MediaField
              label="Member photo"
              hint="Shown on the member card. Uploading saves this form."
              folder={`images/members/${member.id}`}
              value={member.image}
              fallback={BAND_MEMBERS.find((item) => item.id === member.id)?.image || ''}
              maxEdge={1200}
              compact
              canUpload={canUpload}
              onChange={(url) => handlePhoto(member.id, url)}
              onDiscard={onDiscard}
            />

            <MediaField
              label={`Signature sound (up to ${MEMBER_SOUND_MAX_SECONDS} seconds)`}
              hint={`An MP3 of this member's instrument, at most ${MEMBER_SOUND_MAX_SECONDS} seconds long. Visitors hear it when they press the speaker button on this member's card. Uploading saves this form.`}
              kind="audio"
              maxSeconds={MEMBER_SOUND_MAX_SECONDS}
              emptyText="No sound yet. The site plays a short synthesized guitar sound instead."
              folder={`audio/members/${member.id}`}
              value={member.soundUrl || ''}
              fileName={member.soundName}
              canUpload={canUpload}
              onChange={(url, meta) => handleSound(member.id, url, meta?.name || '')}
              onDiscard={onDiscard}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminField label="Member Name" type="text" {...bind(idx, 'name')} />
              <AdminField label="Role & Instrument" type="text" {...bind(idx, 'role')} />
            </div>

            <AdminField label="Gear & Weaponry (instruments used)" type="text" {...bind(idx, 'gear')} />

            <AdminField
              label="Musical Character Description"
              as="textarea"
              rows={2}
              className="resize-none"
              {...bind(idx, 'description')}
            />

            <AdminField label="Quote" type="text" {...bind(idx, 'quote')} />
          </div>
        ))}
      </div>

      <PrimaryButton icon={Save}>Save Member Details</PrimaryButton>
    </form>
  )
}
