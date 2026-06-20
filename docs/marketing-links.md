# Marketing link conventions

When sharing links to **kassiopeia.band** anywhere off-site — Facebook, Instagram, TikTok, newsletters, QR codes, press kits, anywhere — tag the URL with UTM parameters so Plausible can split traffic by source and campaign instead of lumping it all under "Facebook" or "Direct".

Plausible groups UTM-tagged hits automatically under **Sources → Campaigns**, **Sources → Mediums**, and **Sources → Sources** in the dashboard.

## The format

Append to any kassiopeia.band URL:

```
?utm_source=<where>&utm_medium=<how>&utm_campaign=<what>
```

- **`utm_source`** — the specific platform: `facebook`, `instagram`, `tiktok`, `youtube`, `bandcamp`, `spotify`, `newsletter`, `qr_flyer`, `press`, etc. Always lowercase, underscore-separated, no spaces.
- **`utm_medium`** — the channel category: `social`, `email`, `qr`, `paid`, `referral`, `bio_link`.
- **`utm_campaign`** — the specific push: `verity_launch`, `summer_tour_2026`, `merch_drop_july`, `monthly_news_jun26`. Pick a short slug and reuse it across every link for that campaign — that's how Plausible groups them.

Optional:
- **`utm_content`** — only when A/B testing the same campaign across multiple creatives (`hero_video` vs `static_image`).

## Canonical examples

Copy these and edit the campaign slug:

**Facebook post linking to a release page:**
```
https://kassiopeia.band/post/3?utm_source=facebook&utm_medium=social&utm_campaign=verity_launch
```

**Instagram bio link:**
```
https://kassiopeia.band/?utm_source=instagram&utm_medium=bio_link&utm_campaign=summer_2026
```

**TikTok video description:**
```
https://kassiopeia.band/?utm_source=tiktok&utm_medium=social&utm_campaign=verity_launch
```

**Newsletter (monthly):**
```
https://kassiopeia.band/shows?utm_source=newsletter&utm_medium=email&utm_campaign=monthly_news_jun26
```

**QR code on a flyer / merch table:**
```
https://kassiopeia.band/?utm_source=qr_flyer&utm_medium=qr&utm_campaign=summer_tour_2026
```

**Press kit / promoter handoff:**
```
https://kassiopeia.band/?utm_source=press&utm_medium=referral&utm_campaign=verity_launch
```

## Rules of thumb

- **Always lowercase, always underscores.** `Verity_Launch` and `verity_launch` are different campaigns to Plausible. Pick one form and stick to it.
- **Reuse the same `utm_campaign` value across every link for the same push** — that's the whole point. If the Verity launch hits FB, IG, TikTok, and the newsletter, all four links share `utm_campaign=verity_launch` but differ on `utm_source` / `utm_medium`.
- **Don't tag internal links.** Only tag links *into* the site from outside. Internal navigation within kassiopeia.band should never carry UTM params (it confuses session attribution).
- **Don't tag the vanity redirects** (`/spotify`, `/yt`, `/album`, `/bandcamp`, etc.). Those are outbound — the UTM would never reach Plausible. If you want to track which platform the share button came from, tag the kassiopeia.band landing URL, not the outbound jump.
- **Shorten if needed.** Long tagged URLs look ugly in social copy. Use the platform's native link shortener (FB/IG handle this automatically) or a bit.ly/short.io if you really need clean copy — the UTM params survive the redirect.

## How to read the results

In Plausible (https://stats.kassiopeia.band):

- **Sources → Sources** — splits by `utm_source`. Shows which platform sent traffic.
- **Sources → Mediums** — splits by `utm_medium`. Shows social vs email vs QR mix.
- **Sources → Campaigns** — splits by `utm_campaign`. Shows which push drove the most traffic across all platforms combined.

Pair this with the goals configured in the Plausible dashboard (release page visits, outbound clicks to Spotify/Bandcamp, etc.) and you get end-to-end attribution: which campaign on which platform converted into which action.
