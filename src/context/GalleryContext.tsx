"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react"
import { createClient } from "@/utils/supabase/client"

interface DiaryEntry {
    id: number
    userId: string
    date: string
    imageUrl: string
    caption: string
    likes: number
    isLiked: boolean
    author?: {
        username: string
        avatar_url: string
    }
}

interface GalleryContextType {
    entries: DiaryEntry[]
    loading: boolean
    loadingMore: boolean
    hasMore: boolean
    fetchEntries: (page?: number) => Promise<void>
    toggleLikeInCache: (id: number, isLiked: boolean, likes: number) => void
    refresh: () => void
    isInitialized: boolean
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
    const [entries, setEntries] = useState<DiaryEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [isInitialized, setIsInitialized] = useState(false)
    const isFetchingRef = useRef(false)
    const currentPageRef = useRef(0)

    const supabase = createClient()
    const PAGE_SIZE = 12

    const fetchEntries = useCallback(async (page?: number) => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true

        const targetPage = page !== undefined ? page : currentPageRef.current + 1

        if (targetPage === 0) setLoading(true)
        else setLoadingMore(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const from = targetPage * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            const { data: diaries, error } = await supabase
                .from('diaries')
                .select(`id, created_at, image_url, content, user_id, likes!likes_diary_id_fkey (user_id)`)
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            if (diaries && diaries.length > 0) {
                const userIds = Array.from(new Set(diaries.map((d: any) => d.user_id)))
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds)

                const profileMap = new Map()
                profiles?.forEach((p: any) => profileMap.set(p.id, p))

                const mappedEntries: DiaryEntry[] = diaries.map((d: any) => {
                    const profile = profileMap.get(d.user_id)
                    return {
                        id: d.id,
                        userId: d.user_id || "unknown",
                        date: new Date(d.created_at).toLocaleDateString("en-US", {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }),
                        imageUrl: d.image_url,
                        caption: d.content,
                        likes: d.likes ? d.likes.length : 0,
                        isLiked: user ? d.likes.some((like: any) => like.user_id === user.id) : false,
                        author: {
                            username: profile?.username || `User_${d.user_id?.slice(0, 4)}`,
                            avatar_url: profile?.avatar_url
                        }
                    }
                })

                if (targetPage === 0) {
                    setEntries(mappedEntries)
                } else {
                    setEntries(prev => {
                        const newIds = new Set(mappedEntries.map(e => e.id))
                        const filteredPrev = prev.filter(e => !newIds.has(e.id))
                        return [...filteredPrev, ...mappedEntries]
                    })
                }
                setHasMore(diaries.length === PAGE_SIZE)
                currentPageRef.current = targetPage
            } else {
                if (targetPage === 0) setEntries([])
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching diaries:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            setIsInitialized(true)
            isFetchingRef.current = false
        }
    }, [supabase])

    const toggleLikeInCache = useCallback((id: number, isLiked: boolean, likes: number) => {
        setEntries(prev => prev.map(item =>
            item.id === id ? { ...item, isLiked, likes } : item
        ))
    }, [])

    const refresh = useCallback(() => {
        setEntries([])
        setHasMore(true)
        currentPageRef.current = 0
        fetchEntries(0)
    }, [fetchEntries])

    return (
        <GalleryContext.Provider value={{
            entries,
            loading,
            loadingMore,
            hasMore,
            fetchEntries,
            toggleLikeInCache,
            refresh,
            isInitialized
        }}>
            {children}
        </GalleryContext.Provider>
    )
}

export const useGallery = () => {
    const context = useContext(GalleryContext)
    if (context === undefined) {
        throw new Error("useGallery must be used within a GalleryProvider")
    }
    return context
}
