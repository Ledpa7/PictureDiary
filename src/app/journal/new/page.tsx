"use client"

import { useState } from "react"
import { PolaroidCard } from "@/components/PolaroidCard"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewEntryPage() {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [story, setStory] = useState("")

    const handleDrawPicture = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)

        // Mock 3-second delay
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Fixed reliable placeholder
        const randomImage = "https://picsum.photos/seed/picsum/400/400"

        setGeneratedImage(randomImage)
        setIsGenerating(false)
    }

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault()

        console.log("Saving diary to:", process.env.NEXT_PUBLIC_SUPABASE_URL)

        // Save to Supabase
        const { error } = await supabase
            .from('diaries')
            .insert({
                content: story || "My Diary Entry",
                image_url: generatedImage
            })

        if (error) {
            console.error('Error saving diary:', error)
            alert("Save Failed: " + error.message)
            return
        }

        alert("Saved to REAL Database!")
        router.push("/gallery")
    }

    return (
        <div className="container max-w-4xl py-10 px-4">
            <div className="bg-white p-8 rounded-sm shadow-xl min-h-[600px] border border-stone-200 relative"
                style={{ backgroundImage: 'linear-gradient(#f1f1f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
                {/* Paper texture and holes decoration could be added here */}

                {/* Header Section */}
                <header className="mb-8 flex justify-between items-baseline font-handwriting">
                    <div className="flex gap-4 items-center">
                        <span className="text-stone-400 text-xl">Date:</span>
                        <span className="text-2xl text-stone-800 border-b-2 border-dashed border-stone-300 min-w-[150px] inline-block">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="text-stone-400 text-xl">Weather:</span>
                        <div className="flex gap-2">
                            {['☀️', '☁️', '🌧️', '☃️'].map(weather => (
                                <button key={weather} className="text-2xl hover:scale-125 transition-transform opacity-60 hover:opacity-100 p-1">
                                    {weather}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Writing Area */}
                    <form className="flex-1 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                            <h1 className="text-4xl text-primary font-bold mb-6 text-center">Today's Story</h1>

                            <textarea
                                className="w-full min-h-[300px] bg-transparent text-xl leading-10 text-stone-800 p-4 resize-none focus:outline-none font-handwriting"
                                placeholder="Dear Diary, today I..."
                                value={story}
                                onChange={(e) => setStory(e.target.value)}
                                style={{
                                    lineHeight: '40px',
                                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #d1d5db 40px)',
                                    backgroundAttachment: 'local'
                                }}
                            />
                        </div>

                        {!generatedImage && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleDrawPicture}
                                    disabled={isGenerating}
                                    className="bg-primary text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg hover:bg-primary/90 hover:scale-105 transition-all transform flex items-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="animate-spin">🌀</span>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🎨</span>
                                            <span>Draw Picture</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Result Area */}
                    {(generatedImage || isGenerating) && (
                        <div className="flex-1 flex flex-col items-center justify-center border-l-2 border-dashed border-stone-200 pl-8 min-h-[400px]">
                            {isGenerating ? (
                                <div className="text-center space-y-4">
                                    <div className="text-6xl animate-bounce">🎨</div>
                                    <p className="font-handwriting text-2xl text-stone-500">Painting your memory...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <PolaroidCard
                                        date="Today"
                                        caption={story || "My Memory"}
                                        imageUrl={generatedImage!}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        className="mt-8 w-full bg-green-500 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-600 hover:scale-105 transition-all"
                                    >
                                        💾 Save Diary
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
