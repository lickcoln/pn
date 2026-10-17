import React from 'react'
import { AlertTriangle, CheckCircle, Send } from 'lucide-react'

/**
 * What a visitor sees after pressing "send". Only a form that really reached the server is called "sent";
 * if the request failed, the details were only kept on this device, and the visitor is told to use WhatsApp.
 */
export default function FormResult({ delivered, sentTitle, sentText, failedText, onWhatsApp, whatsAppLabel, onBack, backLabel }) {
  return (
    <div
      role="status"
      className={`p-6 sm:p-8 rounded-2xl bg-neutral-900 border text-center space-y-4 ${delivered ? 'border-green-700' : 'border-amber-600/70'}`}
    >
      {delivered ? (
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
      ) : (
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
      )}
      <h4 className="font-bebas text-2xl sm:text-3xl text-white tracking-wide">
        {delivered ? sentTitle : 'NOT SENT YET'}
      </h4>
      <p className="font-tech text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
        {delivered ? sentText : failedText}
      </p>
      {onWhatsApp && (
        <button
          type="button"
          onClick={onWhatsApp}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-xl ${
            delivered ? '' : 'ring-2 ring-amber-500/60'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{whatsAppLabel}</span>
        </button>
      )}
      <div>
        <button type="button" onClick={onBack} className="text-xs font-tech text-neutral-400 hover:text-white underline py-2">
          {backLabel}
        </button>
      </div>
    </div>
  )
}
