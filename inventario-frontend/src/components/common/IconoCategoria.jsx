export function IconoCategoria({
  value,
  size = 32,
  className = ''
}) {
  if (!value) return null

  return (
    <span
      style={{ fontSize: size }}
      className={`inline-flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {value}
    </span>
  )
}
