import { MetadataRoute } from 'next'
import { SEO_KEYWORDS } from '@/constants/seo-keywords'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://ai-picture-diary.pages.dev'

    const keywordRoutes = SEO_KEYWORDS.map((k) => ({
        url: `${baseUrl}/explore/${k.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/gallery`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        ...keywordRoutes,
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ]
}
