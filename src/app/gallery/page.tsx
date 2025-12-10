"use client"

import { PolaroidCard } from "@/components/PolaroidCard"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

// Mock Data for display
const MOCK_ENTRIES = [
    {
        id: 1,
        date: "Dec 08, 2025",
        imageUrl: "https://images.unsplash.com/photo-1596464716127-f9a0819421f6?q=80&w=600&auto=format&fit=crop",
        caption: "Built a snowman in the garden!",
    },
    {
        id: 2,
        date: "Dec 05, 2025",
        imageUrl: "https://images.unsplash.com/photo-1516233758813-a38d024919c5?q=80&w=600&auto=format&fit=crop",
        caption: "Had strawberry ice cream.",
    },
    {
        id: 3,
        date: "Nov 30, 2025",
        imageUrl: "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?q=80&w=600&auto=format&fit=crop",
        caption: "Playing with my cat.",
    },
]

interface DiaryEntry {
    id: number
    date: string
    imageUrl: string
    caption: string
}

export default function GalleryPage() {
    const [entries, setEntries] = useState<DiaryEntry[]>(MOCK_ENTRIES)

    useEffect(() => {
        const fetchEntries = async () => {
            const { data, error } = await supabase
                .from('diaries')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                // Map Supabase data format to UI format if necessary
                const mappedEntries = data.map((d: any) => ({
                    id: d.id, // ID might be number or string, component cares about key
                    date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    imageUrl: d.image_url,
                    caption: d.content
                }))
                setEntries(mappedEntries)
            }
        }

        fetchEntries()
    }, [])

    return (
        <div className="container max-w-6xl py-12 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-bold text-primary mb-4 font-handwriting">My Memory Gallery</h1>
                <p className="text-xl text-stone-500 font-handwriting">Collection of precious moments</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 gap-y-12 pb-20">
                {entries.map((entry) => (
                    <PolaroidCard
                        key={entry.id}
                        date={entry.date}
                        imageUrl={entry.imageUrl}
                        caption={entry.caption}
                    />
                ))}

                {/* Empty State / Add New Placeholder */}
                <a href="/journal/new" className="group relative bg-stone-100/50 p-4 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center min-h-[320px] hover:border-primary/50 hover:bg-stone-50 transition-colors cursor-pointer w-full max-w-[280px] mx-auto">
                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                        ➕
                    </div>
                    <p className="font-handwriting text-xl text-stone-500">Add New Memory</p>
                </a>
            </div>
        </div>
    )
}
