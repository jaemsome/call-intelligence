'use client'

import { useRef, useState } from 'react'
import { FileAudio } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPT = 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a'

export function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onFile(file)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false) }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files) }}
        className={cn(
          'flex min-h-11 w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200',
          dragging ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2',
        )}
      >
        <FileAudio className="mb-3 size-8 text-accent" aria-hidden />
        <span className="font-medium">Drop a recording here or browse</span>
        <span className="mt-1 text-sm text-ink-3">MP3, WAV or M4A · up to 50 MB · up to 30 minutes</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => { pick(e.target.files); e.target.value = '' }}
      />
    </>
  )
}
