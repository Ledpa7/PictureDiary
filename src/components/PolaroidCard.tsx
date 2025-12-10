import Image from "next/image"

interface PolaroidProps {
    date: string
    imageUrl: string
    caption: string
}

export function PolaroidCard({ date, imageUrl, caption }: PolaroidProps) {
    return (
        <div className="group relative bg-white p-4 shadow-lg transition-transform hover:-translate-y-2 hover:rotate-1 hover:shadow-xl w-full max-w-[280px] mx-auto rotate-0 odd:rotate-1 even:-rotate-1">
            {/* Paper texture overlay could go here */}
            <div className="aspect-square relative w-full mb-4 bg-gray-100 overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={caption}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="font-handwriting text-center">
                <p className="text-primary font-bold text-lg mb-1">{date}</p>
                <p className="text-gray-600 leading-tight">{caption}</p>
            </div>
        </div>
    )
}
