import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../../store/toast'

export function Toast() {
  const { text, id } = useToast()
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 10, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -6, x: '-50%' }}
          transition={{ duration: 0.25 }}
          className="absolute left-1/2 z-40 whitespace-nowrap rounded-tile bg-ink px-4 py-2.5 text-sm font-bold text-bg"
          style={{ top: 'calc(var(--top) + 12px)' }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
