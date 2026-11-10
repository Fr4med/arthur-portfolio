import manifest from '@/lib/photo-manifest.json';

export default function Photo({ id, alt, priority = false, className = '' }: {
  id: number;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = manifest.find(item => item.id === id)!;
  const stem = photo.stem ?? `/photos/${String(id).padStart(2, '0')}`;

  return <img
    className={className}
    src={`${stem}-1600.webp`}
    srcSet={`${stem}-640.webp 640w, ${stem}-1600.webp ${photo.width}w`}
    sizes="(max-width:700px) 90vw, 60vw"
    width={photo.width}
    height={photo.height}
    alt={alt}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'}
  />;
}
