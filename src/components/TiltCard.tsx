"use client"

import React, { useRef, useState } from "react"

interface TiltCardProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export default function TiltCard({ children, className = "", onClick }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [rotation, setRotation] = useState({ x: 0, y: 0 })
    const [scale, setScale] = useState(1)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return

        const rect = ref.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Calculate rotation based on cursor position relative to center
        // Center is (0.5, 0.5)
        // Range: -1 to 1
        const xPct = (x / rect.width - 0.5) * 2
        const yPct = (y / rect.height - 0.5) * 2

        // Tilt intensity (Max degrees)
        const MAX_TILT = 15

        // Invert X for Y rotation (Mouse right -> Tilt right around Y axis)
        // Invert Y for X rotation (Mouse down -> Tilt down around X axis) by default logic
        setRotation({
            x: -yPct * MAX_TILT,
            y: xPct * MAX_TILT
        })
    }

    const handleMouseEnter = () => {
        setScale(1.05) // Slight zoom in
    }

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 })
        setScale(1)
    }

    return (
        <div className="h-full w-full animate-in fade-in slide-in-from-bottom-8 duration-700 active:scale-95 transition-transform ease-out">
            <div
                ref={ref}
                onClick={onClick}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`transition-transform ease-out duration-200 ${className}`}
                style={{
                    transform: `
                        perspective(1000px)
                        rotateX(${rotation.x}deg)
                        rotateY(${rotation.y}deg)
                        scale3d(${scale}, ${scale}, ${scale})
                    `,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {/* Glossy Effect Container */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-inherit z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{
                        background: `linear-gradient(125deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                        mixBlendMode: "overlay"
                    }}
                />
                {children}
            </div>
        </div>
    )
}
