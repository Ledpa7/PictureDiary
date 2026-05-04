import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCaption(caption: string): { title: string, body: string } {
    let title = ""
    let body = ""
    if (!caption) return { title, body }
    
    const parts = caption.split(/\r?\n/)
    if (parts.length > 1) {
        title = parts[0]
        body = parts.slice(1).join('\n').trim()
    } else {
        const bracketIndex = caption.indexOf(']')
        if (bracketIndex !== -1 && bracketIndex < caption.length - 1) {
            title = caption.slice(0, bracketIndex + 1).trim()
            body = caption.slice(bracketIndex + 1).trim()
        } else {
            title = caption
            body = ""
        }
    }
    title = title.replace(/^\[|\]$/g, '')
    return { title, body }
}
