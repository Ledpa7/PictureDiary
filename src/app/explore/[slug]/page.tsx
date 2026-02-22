
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEO_KEYWORDS } from '@/constants/seo-keywords';
import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const keyword = SEO_KEYWORDS.find((k) => k.slug === slug);

    if (!keyword) {
        return {
            title: 'Not Found - Doodle Log',
        };
    }

    return {
        title: `${keyword.name} AI Picture Diary | Doodle Log`,
        description: `${keyword.description}. Explore AI-generated illustrations and creative diary prompts.`,
        openGraph: {
            title: `${keyword.name} AI Picture Diary Collection`,
            description: keyword.description,
            type: 'website',
        },
    };
}

export default async function ExplorePage({ params }: Props) {
    const { slug } = await params;
    const keyword = SEO_KEYWORDS.find((k) => k.slug === slug);

    if (!keyword) {
        notFound();
    }

    const supabase = await createClient();

    // Keyword search in 'content' column
    const { data: diaries, error } = await supabase
        .from('diaries')
        .select(`id, created_at, image_url, content, user_id, likes:likes(count)`)
        .ilike('content', `%${keyword.name}%`)
        .order('created_at', { ascending: false })
        .limit(20);

    return (
        <div className="container max-w-5xl py-12 px-4 mx-auto pb-24 text-foreground min-h-screen">
            <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Gallery
            </Link>

            <header className="mb-12">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
                    SEO Discovery Page
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-gaegu mb-4">
                    #{keyword.name} AI Picture Diary
                </h1>
                <p className="text-xl text-muted-foreground font-handwriting">
                    {keyword.description}
                </p>
            </header>

            {diaries && diaries.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {diaries.map((diary: any) => (
                        <div key={diary.id} className="group cursor-pointer">
                            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-xl transition-all duration-500">
                                <Image
                                    src={diary.image_url}
                                    alt={`${keyword.name} diary illustration`}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="mt-3">
                                <div className="text-sm font-handwriting line-clamp-1 text-foreground/90">
                                    {diary.content.replace(/^\[|\]$/g, '').split('\n')[0]}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                    <Heart size={10} className="fill-red-500/50 text-red-500/50" />
                                    <span className="text-[10px] font-bold">{diary.likes?.[0]?.count || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-muted/30 rounded-3xl p-12 text-center border-2 border-dashed border-border/50">
                    <p className="text-muted-foreground font-handwriting text-lg">
                        No picture diaries about {keyword.name} yet.<br />
                        Why not be the first to create one?
                    </p>
                    <Link
                        href="/journal/new"
                        className="mt-6 inline-block bg-primary text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                    >
                        Write a Diary
                    </Link>
                </div>
            )}

            {/* SEO Footer with other keywords */}
            <section className="mt-20 pt-12 border-t border-border/50">
                <h2 className="text-lg font-bold mb-6">Explore More Popular Topics</h2>
                <div className="flex flex-wrap gap-2">
                    {SEO_KEYWORDS.filter(k => k.slug !== slug).map((k) => (
                        <Link
                            key={k.slug}
                            href={`/explore/${k.slug}`}
                            className="px-4 py-2 bg-muted hover:bg-primary hover:text-white rounded-full text-sm font-bold transition-all"
                        >
                            #{k.name}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
