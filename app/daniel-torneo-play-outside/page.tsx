import PlayOutsidePage from './play-outside-page';
import { PLAY_OUTSIDE_RELEASE_AT } from '@/lib/play-outside';
import { getPlayOutsideMetadata } from '@/lib/play-outside-share';

export const metadata = getPlayOutsideMetadata(false);

export default function PlayOutside() {
  // The Worker serves this export only before the release instant.
  return <PlayOutsidePage initialNow={Math.min(Date.now(), PLAY_OUTSIDE_RELEASE_AT - 1)} />;
}
