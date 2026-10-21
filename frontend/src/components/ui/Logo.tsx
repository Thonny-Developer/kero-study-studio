export function Logo({ size = 21 }: { size?: number }) {
  return (
    <div className="flex items-baseline font-display font-extrabold" style={{ fontSize: size, letterSpacing: '-.04em' }}>
      vibely<span className="animate-caret text-acc">_</span>
    </div>
  )
}
