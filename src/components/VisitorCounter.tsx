"use client"

import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { Users } from "lucide-react"

export function VisitorCounter() {
    const [count, setCount] = useState(1) // Start with 1 (me)
    const supabase = createClient()

    useEffect(() => {
        // Generate a random ID for anonymous tracking if not logged in
        const presenceId = Math.random().toString(36).substring(7)

        const channel = supabase.channel('online_users', {
            config: {
                presence: {
                    key: presenceId,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const presentCount = Object.keys(state).length
                setCount(Math.max(1, presentCount))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [])

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-black/80 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border border-white/10 transition-opacity hover:opacity-100 opacity-80 animate-fade-in">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-handwriting">LIVE: {count}</span>
        </div>
    )
}
