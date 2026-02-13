"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Heart, X, Send, Plus, Languages, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

import { useLanguage } from "@/context/LanguageContext"
import { useGallery } from "@/context/GalleryContext"
import TiltCard from "@/components/TiltCard"
import { translateText } from "@/utils/translation"

interface Comment {
    id: number
    username: string
    content: string
    created_at: string
}

export default function GalleryPage() {
    const { language } = useLanguage()

    const {
        entries,
        loading,
        loadingMore,
        hasMore,
        fetchEntries,
        toggleLikeInCache
    } = useGallery()

    const [selectedEntry, setSelectedEntry] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [translatedCaption, setTranslatedCaption] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()
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
        if (entries.length === 0) {
            fetchEntries(0)
        }
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            obs => {
                if (obs[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    const nextPage = Math.ceil(entries.length / PAGE_SIZE)
                    fetchEntries(nextPage)
                }
            },
            { threshold: 1.0 }
        )
        if (observerTarget.current) observer.observe(observerTarget.current)
        return () => observer.disconnect()
    }, [hasMore, loading, loadingMore, entries])

    useEffect(() => {
        if (!selectedEntry) {
            setTranslatedCaption(null)
        }
    }, [selectedEntry])

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
                alert(language === 'ko' ? "번역 결과를 가져오지 못했습니다. .env.local의 API 키를 확인해주세요." : "Translation failed. Check your API key in .env.local.")
            }
        } catch (error: any) {
            console.error("Translation fail:", error)
            alert(language === 'ko'
                ? `번역 오류: ${error.message || "서버와 통신할 수 없습니다."}`
                : `Translation Error: ${error.message || "Failed to connect to server."}`)
        } finally {
            setIsTranslating(false)
        }
    }

    const toggleLike = async (e: React.MouseEvent, entry: any) => {
        e.stopPropagation()
        if (!currentUser) return alert(language === 'ko' ? "로그인이 필요합니다." : "Please sign in to like posts")

        const isLiked = entry.isLiked
        toggleLikeInCache(entry.id, !isLiked, isLiked ? entry.likes - 1 : entry.likes + 1)

        if (selectedEntry?.id === entry.id) {
            setSelectedEntry({ ...selectedEntry, isLiked: !isLiked, likes: isLiked ? entry.likes - 1 : entry.likes + 1 })
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
            <h1 className="text-2xl md:text-3xl font-bold font-gaegu mb-6">
                {language === 'ko' ? '다른 사람의 기록' : "Other People's Logs"}
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {loading && entries.length === 0 ? (
                    Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="aspect-square animate-shimmer bg-muted/40 rounded-xl" />
                    ))
                ) : (
                    entries.map((entry, index) => (
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
                    ))
                )}
                <div ref={observerTarget} className="col-span-full h-20 flex justify-center items-center">
                    {loadingMore && <Loader2 className="animate-spin text-primary" size={24} />}
                </div>
            </div>

            <button
                onClick={() => router.push('/journal/new')}
                className="fixed bottom-8 right-8 bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 group"
            >
                <Plus size={28} className="group-hover:rotate-90 transition-transform" />
            </button>

            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedEntry(null)}>
                    <div className="bg-card w-full max-w-sm md:max-w-4xl flex flex-col md:flex-row rounded-xl overflow-hidden shadow-3xl border border-white/5" onClick={e => e.stopPropagation()}>

                        {/* 1:1 Image Side with Cinematic Blur Background (NEVER CROP) */}
                        <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative aspect-square overflow-hidden">
                            {/* Blurred BG to fill edges */}
                            <Image
                                src={selectedEntry.imageUrl}
                                alt="Doodle Blur"
                                fill
                                className="object-cover blur-3xl opacity-50 scale-105"
                            />
                            {/* Sharp foreground - never cropped */}
                            <Image
                                src={selectedEntry.imageUrl}
                                alt="Doodle Full"
                                fill
                                className="object-contain relative z-10"
                                priority
                            />
                        </div>

                        {/* Info Side */}
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

                                                <button
                                                    onClick={handleTranslate}
                                                    disabled={isTranslating}
                                                    className="mt-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    {isTranslating ? (
                                                        <Loader2 size={11} className="animate-spin" />
                                                    ) : (
                                                        <Languages size={11} />
                                                    )}
                                                    {translatedCaption ? (
                                                        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(selectedEntry.caption) ? 'See Original' : '원문 보기'
                                                    ) : (
                                                        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(selectedEntry.caption) ? 'See Translation' : '번역 보기'
                                                    )}
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-8 font-bold text-right pt-3 border-t border-border/40 uppercase tracking-widest">
                                                {selectedEntry.date}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            <div className="p-4 border-t border-border bg-muted/5 flex justify-between items-center">
                                <div className="flex gap-4">
                                    <button onClick={e => toggleLike(e, selectedEntry)} className="hover:scale-110 active:scale-125 transition-transform">
                                        <Heart size={24} className={selectedEntry.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                                    </button>
                                    <button onClick={() => handleShare(selectedEntry)} className="hover:scale-110 transition-transform">
                                        <Send size={24} className="text-muted-foreground" />
                                    </button>
                                </div>
                                <span className="font-bold text-xs text-muted-foreground">{selectedEntry.likes} likes</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
