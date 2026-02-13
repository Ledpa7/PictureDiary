"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Plus, Heart, MessageCircle, Bookmark, X, Edit2, Send } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useParams, useRouter } from "next/navigation"
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

interface Profile {
    username: string
    description: string
    avatar_url?: string
}

export default function UserGalleryPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params?.userId as string

    const [entries, setEntries] = useState<DiaryEntry[]>([])
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [userStats, setUserStats] = useState({ likes: 0, comments: 0 })

    // Pagination
    const PAGE_SIZE = 12
    const [hasMore, setHasMore] = useState(true)
    const observerTarget = useRef(null)

    // Profile State
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [editForm, setEditForm] = useState({ username: "", description: "" })
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    // Fetch User & Profile
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }

        const fetchProfile = async () => {
            if (!userId) return
            // Try to fetch profile
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
            if (data) {
                setProfile(data)
            }
        }

        getUser()
        fetchProfile()
    }, [userId])

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
    }, [observerTarget, hasMore, loading, loadingMore])

    const loadMore = () => {
        const nextPage = Math.ceil(entries.length / PAGE_SIZE)
        fetchEntries(nextPage)
    }

    // Helper: Resize & Crop Image
    const resizeAndCropImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img')
            img.src = URL.createObjectURL(file)
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) return reject(new Error('No canvas context'))

                const targetSize = 100
                canvas.width = targetSize
                canvas.height = targetSize

                // Center Crop Logic
                const minSide = Math.min(img.width, img.height)
                const sx = (img.width - minSide) / 2
                const sy = (img.height - minSide) / 2

                // Draw centered crop to 100x100 canvas
                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize)

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Blob creation failed'))
                }, file.type, 0.9)
            }
            img.onerror = (e) => reject(e)
        })
    }

    // Save Profile
    const handleSaveProfile = async () => {
        if (!currentUser) return
        if (editForm.username.length > 20) return alert("Username too long (max 20)")
        if (editForm.description.length > 50) return alert("Description too long (max 50)")

        setUploading(true)
        try {
            let avatarUrl = profile?.avatar_url || ""

            // Upload Avatar if file selected
            if (avatarFile) {
                // Resize to 100x100 square
                const resizedBlob = await resizeAndCropImage(avatarFile)

                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`

                // Upload to 'avatars' bucket
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, resizedBlob, {
                        contentType: avatarFile.type,
                        upsert: true
                    })

                if (uploadError) throw uploadError

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName)

                avatarUrl = publicUrl
            }

            const { error } = await supabase.from('profiles').upsert({
                id: currentUser.id,
                username: editForm.username,
                description: editForm.description,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })

            if (error) {
                if (error.code === '23505') alert("Username already taken. Please choose another.")
                else throw error
                return
            }

            setProfile({ ...editForm, avatar_url: avatarUrl })
            setIsEditingProfile(false)
            setAvatarFile(null)
        } catch (e: any) {
            console.error("Profile update failed:", e.message)
            alert("Failed to update profile. (Make sure you created 'avatars' bucket and set policies!)")
        } finally {
            setUploading(false)
        }
    }

    // Fetch Entries for Specific User
    const fetchEntries = async (page = 0) => {
        if (!userId) return

        try {
            if (page === 0) setLoading(true)
            else setLoadingMore(true)

            const from = page * PAGE_SIZE
            const to = from + PAGE_SIZE - 1

            const { data: diaries, error } = await supabase
                .from('diaries')
                .select(`
                    id, created_at, image_url, content, user_id,
                    likes!likes_diary_id_fkey (user_id)
                `)
                .eq('user_id', userId) // Filter by userId
                .order('created_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            if (diaries && diaries.length > 0) {
                const { data: { user } } = await supabase.auth.getUser()

                const mappedEntries = diaries.map((d: any) => ({
                    id: d.id,
                    userId: d.user_id || "unknown",
                    date: new Date(d.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    imageUrl: d.image_url,
                    caption: d.content,
                    likes: d.likes ? d.likes.length : 0,
                    isLiked: user ? d.likes.some((like: any) => like.user_id === user.id) : false
                }))

                if (page === 0) {
                    setEntries(mappedEntries as DiaryEntry[])
                    // Simple stats calculation for initial load
                    const totalLikes = mappedEntries.reduce((acc: number, curr: any) => acc + curr.likes, 0)
                    setUserStats({ likes: totalLikes, comments: 0 })
                } else {
                    setEntries(prev => [...prev, ...mappedEntries as DiaryEntry[]])
                }

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
        fetchEntries(0)
    }, [userId])

    // Same comment/like logic as main gallery
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
                        username: "User",
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
        if (!currentUser) return alert("Please sign in to like posts")

        // Haptic Feedback for Mobile
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }

        // 1. Optimistic UI Update
        const originalEntries = [...entries] // Backup for rollback
        const originalSelected = selectedEntry ? { ...selectedEntry } : null
        const originalStats = { ...userStats }

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

        // Update User Stats
        setUserStats(prev => ({
            ...prev,
            likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1
        }))

        try {
            // 2. Background DB Request
            if (isLiked) {
                const { error } = await supabase.from('likes').delete().match({ diary_id: entry.id, user_id: currentUser.id })
                if (error) throw error
            } else {
                const { error } = await supabase.from('likes').insert({ diary_id: entry.id, user_id: currentUser.id })
                if (error) throw error
            }

        } catch (error) {
            console.error("Error toggling like:", error)
            // 4. Rollback on Error
            setEntries(originalEntries)
            if (originalSelected) setSelectedEntry(originalSelected)
            setUserStats(originalStats)
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

    const handleShare = async (entry: any) => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Doodle Log - AI Picture Diary',
                    text: `Check out this AI drawing: ${entry.caption.split('\n')[0]}`,
                    url: `${window.location.origin}/gallery/${entry.userId}`
                });
            } catch (err) {
                console.warn('Share failed:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${window.location.origin}/gallery/${entry.userId}`);
            alert("Link copied to clipboard!");
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

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    return (
        <div className="container max-w-5xl py-8 px-4 mx-auto">
            <header className="flex flex-col items-center mb-12 gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-muted via-border to-foreground p-[2px]">
                    <div className="w-full h-full rounded-full bg-card p-[2px] overflow-hidden">
                        <img
                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>
                <div className="text-center relative">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl font-bold font-sans">
                            {profile?.username || `User_${userId?.slice(0, 4)}`}
                        </h1>
                        {currentUser?.id === userId && (
                            <button
                                onClick={() => {
                                    setEditForm({
                                        username: profile?.username || "",
                                        description: profile?.description || ""
                                    })
                                    setAvatarFile(null)
                                    setIsEditingProfile(true)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>
                    <p className="font-handwriting text-muted-foreground mt-2">
                        {profile?.description || "Personal Diary Gallery"}
                    </p>

                    <div className="flex gap-6 justify-center mt-4 text-sm font-medium">
                        <span><strong>{entries.length}</strong> posts</span>
                        <span><strong>{userStats.likes}</strong> likes received</span>
                    </div>
                </div>
            </header>

            {/* Edit Profile Modal */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsEditingProfile(false)}>
                    <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 text-card-foreground" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Profile</h2>
                            <button onClick={() => setIsEditingProfile(false)}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                        </div>

                        <div className="space-y-5">
                            {/* Avatar Upload */}
                            <div>
                                <label className="block text-sm font-bold text-foreground mb-2">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-muted overflow-hidden border border-border shrink-0">
                                        {avatarFile ? (
                                            <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <label className="cursor-pointer bg-muted px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-border transition-colors">
                                        <span>Change Photo</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                if (e.target.files?.[0]) setAvatarFile(e.target.files[0])
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-foreground mb-1">Username (max 20)</label>
                                <input
                                    type="text"
                                    className="w-full border border-border bg-background rounded-md p-2 focus:ring-2 focus:ring-primary outline-none text-foreground"
                                    maxLength={20}
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    placeholder={`User_${currentUser?.id.slice(0, 4)}`}
                                />
                                <div className="text-right text-xs text-stone-400 mt-1">{editForm.username.length}/20</div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-foreground mb-1">Description (max 50)</label>
                                <input
                                    type="text"
                                    className="w-full border border-border bg-background rounded-md p-2 focus:ring-2 focus:ring-primary outline-none text-foreground"
                                    maxLength={50}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Personal Diary Gallery"
                                />
                                <div className="text-right text-xs text-muted-foreground mt-1">{editForm.description.length}/50</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setIsEditingProfile(false)}
                                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={uploading}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {entries.map((entry) => (
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
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 50vw, 20vw"
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
                ))}

                {/* Sentinel for Infinite Scroll */}
                <div ref={observerTarget} className="col-span-2 md:col-span-4 lg:col-span-5 h-20 flex items-center justify-center p-4">
                    {loadingMore && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>}
                </div>
            </div>

            {/* Floating Action Button for New Diary */}
            {currentUser?.id === userId && (
                <button
                    onClick={() => router.push('/journal/new')}
                    className="fixed bottom-8 right-8 bg-[#FF8BA7]/60 backdrop-blur-sm text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-40 flex items-center justify-center group"
                    aria-label="Write New Diary"
                >
                    <Plus size={32} className="group-hover:rotate-90 transition-transform drop-shadow-md" />
                </button>
            )}

            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                    <div
                        className="bg-card w-[45vh] max-w-[90vw] md:w-full md:max-w-4xl max-h-[90vh] flex flex-col md:flex-row rounded-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-card-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left: Image (Square) */}
                        <div className="w-full md:w-3/5 relative bg-black flex-shrink-0 flex justify-center items-center md:block md:aspect-square">
                            <div className="relative w-full aspect-square md:h-full md:w-full">
                                <Image src={selectedEntry.imageUrl} alt="Detail" fill className="object-cover" />
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-2/5 flex flex-col flex-1 min-h-0 md:h-auto">
                            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedEntry.userId}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="font-bold text-sm">User_{selectedEntry.userId ? selectedEntry.userId.slice(0, 4) : '????'}</span>
                                </div>
                                <button onClick={() => setSelectedEntry(null)} className="text-muted-foreground hover:text-foreground"><X size={24} /></button>
                            </div>

                            {/* Comments Area */}
                            <div className="p-4 flex-1 overflow-y-auto">
                                <div className="flex gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedEntry.userId}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-sm w-full">
                                        <div className="flex flex-col w-full gap-1">
                                            {(() => {
                                                let title = ""
                                                let body = ""
                                                const parts = selectedEntry.caption.split(/\r?\n/)

                                                if (parts.length > 1) {
                                                    title = parts[0]
                                                    body = parts.slice(1).join('\n').trim()
                                                } else {
                                                    const raw = selectedEntry.caption
                                                    const bracketIndex = raw.indexOf(']')

                                                    if (bracketIndex !== -1 && bracketIndex < raw.length - 1) {
                                                        title = raw.slice(0, bracketIndex + 1).trim()
                                                        body = raw.slice(bracketIndex + 1).trim()
                                                    } else {
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
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 border-t border-border bg-card flex-shrink-0">
                                <div className="flex justify-between mb-3">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={(e) => toggleLike(e, selectedEntry)}
                                            className={`${selectedEntry.isLiked ? 'heart-pop' : ''}`}
                                        >
                                            <Heart className={`transition-colors ${selectedEntry.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`} size={24} />
                                        </button>
                                        <button onClick={() => handleShare(selectedEntry)}>
                                            <Send className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" size={24} />
                                        </button>
                                    </div>

                                </div>
                                <div className="font-bold text-sm mb-1">{selectedEntry.likes} likes</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
