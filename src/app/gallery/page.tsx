"use client"

import { PolaroidCard } from "@/components/PolaroidCard"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface DiaryEntry {
    id: number
    date: string
    imageUrl: string
    caption: string
}

export default function GalleryPage() {
    const supabase = createClient()
    const [entries, setEntries] = useState<DiaryEntry[]>([])

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
