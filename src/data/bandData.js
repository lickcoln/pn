// Paranoid Noise Band Data: the default content of the website.
// Anything an admin edits is saved on top of these defaults (see BandDataContext).

export const BAND_BIO = `Paranoid Noise is a punk rock trio that has been making waves in Jakarta, Indonesia's alternative rock scene. Known for their raw energy and explosive performances, they captured the essence of the alternative rock movement while blending it with the unique spirit of the Indonesian underground. The band's sound is rooted in the gritty, distortion-heavy guitar riffs of Nirvana and the Seattle sound, layered with the deep emotional intensity and explosive rhythms reminiscent of the 90's grunge scene. Their music speaks to the struggles, frustration and emotional volatility of today's youth, with lyrics that explore themes of alienation, rebellion and self-doubt. Paranoid Noise quickly gained attention after their debut in the underground venues of Bekasi, Jakarta and Bandung, delivering electrifying performances that have earned them a loyal following. Their sound is powerful, chaotic and unapologetic, and they've played countless gigs across the country, from small clubs to bigger festival stages, building a reputation as one of the most dynamic live acts in the scene today.`

export const BAND_MEMBERS = [
  {
    id: 'arief',
    name: 'Arief',
    role: 'Guitar & Vocals',
    image: '/band/member_arief.png',
    fallbackImage: '/band/band_rock_4_1270x1526.webp',
    gear: 'Fender Jaguar / Kurt Cobain Signature, Boss DS-1 Distortion, EHX Big Muff',
    description: 'Frontman with a raspy, emotional voice and loud guitar riffs drenched in the fuzz and distortion of 90s Seattle grunge.',
    quote: 'Our music is an expression of anger, restlessness, and uncompromising freedom.'
  },
  {
    id: 'ganjar',
    name: 'Ganjar',
    role: 'Bass',
    image: '/band/member_ganjar.png',
    fallbackImage: '/band/band_rock_8_1254x1254.webp',
    gear: 'Fender Jazz Bass, Ampeg SVT Classic, SansAmp Bass Driver DI',
    description: "Dense, aggressive, thunderous punk basslines that form the solid foundation of Paranoid Noise's dynamics.",
    quote: 'On stage, there is no barrier between us and the energy of the moshpit.'
  },
  {
    id: 'kimao',
    name: 'Kimao',
    role: 'Drum',
    image: '/band/member_kimao.png',
    fallbackImage: '/band/band_rock_1_1252x741.webp',
    gear: 'Mapex Drum Kit, Zildjian Sweet Ride & A-Custom Cymbals, Heavy Punk Sticks',
    description: 'Explosive drumming, pounding tempos, and nonstop hits that pump adrenaline into every live show.',
    quote: 'The drumbeat is the heartbeat of every bit of chaos we create.'
  }
]

export const SINGLES_DISCOGRAPHY = [
  {
    id: 'mesin-waktu',
    title: 'Mesin Waktu',
    releaseDate: 'January 2021',
    year: '2021',
    duration: '3:45',
    color: '#dc2626',
    coverArt: '/images/band_photo_17_1792x1024.jpg',
    description: 'The debut single that introduced a classic grunge feel with modern distortion and became an instant favorite among underground listeners.',
    spotifyUrl: 'https://open.spotify.com/search/Paranoid%20Noise%20Mesin%20Waktu',
    youtubeUrl: 'https://youtube.com/results?search_query=Paranoid+Noise+Mesin+Waktu',
    soundcloudUrl: 'https://soundcloud.com/search?q=Paranoid%20Noise%20Mesin%20Waktu',
    riffType: 'grunge_intro'
  },
  {
    id: 'diamkan-aku',
    title: 'Diamkan Aku',
    releaseDate: 'January 2022',
    year: '2022',
    duration: '3:18',
    color: '#0284c7',
    coverArt: '/band/band_rock_2_1247x690.webp',
    description: 'A deep exploration of the urge to be alone and the weariness of the noise of the world around us.',
    spotifyUrl: 'https://open.spotify.com/search/Paranoid%20Noise%20Diamkan%20Aku',
    youtubeUrl: 'https://youtube.com/results?search_query=Paranoid+Noise+Diamkan+Aku',
    soundcloudUrl: 'https://soundcloud.com/search?q=Paranoid%20Noise%20Diamkan%20Aku',
    riffType: 'punk_drive'
  },
  {
    id: 'i-dont-surrender',
    title: "I Don't Surrender",
    releaseDate: 'March 2022',
    year: '2022',
    duration: '2:56',
    color: '#16a34a',
    coverArt: '/band/band_rock_3_1269x1269.webp',
    description: 'A high-speed anthem of rebellion with a fast punk rock tempo and shouts of never giving up.',
    spotifyUrl: "https://open.spotify.com/search/Paranoid%20Noise%20I%20Don't%20Surrender",
    youtubeUrl: "https://youtube.com/results?search_query=Paranoid+Noise+I+Don't+Surrender",
    soundcloudUrl: "https://soundcloud.com/search?q=Paranoid%20Noise%20I%20Don't%20Surrender",
    riffType: 'fast_punk'
  },
  {
    id: 'aku-trauma',
    title: 'Aku Trauma',
    releaseDate: 'April 2022',
    year: '2022',
    duration: '4:12',
    color: '#ea580c',
    coverArt: '/singles/single_obj_215_213x236.jpg',
    description: "A heavy, dark Seattle-sound mood about inner wounds, restlessness, and the emotional conflicts of today's youth.",
    spotifyUrl: 'https://open.spotify.com/search/Paranoid%20Noise%20Aku%20Trauma',
    youtubeUrl: 'https://youtube.com/results?search_query=Paranoid+Noise+Aku+Trauma',
    soundcloudUrl: 'https://soundcloud.com/search?q=Paranoid%20Noise%20Aku%20Trauma',
    riffType: 'heavy_grunge'
  },
  {
    id: 'on-antarctica',
    title: 'On Antarctica',
    releaseDate: 'May 2022',
    year: '2022',
    duration: '3:50',
    color: '#38bdf8',
    coverArt: '/band/band_rock_1_1252x741.webp',
    description: "A live-set favorite with a quiet-then-explosive (quiet-loud) dynamic in the style of Nirvana's In Utero.",
    spotifyUrl: 'https://open.spotify.com/search/Paranoid%20Noise%20On%20Antarctica',
    youtubeUrl: 'https://youtube.com/results?search_query=Paranoid+Noise+On+Antarctica',
    soundcloudUrl: 'https://soundcloud.com/search?q=Paranoid%20Noise%20On%20Antarctica',
    riffType: 'quiet_loud'
  },
  {
    id: 'pengkhianat',
    title: 'Pengkhianat',
    releaseDate: 'July 2022',
    year: '2022',
    duration: '2:44',
    color: '#991b1b',
    coverArt: '/logo.png',
    description: 'An aggressive single with sharp lyrics that strip away hypocrisy, driven by fast drumming and loud overdrive distortion.',
    spotifyUrl: 'https://open.spotify.com/search/Paranoid%20Noise%20Pengkhianat',
    youtubeUrl: 'https://youtube.com/results?search_query=Paranoid+Noise+Pengkhianat',
    soundcloudUrl: 'https://soundcloud.com/search?q=Paranoid%20Noise%20Pengkhianat',
    riffType: 'hardcore_punk'
  },
  {
    id: 'ive-got-my-vision',
    title: "I've Got My Vision",
    releaseDate: 'October 2022',
    year: '2022',
    duration: '3:32',
    color: '#9333ea',
    coverArt: '/band/band_rock_9_1264x840.webp',
    description: 'A mix of addictive guitar melodies and lyrics about finding yourself that became a crowd-surfing anthem on festival stages.',
    spotifyUrl: "https://open.spotify.com/search/Paranoid%20Noise%20I've%20Got%20My%20Vision",
    youtubeUrl: "https://youtube.com/results?search_query=Paranoid+Noise+I've+Got+My+Vision",
    soundcloudUrl: "https://soundcloud.com/search?q=Paranoid%20Noise+I've+Got+My+Vision",
    riffType: 'melodic_grunge'
  }
]

export const TOUR_EVENTS = [
  {
    id: 'gig-1',
    title: 'Jakarta Distortion Night 2026',
    date: '24 OCTOBER 2026',
    time: '19:30 WIB',
    venue: 'Rossi Musik Fatmawati',
    city: 'South Jakarta',
    category: 'Club Gig',
    status: 'Tickets Available',
    price: 'IDR 65,000',
    mapsUrl: 'https://maps.google.com/?q=Rossi+Musik+Fatmawati+Jakarta',
    description: "An intimate show with Jakarta's underground grunge & punk rock acts. The moshpit is guaranteed to burn!"
  },
  {
    id: 'gig-2',
    title: 'Bandung Underground Noise Fest',
    date: '14 NOVEMBER 2026',
    time: '16:00 WIB',
    venue: 'Spasial / Gudang Selatan',
    city: 'Bandung',
    category: 'Festival',
    status: 'Presale 1',
    price: 'IDR 85,000',
    mapsUrl: 'https://maps.google.com/?q=Gudang+Selatan+Bandung',
    description: 'A big stage for alternative rock and hardcore punk in Bandung, the "City of Flowers". Paranoid Noise plays at 20:45.'
  },
  {
    id: 'gig-3',
    title: 'Bekasi DIY Punk Showcase',
    date: '28 NOVEMBER 2026',
    time: '18:00 WIB',
    venue: 'Underground Sound Studio & Space',
    city: 'Bekasi',
    category: 'Showcase',
    status: 'Limited Tickets',
    price: 'IDR 50,000',
    mapsUrl: 'https://maps.google.com/?q=Bekasi+Underground+Space',
    description: "Back to the roots of Paranoid Noise's very first stage. Exclusive to only 200 people."
  },
  {
    id: 'gig-4',
    title: 'Sonic Subversion Rockfest Vol. 4',
    date: '12 DECEMBER 2026',
    time: '15:00 WIB',
    venue: 'Stadion Patriot Candrabhaga Outer',
    city: 'Greater Jakarta',
    category: 'Festival',
    status: 'Coming Soon',
    price: 'IDR 120,000',
    mapsUrl: 'https://maps.google.com/?q=Stadion+Patriot+Bekasi',
    description: 'A grand year-end festival with a lineup of national punk, grunge, and alternative rock bands.'
  },
  {
    id: 'gig-past-1',
    title: 'Authenticity Live Experience',
    date: '18 MARCH 2024',
    time: '20:00 WIB',
    venue: 'Hard Rock Cafe Stage',
    city: 'Jakarta',
    category: 'Past Gig',
    status: 'Finished (Sold Out)',
    price: 'Sold Out',
    description: 'A stunning performance on the Authenticity stage alongside leading Indonesian rock musicians.'
  }
]

export const MERCH_ITEMS = [
  {
    id: 'merch-tshirt-1',
    name: 'PN "Stompbox Distortion" Vintage Washed T-Shirt',
    price: 185000,
    priceFormatted: 'IDR 185,000',
    category: 'Apparel',
    image: '/logo.png',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 'In Stock',
    description: 'Heavyweight 24s cotton with a vintage wash, a discharge-printed Paranoid Noise stompbox pedal logo on the front and lyrics on the back.'
  },
  {
    id: 'merch-hoodie-1',
    name: 'PN "Seattle Sound Jakarta" Heavy Pullover Hoodie',
    price: 375000,
    priceFormatted: 'IDR 375,000',
    category: 'Apparel',
    image: '/band/band_rock_8_1254x1254.webp',
    sizes: ['M', 'L', 'XL', 'XXL'],
    stock: 'In Stock',
    description: 'Thick 330gsm fleece in washed black, with an embroidered Paranoid Noise logo on the chest and rock graphics printed on the sleeves.'
  },
  {
    id: 'merch-cassette',
    name: 'PN "Singles Collection 2021-2022" Limited Cassette Tape',
    price: 150000,
    priceFormatted: 'IDR 150,000',
    category: 'Physical Audio',
    image: '/images/band_photo_17_1792x1024.jpg',
    sizes: ['One Size'],
    stock: 'Only 25 Left',
    description: 'A limited-edition blood-red transparent cassette tape with the 7 official Paranoid Noise singles, complete with a lyric booklet poster.'
  },
  {
    id: 'merch-cap',
    name: 'PN "Raw Noise" Distressed Trucker Cap',
    price: 135000,
    priceFormatted: 'IDR 135,000',
    category: 'Headwear',
    image: '/band/member_arief.png',
    sizes: ['All Size Snapback'],
    stock: 'In Stock',
    description: 'A grunge-style trucker cap with an embroidered Paranoid Noise stompbox patch and distressed punk rock accents.'
  },
  {
    id: 'merch-pick-set',
    name: 'PN Stompbox Enamel Pin & Tortex Guitar Pick Collector Pack',
    price: 75000,
    priceFormatted: 'IDR 75,000',
    category: 'Accessories',
    image: '/logo.png',
    sizes: ['Pack of 5 Picks + 1 Pin'],
    stock: 'In Stock',
    description: 'A premium enamel metal pin shaped like the PN stompbox pedal, plus 5 custom 1.0mm heavy punk gauge guitar picks.'
  },
  {
    id: 'merch-stickers',
    name: 'PN "Underground Rebellion" Vinyl Sticker Pack (10 Pcs)',
    price: 45000,
    priceFormatted: 'IDR 45,000',
    category: 'Accessories',
    image: '/band/band_rock_10_1270x763.webp',
    sizes: ['10 Die-cut Stickers'],
    stock: 'In Stock',
    description: 'A waterproof, scratch-resistant vinyl sticker pack for your guitar, helmet, laptop, skateboard, and pedalboard.'
  }
]

export const BAND_CONTACT = {
  email: 'official.paranoidnoise@gmail.com',
  whatsappDisplay: '+62 81-Paranoid Noise',
  whatsappRaw: '6281299990099', // direct WhatsApp number for wa.me link
  instagram: 'https://instagram.com/paranoid.noise',
  instagramHandle: '@paranoid.noise',
  youtube: 'https://youtube.com/@paranoid.noise',
  youtubeHandle: '@paranoid.noise',
  spotify: 'https://open.spotify.com/artist/paranoidnoise',
  spotifyHandle: 'Paranoid Noise',
  soundcloud: 'https://soundcloud.com/paranoidnoise',
  soundcloudHandle: 'Paranoid Noise'
}

// The sentences around the content that visitors read (top bar, footer, the introduction under each section
// title). Editable in the admin portal's "Site Texts" tab; an empty text hides that line.
// `{count}` in musicIntro becomes "7 singles" (or "1 single") from the real list, and `{years}` in musicBadge
// becomes the release years of those singles, like "(2021 - 2022)" (nothing when no single has a date).
export const SITE_TEXTS = {
  siteName: 'PARANOID NOISE',
  navTagline: "JAKARTA PUNK ROCK • 90'S GRUNGE",
  footerGenre: 'PUNK ROCK • SEATTLE SOUND GRUNGE TRIO',
  footerAbout: "Rooted in the gritty distortion-heavy guitar riffs of Nirvana and the 90's Seattle sound, blended with the raw energy of the Indonesian underground scene.",
  aboutIntro: 'A punk rock & 90’s grunge trio from Jakarta, setting the underground stage on fire with raw energy and merciless distortion.',
  lineupIntro: 'The three pillars behind the sonic chaos and explosive stage energy of Paranoid Noise.',
  musicBadge: 'OFFICIAL DISCOGRAPHY {years}',
  musicTitle: 'SINGLES &', // the white part of the title
  musicTitleAccent: 'STOMPBOX PLAYER', // the red part of the title
  musicIntro: '{count} by Paranoid Noise that reflect the anger, restlessness, and Seattle-sound energy of the underground scene.',
  gigsIntro: 'Witness the explosive stage energy of Paranoid Noise live from the front row of the moshpit. Get your tickets or reserve now!',
  merchIntro: 'Support the independent musicianship of Paranoid Noise. Official merchandise with premium quality, grunge discharge prints, and authentic details.',
  bookingIntro: 'For stage bookings, media interviews, collaborations, and music festival curation.',
  // the words on the scrolling tape at the bottom of the home page, separated by a bullet (empty = no banner)
  tickerText: "90'S ROUGH DISTORTION • TURN IT UP • FAST • LOUD • UNAPOLOGETIC • NO RULES • PUNK ROCK • JAKARTA UNDERGROUND"
}

// Every site-wide image the admin portal can replace, with the defaults shipped in /public.
// Photos that belong to a list item live on the item itself: a member's image, a single's coverArt,
// a merch product's image.
export const IMAGE_SLOTS = [
  {
    key: 'logo',
    group: 'Logo',
    label: 'Band logo',
    where: 'Navbar, hero stompbox, footer, admin panel and the browser tab icon',
    fallback: '/logo.png',
    maxEdge: 800
  },
  {
    key: 'heroBackground',
    group: 'Backgrounds',
    label: 'Hero background',
    where: 'Full-screen background behind the headline on the home page',
    fallback: '/band/band_rock_9_1264x840.webp',
    maxEdge: 2000
  },
  {
    key: 'discographyBackground',
    group: 'Backgrounds',
    label: 'Music section background',
    where: 'Faded background behind the singles and the stompbox player',
    fallback: '/images/band_photo_17_1792x1024.jpg',
    maxEdge: 2000
  },
  {
    key: 'lineupBanner',
    group: 'Photos',
    label: 'Lineup banner',
    where: 'Wide band photo at the top of the Lineup section',
    fallback: '/band/band_rock_8_1254x1254.webp',
    maxEdge: 1800
  },
  {
    key: 'profileBanner',
    group: 'Photos',
    label: 'Profile stage banner',
    where: 'Wide strip under the bio in the About section',
    fallback: '/band/band_rock_10_1270x763.webp',
    maxEdge: 1600
  },
  {
    key: 'profilePortrait',
    group: 'Photos',
    label: 'Profile live photo',
    where: 'Large photo next to the bio in the About section',
    fallback: '/band/band_rock_3_1269x1269.webp',
    maxEdge: 1400
  },
  {
    key: 'profileTileLeft',
    group: 'Photos',
    label: 'Profile tile (left)',
    where: 'The "Marshall Stacks & Fuzz" tile in the About section',
    fallback: '/band/band_rock_7_1269x1267.webp',
    maxEdge: 1000
  },
  {
    key: 'profileTileRight',
    group: 'Photos',
    label: 'Profile tile (right)',
    where: 'The "Mapex Drum & Sabian Cymbals" tile in the About section',
    fallback: '/band/band_rock_2_1247x690.webp',
    maxEdge: 1000
  },
  {
    key: 'pressKit',
    group: 'Downloads',
    label: 'Press kit image',
    where: 'The file visitors get from "Download Technical Rider & EPK" in the Booking section',
    fallback: '/band/band_rock_8_1254x1254.png', // stays a PNG: it is a download, not a page image
    maxEdge: 2400
  }
]

export const SITE_IMAGES = Object.fromEntries(IMAGE_SLOTS.map((slot) => [slot.key, slot.fallback]))
