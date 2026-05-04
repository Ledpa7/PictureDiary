export const resizeAndCropImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img')
        img.src = URL.createObjectURL(file)
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('No canvas context'))

            const targetSize = 100
            canvas.width = targetSize
            canvas.height = targetSize

            const minSide = Math.min(img.width, img.height)
            const sx = (img.width - minSide) / 2
            const sy = (img.height - minSide) / 2

            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize)

            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
                else reject(new Error('Blob creation failed'))
            }, file.type, 0.9)
        }
        img.onerror = (e) => reject(e)
    })
}
