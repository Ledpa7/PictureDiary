"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Heart, X, Send, Languages, Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/context/LanguageContext"
import TiltCard from "@/components/TiltCard"
import { translateText } from "@/utils/translation"

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

interface ExploreClientProps {
    keyword: {
        slug: string
        name: string
        description: string
        searchTerms?: string[]
    }
    initialEntries: DiaryEntry[]
    hasMoreInitial: boolean
}

export default function ExploreClient({ keyword, initialEntries, hasMoreInitial }: ExploreClientProps) {
    const { language } = useLanguage()
    const router = useRouter()
    const supabase = createClient()
    
    const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(hasMoreInitial)
    const [page, setPage] = useState(1)
    
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [translatedCaption, setTranslatedCaption] = useState<string | null>(null)

    const observerTarget = useRef(null)
    const PAGE_SIZE = 12

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        getUser()
    }, [])

    useEffect(() => {
        if (!selectedEntry) {
            setTranslatedCaption(null)
        }
    }, [selectedEntry])

    // Client-side fetch for pagination
    const fetchMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        
        try {
            const searchTerms = keyword.searchTerms || [keyword.slug]
            const orFilter = searchTerms.map(term => `content.ilike.%${term}%`).join(',')
            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            const { data: diaries, error } = await supabase
                .from('diaries')
                .select(`id, created_at, image_url, content, user_id, likes!likes_diary_id_fkey (user_id)`)
                .or(orFilter)
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
                        isLiked: currentUser ? d.likes.some((like: any) => like.user_id === currentUser.id) : false,
                        author: {
                            username: profile?.username || `User_${d.user_id?.slice(0, 4)}`,
                            avatar_url: profile?.avatar_url
                        }
                    }
                })

                setEntries(prev => {
                    const newIds = new Set(mappedEntries.map(e => e.id))
                    const filteredPrev = prev.filter(e => !newIds.has(e.id))
                    return [...filteredPrev, ...mappedEntries]
                })
                setHasMore(diaries.length === PAGE_SIZE)
                setPage(prev => prev + 1)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error fetching more explore entries:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            obs => {
                if (obs[0].isIntersecting && hasMore && !loadingMore) {
                    fetchMore()
                }
            },
            { threshold: 1.0 }
        )
        if (observerTarget.current) observer.observe(observerTarget.current)
        return () => observer.disconnect()
    }, [hasMore, loadingMore, page])

    const handleTranslate = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!selectedEntry || isTranslating) return

        if (translatedCaption) {
            setTranslatedCaption(null)
            return
        }

        setIsTranslating(true)
        try {
            const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(selectedEntry.caption)
            const targetLang = hasKorean ? 'en' : 'ko'

            const result = await translateText(selectedEntry.caption, targetLang)

            if (result && result !== selectedEntry.caption) {
                setTranslatedCaption(result)
            } else {
                alert(language === 'ko' ? "번역 결과를 가져오지 못했습니다." : "Translation failed.")
            }
        } catch (error: any) {
            console.error("Translation fail:", error)
            alert(language === 'ko' ? "번역 오류가 발생했습니다." : "Translation error.")
        } finally {
            setIsTranslating(false)
        }
    }

    const toggleLike = async (e: React.MouseEvent, entry: any) => {
        e.stopPropagation()
        if (!currentUser) return alert(language === 'ko' ? "로그인이 필요합니다." : "Please sign in to like posts")

        const isLiked = entry.isLiked
        const newLikesCount = isLiked ? entry.likes - 1 : entry.likes + 1
        
        // Optimistic update in client state
        setEntries(prev => prev.map(item =>
            item.id === entry.id ? { ...item, isLiked: !isLiked, likes: newLikesCount } : item
        ))

        if (selectedEntry?.id === entry.id) {
            setSelectedEntry({ ...selectedEntry, isLiked: !isLiked, likes: newLikesCount } as DiaryEntry)
        }

        try {
            if (isLiked) {
                await supabase.from('likes').delete().match({ diary_id: entry.id, user_id: currentUser.id })
            } else {
                await supabase.from('likes').insert({ diary_id: entry.id, user_id: currentUser.id })
            }
        } catch (error) {
            console.error("Like error:", error)
        }
    }

    const handleShare = async (entry: any) => {
        const url = `${window.location.origin}/gallery/${entry.userId}`
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: 'Doodle Log', url })
            } catch (err) { console.warn(err) }
        } else {
            navigator.clipboard.writeText(url)
            alert(language === 'ko' ? "복사되었습니다!" : "Link copied!")
        }
    }

    return (
        <div className="container max-w-5xl py-8 px-4 mx-auto pb-24 text-foreground">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Link href="/gallery" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-gaegu text-primary">
                        #{keyword.name}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        {keyword.description}
                    </p>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-xl mt-6">
                    <p className="font-handwriting text-lg text-muted-foreground">
                        {language === 'ko' 
                            ? `아직 #${keyword.name} 관련 기록이 없습니다. 첫 주인공이 되어보세요!` 
                            : `No doodles found for #${keyword.name}. Be the first one to create one!`}
                    </p>
                    <Link href="/journal/new" className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-full text-xs font-bold shadow-md hover:scale-105 transition-all">
                        {language === 'ko' ? '기록 시작하기' : 'Start Log'}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                    {entries.map((entry, index) => (
                        <TiltCard
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className="cursor-pointer bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="relative aspect-square">
                                <Image src={entry.imageUrl} alt="Diary" fill className="object-cover" sizes="25vw" priority={index < 8} />
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[9px] text-white font-bold tracking-tight">
                                    {entry.date}
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="text-sm font-handwriting line-clamp-1 text-foreground/90">
                                    {entry.caption.split('\n')[0].replace(/^\[|\]$/g, '')}
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                                    <Heart size={12} className={entry.isLiked ? "fill-red-500 text-red-500" : ""} />
                                    <span className="text-[10px] font-bold">{entry.likes}</span>
                                </div>
                            </div>
                        </TiltCard>
                    ))}
                    <div ref={observerTarget} className="col-span-full h-20 flex justify-center items-center">
                        {loadingMore && <Loader2 className="animate-spin text-primary" size={24} />}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedEntry(null)}>
                    <div className="bg-card w-full max-w-sm md:max-w-4xl flex flex-col md:flex-row rounded-xl overflow-hidden shadow-3xl border border-white/5" onClick={e => e.stopPropagation()}>
                        <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative aspect-square overflow-hidden">
                            <Image src={selectedEntry.imageUrl} alt="Doodle Blur" fill className="object-cover blur-3xl opacity-50 scale-105" />
                            <Image src={selectedEntry.imageUrl} alt="Doodle Full" fill className="object-contain relative z-10" priority />
                        </div>
                        <div className="w-full md:w-2/5 flex flex-col h-full bg-card">
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/gallery/${selectedEntry.userId}`)}>
                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border shadow-sm">
                                        <img src={selectedEntry.author?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${selectedEntry.userId}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-sm text-foreground">{selectedEntry.author?.username || "Doodle User"}</span>
                                </div>
                                <button onClick={() => setSelectedEntry(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                {(() => {
                                    const displayCaption = translatedCaption || selectedEntry.caption
                                    const parts = displayCaption.split(/\r?\n/)
                                    const title = parts[0].replace(/^\[|\]$/g, '')
                                    const body = parts.slice(1).join('\n')
                                    return (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h2 className="text-xl font-bold font-handwriting leading-tight text-foreground">{title}</h2>
                                                {body && <p className="text-lg font-handwriting italic text-foreground/80 whitespace-pre-wrap leading-relaxed">{body}</p>}
                                                <button onClick={handleTranslate} disabled={isTranslating} className="mt-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                                                    {isTranslating ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
                                                    {translatedCaption ? (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(selectedEntry.caption) ? 'See Original' : '원문 보기') : (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(selectedEntry.caption) ? 'See Translation' : '번역 보기')}
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-8 font-bold text-right pt-3 border-t border-border/40 uppercase tracking-widest">
                                                {selectedEntry.date}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                            <div className="p-4 border-t border-border bg-muted/5 flex justify-between items-center font-bold">
                                <div className="flex gap-4">
                                    <button onClick={e => toggleLike(e, selectedEntry)} className="hover:scale-110 active:scale-125 transition-transform">
                                        <Heart size={24} className={selectedEntry.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                                    </button>
                                    <button onClick={() => handleShare(selectedEntry)} className="hover:scale-110 transition-transform">
                                        <Send size={24} className="text-muted-foreground" />
                                    </button>
                                </div>
                                <span className="text-xs text-muted-foreground">{selectedEntry.likes} likes</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
