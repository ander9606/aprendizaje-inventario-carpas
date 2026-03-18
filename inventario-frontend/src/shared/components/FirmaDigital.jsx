// ============================================
// COMPONENTE: FirmaDigital
// Canvas táctil para captura de firma
// Optimizado para tabletas
// ============================================

import { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser, Check, Pen } from 'lucide-react'

export default function FirmaDigital({ onConfirm, width = 400, height = 200, disabled = false }) {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        // Set canvas resolution for retina displays
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(dpr, dpr)

        // Initial state
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Draw signature line
        ctx.beginPath()
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.moveTo(20, height - 40)
        ctx.lineTo(width - 20, height - 40)
        ctx.stroke()
        ctx.setLineDash([])

        // Reset stroke style
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 2
    }, [width, height])

    const getPosition = useCallback((e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()

        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            }
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }, [])

    const startDrawing = useCallback((e) => {
        if (disabled) return
        e.preventDefault()
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const pos = getPosition(e)

        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        setIsDrawing(true)
        setHasDrawn(true)
    }, [disabled, getPosition])

    const draw = useCallback((e) => {
        if (!isDrawing || disabled) return
        e.preventDefault()
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const pos = getPosition(e)

        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 2
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
    }, [isDrawing, disabled, getPosition])

    const stopDrawing = useCallback((e) => {
        if (e) e.preventDefault()
        setIsDrawing(false)
    }, [])

    const limpiar = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1

        ctx.clearRect(0, 0, width * dpr, height * dpr)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Redraw signature line
        ctx.beginPath()
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.moveTo(20, height - 40)
        ctx.lineTo(width - 20, height - 40)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 2

        setHasDrawn(false)
    }

    const confirmar = () => {
        if (!hasDrawn) return
        const canvas = canvasRef.current
        const dataUrl = canvas.toDataURL('image/png')
        onConfirm?.(dataUrl)
    }

    // Prevent page scroll when touching canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const preventScroll = (e) => {
            if (isDrawing) e.preventDefault()
        }

        canvas.addEventListener('touchmove', preventScroll, { passive: false })
        return () => canvas.removeEventListener('touchmove', preventScroll)
    }, [isDrawing])

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Pen className="w-4 h-4" />
                <span>Firme aquí con el dedo o stylus</span>
            </div>

            <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white touch-none">
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
                    className="cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={limpiar}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <Eraser className="w-4 h-4" />
                    Limpiar
                </button>
                <button
                    onClick={confirmar}
                    disabled={!hasDrawn || disabled}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Check className="w-4 h-4" />
                    Confirmar Firma
                </button>
            </div>
        </div>
    )
}
