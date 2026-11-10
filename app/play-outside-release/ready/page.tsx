import PlayOutsidePage from '@/app/daniel-torneo-play-outside/play-outside-page';
import { PLAY_OUTSIDE_RELEASE_AT } from '@/lib/play-outside';
import { getPlayOutsideMetadata } from '@/lib/play-outside-share';

export const metadata = getPlayOutsideMetadata(true);

export default function PlayOutsideReadyAsset() {
  return <PlayOutsidePage initialNow={PLAY_OUTSIDE_RELEASE_AT} />;
}
