"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
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
    const [isInitialized, setIsInitialized] = useState(false) // First load check

    // Keep track of loaded pages internally to prevent request spam
    const [lastLoadedPage, setLastLoadedPage] = useState(-1)

    const supabase = createClient()
    const PAGE_SIZE = 12

    const fetchEntries = useCallback(async (page = 0) => {
        // Prevent redundant calls for the same page if strictly requested
        // But for "Load More" scenarios, we rely on caller to pass next page

        if (page === 0) {
            if (loading) return // Already initial loading
            setLoading(true)
        } else {
            if (loadingMore || !hasMore) return
            setLoadingMore(true)
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            // Parallel Request Pattern (Optimized)
            const [diariesResult] = await Promise.all([
                supabase
                    .from('diaries')
                    .select(`
                        id, created_at, image_url, content, user_id,
                        likes!likes_diary_id_fkey (user_id)
                    `)
                    .order('created_at', { ascending: false })
                    .range(from, to)
            ]);

            const { data: diaries, error } = diariesResult
            if (error) throw error

            if (diaries && diaries.length > 0) {
                // Fetch Author Profiles
                const userIds = Array.from(new Set(diaries.map((d: any) => d.user_id)))
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds)

                const profileMap = new Map()
                profiles?.forEach((p: any) => profileMap.set(p.id, p))

                const mappedEntries = diaries.map((d: any) => {
                    const profile = profileMap.get(d.user_id)
                    return {
                        id: d.id,
                        userId: d.user_id || "unknown",
                        date: new Date(d.created_at).toLocaleDateString("en-US", { // Date formatting will be localized in UI if needed, standardized here
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
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

                if (page === 0) {
                    setEntries(mappedEntries as DiaryEntry[])
                    setLastLoadedPage(0)
                    setHasMore(diaries.length === PAGE_SIZE)
                } else {
                    setEntries(prev => {
                        // Deduping (Safety)
                        const newIds = new Set(mappedEntries.map(e => e.id))
                        const filteredPrev = prev.filter(e => !newIds.has(e.id))
                        return [...filteredPrev, ...mappedEntries as DiaryEntry[]]
                    })
                    setLastLoadedPage(page)
                    if (diaries.length < PAGE_SIZE) {
                        setHasMore(false)
                    }
                }
            } else {
                if (page === 0) setEntries([])
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching diaries:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
            setIsInitialized(true)
        }
    }, [hasMore, loading, loadingMore, supabase])

    const toggleLikeInCache = useCallback((id: number, isLiked: boolean, likes: number) => {
        setEntries(prev => prev.map(item =>
            item.id === id ? { ...item, isLiked, likes } : item
        ))
    }, [])

    const refresh = useCallback(() => {
        setEntries([]) // Clear cache to show skeletons/loading state
        setHasMore(true)
        setLastLoadedPage(-1)
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
