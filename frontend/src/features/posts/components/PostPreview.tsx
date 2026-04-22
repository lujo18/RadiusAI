import { Card } from '@/components/ui/card'
import { usePostWithAnalytics } from '@/lib/api/hooks/usePosts'
import { Eye, Heart, ImageOff, MessageCircle } from 'lucide-react'
import type { PostWithAnalytics } from '@/types/types'
import { Skeleton } from '@/components/ui/skeleton'

type PostPreviewProps = {
  post?: PostWithAnalytics | null
  postId?: string
}

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const PostPreview = ({ post, postId }: PostPreviewProps) => {
  const shouldFetch = !post && !!postId
  const { data: fetchedPost, isLoading } = usePostWithAnalytics(shouldFetch ? postId : null)
  const resolvedPost = post ?? fetchedPost

  const storageUrls = resolvedPost?.storage_urls
  const content = resolvedPost?.content
  const analytics = resolvedPost?.analytics

  let thumbnail: string | undefined

  if (Array.isArray(storageUrls) && typeof storageUrls[0] === 'string') {
    thumbnail = storageUrls[0]
  } else if (isRecord(storageUrls)) {
    const slides = storageUrls.slides
    const slideUrls = storageUrls.slide_urls
    const thumb = storageUrls.thumbnail

    if (Array.isArray(slides) && typeof slides[0] === 'string') {
      thumbnail = slides[0]
    } else if (Array.isArray(slideUrls) && typeof slideUrls[0] === 'string') {
      thumbnail = slideUrls[0]
    } else if (typeof thumb === 'string') {
      thumbnail = thumb
    }
  }

  let title = 'Untitled post'

  if (isRecord(content)) {
    if (typeof content.title === 'string') {
      title = content.title
    } else if (typeof content.description === 'string') {
      title = content.description
    } else if (typeof content.caption === 'string') {
      title = content.caption
    }
  }

  const stats = [
    {
      icon: Heart,
      label: 'Likes',
      value: analytics?.likes ?? 0,
    },
    {
      icon: MessageCircle,
      label: 'Comments',
      value: analytics?.comments ?? 0,
    },
    {
      icon: Eye,
      label: 'Views',
      value: analytics?.impressions ?? 0,
    },
  ]

  if (isLoading) {
    return (
      <Skeleton className='max-w-[320px] aspect-9/16'></Skeleton>
    )
  }

  return (
    <Card className="relative max-w-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-black p-0 shadow-2xl">
      <div className="relative aspect-9/16 w-full">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-400">
            <ImageOff className="size-10" aria-hidden="true" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        <div className="absolute bottom-4 left-4 right-15 z-10">
          <p className="line-clamp-3 text-sm font-semibold leading-tight muted">{title}</p>
        </div>

        <div className="absolute bottom-4 right-0 z-10 flex flex-col items-center gap-4 text-white">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="flex min-w-[42px] flex-col items-center gap-1"
                aria-label={`${compactNumberFormatter.format(stat.value)} ${stat.label.toLowerCase()}`}
              >
                <Icon className="size-[50%] drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]" aria-hidden="true" />
                <span className="text-xs font-semibold leading-none text-white tabular-nums">
                  {compactNumberFormatter.format(stat.value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
