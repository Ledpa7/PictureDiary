"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useLanguage } from "@/context/LanguageContext"
import { useGallery } from "@/context/GalleryContext"
import Image from "next/image"
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Lock, Pencil } from "lucide-react"

export default function NewEntryPage() {
    const router = useRouter()
    const supabase = createClient()
    const { language, t } = useLanguage()
    const { refresh } = useGallery()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Form States
    const [title, setTitle] = useState("")
    const [story, setStory] = useState("")
    const [cursorPos, setCursorPos] = useState(0) // Track cursor position
    const [weather, setWeather] = useState("")
    const [date, setDate] = useState({ year: '', month: '', day: '', weekday: '' })
    const [isAutoWeather, setIsAutoWeather] = useState(false)
    const [maxChars, setMaxChars] = useState(50)
    const [isFocused, setIsFocused] = useState(false)

    // Check Level & Set Max Chars based on Language
    useEffect(() => {
        const checkUserLevel = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            let limit = 100 // Unified Free Limit

            if (user) {
                const { data: profile } = await supabase.from('profiles').select('level').eq('id', user.id).maybeSingle()
                if (profile && profile.level >= 100) {
                    limit = 500 // Unified Premium Limit
                }
            }

            setMaxChars(limit)
        }
        checkUserLevel()
    }, [language])

    // Initialize Date
    useEffect(() => {
        const now = new Date()
        const daysKo = ['일', '월', '화', '수', '목', '금', '토']
        const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        setDate({
            year: now.getFullYear().toString(),
            month: (now.getMonth() + 1).toString(),
            day: now.getDate().toString(),
            weekday: language === 'ko' ? daysKo[now.getDay()] : daysEn[now.getDay()]
        })
    }, [language])

    // Fetch Weather
    useEffect(() => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code`)
                const data = await res.json()

                // WMO Weather interpretation (simplified)
                const code = data.current.weather_code
                let weatherText = "Sunny"

                // Enhanced WMO Code Mapping
                if (code === 0) weatherText = "Sunny" // Clear sky
                else if (code >= 1 && code <= 3) weatherText = "Cloudy" // Mainly clear, partly cloudy, and overcast
                else if (code >= 45 && code <= 48) weatherText = "Cloudy" // Fog treated as Cloudy for simplicity (or make a new Fog icon if available, but for now match existing UI options)
                else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) weatherText = "Rainy" // Drizzle, Rain, Showers
                else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) weatherText = "Snowy" // Snow fall, grains, showers
                else if (code >= 95) weatherText = "Stormy" // Thunderstorm

                setWeather(weatherText)
                setIsAutoWeather(true)
                console.log("Auto weather set:", weatherText)
            } catch (e) {
                console.error("Weather fetch failed", e)
                setIsAutoWeather(false) // Explicitly allow manual edit on error
            }
        }, () => {
            console.log("Geolocation denied")
        })
    }, [])


    const handleGenerateAndSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isGenerating) return

        setIsGenerating(true)
        setErrorMessage(null)

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            setErrorMessage(language === 'ko' ? "로그인이 필요합니다." : "You must be logged in.")
            setIsGenerating(false)
            return
        }

        try {
            // --- Gemini Nano (Chrome Built-in AI) Optimization ---
            let localRefinedPrompt = "";
            const promptContext = `Weather: ${weather}, Title: ${title}, Story: ${story}`

            try {
                // Check if Chrome's window.ai (Prompt API) is available
                // @ts-ignore - window.ai is experimental
                if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
                    console.log("[Gemini Nano] Local AI detected. Attempting refinement...");
                    // @ts-ignore
                    const capabilities = await window.ai.languageModel.capabilities();

                    if (capabilities.available !== 'no') {
                        // @ts-ignore
                        const session = await window.ai.languageModel.create({
                            systemPrompt: "You are an expert art director. Convert a diary entry into a detailed English image prompt. Style: Soft, hand-drawn art style, colored pencils/crayons, warm texture. Output only the prompt."
                        });

                        localRefinedPrompt = await session.prompt(`Diary Entry: "${promptContext}"\n\nImage Prompt:`);
                        session.destroy();
                        console.log("[Gemini Nano] Prompt refined locally:", localRefinedPrompt);
                    }
                }
            } catch (localAiError) {
                console.warn("[Gemini Nano] Local refinement failed, falling back to server:", localAiError);
            }

            // 1. Generate Image (Pass localRefinedPrompt if available)
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: promptContext,
                    preRefinedPrompt: localRefinedPrompt // Pass the locally generated prompt
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to generate image")

            setGeneratedImage(data.imageUrl)

            // 2. Save to Supabase Immediately
            const fullContent = `${title}\n${story}`
            const { error } = await supabase
                .from('diaries')
                .insert({
                    content: fullContent,
                    image_url: data.imageUrl,
                    user_id: user.id,
                    prompt: data.refinedPrompt
                })

            if (error) throw error
            refresh()
            router.push("/gallery")

        } catch (error: any) {
            console.error("Process failed:", error)
            setErrorMessage(error.message)
            setIsGenerating(false)
        }
    }

    const handleBoxClick = (index: number) => {
        if (!textareaRef.current) return
        const targetPos = Math.min(index, story.length)
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(targetPos, targetPos)
        setCursorPos(targetPos)
    }

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const isManualScroll = useRef(false)

    // Helper: Manual Scroll Trigger
    const checkAndScroll = (currentIndex: number) => {
        // User Request: "Don't jump back on next char."
        // Strategy: Persistent Line Lock.
        // Instead of scrolling ONLY at 51, we enforce the scroll position
        // for the ENTIRE duration of writing that line (51-59).
        // Anchoring to the start of the line (50, 60, 70...)

        // Reset manual scroll flag on typing
        isManualScroll.current = false

        if (currentIndex >= 50) {
            // Calculate the "Anchor" index (Start of the current line)
            // e.g. 53 -> 50, 68 -> 60
            const anchorIndex = Math.floor(currentIndex / 10) * 10

            // No delay needed, we want instant correction
            setTimeout(() => {
                // If user tried to scroll manually in the meantime, don't force it?
                // No, when typing, we must force it to prevent jitter.
                if (isManualScroll.current) return

                const anchorBox = document.getElementById(`char-box-${anchorIndex}`)
                const container = scrollContainerRef.current
                const textarea = textareaRef.current

                if (anchorBox && container && textarea) {
                    // Previously: Align to TOP (activeBox.offsetTop - 10)
                    // New Request: Align to BOTTOM ("Left Rear/Bottom")
                    // We calculate the position so the current line sits at the bottom of the view.

                    const containerHeight = container.clientHeight
                    const rowHeight = anchorBox.offsetHeight

                    // Box Top Position - Container Height + Box Height + Padding (20px for breathing room)
                    // This puts the box right at the bottom edge.
                    // But if it's strictly at bottom, it might feel cramped. Let's give it 40px padding?
                    // User said "Left Rear", implying Bottom. Let's use standard bottom alignment.
                    const targetScrollTop = anchorBox.offsetTop - containerHeight + rowHeight + 10

                    // Enforce Lock on every keystroke
                    container.scrollTo({ top: targetScrollTop })
                    textarea.scrollTop = targetScrollTop
                }
            }, 0)
        }
    }

    // Unlock on user interaction
    const unlockScroll = () => {
        isManualScroll.current = true
    }

    return (
        <div className="container max-w-2xl py-10 px-4 mx-auto font-handwriting">
            {/* Outer Frame - 4B Pencil Style (White Border) */}
            <div className="border-4 border-white rounded-sm bg-card flex flex-col mb-3 md:mb-6">

                {/* Header: Date & Weather */}
                <div className="flex flex-col md:flex-row border-b-[3px] border-white md:h-14 h-auto">
                    <div className="flex-1 md:flex-[3] flex items-center justify-start md:justify-center gap-1 md:gap-2 border-b-[3px] md:border-b-0 md:border-r-[3px] border-white text-lg md:text-xl font-bold text-primary py-1 md:py-0 pl-4 md:pl-0">
                        <span>{date.year}</span> <span className="text-[10px] md:text-sm font-normal">{language === 'ko' ? '년' : 'Year'}</span>
                        <span>{date.month}</span> <span className="text-[10px] md:text-sm font-normal">{language === 'ko' ? '월' : 'Month'}</span>
                        <span>{date.day}</span> <span className="text-[10px] md:text-sm font-normal">{language === 'ko' ? '일' : 'Day'}</span>
                        <span>{date.weekday}{language === 'ko' ? '요일' : ''}</span>
                    </div>
                    <div className="flex-1 md:flex-[2] flex items-center justify-end md:justify-center gap-2 px-2 py-1 md:py-0 overflow-x-auto md:overflow-visible pr-4 md:pr-0">
                        <div className="flex items-center gap-1">
                            <span className="whitespace-nowrap shrink-0 text-sm font-bold text-primary">{language === 'ko' ? '날씨:' : 'Weather:'}</span>
                            {isAutoWeather && <Lock size={14} className="text-stone-400" />}
                        </div>
                        {['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Stormy'].map((w) => {
                            const Icon = w === 'Sunny' ? Sun : w === 'Cloudy' ? Cloud : w === 'Rainy' ? CloudRain : w === 'Snowy' ? Snowflake : CloudLightning;
                            const isSelected = weather === w;
                            return (
                                <button
                                    key={w}
                                    onClick={() => !isAutoWeather && setWeather(w)}
                                    disabled={isAutoWeather}
                                    className={`transition-all ${!isAutoWeather && 'hover:scale-110'} ${isSelected ? 'text-primary scale-110' : 'text-muted-foreground'} ${isAutoWeather ? 'cursor-default' : 'cursor-pointer'}`}
                                    title={w}
                                >
                                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isSelected ? "fill-current stroke-[3px]" : "stroke-[2.5px]"}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Image Area */}
                <div className="aspect-[4/3] w-full border-b-[3px] border-stone-200 relative flex items-center justify-center bg-card overflow-hidden">
                    {generatedImage ? (
                        <Image src={generatedImage} alt="Generated Diary" fill className="object-cover" />
                    ) : (
                        <div className="text-center p-6">
                            {isGenerating ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="animate-[spin_3s_linear_infinite]">
                                            <Pencil size={48} className="text-primary fill-primary/20" />
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold animate-pulse text-muted-foreground mt-2">
                                        {language === 'ko' ? '추억을 그리는 중...' : 'Sketching your memory...'}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground font-bold text-lg">
                                    {language === 'ko' ? '일기를 쓰면 이곳에 그림이 그려져요.' : 'Write your diary, and a drawing will appear here.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Title Section */}
                <div
                    className="h-10 border-b-[3px] border-stone-200 flex items-center px-4 gap-2 md:gap-3 cursor-text"
                    onClick={() => document.getElementById('title-input')?.focus()}
                >
                    <span className="font-bold text-base md:text-xl text-primary whitespace-nowrap">{language === 'ko' ? '제목:' : 'Title:'}</span>
                    <input
                        id="title-input"
                        value={title}
                        maxLength={20}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent focus:outline-none font-bold text-lg md:text-2xl text-foreground placeholder:text-muted-foreground"
                        placeholder={language === 'ko' ? '제목을 입력하세요' : 'Enter title'}
                    />
                    {/* Character Counter */}
                    <div className="font-bold text-primary text-sm md:text-lg whitespace-nowrap">
                        {story.length} / {maxChars}
                    </div>
                </div>

                {/* Grid Content Section - Manuscript Paper (Won-go-ji) Style */}
                {/* Scrollable Viewport - Fixed to show approx 5 rows (50 chars) */}
                <div
                    ref={scrollContainerRef}
                    className="relative w-full aspect-[2/1] bg-card overflow-y-auto border-t border-stone-200"
                    onWheel={unlockScroll}       // Unlock immediately on mouse wheel
                    onTouchStart={unlockScroll}  // Unlock immediately on touch
                >

                    {/* Inner Content Container */}
                    <div className="relative w-full min-h-full">
                        {/* The Grid */}
                        <div className="grid grid-cols-10 gap-[2px] p-[2px]">
                            {Array.from({ length: maxChars }).map((_, i) => (
                                <div
                                    key={i}
                                    id={`char-box-${i}`}
                                    onClick={() => handleBoxClick(i)}
                                    className={`
                                    aspect-square border border-stone-200 flex items-center justify-center
                                    text-lg md:text-2xl leading-none font-bold text-foreground relative cursor-text
                                    ${i < story.length ? '' : ''}
                                `}
                                    style={{
                                        fontFamily: 'var(--font-gaegu)'
                                    }}
                                >
                                    {/* The Character */}
                                    <span className="z-10">{story[i] || ''}</span>

                                    {/* Custom Cursor Logic */}
                                    {isFocused && i === cursorPos && (
                                        <div className="absolute inset-1 md:inset-2 border-4 border-primary rounded-full animate-pulse pointer-events-none opacity-50" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Invisible Input Overlay */}
                        <textarea
                            ref={textareaRef}
                            id="story-input"
                            maxLength={maxChars}
                            value={story}
                            onChange={(e) => {
                                setStory(e.target.value)
                                const newCursorPos = e.target.selectionStart
                                setCursorPos(newCursorPos)
                                checkAndScroll(newCursorPos)
                            }}
                            onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
                            onKeyUp={(e) => {
                                const pos = e.currentTarget.selectionStart
                                setCursorPos(pos)
                                checkAndScroll(pos)
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none resize-none text-base z-20 overflow-hidden"
                            autoFocus
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </div>
                </div>

            </div>

            {/* Error & Controls */}
            {errorMessage && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 text-sm rounded">
                    {errorMessage}
                </div>
            )}

            {!isGenerating && !generatedImage && (
                <button
                    onClick={handleGenerateAndSave}
                    className="w-full mt-3 md:mt-6 py-4 bg-[#FF8BA7] text-black font-bold text-xl rounded shadow-lg hover:scale-[1.02] transition-transform"
                >
                    {language === 'ko' ? '그림일기 완성하기' : 'Complete Diary'}
                </button>
            )}
        </div>
    )
}
