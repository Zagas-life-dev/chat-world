'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeChatProps {
  roomId: string
  userId: string
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    id: string;
    name: string
  }
  createdAt: string
}

// const EVENT_MESSAGE_TYPE = 'message'
type MessageRow = {
  id: string
  content: string
  user_id:string
  created_at: string
}

export function useRealtimeChat({ roomId, userId }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
    const names = useRef(new Map<string, string>())
 
    const toMessage = useCallback(
    (row: MessageRow): ChatMessage => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      user: { id: row.user_id, name: names.current.get(row.user_id) ?? 'Unknown' },
    }),
    []
  )
    useEffect(() => {
    let cancelled = false

    async function load() {
        const { data: members } = await supabase
        .from('chat_room_member')
        .select('user_id, user:user_id ( name )')
        .eq('room_id', roomId)
        .returns<{ user_id: string; user: { name: string } | null }[]>()

      if (cancelled) return
      members?.forEach((m) => {
        if (m.user?.name) names.current.set(m.user_id, m.user.name)
      })


      const { data: rows, error } = await supabase
        .from('messages')
        .select('id, content, user_id, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (cancelled) return
      if (error) return console.error(error)

      setMessages((rows ?? []).map(toMessage))
    }

    load()
    return () => { cancelled = true }
  }, [roomId, supabase, toMessage])

    useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow
          setMessages((current) =>
            current.some((m) => m.id === row.id) ? current : [...current, toMessage(row)]
          )
        }
      )
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase, toMessage])
    const sendMessage = useCallback(
    async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim(),
      })
      if (error) console.error(error)
    },
    [roomId, userId, supabase]
  )

  return { messages, sendMessage, isConnected }
}

