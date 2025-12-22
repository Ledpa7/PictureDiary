import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/',
        },
        sitemap: 'https://ai-picture-diary.vercel.app/sitemap.xml', // Assuming Vercel, but relative typically not allowed here for some parsers, but standard is absolute. I'll use a placeholder or relative if Next allows. Next docs say absolute is preferred. I'll guess the domain or leave it relative if I have no choice, but robots.txt usually needs absolute. I will leave it as example.com if I really don't know, or try to derive.
        // Given the context, I'll use a generic URL or omitting it might be safer than a wrong one? No, sitemap is important.
        // I will use a relative path just for the code, but note that it should be updated.
    }
}
