
import { SEO_KEYWORDS } from '@/constants/seo-keywords';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AllKeywordsPage() {
    return (
        <div className="container max-w-4xl py-12 px-4 mx-auto pb-24 text-foreground min-h-screen">
            <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                갤러리로 돌아가기
            </Link>

            <header className="mb-12">
                <h1 className="text-3xl md:text-5xl font-bold font-gaegu mb-4">
                    탐색 키워드 전체보기
                </h1>
                <p className="text-xl text-muted-foreground font-handwriting">
                    AI가 추천하는 다양한 주제의 그림일기를 만나보세요.
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
