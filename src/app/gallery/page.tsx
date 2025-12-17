"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Bookmark, X, Send, Plus, Pencil } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/context/LanguageContext"
import TiltCard from "@/components/TiltCard"

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

interface Comment {
    id: number
    username: string
    content: string
    created_at: string
}

export default function GalleryPage() {
    const { language, setLanguage } = useLanguage()
    const [entries, setEntries] = useState<DiaryEntry[]>([])
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
    const [loading, setLoading] = useState(true) // Initial loading
    const [loadingMore, setLoadingMore] = useState(false) // Pagination loading
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [currentUser, setCurrentUser] = useState<any>(null)
    const router = useRouter()

    // Pagination
    const PAGE_SIZE = 12
    const [hasMore, setHasMore] = useState(true)
    const observerTarget = useRef(null)

    const [stats, setStats] = useState({ likes: 0, comments: 0 })

    const supabase = createClient()

    // Fetch User
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        getUser()
        fetchStats()
    }, [])

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    loadMore()
                }
            },
            { threshold: 1.0 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current)
            }
        }
    }, [observerTarget, hasMore, loading, loadingMore]) // Dependencies crucial

    const loadMore = () => {
        const nextPage = Math.ceil(entries.length / PAGE_SIZE)
        fetchEntries(nextPage)
    }

    // Fetch Global Stats
    const fetchStats = async () => {
        const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true })
        const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true })
        setStats({
            likes: likesCount || 0,
            comments: commentsCount || 0
        })
    }

    // Fetch Entries
    const fetchEntries = async (page = 0) => {
        try {
            if (page === 0) setLoading(true)
            else setLoadingMore(true)

            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            // Fetch diaries
            const { data: diaries, error } = await supabase
                .from('diaries')
                .select(`
                    id, created_at, image_url, content, user_id,
                    likes!likes_diary_id_fkey (user_id)
                `)
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            if (diaries && diaries.length > 0) {
                const { data: { user } } = await supabase.auth.getUser()

                // Fetch Profiles Manually (to avoid complex FK setup issues)
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
                        date: new Date(d.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
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
                } else {
                    setEntries(prev => [...prev, ...mappedEntries as DiaryEntry[]])
                }

                // If we got fewer items than requested, we reached the end
                if (diaries.length < PAGE_SIZE) {
                    setHasMore(false)
                }
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching diaries:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchEntries(0)
    }, [language])

    // Fetch Comments when entry selected
    useEffect(() => {
        if (selectedEntry) {
            const fetchComments = async () => {
                const { data, error } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('diary_id', selectedEntry.id)
                    .order('created_at', { ascending: true })

                if (data) {
                    const mappedComments = data.map((c: any) => ({
                        id: c.id,
                        username: "User", // Simplification: in real app, fetch user profile
                        content: c.content,
                        created_at: new Date(c.created_at).toLocaleDateString()
                    }))
                    setComments(mappedComments)
                }
            }
            fetchComments()
        } else {
            setComments([])
        }
    }, [selectedEntry])

    const toggleLike = async (e: React.MouseEvent, entry: DiaryEntry) => {
        e.stopPropagation()
        if (!currentUser) return alert(language === 'ko' ? "로그인이 필요합니다." : "Please sign in to like posts")

        // 1. Optimistic UI Update
        const originalEntries = [...entries] // Backup for rollback
        const originalSelected = selectedEntry ? { ...selectedEntry } : null
        const isLiked = entry.isLiked
        const newIsLiked = !isLiked
        const newLikes = isLiked ? Math.max(0, entry.likes - 1) : entry.likes + 1

        // Update Grid List State
        setEntries(prev => prev.map(item =>
            item.id === entry.id
                ? { ...item, isLiked: newIsLiked, likes: newLikes }
                : item
        ))

        // Update Modal State (if open)
        if (selectedEntry && selectedEntry.id === entry.id) {
            setSelectedEntry({ ...selectedEntry, isLiked: newIsLiked, likes: newLikes })
        }

        try {
            // 2. Background DB Request
            if (isLiked) {
                const { error } = await supabase.from('likes').delete().match({ diary_id: entry.id, user_id: currentUser.id })
                if (error) throw error
            } else {
                const { error } = await supabase.from('likes').insert({ diary_id: entry.id, user_id: currentUser.id })
                if (error) throw error
            }

            // 3. Update Sync Stats (Non-blocking)
            fetchStats()

        } catch (error) {
            console.error("Error toggling like:", error)
            // 4. Rollback on Error
            setEntries(originalEntries)
            if (originalSelected) setSelectedEntry(originalSelected)
            alert("Failed to update like. Please try again.")
        }
    }

    const handlePostComment = async () => {
        if (!newComment.trim() || !selectedEntry || !currentUser) return

        try {
            const { error } = await supabase.from('comments').insert({
                diary_id: selectedEntry.id,
                user_id: currentUser.id,
                content: newComment
            })

            if (!error) {
                setNewComment("")
                await fetchStats() // Refresh Stats
                // Refresh comments
                const { data } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('diary_id', selectedEntry.id)
                    .order('created_at', { ascending: true })

                if (data) {
                    const mappedComments = data.map((c: any) => ({
                        id: c.id,
                        username: "Me",
                        content: c.content,
                        created_at: new Date(c.created_at).toLocaleDateString()
                    }))
                    setComments(mappedComments)
                }
            }
        } catch (error) {
            console.error("Error posting comment:", error)
        }
    }

    // Close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedEntry(null)
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [])



    return (
        <div className="container max-w-5xl py-8 px-4 mx-auto pb-24">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-2 md:mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {language === 'ko' ? '다른 사람의 기록' : "Other People's Logs"}
                </h1>
            </div>


            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4"> {/* Changed gap to 2 for mobile, 4 for desktop */}
                {loading && entries.length === 0 ? (
                    Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="bg-card flex flex-col h-full rounded-md border border-border overflow-hidden">
                            <div className="aspect-square bg-muted animate-pulse" />
                            <div className="p-3 flex flex-col gap-2">
                                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                            </div>
                        </div>
                    ))
                ) : (
                    entries.map((entry, index) => (
                        <TiltCard
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className="group relative cursor-pointer bg-card flex flex-col h-full hover:z-10 shadow-sm border border-border overflow-hidden rounded-md"
                        >
                            <div className="relative aspect-square w-full bg-muted">
                                <Image
                                    src={entry.imageUrl}
                                    alt="Diary Entry"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110" // Inner zoom
                                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                    priority={index < 6}
                                    quality={75}
                                />
                            </div>
                            <div className="p-3 bg-card flex flex-col justify-between flex-1">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1">{entry.date}</p>
                                    <div className="text-sm font-handwriting text-foreground line-clamp-2 leading-snug">
                                        {(() => {
                                            let title = ""
                                            let body = ""
                                            const parts = entry.caption.split(/\r?\n/)
                                            if (parts.length > 1) {
                                                title = parts[0]
                                                body = parts.slice(1).join(' ')
                                            } else {
                                                const bracketIndex = entry.caption.indexOf(']')
                                                if (bracketIndex !== -1 && bracketIndex < entry.caption.length - 1) {
                                                    title = entry.caption.slice(0, bracketIndex + 1)
                                                    body = entry.caption.slice(bracketIndex + 1)
                                                } else {
                                                    title = entry.caption
                                                    body = ""
                                                }
                                            }
                                            // Clean brackets
                                            title = title.replace(/^\[|\]$/g, '')

                                            return (
                                                <>
                                                    <span className="font-bold text-base mr-1">{title}</span>
                                                    <span className="opacity-80">{body}</span>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mt-3 text-muted-foreground">
                                    <Heart
                                        size={14}
                                        className={entry.isLiked ? "fill-red-500 text-red-500" : ""}
                                    />
                                    <span className="text-xs">{entry.likes}</span>
                                </div>
                            </div>
                        </TiltCard>
                    ))
                )}

                {/* Sentinel for Infinite Scroll */}
                <div ref={observerTarget} className="col-span-2 md:col-span-4 lg:col-span-5 h-20 flex items-center justify-center p-4">
                    {loadingMore && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
                </div>
            </div>

            {/* Floating Action Button for New Diary */}
            <button
                onClick={() => router.push('/journal/new')}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-[#FF8BA7]/80 md:bg-[#FF8BA7]/60 backdrop-blur-sm text-white p-3 md:p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 flex items-center justify-center group"
                aria-label="Write New Diary"
            >
                <Plus size={28} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform drop-shadow-md" />
            </button>

            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                    <div
                        className="bg-card w-full max-w-sm md:max-w-4xl md:w-full max-h-[85vh] md:max-h-[90vh] flex flex-col md:flex-row rounded-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left: Image (Square) */}
                        <div className="w-full md:w-3/5 relative bg-black flex-shrink-0 flex justify-center items-center md:block md:aspect-square">
                            <div className="relative w-full aspect-square md:h-full md:w-full">
                                <Image src={selectedEntry.imageUrl} alt="Detail" fill className="object-cover" />
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-2/5 flex flex-col flex-1 min-h-0 md:h-auto text-card-foreground">
                            {/* Header with Author - UPDATED */}
                            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:bg-muted p-1.5 rounded-lg transition-colors -ml-2 select-none"
                                    onClick={() => router.push(`/gallery/${selectedEntry.userId}`)}
                                    title="View Author's Gallery"
                                >
                                    <div className="w-9 h-9 rounded-full bg-muted overflow-hidden border border-border shadow-sm flex-shrink-0">
                                        <img
                                            src={selectedEntry.author?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${selectedEntry.userId}`}
                                            alt="Author"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="font-bold text-sm text-foreground leading-tight">
                                            {selectedEntry.author?.username || `User_${selectedEntry.userId.slice(0, 4)}`}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium">View Gallery</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEntry(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={24} /></button>
                            </div>

                            {/* Comments Area */}
                            <div className="p-4 flex-1 overflow-y-auto">

                                <div className="flex gap-3 mb-6">
                                    <div className="text-sm w-full">
                                        <div className="flex flex-col w-full gap-1">
                                            {(() => {
                                                let title = ""
                                                let body = ""

                                                // 1. Try splitting by newline
                                                const parts = selectedEntry.caption.split(/\r?\n/)

                                                if (parts.length > 1) {
                                                    title = parts[0]
                                                    body = parts.slice(1).join('\n').trim()
                                                } else {
                                                    // 2. No newline? Try splitting by closing bracket ']' if present (e.g. "[Title] Body")
                                                    const raw = selectedEntry.caption
                                                    const bracketIndex = raw.indexOf(']')

                                                    if (bracketIndex !== -1 && bracketIndex < raw.length - 1) {
                                                        title = raw.slice(0, bracketIndex + 1).trim()
                                                        body = raw.slice(bracketIndex + 1).trim()
                                                    } else {
                                                        // 3. Fallback: Treat everything as Body (or Title if short? Let's just create a Title block)
                                                        // Actually, if it's just one chunk, let's treat it as Body to look normal, 
                                                        // OR just show it all in the title block if it's short.
                                                        // User wants separation. Let's act smart.
                                                        title = raw
                                                        body = ""
                                                    }
                                                }

                                                // Clean up brackets from title for display if they exist (Legacy support)
                                                title = title.replace(/^\[|\]$/g, '')

                                                return (
                                                    <>
                                                        <div className="font-bold text-xl leading-snug text-foreground">
                                                            {title}
                                                        </div>
                                                        {body && (
                                                            <div className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/80">
                                                                {body}
                                                            </div>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-4 font-handwriting text-right border-t border-border pt-2">{selectedEntry.date}</div>
                                    </div>
                                </div>

                                { /* Comments Section Hidden for now */}
                                {/* <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                {comment.username[0]}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-bold mr-2 text-foreground">{comment.username}</span>
                                                <span className="text-muted-foreground">{comment.content}</span>
                                                <div className="text-xs text-muted-foreground mt-1">{comment.created_at}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-8">No comments yet. Be the first!</div>
                                    )}
                                </div> */}
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 border-t border-border bg-card flex-shrink-0">
                                <div className="flex justify-between mb-3">
                                    <div className="flex gap-4">
                                        <button onClick={(e) => toggleLike(e, selectedEntry)}>
                                            <Heart className={`transition-colors ${selectedEntry.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`} size={24} />
                                        </button>
                                        {/* <MessageCircle className="cursor-pointer text-muted-foreground hover:text-foreground" size={24} /> */}
                                    </div>

                                </div>
                                <div className="font-bold text-sm mb-1">{selectedEntry.likes} likes</div>

                                {/* Comment Input Hidden */}
                                {/* <div className="flex gap-2 mt-3 border-t border-border pt-3">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                    />
                                    <button
                                        className="text-blue-500 font-bold text-sm disabled:opacity-50"
                                        disabled={!newComment.trim()}
                                        onClick={handlePostComment}
                                    >
                                        Post
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
