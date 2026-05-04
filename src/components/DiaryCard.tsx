import React from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import TiltCard from './TiltCard'
import { parseCaption } from '@/lib/utils'

interface DiaryEntry {
    id: number
    userId: string
    date: string
    imageUrl: string
    caption: string
    likes: number
    isLiked: boolean
}

interface DiaryCardProps {
    entry: DiaryEntry;
    onClick: (entry: DiaryEntry) => void;
}

const DiaryCard = React.memo(({ entry, onClick }: DiaryCardProps) => {
    const { title, body } = parseCaption(entry.caption);

    return (
        <div style={{ contentVisibility: 'auto', containIntrinsicSize: '300px' }} className="h-full">
            <TiltCard
                onClick={() => onClick(entry)}
                className="group relative cursor-pointer bg-card flex flex-col h-full hover:z-10 shadow-sm border border-border overflow-hidden rounded-md"
            >
                <div className="relative aspect-square w-full bg-muted">
                    <Image
                        src={entry.imageUrl}
                        alt="Diary Entry"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 20vw"
                        loading="lazy"
                    />
                </div>
                <div className="p-3 bg-card flex flex-col justify-between flex-1">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">{entry.date}</p>
                        <div className="text-sm font-handwriting text-foreground line-clamp-2 leading-snug">
                            <span className="font-bold text-base mr-1">{title}</span>
                            <span className="opacity-80">{body.replace(/\n/g, ' ')}</span>
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
        </div>
    )
}, (prevProps, nextProps) => {
    // Only re-render if essential visual states change
    return (
        prevProps.entry.id === nextProps.entry.id &&
        prevProps.entry.isLiked === nextProps.entry.isLiked &&
        prevProps.entry.likes === nextProps.entry.likes
    )
})

export default DiaryCard
