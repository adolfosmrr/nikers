import { MatrixText } from "./matrix-text"

interface HeroCounterProps {
  current: number
  total: number
  onNext: () => void
  onPrev: () => void
}

export function HeroCounter({ current, total, onNext, onPrev }: HeroCounterProps) {
  return (
    <div data-exit="down"
      className="absolute right-8 bottom-8 flex h-9 items-center gap-4 text-white">
      <button className="rounded-full bg-white px-4 py-1 text-black" onClick={onPrev} type="button">
        Prev
      </button>
      <p className="text-2xl">
        <MatrixText text={String(current)} /> · {total}
      </p>
      <button className="rounded-full bg-white px-4 py-1 text-black" onClick={onNext} type="button">
        Next
      </button>
    </div>
  )
}
