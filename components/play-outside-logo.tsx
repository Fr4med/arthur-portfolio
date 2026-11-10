export default function PlayOutsideLogo({ className, priority = false, sizes = '(max-width: 700px) 25vw, (max-width: 1100px) 120px, 180px' }: { className?: string; priority?: boolean; sizes?: string }) {
  return <img
    className={className}
    src="/films/play-outside/branding/play-outside-logo-320.webp"
    srcSet="/films/play-outside/branding/play-outside-logo-160.webp 160w, /films/play-outside/branding/play-outside-logo-320.webp 320w, /films/play-outside/branding/play-outside-logo-640.webp 640w, /films/play-outside/branding/play-outside-logo-1280.webp 1280w"
    sizes={sizes}
    width={1536}
    height={1024}
    alt="Play Outside project logo"
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
  />;
}
