
import { Metadata } from 'next';
import { SEO_KEYWORDS } from '@/constants/seo-keywords';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: "Explore All Topics | Doodle Log",
    description: "Browse all AI picture diary topics and discover curated diary collections by theme. Find inspiration for your next diary entry.",
    openGraph: {
        title: "Explore All Topics | Doodle Log",
        description: "Discover AI picture diary collections organized by popular themes and topics.",
    },
};

export default function AllKeywordsPage() {
    return (
        <div className="container max-w-4xl py-12 px-4 mx-auto pb-24 text-foreground min-h-screen">
            <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Gallery
            </Link>

            <header className="mb-12">
                <h1 className="text-3xl md:text-5xl font-bold font-gaegu mb-4">
                    Explore All Topics
                </h1>
                <p className="text-xl text-muted-foreground font-handwriting">
                    Discover AI-curated picture diary collections across a variety of themes.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SEO_KEYWORDS.map((k) => (
                    <Link
                        key={k.slug}
                        href={`/explore/${k.slug}`}
                        className="p-6 bg-card hover:bg-primary/5 border border-border rounded-2xl transition-all group"
                    >
                        <div className="text-lg font-bold text-primary mb-1">#{k.name}</div>
                        <div className="text-sm text-muted-foreground">{k.description}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
