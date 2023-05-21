import React from 'react'

export default function ChatMessage({chatMessage}) {
  return (
    <div>
      {chatMessage.message}
    </div>
  )
}
