import React from 'react'
import { AlertTriangle, Download, RotateCcw, Upload } from 'lucide-react'

export default function BackupTab({ config, importConfig, resetToDefaults, notify }) {
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `paranoid_noise_backup_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = importConfig(event.target.result)
      if (result.success) {
        notify('Configuration imported!')
      } else {
        alert('Could not import the file: ' + result.error)
      }
    }
    reader.readAsText(file)
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to restore all content, images and the theme to the original Paranoid Noise defaults? With the shared server mode this also removes the content published for every visitor.')) {
      resetToDefaults()
      notify('Content & theme restored to the defaults!')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h4 className="font-bebas text-3xl text-white tracking-wide">
          BACKUP DATA &amp; RESET TO DEFAULT
        </h4>
        <p className="text-xs font-tech text-neutral-400">
          Export a backup copy of the website settings to a JSON file, or restore the original defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <Download className="w-8 h-8 text-red-500" />
          <h5 className="font-bebas text-2xl text-white tracking-wide">EXPORT JSON BACKUP</h5>
          <p className="text-xs font-tech text-neutral-400">
            Download the whole theme, bio, member, gig, and merch configuration as one JSON file.
          </p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Backup File
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <Upload className="w-8 h-8 text-neutral-400" />
          <h5 className="font-bebas text-2xl text-white tracking-wide">IMPORT JSON BACKUP</h5>
          <p className="text-xs font-tech text-neutral-400">
            Upload a JSON backup file to restore all website settings.
          </p>
          <label className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Choose JSON File
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-red-950/40 border border-red-900/60 space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-tech font-bold text-xs uppercase">
          <AlertTriangle className="w-4 h-4" /> Factory Reset
        </div>
        <p className="text-xs font-tech text-neutral-300">
          Restores the profile text, singles, band members, event schedule, images, and color theme to the original Paranoid Noise defaults. With the shared server mode this removes the content published for every visitor.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset to Paranoid Noise Defaults
        </button>
      </div>
    </div>
  )
}
