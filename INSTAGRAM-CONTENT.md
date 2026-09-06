# Instagram posts for the portfolio

Show Arthur's filming and editing work. Use feed posts, carousels and Reels. Never use Stories or Highlights.

## First set of rules

The starting rule requires a clear statement of Arthur's role. It is deliberately conservative. A keyword match does not prove authorship, so unclear captions stay off the website until reviewed.

| Caption signal | Decision |
| --- | --- |
| Filmed by me, filming by Arthur Khitrik, video by @arthurkhitrik, I filmed | Include as filming |
| Edited by me, edit by @arthurkhitrik, I edited, my edit | Include as editing |
| Film/video I made, created or produced | Include as a film project |
| #filmedbyarthur, #filmedbyarthurkhitrik, #filmedbyme | Include as filming |
| #editedbyarthur, #editedbyarthurkhitrik, #editedbyme | Include as editing |
| צילום ועריכה שלי, עריכה: @arthurkhitrik, ערכתי את הסרטון | Include the stated role |
| Filming, editing, shooting, BTS without a clear role credit | Leave out pending review |
| Skate, session, Paris, a brand mention, or attendance at an event | Do not qualify on their own |
| Another person's credit, a denial or a question about a credit | Do not qualify on their own |
| #notportfolio or #akprivate | Exclude |

Only captions on @arthurkhitrik's account are processed. Credit phrases are matched as words, and hashtags must match exactly. A reference to another filmer does not count as Arthur's filming credit. Photo credits alone do not qualify a post as video work. Dates order the qualifying posts; popularity does not affect selection.

These tags are proposed conventions, not a claim that Arthur already uses them. They can be changed in `lib/instagram-rules.ts`. Specific approved or rejected post shortcodes can be recorded in `postOverrides`; a Story can never be approved through an override.

## Review of the available posts

The public Instagram preview exposed these six post captions on 6 September 2026. This is not a review of the entire account.

| Post | What the caption establishes | Initial decision |
| --- | --- | --- |
| [SHABBAT SESH clip](https://www.instagram.com/p/Dcf_JeJNzu8/) | Arthur says he made the video | Include as a film project |
| [A MUD SHOW](https://www.instagram.com/p/Da3NzigNfTv/) | No filming or editing role stated | Exclude |
| [MUDCAN BOYZ](https://www.instagram.com/p/DZ1RXBACJ84/) | Brand mention without a role | Exclude |
| [Netanya nationals](https://www.instagram.com/p/DZABIVdjfKl/) | Event participation and another person's photo credit | Exclude |
| [Polaroid post](https://www.instagram.com/p/DX0yCy9DItC/) | Photography, no filming or editing role | Exclude |
| [RVCA shoot](https://www.instagram.com/p/DXURff6jHqd/) | A shoot is mentioned, but Arthur's role is unclear | Needs Arthur's confirmation |

## Suggested caption structure

Keep the personal caption. Add a clear credit block with only the roles Arthur actually performed:

```text
[Project or client]
[Your caption about the work]

Filming: @arthurkhitrik
Editing: @arthurkhitrik
[Other people's credits]

#filmedbyarthur #editedbyarthur
```

Use only the applicable line and hashtag when Arthur performed one role. The credit line already qualifies the post; hashtags are optional. For a relevant post whose caption cannot change, approve its individual link after reviewing it.

## Automatic updates

The filtered feed needs authorized read access to Arthur's Instagram Creator/Business account. The server integration is ready, but there is no account token configured yet. Until connected, the page shows the qualifying saved post, with no unfiltered feed fallback.

Once connected, page visits check for qualifying posts using a cache of up to 15 minutes. The API scans up to 150 recent feed posts and Reels. It does not scan Stories, comments, tags on other accounts, text inside images, or spoken video content. An older project outside that window needs an explicit saved post entry. Token renewal will also need to be configured or performed before the Instagram access token expires.

Meta documents the account requirements and read permission in its [Instagram Login API collection](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login). Connection credentials belong in the site's secret settings, not in captions, source files or chat.
