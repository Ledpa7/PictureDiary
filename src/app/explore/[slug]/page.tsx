import { notFound } from "next/navigation"
import { Metadata } from "next"
import { SEO_KEYWORDS } from "@/constants/seo-keywords"
import { createClient } from "@/utils/supabase/server"
import ExploreClient from "./ExploreClient"

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const keyword = SEO_KEYWORDS.find(k => k.slug === slug)
    if (!keyword) return {}

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doodlelog.pages.dev'
    const pageUrl = `${siteUrl}/explore/${slug}`

    return {
        title: `#${keyword.name} - Explore | 두들로그 - Doodle Log`,
        description: keyword.description,
        alternates: {
            canonical: `/explore/${slug}`,
            languages: {
                'en-US': `/explore/${slug}`,
                'ko-KR': `/explore/${slug}`,
            },
        },
        openGraph: {
            title: `#${keyword.name} - Explore | 두들로그`,
            description: keyword.description,
            url: `/explore/${slug}`,
        }
    }
}

export default async function ExplorePage({ params }: Props) {
    const { slug } = await params
    const keyword = SEO_KEYWORDS.find(k => k.slug === slug)
    if (!keyword) {
        notFound()
    }

    const supabase = await createClient()
    const searchTerms = keyword.searchTerms || [keyword.slug]
    const orFilter = searchTerms.map(term => `content.ilike.%${term}%`).join(',')

    const PAGE_SIZE = 12

    const { data: diaries, error } = await supabase
        .from('diaries')
        .select(`id, created_at, image_url, content, user_id, likes!likes_diary_id_fkey (user_id)`)
        .or(orFilter)
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
        <ExploreClient 
            keyword={keyword} 
            initialEntries={initialEntries} 
            hasMoreInitial={diaries ? diaries.length === PAGE_SIZE : false}
        />
    )
}
