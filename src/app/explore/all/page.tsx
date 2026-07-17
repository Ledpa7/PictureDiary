import { Metadata } from "next"
import { SEO_KEYWORDS } from "@/constants/seo-keywords"
import { createClient } from "@/utils/supabase/server"
import ExploreAllClient from "./ExploreAllClient"

export const metadata: Metadata = {
    title: "Explore All Categories | 두들로그 - Doodle Log",
    description: "Browse daily drawing diaries by various interest categories like Travel, Cat, Dog, Cafe, and more.",
    alternates: {
        canonical: "/explore/all",
        languages: {
            'en-US': "/explore/all",
            'ko-KR': "/explore/all",
        },
    },
}

export default async function ExploreAllPage() {
    const supabase = await createClient()
    const PAGE_SIZE = 12

    const { data: diaries, error } = await supabase
        .from('diaries')
        .select(`id, created_at, image_url, content, user_id, likes!likes_diary_id_fkey (user_id)`)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1)

    let initialEntries: any[] = []

    if (diaries && diaries.length > 0) {
        const userIds = Array.from(new Set(diaries.map((d: any) => d.user_id)))
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

        const profileMap = new Map()
        profiles?.forEach((p: any) => profileMap.set(p.id, p))

        // Get current authenticated user (if any) to check likes
        const { data: { user } } = await supabase.auth.getUser()

        initialEntries = diaries.map((d: any) => {
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
    }

    return (
        <ExploreAllClient 
            initialEntries={initialEntries} 
            hasMoreInitial={diaries ? diaries.length === PAGE_SIZE : false}
            keywords={SEO_KEYWORDS}
        />
    )
}
