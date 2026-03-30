import type { FuriganaToken } from '@/types/ai'

interface Props {
  tokens: FuriganaToken[]
}

export default function RubyText({ tokens }: Props) {
  return (
    <span>
      {tokens.map((token, i) =>
        token.reading ? (
          <ruby key={i} className="ruby-token">
            {token.original}
            <rp>(</rp>
            <rt className="text-gray-400">{token.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{token.original}</span>
        )
      )}
    </span>
  )
}
