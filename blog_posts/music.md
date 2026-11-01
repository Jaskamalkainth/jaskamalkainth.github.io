---
post_theme: dark
wide: true
title: "Music I Love: Rafi to Arijit Singh, The Beatles to Linkin Park"
description: "What I keep on repeat: Mohammed Rafi, Arijit Singh, Jubin Nautiyal, The Beatles, Linkin Park, Imagine Dragons, Post Malone, favourite songs and piano pieces."
date: 2022-01-01
last_modified_at: 2026-11-01
keywords: [favourite songs, Arijit Singh, Mohammed Rafi, Jubin Nautiyal, The Beatles, Linkin Park, Imagine Dragons, piano music]
related: ["/blog_posts/whatwedowhywedo.html", "/blog_posts/philosophy-notes.html"]
---

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@500;700&family=Monoton&family=Yatra+One&display=swap" />
<link rel="stylesheet" href="{{ site.baseurl }}/blog_posts/experiments/music/music.css" />

<div class="mx" id="mx">

<header class="mx-hero">
  <canvas class="mx-viz" id="mx-viz" aria-hidden="true"></canvas>
  <h1 class="mx-title"><span>Music</span> is my only drug</h1>
  <p class="mx-scrawl">there's nothing like music to relieve the soul and uplift it</p>
  <button type="button" class="mx-radio-cta" data-radio-open><i class="fa fa-broadcast-tower" aria-hidden="true"></i> turn on the radio</button>
</header>

<div class="mx-radio" id="mx-radio">
  <div class="mx-radio-panel" id="mx-radio-panel" role="dialog" aria-label="Background music radio" hidden>
    <div class="mx-dial" aria-hidden="true">
      <div class="mx-dial-ticks"></div>
      <div class="mx-needle"></div>
    </div>
    <div class="mx-stations">
      <button type="button" data-station="beethoven" aria-pressed="false"><b>Beethoven</b><span>moonlight</span></button>
      <button type="button" data-station="mozart" aria-pressed="false"><b>Mozart</b><span>nachtmusik</span></button>
      <button type="button" data-station="jazz" aria-pressed="false"><b>Jazz</b><span>late night</span></button>
      <button type="button" data-station="blues" aria-pressed="false"><b>Blues</b><span>12-bar</span></button>
    </div>
    <div class="mx-radio-row">
      <button type="button" class="mx-btn" id="mx-radio-play" aria-label="Play the radio"><i class="fa fa-play" aria-hidden="true"></i></button>
      <p class="mx-radio-now" id="mx-radio-now" aria-live="polite">off · pick a station</p>
    </div>
    <label class="mx-radio-vol"><i class="fa fa-volume-down" aria-hidden="true"></i><span class="mx-sr">Volume</span>
      <input type="range" id="mx-radio-vol" min="0" max="1.2" step="0.05" value="0.8" />
      <i class="fa fa-volume-up" aria-hidden="true"></i></label>
    <p class="mx-radio-fine">played live in your browser, note by note</p>
  </div>
  <button type="button" class="mx-radio-fab" id="mx-radio-fab" aria-expanded="false" aria-controls="mx-radio-panel">
    <span class="mx-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span class="mx-fab-t">background music</span>
  </button>
</div>

<section class="mx-deck" aria-labelledby="mx-songs">
  <h2 id="mx-songs" class="mx-sr">Songs I keep coming back to</h2>

  <div class="mx-table">
    <svg class="mx-turntable" id="mx-turntable" viewBox="0 0 500 420" role="img" aria-label="A turntable. The selected record spins on the platter while the tonearm rests on it.">
      <defs>
        <radialGradient id="mxVinyl" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#2a2a33" />
          <stop offset="1" stop-color="#0c0c10" />
        </radialGradient>
        <linearGradient id="mxSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.35" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0.14" />
          <stop offset="0.65" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="mxPlinth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2b2140" />
          <stop offset="1" stop-color="#160f24" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="492" height="412" rx="26" fill="url(#mxPlinth)" stroke="#3d2f5c" stroke-width="2" />
      <circle cx="210" cy="210" r="186" fill="#0a0710" />
      <g class="mx-record" id="mx-record">
        <circle cx="210" cy="210" r="176" fill="url(#mxVinyl)" />
        <g fill="none" stroke="#fff" stroke-opacity="0.06">
          <circle cx="210" cy="210" r="164" /><circle cx="210" cy="210" r="152" /><circle cx="210" cy="210" r="140" />
          <circle cx="210" cy="210" r="128" /><circle cx="210" cy="210" r="116" /><circle cx="210" cy="210" r="104" />
          <circle cx="210" cy="210" r="92" /><circle cx="210" cy="210" r="80" />
        </g>
        <circle cx="210" cy="210" r="62" id="mx-label" fill="#e2557b" />
        <path d="M210 160 a50 50 0 0 1 0 100" fill="#000" fill-opacity="0.12" />
        <text x="210" y="204" text-anchor="middle" class="mx-label-t" id="mx-label-t">Hey Jude</text>
        <text x="210" y="226" text-anchor="middle" class="mx-label-s" id="mx-label-s">THE BEATLES · 1968</text>
        <circle cx="210" cy="210" r="5" fill="#0a0710" />
      </g>
      <circle cx="210" cy="210" r="176" fill="url(#mxSheen)" pointer-events="none" />
      <circle cx="450" cy="62" r="30" fill="#3a2d57" stroke="#55437e" stroke-width="2" />
      <g class="mx-arm" id="mx-arm">
        <path d="M450 62 L452 250 L430 300" fill="none" stroke="#cfc8e6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="416" y="292" width="26" height="38" rx="5" transform="rotate(25 429 311)" fill="#efeaff" />
        <circle cx="450" cy="62" r="14" fill="#efeaff" />
      </g>
      <rect x="400" y="350" width="70" height="34" rx="10" fill="#0f0a1a" stroke="#3d2f5c" />
      <text x="435" y="372" text-anchor="middle" class="mx-rpm">33⅓</text>
    </svg>

    <div class="mx-now" aria-live="polite">
      <p class="mx-now-k">now spinning</p>
      <p class="mx-now-t" id="mx-now-t">Hey Jude</p>
      <p class="mx-now-a" id="mx-now-a">The Beatles · 1968</p>
      <div class="mx-now-ctl">
        <button type="button" class="mx-btn" id="mx-prev" aria-label="Previous record"><i class="fa fa-step-backward" aria-hidden="true"></i></button>
        <button type="button" class="mx-btn mx-btn-big" id="mx-toggle" aria-label="Stop the record"><i class="fa fa-pause" aria-hidden="true"></i></button>
        <button type="button" class="mx-btn" id="mx-next" aria-label="Next record"><i class="fa fa-step-forward" aria-hidden="true"></i></button>
        <a class="mx-yt" id="mx-yt" href="https://www.youtube.com/results?search_query=The+Beatles+Hey+Jude" target="_blank" rel="noopener"><i class="fab fa-youtube" aria-hidden="true"></i> listen</a>
      </div>
    </div>
  </div>

  <p class="mx-hint">↓ pull a record from the crate</p>
  <ul class="mx-crate" id="mx-crate">
    <li><button type="button" class="mx-sleeve" data-i="0" data-t="Blowin' in the Wind" data-a="Bob Dylan · 1963" data-c="#4f8fd6" data-q="Bob+Dylan+Blowin+in+the+Wind" aria-label="Blowin' in the Wind, Bob Dylan, 1963">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <rect width="200" height="200" fill="#e9dcc0" />
        <g fill="none" stroke="#2f5d8f" stroke-width="5" stroke-linecap="round" class="mx-wind">
          <path d="M-10 60 C40 30 80 90 130 60 S190 40 220 55" />
          <path d="M-10 92 C30 70 90 120 140 92 S200 80 220 88" opacity=".7" />
          <path d="M-10 124 C50 104 90 150 150 122 S200 112 220 120" opacity=".45" />
        </g>
        <path d="M150 40 c6 -10 18 -8 16 4 c-2 10 -14 8 -16 -4z" fill="#c4572e" class="mx-leaf" />
        <text x="14" y="168" class="mx-sl-t" fill="#1f3550">BLOWIN'</text>
        <text x="14" y="190" class="mx-sl-s" fill="#1f3550">IN THE WIND</text>
      </svg>
    </button></li>
    <li><button type="button" class="mx-sleeve" data-i="1" data-t="Tu Hi Re" data-a="A. R. Rahman · Hariharan · 1995" data-c="#f08a3c" data-q="Tu+Hi+Re+Bombay+A+R+Rahman" aria-label="Tu Hi Re, A. R. Rahman, Hariharan and Kavita Krishnamurthy, Bombay, 1995">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs><linearGradient id="mxDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1055" /><stop offset=".55" stop-color="#d5426b" /><stop offset="1" stop-color="#f7a541" /></linearGradient></defs>
        <rect width="200" height="200" fill="url(#mxDusk)" />
        <circle cx="100" cy="128" r="40" fill="#ffd27a" />
        <rect y="128" width="200" height="72" fill="#1b0b3a" opacity=".85" />
        <g stroke="#ffd27a" stroke-width="3" stroke-linecap="round" opacity=".8">
          <path d="M70 140 h60" /><path d="M80 152 h40" /><path d="M90 164 h20" />
        </g>
        <text x="100" y="62" text-anchor="middle" class="mx-sl-dev" fill="#fff4dc">तू ही रे</text>
        <text x="100" y="190" text-anchor="middle" class="mx-sl-s" fill="#ffd27a">BOMBAY · 1995</text>
      </svg>
    </button></li>
    <li><button type="button" class="mx-sleeve" data-i="2" data-t="I Believe I Can Fly" data-a="R. Kelly · 1996" data-c="#5ec7d6" data-q="I+Believe+I+Can+Fly" aria-label="I Believe I Can Fly, R. Kelly, 1996">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs><linearGradient id="mxSky" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9be7f0" /><stop offset="1" stop-color="#1d4e89" /></linearGradient></defs>
        <rect width="200" height="200" fill="url(#mxSky)" />
        <g class="mx-wings" fill="#fff">
          <path d="M100 92 C80 60 40 52 14 66 C40 70 56 82 66 96 C50 92 34 96 22 106 C48 106 70 108 100 100z" />
          <path d="M100 92 C120 60 160 52 186 66 C160 70 144 82 134 96 C150 92 166 96 178 106 C152 106 130 108 100 100z" />
        </g>
        <text x="100" y="166" text-anchor="middle" class="mx-sl-t" fill="#fff">I BELIEVE</text>
        <text x="100" y="188" text-anchor="middle" class="mx-sl-s" fill="#e9fbff">I CAN FLY</text>
      </svg>
    </button></li>
    <li><button type="button" class="mx-sleeve is-on" data-i="3" data-t="Hey Jude" data-a="The Beatles · 1968" data-c="#e2557b" data-q="The+Beatles+Hey+Jude" aria-label="Hey Jude, The Beatles, 1968" aria-pressed="true">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <rect width="200" height="200" fill="#f6c445" />
        <g class="mx-sl-na" fill="#e2557b">
          <text x="-6" y="40">na na na</text><text x="-30" y="78">na na na na</text>
          <text x="-14" y="116">na na na</text><text x="-40" y="154">na na na na</text>
        </g>
        <rect x="0" y="164" width="200" height="36" fill="#1d1230" />
        <text x="100" y="190" text-anchor="middle" class="mx-sl-t" fill="#f6c445">HEY JUDE</text>
      </svg>
    </button></li>
    <li><button type="button" class="mx-sleeve" data-i="4" data-t="Imagine" data-a="John Lennon · 1971" data-c="#f4f1ea" data-q="John+Lennon+Imagine" aria-label="Imagine, John Lennon, 1971">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <rect width="200" height="200" fill="#f4f1ea" />
        <circle cx="100" cy="80" r="46" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-dasharray="3 6" class="mx-dream" />
        <g fill="#1a1a1a">
          <path d="M52 132 h96 v10 h-96z" /><path d="M58 142 h6 v22 h-6z M136 142 h6 v22 h-6z" />
          <path d="M60 104 h80 a8 8 0 0 1 8 8 v20 h-96 v-20 a8 8 0 0 1 8 -8z" />
        </g>
        <g fill="#f4f1ea"><rect x="64" y="124" width="72" height="5" /></g>
        <text x="100" y="190" text-anchor="middle" class="mx-sl-im" fill="#1a1a1a">imagine</text>
      </svg>
    </button></li>
  </ul>
</section>

<section class="mx-poster" aria-labelledby="mx-lineup">
  <p class="mx-p-pre">headphones on · all night · every night</p>
  <h2 id="mx-lineup" class="mx-p-h">On Repeat</h2>
  <div class="mx-stage">
    <p class="mx-stage-n"><span class="mx-dev">हिंदी</span> stage</p>
    <a class="mx-act mx-xl" href="https://www.youtube.com/results?search_query=Arijit+Singh+songs" target="_blank" rel="noopener">Arijit Singh</a>
    <a class="mx-act mx-l" href="https://www.youtube.com/results?search_query=Mohammed+Rafi+old+hindi+songs" target="_blank" rel="noopener">Mohammed Rafi <small>&amp; the golden-era classics</small></a>
    <a class="mx-act mx-l" href="https://www.youtube.com/results?search_query=Jubin+Nautiyal+songs" target="_blank" rel="noopener">Jubin Nautiyal</a>
  </div>
  <p class="mx-p-star" aria-hidden="true">✦ ✦ ✦</p>
  <div class="mx-stage">
    <p class="mx-stage-n">rock <span class="mx-amp">&amp;</span> pop stage</p>
    <a class="mx-act mx-xl" href="https://www.youtube.com/results?search_query=The+Beatles+songs" target="_blank" rel="noopener">The Beatles</a>
    <div class="mx-row">
      <a class="mx-act mx-m" href="https://www.youtube.com/results?search_query=Linkin+Park+songs" target="_blank" rel="noopener">Linkin Park</a>
      <a class="mx-act mx-m" href="https://www.youtube.com/results?search_query=Imagine+Dragons+songs" target="_blank" rel="noopener">Imagine Dragons</a>
      <a class="mx-act mx-m" href="https://www.youtube.com/results?search_query=Post+Malone+songs" target="_blank" rel="noopener">Post Malone</a>
    </div>
  </div>
  <p class="mx-p-foot">admit one · no skips</p>
</section>

<section class="mx-keys-wrap" aria-labelledby="mx-play">
  <h2 id="mx-play" class="mx-neon-h">play something</h2>
  <div class="mx-keys-stage">
    <div class="mx-notes" id="mx-notes" aria-hidden="true"></div>
    <div class="mx-keys" id="mx-keys" role="group" aria-label="Playable piano, C4 to B5. Click the keys or use your computer keyboard."></div>
  </div>
  <div class="mx-keys-ctl">
    <button type="button" class="mx-pill" id="mx-elise"><i class="fa fa-play" aria-hidden="true"></i> Für Elise</button>
    <span class="mx-scrawl mx-small">or tap the keys · A–L on a keyboard</span>
  </div>
</section>

<section class="mx-piano" aria-labelledby="mx-pianos">
  <h2 id="mx-pianos" class="mx-neon-h">piano pieces I love</h2>
  <div class="mx-tapes">
    <a class="mx-tape" href="https://www.youtube.com/watch?v=EFJ7kDva7JE" data-yt="EFJ7kDva7JE" data-title="Mariage d'Amour (Spring Waltz), piano" target="_blank" rel="noopener">
      <span class="mx-thumb"><img src="https://i.ytimg.com/vi/EFJ7kDva7JE/hqdefault.jpg" alt="Video thumbnail: Mariage d'Amour piano performance" width="480" height="360" loading="lazy" /><i class="fa fa-play" aria-hidden="true"></i></span>
      <span class="mx-tape-t">Mariage d'Amour</span>
      <span class="mx-scrawl mx-small">Paul de Senneville, not Chopin!</span>
    </a>
    <a class="mx-tape" href="https://www.youtube.com/watch?v=bP70gBZc564" data-yt="bP70gBZc564" data-title="Beethoven: Für Elise, piano" target="_blank" rel="noopener">
      <span class="mx-thumb"><img src="https://i.ytimg.com/vi/bP70gBZc564/hqdefault.jpg" alt="Video thumbnail: Für Elise piano performance" width="480" height="360" loading="lazy" /><i class="fa fa-play" aria-hidden="true"></i></span>
      <span class="mx-tape-t">Für Elise</span>
      <span class="mx-scrawl mx-small">Beethoven, the real one</span>
    </a>
    <a class="mx-tape" href="https://www.youtube.com/watch?v=WPChw6DiIkw" data-yt="WPChw6DiIkw" data-title="Love Story theme, piano (Richard Clayderman)" target="_blank" rel="noopener">
      <span class="mx-thumb"><img src="https://i.ytimg.com/vi/WPChw6DiIkw/hqdefault.jpg" alt="Video thumbnail: Love Story theme on piano" width="480" height="360" loading="lazy" /><i class="fa fa-play" aria-hidden="true"></i></span>
      <span class="mx-tape-t">Love Story</span>
      <span class="mx-scrawl mx-small">Francis Lai, not Beethoven!</span>
    </a>
    <a class="mx-tape" href="https://www.youtube.com/watch?v=YI6hpzai-hU" data-yt="YI6hpzai-hU" data-title="Harry Potter piano medley, virtuosic cover by Eshan Denipitiya" target="_blank" rel="noopener">
      <span class="mx-thumb"><img src="https://i.ytimg.com/vi/YI6hpzai-hU/hqdefault.jpg" alt="Video thumbnail: virtuosic Harry Potter piano medley" width="480" height="360" loading="lazy" /><i class="fa fa-play" aria-hidden="true"></i></span>
      <span class="mx-tape-t">Harry Potter medley</span>
      <span class="mx-scrawl mx-small">John Williams, ten fingers, pure magic</span>
    </a>
  </div>
</section>

<section class="mx-wall" aria-labelledby="mx-legends">
  <h2 id="mx-legends" class="mx-neon-h">on my wall</h2>
  <div class="mx-polaroids">
    <a class="mx-pol" href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/96ed9b0919b25388599fd3e0dd926db4.jpg" target="_blank" rel="noopener">
      <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/96ed9b0919b25388599fd3e0dd926db4.jpg" alt="Portrait of Johann Sebastian Bach with his quote: The aim and final end of all music should be none other than the glory of God and the refreshment of the soul." loading="lazy" />
      <span class="mx-scrawl">Bach</span>
    </a>
    <a class="mx-pol" href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/Ludwig-van-Beethoven-Quotes.jpg" target="_blank" rel="noopener">
      <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/Ludwig-van-Beethoven-Quotes.jpg" alt="Portrait of Ludwig van Beethoven with the quote: Music is the mediator between the spiritual and the sensual life." loading="lazy" />
      <span class="mx-scrawl">Beethoven</span>
    </a>
    <a class="mx-pol" href="https://raw.githubusercontent.com/Jaskamalkainth/images/master/mozart_quote_4_new.jpg" target="_blank" rel="noopener">
      <img src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/mozart_quote_4_new.jpg" alt="Portrait of Wolfgang Amadeus Mozart with a quote attributed to him: All I insist on, and nothing else, is that you should show the whole world that you are not afraid. Be silent, if you choose; but when it is necessary, speak, and speak in such a way that people will remember it." loading="lazy" />
      <span class="mx-scrawl">Mozart</span>
    </a>
    <img class="mx-hero-img" src="https://raw.githubusercontent.com/Jaskamalkainth/images/master/hqdefault.jpg" alt="Painting of a woman in a white dress playing the piano, in bright orange and yellow brushstrokes" loading="lazy" />
  </div>
</section>

<details class="mx-liner" markdown="1">
<summary>liner notes</summary>

**In short:** my playlist swings between Hindi film music (Mohammed Rafi and the golden-era classics, Arijit Singh, Jubin Nautiyal) and Western rock and pop (The Beatles, Linkin Park, Imagine Dragons, Post Malone). The songs I return to most are *Blowin' in the Wind*, *Tu Hi Re*, *I Believe I Can Fly*, *Hey Jude* and *Imagine*.

**The five records in the crate**

| Song | Artist | Year | From |
|---|---|---|---|
| Blowin' in the Wind | Bob Dylan | 1963 | *The Freewheelin' Bob Dylan* |
| Tu Hi Re | Hariharan and Kavita Krishnamurthy; music by A. R. Rahman | 1995 | *Bombay* (Hindi version of *Uyire Uyire*) |
| I Believe I Can Fly | R. Kelly | 1996 | *Space Jam* soundtrack |
| Hey Jude | The Beatles (written by Paul McCartney) | 1968 | single, over seven minutes long |
| Imagine | John Lennon | 1971 | *Imagine* |

**The lineup.** Mohammed Rafi (1924–1980) was the voice of Hindi cinema's golden era. Arijit Singh became the defining playback voice of the last decade after *Tum Hi Ho* (*Aashiqui 2*, 2013). Jubin Nautiyal, from Uttarakhand, sang *Raataan Lambiyan* (*Shershaah*, 2021). The Beatles were John Lennon, Paul McCartney, George Harrison and Ringo Starr, from Liverpool, 1960–1970. Linkin Park broke through with *Hybrid Theory* (2000), home of *In the End*. Imagine Dragons are the Las Vegas band behind *Radioactive*, *Demons* and *Believer*. Post Malone's hits include *Circles*, *Sunflower* and *Rockstar*.

**The piano pieces.** *Mariage d'Amour* is often mislabelled online as Chopin; Paul de Senneville wrote it in 1978 and Richard Clayderman made it famous. *Für Elise* is Beethoven's. The *Love Story* theme is Francis Lai's, from the 1970 film, in Richard Clayderman's arrangement (the video credits Beethoven, but it isn't his). The Harry Potter medley is a virtuosic cover of John Williams's themes by Eshan Denipitiya.

**The background radio** plays four stations, synthesized live with the Web Audio API rather than streamed. *Beethoven* loops the opening four bars of the Piano Sonata No. 14 "Moonlight" (Op. 27 No. 2), first movement. *Mozart* plays the opening of *Eine kleine Nachtmusik* (K. 525) and the first two bars of the Piano Sonata No. 16 in C (K. 545). Both pieces are public domain. *Jazz* improvises a vibraphone line over a ii–V–I–VI in C with walking bass, ride cymbal and rootless piano voicings; *Blues* improvises a guitar line over a 12-bar shuffle in A with boogie bass and a backbeat. The jazz and blues solos are random every time, so no two plays are the same.

**The playable piano** runs in your browser with the Web Audio API: two octaves from C4 to B5, and the Für Elise button plays the opening melody (public domain).

</details>

</div>

<script defer src="{{ site.baseurl }}/blog_posts/experiments/music/music.js"></script>
