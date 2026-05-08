'use client'

import { useState, useEffect } from 'react'

function getGreeting(name: string | null): string {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${time}, ${name}` : time
}

export function Greeting({ name }: { name: string | null }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    setText(getGreeting(name))
  }, [name])

  // Render nothing until client hydrates — avoids server/client mismatch
  if (text === null) return null
  return <>{text}</>
}
