import { createContext, useContext, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'
import { cn } from '@/lib/utils'

const DragContext = createContext(null)

export function DraggableCardContainer({ children, className, ...props }) {
  const containerRef = useRef(null)

  return (
    <DragContext.Provider value={containerRef}>
      <div
        ref={containerRef}
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </div>
    </DragContext.Provider>
  )
}

export function DraggableCardBody({
  children,
  className,
  rotate = 0,
  zIndex = 10,
  ...props
}) {
  const containerRef = useContext(DragContext)
  const cardRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springConfig = { stiffness: 220, damping: 22 }
  const smoothX = useSpring(pointerX, springConfig)
  const smoothY = useSpring(pointerY, springConfig)
  const rotateX = useTransform(smoothY, [-80, 80], [10, -10])
  const rotateY = useTransform(smoothX, [-80, 80], [-10, 10])

  const handleMouseMove = (event) => {
    const el = cardRef.current
    if (!el || dragging) return

    const rect = el.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    pointerX.set(Math.max(-80, Math.min(80, x)))
    pointerY.set(Math.max(-80, Math.min(80, y)))
  }

  const handleMouseLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={containerRef}
      dragElastic={0.16}
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false)
        pointerX.set(0)
        pointerY.set(0)
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 26, scale: 0.9, rotate }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotate }}
      whileDrag={{ scale: 1.045 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      style={{
        rotateX,
        rotateY,
        zIndex: dragging ? 60 : zIndex,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'absolute cursor-grab select-none active:cursor-grabbing',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
