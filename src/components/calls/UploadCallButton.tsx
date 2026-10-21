'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UploadDrawer } from './UploadDrawer'

/** "Upload call" button that opens the upload drawer in place, on whatever page it sits. */
export function UploadCallButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}><Upload className="size-4" aria-hidden />Upload call</Button>
      <UploadDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
