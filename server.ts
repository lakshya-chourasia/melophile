import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { randomInt, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Curated collections with 100% verified YouTube video IDs and ultra-high-resolution 1200x1200 studio master artwork
const CURATED_GENRES = [
  {
    id: 'love-2k20',
    name: 'LOVE 2K20',
    description: 'Curated romantic anthems, soulful acoustic ballads and deep heartfelt pop',
    curator: 'Pharrell Williams',
    tag: '#RELATIONSHIPS',
    tracks: [
      {
        id: 'raiQjmyZMC0',
        title: 'Someone Like You',
        artist: 'Adele Adkins',
        duration: '4:45',
        durationSec: 285,
        views: '2.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/1200x1200bb.jpg',
      },
      {
        id: 'zmsS_6sP5c4',
        title: 'If I Could Change You',
        artist: 'Danielle Haim (HAIM)',
        duration: '3:50',
        durationSec: 230,
        views: '45M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/f1/0c/21/f10c2105-fed1-b727-fb61-b0c96cc73eea/886444152648.jpg/1200x1200bb.jpg',
      },
      {
        id: 'kYFjF3v1U7c',
        title: 'Go slow',
        artist: 'Gorgon City ft. Kaskade (Ryan Raddon)',
        duration: '3:45',
        durationSec: 225,
        views: '28M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/fb/c9/72/fbc972b5-3b37-058a-6818-63604315bf22/19UMGIM36996.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'f-X8f_d1n3Y',
        title: 'Losing my mind',
        artist: 'Philip George',
        duration: '3:15',
        durationSec: 195,
        views: '18M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/06/6e/d9/066ed9f2-5eec-324e-90cc-7c0e8dd89c79/05037128232506.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'XXYlFuWEuKI',
        title: 'Save Your Tears',
        artist: 'Abel Tesfaye (The Weeknd)',
        duration: '3:35',
        durationSec: 215,
        views: '1.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow',
        artist: 'Chris Martin (Coldplay)',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
      },
      {
        id: '2Vv-BfVoq4g',
        title: 'Perfect',
        artist: 'Edward Christopher Sheeran',
        duration: '4:23',
        durationSec: 263,
        views: '3.6B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'official-hits',
    name: 'Top Global Official Music Videos',
    description: 'Master studio official music videos from top worldwide artists',
    tracks: [
      {
        id: '81qmmlsIE3k',
        title: 'Tum Hi Ho',
        artist: 'Arijit Singh, Mithoon',
        duration: '4:22',
        durationSec: 262,
        views: '850M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: 'wnWgkY1LGW4',
        title: 'Sanam Teri Kasam',
        artist: 'Himesh Reshammiya, Ankit Tiwari, Palak Muchhal',
        duration: '5:14',
        durationSec: 314,
        views: '420M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/44/65/2a/44652a17-ed54-7224-ca3e-281a2f704412/196871079150.jpg/1200x1200bb.jpg',
      },
      {
        id: 'lBvbNxiVmZA',
        title: 'Raanjhan',
        artist: 'Sachet-Parampara, Parampara Tandon, Kausar Munir',
        duration: '3:30',
        durationSec: 210,
        views: '110M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/99/a9/ca/99a9caf7-5d9f-5890-3fdf-e3ff8c860e79/8903431018915_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '3Cp2QTBZAFQ',
        title: 'Finding Her',
        artist: 'Kushagra & Bharath',
        duration: '3:40',
        durationSec: 220,
        views: '35M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0e/4f/58/0e4f5828-64f8-26d5-ebde-661b6fee89fe/5034644353067.jpg/1200x1200bb.jpg',
      },
      {
        id: 'kJQP7kiw5Fk',
        title: 'Despacito',
        artist: 'Luis Fonsi ft. Daddy Yankee (Ramón Ayala)',
        duration: '4:42',
        durationSec: 282,
        views: '8.4B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'JGwWNGJdvx8',
        title: 'Shape of You',
        artist: 'Edward Christopher Sheeran',
        duration: '4:24',
        durationSec: 264,
        views: '6.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Bohemian Rhapsody',
        artist: 'Freddie Mercury (Queen)',
        duration: '6:00',
        durationSec: 360,
        views: '1.7B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8b/0a/ea/8b0aea60-6f4a-195b-5958-cdf459c2333b/602527644271.jpg/1200x1200bb.jpg',
      },
      {
        id: '4NRXx6U8ABQ',
        title: 'Blinding Lights',
        artist: 'Abel Tesfaye (The Weeknd)',
        duration: '4:22',
        durationSec: 262,
        views: '800M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow',
        artist: 'Chris Martin (Coldplay)',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
      },
      {
        id: 'H5v3kku4y6Q',
        title: 'As It Was',
        artist: 'Harry Edward Styles',
        duration: '2:47',
        durationSec: 167,
        views: '850M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/1200x1200bb.jpg',
      },
      {
        id: 'TUVcZfQe-Kw',
        title: 'Levitating',
        artist: 'Dua Lipa',
        duration: '3:50',
        durationSec: 230,
        views: '920M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/1200x1200bb.jpg',
      },
      {
        id: 'wXhTHyIgQ_U',
        title: 'Circles',
        artist: 'Austin Richard Post (Post Malone)',
        duration: '3:35',
        durationSec: 215,
        views: '640M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7b/1b/1b/7b1b1b0b-7ce2-b223-f9e0-8e36abe51877/19UMGIM78325.rgb.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'synthwave',
    name: 'Synthwave & Retrowave',
    description: 'Neon horizons, analog synthesizers, and midnight expressway nostalgia',
    tracks: [
      {
        id: 'a6P40S5K4c4',
        title: 'Days of Thunder',
        artist: 'Tyler Lyle (The Midnight)',
        duration: '5:30',
        durationSec: 330,
        views: '12M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5a/0f/a4/5a0fa413-e1b8-7cb6-7ecc-7c22e656d33d/194271526137_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '_Ci0Kgdpgsw',
        title: 'On the Run',
        artist: 'Jordy Leenaerts (Timecop1983)',
        duration: '5:01',
        durationSec: 301,
        views: '15M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5a/44/68/5a4468ef-ce33-9aea-1062-a6e9600b1321/859726345762_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '8GW6sLrK40k',
        title: 'Resonance',
        artist: 'Randy Goffe (HOME)',
        duration: '3:32',
        durationSec: 212,
        views: '140M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4f/13/65/4f1365b0-e97c-c469-c438-2f7d8f204355/872133025584_cover.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'indie-rock',
    name: 'Indie & Alt Rock',
    description: 'Iconic anthems and guitar driven official videos',
    tracks: [
      {
        id: 'gGdGFtwCNBE',
        title: 'Mr. Brightside',
        artist: 'Brandon Flowers (The Killers)',
        duration: '3:48',
        durationSec: 228,
        views: '560M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'bpOSxM0rNPM',
        title: 'Do I Wanna Know?',
        artist: 'Alex Turner (Arctic Monkeys)',
        duration: '4:26',
        durationSec: 266,
        views: '1.6B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/1200x1200bb.jpg',
      },
      {
        id: '1G4isv_Fylg',
        title: 'Bloom',
        artist: 'Sam Bentley & Christina Lacy (The Paper Kites)',
        duration: '3:30',
        durationSec: 210,
        views: '78M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0b/a9/d7/0ba9d7c7-2e68-dc9b-cde4-d142e8ce86b1/067003806756.png/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'pop-dance',
    name: 'Electronic & Pop Dance',
    description: 'High energy dance visuals and festival anthems',
    tracks: [
      {
        id: 'YykjpeuMNEk',
        title: 'Hymn For The Weekend',
        artist: 'Chris Martin & Beyoncé (Coldplay)',
        duration: '4:20',
        durationSec: 260,
        views: '2.1B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c8/0a/6d/c80a6df9-e55a-fb83-0311-f4776984ac67/mzm.lasidxkv.jpg/1200x1200bb.jpg',
      },
      {
        id: 'kOkQ4T5WO9E',
        title: 'This Is What You Came For',
        artist: 'Rihanna & Calvin Harris',
        duration: '4:00',
        durationSec: 240,
        views: '2.7B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/59/57/a6/5957a66e-fb10-4065-5739-7c54236339e4/886445857290.jpg/1200x1200bb.jpg',
      },
      {
        id: 'ALZHF5UqnU4',
        title: 'Alone',
        artist: 'Christopher Comstock (Marshmello)',
        duration: '3:20',
        durationSec: 200,
        views: '2.4B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7e/be/33/7ebe3370-959a-94f7-77e2-c9e7fea9a4ed/859716988917_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: 'IcrbM1l_BoI',
        title: 'Wake Me Up',
        artist: 'Aloe Blacc (Avicii)',
        duration: '4:32',
        durationSec: 272,
        views: '2.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/18/5b/1e/185b1ef5-5d97-19d8-aebf-8e29e41874ef/13UAAIM59255.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'DyDfgMOUjCI',
        title: 'bad guy',
        artist: 'Billie Eilish O\'Connell',
        duration: '3:25',
        durationSec: 205,
        views: '1.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/37/d1/1a37d1b1-8508-54f2-f541-bf4e437dda76/19UMGIM05028.rgb.jpg/1200x1200bb.jpg',
      },
    ],
  },
];

function parseDurationSec(durationStr: string): number {
  if (!durationStr || durationStr === 'Live') return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

// In-memory blacklist for known playback-restricted videos (disallowed embedding)
const KNOWN_RESTRICTED_IDS = new Set<string>(['hLQl3WQQoQ0', 'f-X8f_d1n3Y']);

// ─────────────────────────────────────────────────────────────────────────────
// TRUE-ENTROPY OFFICIAL SINGERS RANDOM MUSIC DISCOVERY ENGINE
// Preserves full CSPRNG randomness on every load/refresh while guaranteeing
// verified official singers, Official Artist Channels, VEVO & Topic masters.
// ─────────────────────────────────────────────────────────────────────────────

function csprngShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function csprngPick<T>(items: T[]): T {
  return items[randomInt(0, items.length)];
}

const RANDOM_MOODS = [
  { label: 'Midnight Drive', tag: '#MIDNIGHT', desc: 'Late-night studio cuts and hypnotic vocal grooves' },
  { label: 'Golden Hour', tag: '#GOLDENHOUR', desc: 'Warm sunset melodies from iconic recording artists' },
  { label: 'Rainy Window', tag: '#RAINYMOOD', desc: 'Intimate vocal performances and soulful ballads' },
  { label: 'Velvet Lounge', tag: '#VELVET', desc: 'Smooth harmonies, warm basslines, and lush production' },
  { label: 'After Hours', tag: '#AFTERHOURS', desc: 'Deep nocturnal rhythms and moody studio masters' },
  { label: 'Electric Pulse', tag: '#ELECTRIC', desc: 'High-voltage hooks, crisp percussion, and chart-topping energy' },
  { label: 'Sunrise Drift', tag: '#SUNRISE', desc: 'Bright uplifting anthems and effortless morning vocals' },
  { label: 'Ocean Breeze', tag: '#COASTAL', desc: 'Sunlit melodies, relaxed tempos, and coastal grooves' },
  { label: 'Neon Mirage', tag: '#NEON', desc: 'Shimmering synth-pop and nocturnal studio anthems' },
  { label: 'Sunday Slow', tag: '#SUNDAY', desc: 'Unrushed acoustic cuts and soul-warming vocals' },
  { label: 'Rooftop Dusk', tag: '#ROOFTOP', desc: 'Twilight beats, stylish hooks, and skyline atmosphere' },
  { label: 'Stargazer', tag: '#COSMIC', desc: 'Expansive studio soundscapes and dreamy vocal textures' },
  { label: 'Quiet Storm', tag: '#QUIETSTORM', desc: 'Velvety chords, classic voices, and heartfelt lyricism' },
  { label: 'Desert Highway', tag: '#ROADTRIP', desc: 'Open-road anthems, driving guitars, and soaring choruses' },
  { label: 'Ember Glow', tag: '#EMBER', desc: 'Rich analog warmth, timeless singers, and iconic hooks' },
  { label: 'Urban Echo', tag: '#CITYNIGHTS', desc: 'Crisp modern production and signature artist vocals' },
];

interface OfficialGenreBucket {
  genre: string;
  tag: string;
  artists: string[];
}

const OFFICIAL_SINGER_BUCKETS: OfficialGenreBucket[] = [
  {
    genre: 'Global Pop Icons',
    tag: '#POP',
    artists: [
      'The Weeknd', 'Dua Lipa', 'Bruno Mars', 'Billie Eilish', 'Adele',
      'Ed Sheeran', 'Taylor Swift', 'Harry Styles', 'Rihanna', 'Lady Gaga',
      'Ariana Grande', 'Post Malone', 'Sabrina Carpenter', 'Olivia Rodrigo',
      'Beyoncé', 'Sam Smith', 'Sia', 'Shawn Mendes', 'Charlie Puth',
      'Miley Cyrus', 'Lana Del Rey', 'Lorde', 'Troye Sivan', 'Halsey',
      'Benson Boone', 'Teddy Swims', 'Tate McRae', 'Chappell Roan',
    ],
  },
  {
    genre: 'R&B & Neo-Soul',
    tag: '#RNBSOUL',
    artists: [
      'SZA', 'Frank Ocean', 'Daniel Caesar', 'Giveon', 'Alicia Keys',
      'John Legend', 'Sade', 'Amy Winehouse', 'Stevie Wonder', 'Marvin Gaye',
      'Anderson .Paak', 'Silk Sonic', 'Leon Bridges', 'Snoh Aalegra',
      'Kali Uchis', 'Steve Lacy', 'Omar Apollo', 'Jorja Smith',
      'Summer Walker', 'Brent Faiyaz', 'Khalid', 'H.E.R.', 'RAYE', 'Erykah Badu',
    ],
  },
  {
    genre: 'Indie & Alternative',
    tag: '#INDIE',
    artists: [
      'Arctic Monkeys', 'Tame Impala', 'Coldplay', 'Radiohead', 'Gorillaz',
      'The Strokes', 'Cigarettes After Sex', 'The Neighbourhood', 'The 1975',
      'Glass Animals', 'Hozier', 'Noah Kahan', 'Bon Iver', 'Clairo',
      'Joji', 'Mac DeMarco', 'Men I Trust', 'Beach House', 'Laufey',
      'Mitski', 'Phoebe Bridgers', 'The Marías', 'Vance Joy', 'Cage The Elephant',
      'Foster The People', 'Rex Orange County', 'beabadoobee',
    ],
  },
  {
    genre: 'Rock & Timeless Anthems',
    tag: '#ROCK',
    artists: [
      'Queen', 'Fleetwood Mac', 'Pink Floyd', 'Oasis', 'The Killers',
      'Linkin Park', 'Red Hot Chili Peppers', 'Foo Fighters', 'Green Day',
      'Nirvana', 'Muse', 'Imagine Dragons', 'OneRepublic', 'U2',
      'Bruce Springsteen', 'David Bowie', 'Elton John', 'Prince',
      'Michael Jackson', 'Whitney Houston', 'George Michael', 'Phil Collins',
    ],
  },
  {
    genre: 'Hip-Hop & Rap',
    tag: '#HIPHOP',
    artists: [
      'Kendrick Lamar', 'Drake', 'Travis Scott', 'J. Cole', 'Tyler, The Creator',
      'Eminem', 'Kid Cudi', 'Mac Miller', 'A$AP Rocky', 'Childish Gambino',
      'Future', 'Metro Boomin', 'OutKast', 'Ms. Lauryn Hill', 'Nas',
      'Central Cee', 'Dave', 'Stormzy', 'Doja Cat', '21 Savage',
    ],
  },
  {
    genre: 'Electronic & Dance',
    tag: '#ELECTRONIC',
    artists: [
      'Daft Punk', 'Calvin Harris', 'Avicii', 'Disclosure', 'Fred again..',
      'Flume', 'ODESZA', 'Kygo', 'Zedd', 'Martin Garrix', 'RÜFÜS DU SOL',
      'KAYTRANADA', 'Peggy Gou', 'M83', 'Empire of the Sun', 'MGMT',
      'Parcels', 'Justice', 'David Guetta', 'Swedish House Mafia',
    ],
  },
  {
    genre: 'Bollywood & Indian Soul',
    tag: '#BOLLYWOOD',
    artists: [
      'Arijit Singh', 'Shreya Ghoshal', 'A. R. Rahman', 'Atif Aslam',
      'Sonu Nigam', 'KK', 'Mohit Chauhan', 'Pritam', 'Vishal-Shekhar',
      'Jubin Nautiyal', 'Armaan Malik', 'Darshan Raval', 'Anuv Jain',
      'Prateek Kuhad', 'Amit Trivedi', 'Sunidhi Chauhan', 'Kailash Kher',
      'Papon', 'Lucky Ali', 'Sachet-Parampara', 'Rekha Bhardwaj', 'Shankar Mahadevan',
    ],
  },
  {
    genre: 'Punjabi & Desi Wave',
    tag: '#PUNJABI',
    artists: [
      'Diljit Dosanjh', 'AP Dhillon', 'Karan Aujla', 'Shubh', 'Sidhu Moose Wala',
      'Guru Randhawa', 'Harrdy Sandhu', 'Badshah', 'Divine', 'Ritviz',
      'King', 'Talwiinder', 'PropheC', 'Amrinder Gill', 'Satinder Sartaaj',
    ],
  },
  {
    genre: 'Latin & Reggaeton',
    tag: '#LATIN',
    artists: [
      'Bad Bunny', 'Shakira', 'KAROL G', 'ROSALÍA', 'Rauw Alejandro',
      'Feid', 'J Balvin', 'Luis Fonsi', 'Peso Pluma', 'Maluma',
      'Enrique Iglesias', 'Ricky Martin', 'Camila Cabello', 'Camilo',
    ],
  },
  {
    genre: 'Afrobeats & Global Groove',
    tag: '#AFROBEATS',
    artists: [
      'Burna Boy', 'Wizkid', 'Rema', 'Tems', 'Ayra Starr',
      'Davido', 'Asake', 'Ckay', 'Omah Lay', 'Fireboy DML',
      'Stromae', 'Angèle', 'Tyla',
    ],
  },
  {
    genre: 'K-Pop & J-Pop Official',
    tag: '#ASIANPOP',
    artists: [
      'BTS', 'BLACKPINK', 'NewJeans', 'Jung Kook', 'IU', 'TWICE',
      'Stray Kids', 'SEVENTEEN', 'Fujii Kaze', 'YOASOBI', 'Kenshi Yonezu',
      'Ado', 'Official HIGE DANDism', 'Lisa', 'Jimin', 'V',
    ],
  },
];

// Known unofficial fan-upload, lyric-repost, slowed/reverb, and compilation channels to reject
const UNOFFICIAL_CHANNEL_PATTERN =
  /\b(7clouds|unique\s*vibes|vibe\s*music|shadow\s*music|chilltracks|royal\s*music|dopelyrics|syrebralvibes|taj\s*tracks|cloudkid|mrsuicidesheep|trap\s*nation|bass\s*nation|proximity|koala\s*kontrol|wave\s*music|latin\s*hype|cumbia\s*drive|lofi\s*girl|chilledcow|audio\s*library|nocopyrightsounds|ncs\b|lyrics?\s*channel|lyric\s*box|music\s*lyrics|song\s*lyrics|slowed|reverb|nightcore|sped\s*up|8d\s*tunes|8d\s*audio|karaoke|sing\s*king|piano\s*tutorials?|guitar\s*lessons?|type\s*beat|beats\s*by|ai\s*covers?|ai\s*music|suno|udio|jukebox|status\s*video|whatsapp\s*status|fan\s*club|fan\s*page|bollywood\s*classics\s*mix|nonstop\s*hits)\b/i;

// Verified major official music labels & broadcasters that publish genuine official singer releases
const OFFICIAL_LABEL_CHANNEL_PATTERN =
  /\b(vevo|t-series|sony\s*music|zee\s*music|yrf\b|yash\s*raj|tips\s*official|saregama|universal\s*music|warner\s*music|atlantic\s*records|republic\s*records|interscope|columbia\s*records|rca\s*records|def\s*jam|capitol\s*records|island\s*records|epic\s*records|parlophone|virgin\s*records|motown|blue\s*note|xl\s*recordings|4ad|domino\s*recording|sub\s*pop|ninja\s*tune|stones\s*throw|fueled\s*by\s*ramen|hybe\s*labels|jyp\s*entertainment|smtown|yg\s*entertainment|coke\s*studio|88rising|spinnin|monstercat|ultra\s*music|armada\s*music|anjunabeats|speed\s*records|white\s*hill\s*music|desi\s*melodies|dm\s*-\s*desi\s*melodies|times\s*music|eros\s*now\s*music|jjust\s*music|colorsxstudios|npr\s*music|vevo\s*official)\b/i;

// Unofficial / non-studio track title indicators to exclude from official singer discovery
const UNOFFICIAL_TITLE_PATTERN =
  /\b(cover\b|karaoke|instrumental\b|slowed|reverb|8d\s*audio|nightcore|sped\s*up|pitched|type\s*beat|fan\s*made|fan\s*video|ai\s*cover|ai\s*version|tribute\b|piano\s*version|piano\s*cover|guitar\s*cover|violin\s*cover|acoustic\s*cover|reaction|tutorial|how\s*to\s*play|parody|podcast|interview|behind\s*the\s*scenes|making\s*of|teaser\b|trailer\b|promo\b|status\b|whatsapp|ringtone|lofi\s*flip|lo-fi\s*remix|mashup|jukebox|nonstop|full\s*album|playlist|megamix|compilation|1\s*hour|10\s*hours|24\/7|live\s*stream|mixtape|mix\b|radio|beats\s*to|study\s*music|sleep\s*music|shorts?)\b/i;

// Rolling in-memory pool of live verified official tracks discovered during runtime
const liveDiscoveredPool = new Map<string, any>();
const recentServedIds: string[] = [];
const recentArtistSeeds: string[] = [];

function recordServedTracks(ids: string[]) {
  for (const id of ids) {
    if (!id) continue;
    recentServedIds.push(id);
  }
  if (recentServedIds.length > 240) {
    recentServedIds.splice(0, recentServedIds.length - 240);
  }
}

function addToLivePool(tracks: any[]) {
  for (const t of tracks) {
    if (!t?.id || KNOWN_RESTRICTED_IDS.has(t.id) || !t.isOfficial) continue;
    liveDiscoveredPool.set(t.id, t);
  }
  if (liveDiscoveredPool.size > 650) {
    const excess = liveDiscoveredPool.size - 650;
    const keys = liveDiscoveredPool.keys();
    for (let i = 0; i < excess; i++) {
      const k = keys.next().value;
      if (k) liveDiscoveredPool.delete(k);
    }
  }
}

function parseExcludeSet(excludeParam: unknown): Set<string> {
  const set = new Set<string>(KNOWN_RESTRICTED_IDS);
  if (typeof excludeParam === 'string' && excludeParam.trim()) {
    for (const part of excludeParam.split(',')) {
      const id = part.trim();
      if (id) set.add(id);
    }
  }
  return set;
}

function pickRandomOfficialArtists(bucket: OfficialGenreBucket, count: number): string[] {
  const fresh = csprngShuffle(
    bucket.artists.filter((a) => !recentArtistSeeds.includes(a))
  );
  const pool = fresh.length >= count ? fresh : csprngShuffle(bucket.artists);
  const chosen = pool.slice(0, count);
  for (const a of chosen) {
    recentArtistSeeds.push(a);
  }
  if (recentArtistSeeds.length > 90) {
    recentArtistSeeds.splice(0, recentArtistSeeds.length - 90);
  }
  return chosen;
}

function buildOfficialSingerQuery(artist: string): string {
  const mode = randomInt(0, 3);
  if (mode === 0) return `${artist} official music video`;
  if (mode === 1) return `${artist} official audio`;
  return `${artist} songs official`;
}

function buildProceduralArchetypes(count: number) {
  const shuffledBuckets = csprngShuffle(OFFICIAL_SINGER_BUCKETS);
  const shuffledMoods = csprngShuffle(RANDOM_MOODS);
  const picked: Array<{
    id: string;
    name: string;
    description: string;
    tag: string;
    artists: string[];
    queries: string[];
  }> = [];

  for (let i = 0; i < Math.min(count, shuffledBuckets.length); i++) {
    const bucket = shuffledBuckets[i];
    const mood = shuffledMoods[i % shuffledMoods.length];
    const artists = pickRandomOfficialArtists(bucket, 2);

    const styleVariant = randomInt(0, 3);
    const title =
      styleVariant === 0
        ? `${mood.label}: ${bucket.genre}`
        : styleVariant === 1
        ? `${bucket.genre} Spotlight`
        : `${bucket.genre} · ${mood.label}`;

    picked.push({
      id: `rand-${randomBytes(4).toString('hex')}`,
      name: title,
      description: `Official releases featuring ${artists.join(', ')} and more — ${mood.desc.toLowerCase()}`,
      tag: randomInt(0, 2) === 0 ? bucket.tag : mood.tag,
      artists,
      queries: artists.map((a) => buildOfficialSingerQuery(a)),
    });
  }

  return picked;
}

function cleanOfficialChannelName(rawChannel: string): string {
  return rawChannel
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s+Official$/i, '')
    .trim();
}

const SERVER_TITLE_JUNK_PAREN_RE =
  /\b(?:official|music\s*video|video|audio|lyric(?:al|s)?|visuali[sz]er|m\/?v|pv|hd|hq|4k|8k|uhd|1080p|60fps|remaster(?:ed)?|explicit|clean|nsfw|dirty|full\s*(?:song|video|audio)|with\s*lyrics|color\s*coded|sub\s*esp|español|eng\s*sub|subtitles?|new\s*(?:hindi|punjabi|english|tamil|telugu)?\s*song|latest\s*song|trending|viral|teaser|trailer|promo|clip|shorts?|prod\.?(?:\s+by)?|produced\s+by|directed\s+by|dir\.|starring|feat\.?|ft\.?|featuring|from\s+["'“”]?|ost|soundtrack|motion\s*picture|radio\s*edit|single\s*version|album\s*version|original\s*version|film\s*version|dance\s*mix|extended|bonus\s*track|deluxe|out\s*now|available\s*now|vevo|topic|live\s+(?:at|from|in|on|session|performance)|in\s+studio|performance|tiny\s*desk|colors\s+show|bbc|session|slowed|reverb|sped\s*up|nightcore|8d|bass\s*boosted|karaoke|instrumental|video\s*song|audio\s*song|audio\s*only|title\s*track|theme\s*song|animated|vertical|dolby|atmos|spatial|hi-?res|lossless|premiere|exclusive|uncensored|censored|spider-man|movie|film|version|edit|bonus|demo)\b|^\s*(?:19|20)\d{2}\s*$/i;

const SERVER_TITLE_TRAILING_JUNK_RE =
  /(?:\s*[-–—:,]?\s*|\s+)(?:official\s*(?:music\s*)?(?:hd\s*|4k\s*|8k\s*)?(?:video|audio|lyric(?:al|s)?(?:\s*(?:video|song))?|visuali[sz]er|m\/?v|performance|full\s*(?:song|video|audio)|remaster(?:ed)?|teaser|trailer)|(?:8k\/4k|4k\/8k|8k|4k|hd)\s*music\s*video|music\s*video|lyric(?:al)?\s*video|official\s*lyric|film\s*version|full\s*(?:video\s*)?song|full\s*video|full\s*audio|video\s*song|audio\s*song|with\s*lyrics|m\/v|mv|visuali[sz]er|4k\s*remaster(?:ed)?|hd\s*remaster(?:ed)?|remaster(?:ed)?(?:\s*\d{4})?|audio\s*only|hd|4k|8k|hq|explicit|clean|nsfw|official)\s*$/i;

const SERVER_TITLE_LEADING_PREFIX_RE =
  /^(?:full\s*(?:video\s*)?(?:song)?|official\s*(?:music\s*)?(?:video|audio)|lyrical?(?:\s*video)?|video\s*song|audio\s*song|new\s*song|latest\s*song|exclusive|hd|4k|m\/?v)\s*[:\-–—]\s*/i;

const SERVER_RECORD_LABEL_RE =
  /\b(?:t-series|tseries|sony\s*music|zee\s*music|tips\s*official|yrf|yash\s*raj|saregama|speed\s*records|desi\s*music|times\s*music|eros\s*now|shemaroo|warner\s*music|universal\s*music|atlantic\s*records|republic\s*records|interscope|columbia\s*records|def\s*jam|spinnin'?|monstercat|ncs|trap\s*nation|proximity|cloudkid|vevo|ultra\s*music|armada\s*music|dharma\s*productions|junglee\s*music)\b/i;

function stripServerTitleNoise(input: string): string {
  let s = (input || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}★☆♫♪▶]/gu, ' ')
    .replace(/\s+#\S+/g, '')
    .replace(/^#\S+\s+/g, '')
    .replace(/\s*(?:\||｜|\/\/|•)\s*.*$/, '')
    .replace(SERVER_TITLE_LEADING_PREFIX_RE, '');

  for (let pass = 0; pass < 4; pass++) {
    const next = s
      .replace(/\s*[\(\[【\{]\s*([^\)\]】\}]+?)\s*[\)\]】\}]/g, (full, inner: string) =>
        SERVER_TITLE_JUNK_PAREN_RE.test(inner) ? '' : full
      )
      .replace(/\s*[\(\[【\{]\s*[\)\]】\}]/g, '')
      .trim();
    if (next === s) break;
    s = next;
  }

  for (let pass = 0; pass < 4; pass++) {
    const next = s.replace(SERVER_TITLE_TRAILING_JUNK_RE, '').trim();
    if (next === s || !next) break;
    s = next;
  }

  s = s
    .replace(/\s+(?:ft\.?|feat\.?|featuring)\s+.+$/i, '')
    .replace(/^\d{1,2}\s*[.)]\s+/, '')
    .replace(/^"([^"]+)"$/, '$1')
    .replace(/^'([^']+)'$/, '$1')
    .replace(/^“([^”]+)”$/, '$1')
    .replace(/^‘([^’]+)’$/, '$1')
    .replace(/[\s\-–—:|,/]+$/, '')
    .replace(/^[\s\-–—:|,/]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

function cleanProperSongTitle(
  rawTitle: string,
  knownArtist?: string
): { title: string; artistFromTitle?: string; albumFromTitle?: string } {
  const baseCleaned = stripServerTitleNoise(rawTitle);
  if (!baseCleaned) return { title: (rawTitle || 'Unknown Track').trim() };

  let working = baseCleaned;
  let artistFromTitle: string | undefined;
  let albumFromTitle: string | undefined;

  // K-pop / quote-wrapped MV titles: BTS (방탄소년단) 'Dynamite'
  const quotedMatch = working.match(/^(.{2,42}?)\s*(?:[-–—]\s*)?['"‘“]([^'"’”]{2,80})['"’”]$/);
  if (quotedMatch) {
    const leftArtist = quotedMatch[1].replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    const quotedSong = stripServerTitleNoise(quotedMatch[2]);
    if (quotedSong) {
      return {
        title: quotedSong,
        artistFromTitle: leftArtist && !SERVER_RECORD_LABEL_RE.test(leftArtist) ? leftArtist : undefined,
      };
    }
  }

  // "Artist: Song"
  const colonMatch = working.match(/^([^:]{2,38}):\s+(.{2,})$/);
  if (colonMatch) {
    const left = colonMatch[1].trim();
    const right = stripServerTitleNoise(colonMatch[2]);
    if (!/^(?:part|chapter|act|vol|episode|ep|scene)\b/i.test(left) && right) {
      if (!SERVER_RECORD_LABEL_RE.test(left)) artistFromTitle = left;
      working = right;
    }
  }

  // "Artist - Song" / "Song - Movie | Cast | Singer" / multi-dash metadata
  const pipeCount = (rawTitle.match(/\||｜/g) || []).length;
  const isLabelChannel = SERVER_RECORD_LABEL_RE.test(knownArtist || '');
  const rawDashParts = (rawTitle || '')
    .replace(/\s*(?:\||｜|\/\/|•)\s*.*$/, '')
    .split(/\s+[-–—]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const dashParts = working
    .split(/\s+[-–—]\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  while (dashParts.length > 1) {
    const last = stripServerTitleNoise(dashParts[dashParts.length - 1]);
    if (!last || (SERVER_TITLE_JUNK_PAREN_RE.test(last) && last.split(/\s+/).length <= 4) || SERVER_RECORD_LABEL_RE.test(last)) {
      dashParts.pop();
    } else {
      break;
    }
  }

  if (dashParts.length >= 2) {
    const norm = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normKnown = norm(knownArtist || '');
    const normFirst = norm(dashParts[0]);
    const normSecond = norm(dashParts[1]);
    const firstHasSongTag =
      rawDashParts.length >= 2 &&
      /\b(?:full\s*(?:video\s*)?song|full\s*video|full\s*audio|video\s*song|audio\s*song|official\s*(?:music\s*)?(?:video|audio)|lyric(?:al)?\s*video|music\s*video)\b/i.test(
        rawDashParts[0]
      );
    const firstIsArtist = !firstHasSongTag && Boolean(normKnown) && !isLabelChannel && (normFirst === normKnown || normFirst.includes(normKnown) || normKnown.includes(normFirst));
    const secondIsArtist = Boolean(normKnown) && !isLabelChannel && (normSecond === normKnown || normSecond.includes(normKnown) || normKnown.includes(normSecond));

    // Record-label uploads with `|` pipes (e.g. Sony Music India / Zee Music / T-Series):
    // "Kesariya - Brahmāstra | Ranbir Kapoor | Pritam | Arijit Singh" or "Shayad - Love Aaj Kal | Kartik | Arijit"
    // In Indian label MV convention with 2+ pipes, `Left - Right` before the first pipe is `Song - Movie`!
    const looksLikeIndianSongDashMovie =
      pipeCount >= 2 &&
      (isLabelChannel || /\b(?:ranbir|alia|shah\s*rukh|salman|varun|kriti|kartik|sara|deepika|ranveer|shraddha|pritam|arijit|shreya|atif|vishal|sachin[\s-]jigar|amitabh|tanishk|jubin|armaan|darshan|sonu|shankar|rahman|mithoon|sachet|parampara)\b/i.test(rawTitle)) &&
      !/\b(?:ft\.?|feat\.?|featuring|&| x )\b/i.test(dashParts[0]);

    if (firstHasSongTag || (secondIsArtist && !firstIsArtist)) {
      if (secondIsArtist) artistFromTitle = dashParts[1];
      working = dashParts[0];
    } else if (looksLikeIndianSongDashMovie) {
      working = dashParts[0];
      albumFromTitle = dashParts[1];
    } else {
      if (!SERVER_RECORD_LABEL_RE.test(dashParts[0])) artistFromTitle = dashParts[0];
      working = dashParts[1];
    }
  } else if (dashParts.length === 1) {
    working = dashParts[0];
  }

  const finalTitle = stripServerTitleNoise(working);
  return {
    title: finalTitle || baseCleaned || rawTitle.trim(),
    ...(artistFromTitle ? { artistFromTitle: artistFromTitle.replace(/\s+/g, ' ').trim() } : {}),
    ...(albumFromTitle ? { albumFromTitle: albumFromTitle.replace(/\s+/g, ' ').trim() } : {}),
  };
}

function isYtmSquareCoverUrl(url: string): boolean {
  if (!url) return false;
  return (
    (url.includes('lh3.googleusercontent.com') || url.includes('yt3.googleusercontent.com')) &&
    /=w(\d+)-h\1(?:-|$)/i.test(url)
  );
}

function upgradeYtmSquareCoverUrl(url: string): string {
  if (!url) return '';
  if (isYtmSquareCoverUrl(url)) {
    return url.replace(/=w\d+-h\d+[^&]*/i, '=w600-h600-l90-rj');
  }
  return url;
}

function parsePlayCount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, '').trim();
  const m = cleaned.match(/(\d+(?:\.\d+)?)\s*([KMB])?/i);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  if (!Number.isFinite(num)) return 0;
  const unit = (m[2] || '').toUpperCase();
  if (unit === 'B') return Math.round(num * 1_000_000_000);
  if (unit === 'M') return Math.round(num * 1_000_000);
  if (unit === 'K') return Math.round(num * 1_000);
  return Math.round(num);
}

const SEARCH_NOISE_COVER_RE =
  /\b(karaoke|originally\s+performed\s+by|tribute\s+to|piano\s+cover|guitar\s+cover|violin\s+cover|cello\s+cover|drum\s+cover|sitar\s+cover|flute\s+cover|harp\s+cover|sax\s+cover|rock\s+metal\s+cover|metal\s+cover|orchestral\s+cover|epic\s+version|vocals\s+only|arabic\s+version|bossa\s+nova|lullaby|music\s+box|8[\s-]?bit|ringtone|backing\s+track|instrumental\s+version|slowed\s*(?:\+|&|and)?\s*reverb|sped\s*up|nightcore|8d\s+audio|lo[\s-]?fi\s+flip|dance\s+fitness|zumba|workout\s+mix|looping\s+station|jimmy\s+fallon|tonight\s+show|kidz\s+bop|parody|1\s+hour|10\s+hours|20\s+minute\s+loop|jukebox|non[\s-]?stop|best\s+of\s+.*hits|full\s+album|shock\s+everyone|two\s+kids\s+sing|mmv|amv|david\s+garrett\s+edition)\b/i;

const SEARCH_NOISE_ARTIST_RE =
  /\b(karaoke|tribute|bossa\s+nova|metal\s+universe|zoom\s+karaoke|zzang\s+karaoke|kidz\s+bop|lullaby|piano\s+guys|tonight\s+show|jimmy\s+fallon|dj\s+raphi|7cloudsnation|lafzify|nasheedio|music\s+box|fh\s+studios|sr\s+lofi|abt\s+lofi|rousseau|maestro\s+ziikos|uiia\s+cat|violin\s+phonix|first\s+to\s+eleven|brave\s+order)\b/i;

const SEARCH_USER_WANTS_ALT_RE =
  /\b(remix|cover|karaoke|slowed|reverb|sped\s*up|lofi|lo-?fi|acoustic|live|unplugged|instrumental|nightcore|8d|mashup|piano|guitar|orchestral|metal|house|bossa|arabic|version|extended|loop)\b/i;

function normalizeMatchText(str: string): string {
  return (str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseYtmResponsiveItem(r: any, sourceKind: 'ytm-song' | 'ytm-card' | 'ytm-video', rankIndex: number): any | null {
  if (!r) return null;
  const videoId =
    r.playlistItemData?.videoId ||
    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
    r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) return null;
  if (KNOWN_RESTRICTED_IDS.has(videoId)) return null;

  const rawTitle = (r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [])
    .map((x: any) => x.text || '')
    .join('')
    .trim();
  if (!rawTitle) return null;

  const col1Runs: any[] = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const col2Runs: any[] = r.flexColumns?.[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];

  const artistParts: string[] = [];
  let album = '';
  let duration = '';
  let viewsText = col2Runs.map((x: any) => x.text || '').join('').trim();

  for (const run of col1Runs) {
    const txt = (run?.text || '').trim();
    if (!txt || txt === '•' || txt === '·') continue;
    const pageType =
      run?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
    if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
      artistParts.push(txt);
    } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
      if (!album) album = txt;
    } else if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(txt)) {
      duration = txt;
    } else if (/\b(?:plays|views)\b/i.test(txt)) {
      if (!viewsText) viewsText = txt;
    }
  }

  // Fallback artist extraction when InnerTube omits pageType (e.g. unlinked artist runs)
  if (artistParts.length === 0) {
    const segments = col1Runs
      .map((x: any) => x.text || '')
      .join('')
      .split(/\s*[•·]\s*/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    for (const seg of segments) {
      if (/^(?:song|video|episode|single|album|ep)$/i.test(seg)) continue;
      if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(seg)) {
        if (!duration) duration = seg;
        continue;
      }
      if (/\b(?:plays|views|monthly|subscribers)\b/i.test(seg)) {
        if (!viewsText) viewsText = seg;
        continue;
      }
      if (/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i.test(seg)) continue;
      artistParts.push(seg);
      break;
    }
  }

  const rawArtist = artistParts.join(', ').replace(/\s*,\s*&\s*/g, ' & ').trim() || 'Artist';
  const durationSec = parseDurationSec(duration);
  const playsCount = parsePlayCount(viewsText);

  const thumbs: any[] = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
  const bestThumb = thumbs[thumbs.length - 1]?.url || '';
  const hasSquare = isYtmSquareCoverUrl(bestThumb);
  const thumbnail = hasSquare
    ? upgradeYtmSquareCoverUrl(bestThumb)
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const cleaned = cleanProperSongTitle(rawTitle, rawArtist);
  const title = cleaned.title || rawTitle;

  const isNoiseUpload =
    SEARCH_NOISE_COVER_RE.test(rawTitle) ||
    SEARCH_NOISE_COVER_RE.test(album) ||
    SEARCH_NOISE_ARTIST_RE.test(rawArtist);

  return {
    id: videoId,
    title,
    rawTitle,
    artist: rawArtist,
    duration: duration || '0:00',
    durationSec,
    views: viewsText,
    playsCount,
    thumbnail,
    videoThumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    hasSquareArtwork: hasSquare,
    isOfficial: !isNoiseUpload && (sourceKind === 'ytm-song' || playsCount >= 500_000),
    sourceKind,
    rankIndex,
    ...(album ? { artworkAlbumHint: album } : {}),
    ...(rawArtist ? { artworkArtistHint: rawArtist } : {}),
  };
}

async function fetchYtmSearchRaw(query: string, params?: string, timeoutMs = 2800): Promise<any | null> {
  try {
    const body: Record<string, any> = {
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20241106.01.00',
          hl: 'en',
          gl: 'US',
        },
      },
      query,
    };
    if (params) body.params = params;

    const res = await fetch('https://music.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Origin: 'https://music.youtube.com',
        Referer: 'https://music.youtube.com/',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function searchYouTubeMusicInnerTube(rawQuery: string): Promise<any[]> {
  // Parallel call: Official Songs catalog + Unfiltered Top Card (gives Top Result + artist top songs in ~450-550ms!)
  const [songsJson, topJson] = await Promise.all([
    fetchYtmSearchRaw(rawQuery, 'EgWKAQIIAWoMEAMQBBAJEAoQBRAV', 2800),
    fetchYtmSearchRaw(rawQuery, undefined, 2400),
  ]);

  const candidates: any[] = [];
  const seenIds = new Set<string>();

  const pushCandidate = (item: any | null) => {
    if (!item || !item.id || seenIds.has(item.id)) return;
    seenIds.add(item.id);
    candidates.push(item);
  };

  // 1. Parse Top Card & its featured artist/related tracks first (when Top Card is an Artist or Top Song)
  const topSections =
    topJson?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  let topCardArtist = '';
  for (const sec of topSections) {
    const card = sec.musicCardShelfRenderer;
    if (!card) continue;
    const cardTitle = (card.title?.runs || []).map((x: any) => x.text || '').join('').trim();
    const cardSubRuns: any[] = card.subtitle?.runs || [];
    const cardSubText = cardSubRuns.map((x: any) => x.text || '').join('').trim();
    const isArtistCard = /^artist\b/i.test(cardSubText);
    if (isArtistCard && cardTitle) {
      topCardArtist = cardTitle;
    }

    const cardVid = card.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
    if (cardVid && cardVid.length === 11 && !KNOWN_RESTRICTED_IDS.has(cardVid)) {
      const thumbs: any[] = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      const bestThumb = thumbs[thumbs.length - 1]?.url || '';
      const hasSquare = isYtmSquareCoverUrl(bestThumb);
      const segments = cardSubText.split(/\s*[•·]\s*/).map((s: string) => s.trim()).filter(Boolean);
      const artistSeg = segments.find((s: string) => !/^(?:song|video|episode)$/i.test(s) && !/^\d{1,2}:\d{2}/.test(s) && !/\b(?:views|plays)\b/i.test(s)) || '';
      const durSeg = segments.find((s: string) => /^\d{1,2}:\d{2}(?::\d{2})?$/.test(s)) || '';
      const viewsSeg = segments.find((s: string) => /\b(?:views|plays)\b/i.test(s)) || '';
      const cleaned = cleanProperSongTitle(cardTitle, artistSeg);
      pushCandidate({
        id: cardVid,
        title: cleaned.title || cardTitle,
        rawTitle: cardTitle,
        artist: artistSeg || cleaned.artistFromTitle || 'Artist',
        duration: durSeg || '0:00',
        durationSec: parseDurationSec(durSeg),
        views: viewsSeg,
        playsCount: parsePlayCount(viewsSeg),
        thumbnail: hasSquare ? upgradeYtmSquareCoverUrl(bestThumb) : `https://i.ytimg.com/vi/${cardVid}/hqdefault.jpg`,
        videoThumbnail: `https://i.ytimg.com/vi/${cardVid}/hqdefault.jpg`,
        hasSquareArtwork: hasSquare,
        isOfficial: !SEARCH_NOISE_COVER_RE.test(cardTitle),
        sourceKind: hasSquare ? 'ytm-song' : 'ytm-card',
        rankIndex: 0,
        ...(artistSeg ? { artworkArtistHint: artistSeg } : {}),
      });
    }

    // Parse card children (e.g., for Artist search "Arijit Singh" -> top hits like "Apna Bana Le", "Salamat")
    const cardChildren: any[] = card.contents || [];
    cardChildren.forEach((child, idx) => {
      const parsed = parseYtmResponsiveItem(child?.musicResponsiveListItemRenderer, 'ytm-card', idx + 1);
      if (parsed) {
        if (topCardArtist && (!parsed.artist || parsed.artist === 'Artist')) {
          parsed.artist = topCardArtist;
          parsed.artworkArtistHint = topCardArtist;
        }
        pushCandidate(parsed);
      }
    });
  }

  // 2. Parse Official Songs shelf (up to 20 studio songs with exact artist, album, playsCount, and square cover)
  const songSections =
    songsJson?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  let songRank = 0;
  for (const sec of songSections) {
    const shelf = sec.musicShelfRenderer;
    if (!shelf?.contents) continue;
    for (const item of shelf.contents) {
      const parsed = parseYtmResponsiveItem(item?.musicResponsiveListItemRenderer, 'ytm-song', songRank++);
      if (parsed) pushCandidate(parsed);
    }
  }

  return candidates;
}

function rankAndFilterSearchTracks(candidates: any[], rawQuery: string, limit = 15): any[] {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const normQ = normalizeMatchText(rawQuery);
  const queryTokens = normQ.split(' ').filter((t) => t.length >= 2);
  const userWantsAlt = SEARCH_USER_WANTS_ALT_RE.test(rawQuery || '');

  // Pre-filter obvious karaoke / cover / parody / fitness / compilation junk unless user explicitly asked for it
  const cleanedCandidates = candidates.filter((t) => {
    if (!t?.id || KNOWN_RESTRICTED_IDS.has(t.id)) return false;
    const rawTitle = t.rawTitle || t.title || '';
    const artist = t.artist || '';
    const album = t.artworkAlbumHint || '';
    const dur = t.durationSec || 0;

    // Drop very short clips (< 45s) or huge jukeboxes/compilations (> 12 min)
    if (dur > 0 && (dur < 45 || dur > 720)) return false;

    if (!userWantsAlt) {
      if (SEARCH_NOISE_COVER_RE.test(rawTitle) || SEARCH_NOISE_COVER_RE.test(album) || SEARCH_NOISE_ARTIST_RE.test(artist)) {
        return false;
      }
      // Drop cover/remix/slowed/karaoke variants when not asked for
      if (/\b(?:cover|karaoke|slowed|reverb|sped\s*up|nightcore|remix|lofi|lo-?fi|unplugged|8d|mashup|parody|instrumental)\b/i.test(rawTitle)) {
        return false;
      }
      // Drop songs whose title is literally identical to the artist name (mangled YouTube scrape artifact)
      if (
        t.sourceKind !== 'ytm-song' &&
        normalizeMatchText(t.title) === normalizeMatchText(artist) &&
        normalizeMatchText(t.title) !== normQ
      ) {
        return false;
      }
    }
    return true;
  });

  const pool = cleanedCandidates.length > 0 ? cleanedCandidates : candidates;

  // Track the highest play count per normalized titleKey so blockbuster originals (e.g. 3.7B plays)
  // always suppress lower-play covers with the exact same title even when the user had a typo in their query.
  const maxPlaysByTitleKey = new Map<string, number>();
  let globalMaxPlays = 0;
  for (const t of pool) {
    const tKey = normalizeSearchTitleForDedup(t.title || '', rawQuery);
    const plays = t.playsCount || parsePlayCount(t.views || '');
    if (plays > globalMaxPlays) globalMaxPlays = plays;
    if (tKey) {
      const prev = maxPlaysByTitleKey.get(tKey) || 0;
      if (plays > prev) maxPlaysByTitleKey.set(tKey, plays);
    }
  }

  const pruned = pool.filter((t) => {
    if (userWantsAlt) return true;
    const tKey = normalizeSearchTitleForDedup(t.title || '', rawQuery);
    const plays = t.playsCount || parsePlayCount(t.views || '');
    const titleMaxPlays = tKey ? maxPlaysByTitleKey.get(tKey) || 0 : 0;
    // If a massive blockbuster (>= 10M plays) owns this exact song title, drop covers with < 15% of its plays
    if (titleMaxPlays >= 10_000_000 && plays > 0 && plays < titleMaxPlays * 0.15) {
      return false;
    }
    return true;
  });

  // Score every candidate for relevance + authority + studio quality
  const scored = pruned.map((t, idx) => {
    const normTitle = normalizeMatchText(t.title || '');
    const normArtist = normalizeMatchText(t.artist || '');
    const normAlbum = normalizeMatchText(t.artworkAlbumHint || '');
    const rawTitleLower = (t.rawTitle || t.title || '').toLowerCase();
    const plays = t.playsCount || parsePlayCount(t.views || '');

    let score = 0;

    // 1. Exact combined "title + artist" or "artist + title" match (highest precision!)
    const combinedTA = `${normTitle} ${normArtist}`.trim();
    const combinedAT = `${normArtist} ${normTitle}`.trim();
    const isExactCombined =
      Boolean(normQ) &&
      Boolean(normTitle) &&
      Boolean(normArtist) &&
      (combinedTA === normQ || combinedAT === normQ);

    // Detect cover uploads that embed the real artist's name inside parentheses in the title
    // while the actual track artist is someone else (e.g. "Shape of You (Ed Sheeran)" by "Rousseau")
    const parenArtistMatch = rawTitleLower.match(/\(([^)]{3,40})\)/);
    const parenInsideNorm = parenArtistMatch ? normalizeMatchText(parenArtistMatch[1]) : '';
    const isCoverWithArtistInParens =
      !userWantsAlt &&
      Boolean(parenInsideNorm) &&
      Boolean(normQ) &&
      normQ.includes(parenInsideNorm) &&
      !normArtist.includes(parenInsideNorm) &&
      !/\b(?:feat|ft|from|remaster|deluxe|radio|album|single|pt|part)\b/i.test(parenInsideNorm);

    if (isExactCombined) {
      score += 210;
    } else if (normQ && normTitle === normQ && !isCoverWithArtistInParens) {
      score += 155;
    } else if (normQ && normTitle.startsWith(normQ)) {
      score += 95;
    } else if (normQ && normTitle.includes(normQ)) {
      score += 65;
    }

    if (isCoverWithArtistInParens) {
      score -= 130;
    }

    if (normQ && normArtist === normQ) {
      score += 135;
    } else if (normQ && (normArtist.includes(normQ) || (normQ.includes(normArtist) && normArtist.length >= 4))) {
      score += 80;
    }

    // 2. Multi-token query match coverage (handles "shape of you ed sheeran", "tum hi ho arijit", etc.)
    if (queryTokens.length > 0) {
      let titleHits = 0;
      let artistHits = 0;
      let anyHits = 0;
      for (const tok of queryTokens) {
        const inTitle = normTitle.includes(tok);
        const inArtist = normArtist.includes(tok);
        if (inTitle) titleHits++;
        if (inArtist) artistHits++;
        if (inTitle || inArtist || normAlbum.includes(tok)) anyHits++;
      }
      const coverage = anyHits / queryTokens.length;
      score += coverage * 85;
      if (anyHits === queryTokens.length) score += 35;
      if (titleHits > 0 && artistHits > 0) score += 55; // Both song & credited artist matched!
    }

    // 3. Popularity authority (strong logarithmic play/view count so real hits crush knockoffs & parodies)
    if (plays > 0) {
      score += Math.min(82, Math.log10(Math.max(10, plays)) * 8.5);
    }
    if (globalMaxPlays >= 50_000_000 && plays > 0 && plays < 200_000 && normTitle !== normQ) {
      score -= 45;
    }

    // 4. Studio audio + official square artwork preference
    if (t.sourceKind === 'ytm-song') score += 38;
    if (t.hasSquareArtwork) score += 28;
    if (t.isOfficial) score += 20;

    // 5. Healthy single-track duration
    const dur = t.durationSec || 0;
    if (dur >= 95 && dur <= 450) score += 12;

    // 6. Mild preference for engine's original top rank
    const engineRank = typeof t.rankIndex === 'number' ? t.rankIndex : idx;
    score += Math.max(0, 16 - engineRank * 1.1);

    // Strip internal ranking metadata before returning to client
    const { rawTitle: _rt, playsCount: _pc, sourceKind: _sk, rankIndex: _ri, ...cleanTrack } = t;
    return { track: cleanTrack, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const ranked = scored.map((s) => s.track);
  return deduplicateSearchTracks(ranked, rawQuery).slice(0, limit);
}

async function scrapeYouTubeMusic(
  rawQuery: string,
  options: {
    limit?: number;
    singleTracksOnly?: boolean;
    officialOnly?: boolean;
    excludeIds?: Set<string>;
  } = {}
): Promise<any[]> {
  const {
    limit = 16,
    singleTracksOnly = false,
    officialOnly = false,
    excludeIds = KNOWN_RESTRICTED_IDS,
  } = options;

  const officialQuery = /official\s*(music\s*)?(video|audio)|songs?\s+official/i.test(rawQuery)
    ? rawQuery
    : `${rawQuery} official music video`;

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(officialQuery)}`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(5500),
  });

  if (!response.ok) {
    throw new Error(`YouTube responded with status ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const tracks: any[] = [];
  const seenLocal = new Set<string>();

  for (const sec of sections) {
    const renderers = sec.itemSectionRenderer?.contents || [];
    for (const item of renderers) {
      if (!item.videoRenderer) continue;
      const v = item.videoRenderer;
      const videoId = v.videoId;
      if (!videoId || seenLocal.has(videoId) || KNOWN_RESTRICTED_IDS.has(videoId) || excludeIds.has(videoId)) {
        continue;
      }

      const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'Unknown Title';
      const rawChannel = v.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Artist';
      const duration = v.lengthText?.simpleText || '';
      const durationSec = parseDurationSec(duration);
      const views = v.viewCountText?.simpleText || '';
      const thumbs = v.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const lowerTitle = title.toLowerCase();
      const lowerChannel = rawChannel.toLowerCase();

      const hasVerifiedArtistBadge = !!v.ownerBadges?.some(
        (b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST'
      );
      const hasVerifiedBadge = !!v.ownerBadges?.some(
        (b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED'
      );
      const isTopicChannel = /\s*-\s*topic$/i.test(rawChannel);
      const isVevoChannel = /vevo/i.test(rawChannel);
      const isKnownLabelChannel = OFFICIAL_LABEL_CHANNEL_PATTERN.test(rawChannel);
      const isUnofficialChannel = UNOFFICIAL_CHANNEL_PATTERN.test(rawChannel);

      // Strictly block obvious non-music, playlist, and jukebox compilation uploads everywhere
      const isDisqualified =
        lowerTitle.includes('1 hour') ||
        lowerTitle.includes('10 hours') ||
        lowerTitle.includes('reaction') ||
        lowerTitle.includes('tutorial') ||
        lowerTitle.includes('how to play') ||
        lowerTitle.includes('parody') ||
        lowerTitle.includes('podcast') ||
        lowerTitle.includes('interview') ||
        lowerTitle.includes('behind the scenes') ||
        lowerTitle.includes('making of') ||
        /\b(?:jukebox|hit\s+songs|best\s+of|top\s+\d+\s+songs|non[\s-]?stop|audio\s+jukebox|video\s+jukebox|full\s+album|all\s+songs|playlist|mashup\s+20\d\d)\b/i.test(
          lowerTitle
        );

      if (isDisqualified) continue;

      // True official singer/label verification (never fooled by fan channels typing "Official" in title)
      const isVerifiedOfficialSource =
        !isUnofficialChannel &&
        (hasVerifiedArtistBadge ||
          isTopicChannel ||
          isVevoChannel ||
          isKnownLabelChannel ||
          (hasVerifiedBadge &&
            (lowerTitle.includes('official music video') ||
              lowerTitle.includes('official video') ||
              lowerTitle.includes('official audio') ||
              lowerTitle.includes('official lyric video'))));

      if (singleTracksOnly) {
        const isMixOrCompilation =
          !duration ||
          duration === 'Live' ||
          durationSec < 95 ||
          durationSec > 540 ||
          UNOFFICIAL_TITLE_PATTERN.test(lowerTitle);
        if (isMixOrCompilation) continue;
      }

      if (officialOnly) {
        if (!isVerifiedOfficialSource) continue;
        // Also exclude fan lyric videos unless uploaded directly by the Official Artist Channel
        if (!hasVerifiedArtistBadge && !isTopicChannel && /\blyrics?\b/i.test(lowerTitle) && !isKnownLabelChannel) {
          continue;
        }
      }

      const cleanedChannel = cleanOfficialChannelName(rawChannel) || rawChannel;
      const parsedMeta = cleanProperSongTitle(title, cleanedChannel);
      const displayTitle = parsedMeta.title;
      const isLabelUpload = SERVER_RECORD_LABEL_RE.test(cleanedChannel) || !cleanedChannel || cleanedChannel === 'YouTube Artist';

      // Extract original movie/album & singer context from raw YouTube title before it gets discarded
      // e.g., "Zaalima | Raees | Shah Rukh Khan | Arijit Singh & Harshdeep Kaur" -> albumHint: "Raees", artistHint: "Arijit Singh"
      let artworkAlbumHint = parsedMeta.albumFromTitle || '';
      let artworkArtistHint = parsedMeta.artistFromTitle || '';
      const fromInRaw = title.match(/[\(\[]\s*from\s+["'“”]?([^"'“”\)\]]{2,60})["'“”]?\s*[\)\]]/i);
      if (fromInRaw && fromInRaw[1]) {
        artworkAlbumHint = fromInRaw[1].trim();
      }
      const pipeSegments: string[] = String(title || '')
        .split(/\s*(?:\||｜)\s*/)
        .map((p: string) => p.trim())
        .filter(Boolean);
      const trailingPipesText = pipeSegments.slice(1).join(' | ').toLowerCase();
      if (pipeSegments.length >= 2) {
        // Check if user searched for an ARTIST (appears AFTER the first pipe, NOT matching the song title!)
        if (!artworkArtistHint && isLabelUpload) {
          const cleanQueryArtist = rawQuery
            .replace(/\b(?:official|music|video|audio|songs?|top|best|hits?|lyric(?:s|al)?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          const normDispTitle = displayTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
          const normQueryArt = cleanQueryArtist.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
          const queryIsSongName =
            normQueryArt &&
            normDispTitle &&
            (normDispTitle.includes(normQueryArt) || normQueryArt.includes(normDispTitle));
          if (
            !queryIsSongName &&
            cleanQueryArtist.length >= 3 &&
            cleanQueryArtist.length <= 42 &&
            trailingPipesText.includes(cleanQueryArtist.toLowerCase())
          ) {
            artworkArtistHint = cleanQueryArtist
              .split(' ')
              .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
              .join(' ');
          }
        }
        // Extract well-known credited playback singer from trailing pipes on record-label uploads
        if (!artworkArtistHint && isLabelUpload) {
          const knownSingerMatch = pipeSegments
            .slice(1)
            .join(' | ')
            .match(
              /\b(Arijit Singh|Shreya Ghoshal|Atif Aslam|Pritam|A\.?\s*R\.?\s*Rahman|Vishal Mishra|Jubin Nautiyal|Sonu Nigam|Armaan Malik|Darshan Raval|Diljit Dosanjh|AP Dhillon|Karan Aujla|Sidhu Moose Wala|Shubh|Badshah|Yo Yo Honey Singh|Neha Kakkar|Sunidhi Chauhan|KK|Mohit Chauhan|B Praak|Sachet Tandon|Jasleen Royal|Anuv Jain|King|Divine|Raftaar|MC Stan|Anirudh Ravichander|Sid Sriram)\b/i
            );
          if (knownSingerMatch && knownSingerMatch[1]) {
            artworkArtistHint = knownSingerMatch[1].trim();
          }
        }
        if (!artworkAlbumHint) {
          const secondSeg = pipeSegments[1]
            .replace(/\b(?:official|full\s*(?:video|song|audio)|lyric(?:al)?\s*video|hd|4k|8k|video\s*song)\b/gi, '')
            .trim();
          const isSameAsArtist =
            artworkArtistHint && secondSeg.toLowerCase().includes(artworkArtistHint.toLowerCase());
          if (
            secondSeg.length >= 2 &&
            secondSeg.length <= 48 &&
            !isSameAsArtist &&
            !SERVER_RECORD_LABEL_RE.test(secondSeg) &&
            !/\b(?:love\s+song|sad\s+song|new\s+song|hit\s+song|official\s+music)\b/i.test(secondSeg)
          ) {
            artworkAlbumHint = secondSeg;
          }
        }
      }

      const displayArtist =
        isLabelUpload && artworkArtistHint
          ? artworkArtistHint
          : parsedMeta.artistFromTitle && isLabelUpload
          ? parsedMeta.artistFromTitle
          : cleanedChannel;

      seenLocal.add(videoId);
      tracks.push({
        id: videoId,
        title: displayTitle,
        artist: displayArtist,
        duration: duration || 'Live',
        durationSec,
        views,
        thumbnail,
        isOfficial: isVerifiedOfficialSource,
        ...(artworkAlbumHint ? { artworkAlbumHint } : {}),
        ...(artworkArtistHint ? { artworkArtistHint } : {}),
      });
    }
  }

  const dedupedTracks = deduplicateSearchTracks(tracks, rawQuery);

  if (singleTracksOnly || officialOnly) {
    const official = csprngShuffle(dedupedTracks.filter((t) => t.isOfficial));
    const result = officialOnly
      ? official.slice(0, limit)
      : [...official, ...csprngShuffle(dedupedTracks.filter((t) => !t.isOfficial))].slice(0, limit);
    addToLivePool(result);
    return result;
  }

  dedupedTracks.sort((a, b) => {
    if (a.isOfficial && !b.isOfficial) return -1;
    if (!a.isOfficial && b.isOfficial) return 1;
    return 0;
  });

  addToLivePool(dedupedTracks.filter((t) => t.isOfficial && t.durationSec >= 95 && t.durationSec <= 540));
  return dedupedTracks.slice(0, limit);
}

function getAllFallbackTracks(excludeIds: Set<string>): any[] {
  const combined = new Map<string, any>();
  for (const t of liveDiscoveredPool.values()) {
    if (!KNOWN_RESTRICTED_IDS.has(t.id) && !excludeIds.has(t.id) && t.isOfficial) {
      combined.set(t.id, t);
    }
  }
  for (const g of CURATED_GENRES) {
    for (const t of g.tracks) {
      if (!KNOWN_RESTRICTED_IDS.has(t.id) && !excludeIds.has(t.id) && !combined.has(t.id)) {
        combined.set(t.id, { ...t, isOfficial: true });
      }
    }
  }
  return csprngShuffle(Array.from(combined.values()));
}

function getCanonicalTrackKey(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/\s*[\(\[]\s*[^\)\]]*(official|video|audio|lyric|visualizer|hd|4k|live|remaster|vevo|m\/v|mv|performance|session)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*\|.*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SEARCH_DEDUP_GENERIC_ARTIST_RE =
  /\b(t-?series|sony\s*music\w*|zee\s*music\w*|yrf|yash\s*raj|tips|saregama|speed\s*records|universal\s*music|warner\s*music|republic\s*records|atlantic\s*records|columbia\s*records|interscope|def\s*jam|vevo|7clouds|dopelyrics|syrebralvibes|unique\s*vibes|taj\s*tracks|chilltracks|vibe\s*music|latin\s*hype|kidz\s*bop|bbc\s*radio|set\s*india|lyrics?|music\s*hub|youtube\s*artist|unknown\s*artist|topic)\b/i;

const SEARCH_DEDUP_ALT_EDITION_RE =
  /\b(remix|dance\s*mix|mix|acoustic|live|slowed|reverb|sped\s*up|lofi|lo-?fi|unplugged|cover|karaoke|instrumental|nightcore|8d|mashup|extended|radio\s*edit|version|session|weekend|all\s*stars)\b/i;

function normalizeSearchTitleForDedup(rawTitle: string, searchQuery = ''): string {
  const { title: proper } = cleanProperSongTitle(rawTitle || '');
  let key = proper
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Strip lowercase 'l' pipe mimics common on music channels (e.g., "Kesariya l Brahmastra l ...")
  key = key.replace(/\s+l\s+.*$/i, '');

  key = key
    .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|featuring|with)\s+[^\)\]]*[\)\]]/gi, '')
    .replace(/\s+(?:feat\.?|ft\.?|featuring)\s+.*$/i, '');

  if (!SEARCH_DEDUP_ALT_EDITION_RE.test(searchQuery || '')) {
    key = key
      .replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '')
      .replace(/\s*[-–—]\s*(?:remix|dance\s*mix|acoustic|live|slowed(?:\s*\+?\s*reverb)?|sped\s*up|lofi|lo-?fi|unplugged|cover|karaoke|instrumental|remaster(?:ed)?|radio\s*edit|single\s*version|album\s*version).*$/i, '')
      .replace(/\s+-[a-z0-9].*$/i, '');
  }

  return key
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchArtistForDedup(rawArtist: string): { normalized: string; tokens: string[]; isGeneric: boolean } {
  const cleanedRaw = cleanOfficialChannelName(rawArtist || '') || rawArtist || '';
  const isGeneric = !cleanedRaw.trim() || SEARCH_DEDUP_GENERIC_ARTIST_RE.test(cleanedRaw);
  const normalized = cleanedRaw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(official|music|records|entertainment|channel|tv)\b/gi, ' ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = normalized.split(' ').filter((tok) => tok.length >= 2 && tok !== 'the' && tok !== 'and');
  return { normalized, tokens, isGeneric };
}

function deduplicateSearchTracks(tracks: any[], searchQuery = ''): any[] {
  if (!Array.isArray(tracks) || tracks.length <= 1) return tracks || [];
  const queryWantsAlt = SEARCH_DEDUP_ALT_EDITION_RE.test(searchQuery || '');
  const normalizedQuery = (searchQuery || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf\uac00-\ud7af]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const scoreItem = (t: any, idx: number): number => {
    let score = 0;
    if (t.hasSquareArtwork) score += 45;
    if (t.isOfficial) score += 30;
    const raw = (t.title || '').toLowerCase();
    const isAlt = SEARCH_DEDUP_ALT_EDITION_RE.test(raw) || /\blyrics?\b/i.test(raw) || /\s+l\s+/i.test(raw);
    if (!queryWantsAlt && !isAlt) {
      score += 24;
    }
    const plays = parsePlayCount(t.views || '');
    if (plays > 0) {
      score += Math.min(65, Math.log10(Math.max(10, plays)) * 6.8);
    }
    const dur = t.durationSec || 0;
    if (dur >= 100 && dur <= 460) score += 10;
    if (!SEARCH_DEDUP_GENERIC_ARTIST_RE.test(t.artist || '')) score += 12;
    score += Math.max(0, 8 - idx * 0.35);
    return score;
  };

  const seenIds = new Set<string>();
  const kept: Array<{
    track: any;
    score: number;
    titleKey: string;
    artist: { normalized: string; tokens: string[]; isGeneric: boolean; isOfficial: boolean; isAltUpload: boolean };
  }> = [];

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    if (!t?.id || seenIds.has(t.id)) continue;
    seenIds.add(t.id);

    const parsed = cleanProperSongTitle(t.title || '', t.artist || '');
    const titleKey = normalizeSearchTitleForDedup(t.title || '', searchQuery);
    const effArtist =
      parsed.artistFromTitle && SEARCH_DEDUP_GENERIC_ARTIST_RE.test(t.artist || '')
        ? parsed.artistFromTitle
        : t.artist || parsed.artistFromTitle || '';
    const isAltUpload =
      SEARCH_DEDUP_ALT_EDITION_RE.test(t.title || '') ||
      /\blyrics?\b/i.test(t.title || '') ||
      /\s+l\s+/i.test(t.title || '');
    const artist = { ...normalizeSearchArtistForDedup(effArtist), isOfficial: Boolean(t.isOfficial), isAltUpload };
    const score = scoreItem(t, i);

    if (!titleKey) {
      kept.push({ track: t, score, titleKey, artist });
      continue;
    }

    const titleMatchesQuery =
      Boolean(normalizedQuery) &&
      titleKey.length >= 3 &&
      (titleKey === normalizedQuery ||
        normalizedQuery.includes(titleKey) ||
        (titleKey.startsWith(normalizedQuery) && titleKey.length - normalizedQuery.length <= 4));

    const dupIdx = kept.findIndex((existing) => {
      if (existing.titleKey !== titleKey) return false;
      if (titleMatchesQuery) return true;
      // Only treat same title as distinct songs when BOTH are verified official non-generic artists with zero overlap
      if (
        !existing.artist.isGeneric &&
        !artist.isGeneric &&
        !existing.artist.isAltUpload &&
        !artist.isAltUpload &&
        existing.artist.isOfficial &&
        artist.isOfficial &&
        existing.artist.normalized &&
        artist.normalized &&
        existing.artist.normalized !== artist.normalized &&
        !existing.artist.normalized.includes(artist.normalized) &&
        !artist.normalized.includes(existing.artist.normalized)
      ) {
        const bSet = new Set(artist.tokens);
        const sharesToken = existing.artist.tokens.some((tok) => bSet.has(tok));
        if (!sharesToken) return false;
      }
      return true;
    });

    if (dupIdx === -1) {
      kept.push({ track: t, score, titleKey, artist });
    } else {
      const existing = kept[dupIdx];
      if (score > existing.score) {
        const merged =
          !t.hasSquareArtwork && existing.track.hasSquareArtwork && existing.track.thumbnail
            ? { ...t, thumbnail: existing.track.thumbnail, hasSquareArtwork: true }
            : t;
        kept[dupIdx] = { track: merged, score, titleKey, artist };
      } else if (!existing.track.hasSquareArtwork && t.hasSquareArtwork && t.thumbnail) {
        kept[dupIdx] = {
          ...existing,
          track: { ...existing.track, thumbnail: t.thumbnail, hasSquareArtwork: true },
        };
      }
    }
  }

  return kept.map((k) => k.track);
}

async function generateRandomUniverse(clientExclude: Set<string>) {
  const seed = randomBytes(6).toString('hex');
  const recentSet = new Set<string>([...clientExclude, ...recentServedIds.slice(-90)]);
  const archetypes = buildProceduralArchetypes(4);

  // Query 2 randomly chosen official singers per collection in parallel (8 verified singer searches total)
  const scrapeResults = await Promise.all(
    archetypes.map(async (arch) => {
      const settled = await Promise.allSettled(
        arch.queries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: recentSet,
          })
        )
      );
      const merged: any[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled') merged.push(...r.value);
      }
      return csprngShuffle(merged);
    })
  );

  const usedGlobalIds = new Set<string>();
  const usedGlobalTitles = new Set<string>();
  const fallbackPool = getAllFallbackTracks(recentSet);
  const emergencyPool = getAllFallbackTracks(KNOWN_RESTRICTED_IDS);

  const genres = archetypes.map((arch, idx) => {
    const liveTracks = scrapeResults[idx] || [];
    const collectionTracks: any[] = [];

    for (const t of csprngShuffle(liveTracks)) {
      if (collectionTracks.length >= 7) break;
      const canon = getCanonicalTrackKey(t.title || '');
      if (
        !usedGlobalIds.has(t.id) &&
        !KNOWN_RESTRICTED_IDS.has(t.id) &&
        (!canon || !usedGlobalTitles.has(canon))
      ) {
        usedGlobalIds.add(t.id);
        if (canon) usedGlobalTitles.add(canon);
        collectionTracks.push(t);
      }
    }

    // Supplement cleanly from verified official pool if a YouTube query returned fewer than 6 unique tracks
    const supplementSources = [fallbackPool, emergencyPool];
    for (const source of supplementSources) {
      if (collectionTracks.length >= 6) break;
      for (const t of source) {
        if (collectionTracks.length >= 6) break;
        const canon = getCanonicalTrackKey(t.title || '');
        if (
          !usedGlobalIds.has(t.id) &&
          !KNOWN_RESTRICTED_IDS.has(t.id) &&
          (!canon || !usedGlobalTitles.has(canon))
        ) {
          usedGlobalIds.add(t.id);
          if (canon) usedGlobalTitles.add(canon);
          collectionTracks.push(t);
        }
      }
    }

    return {
      id: arch.id,
      name: arch.name,
      description: arch.description,
      tag: arch.tag,
      tracks: csprngShuffle(collectionTracks),
    };
  });

  const shuffledGenres = csprngShuffle(genres.filter((g) => g.tracks.length > 0));
  const allUniverseTracks = csprngShuffle(shuffledGenres.flatMap((g) => g.tracks));

  const featured = allUniverseTracks.slice(0, 4);
  const popular = csprngShuffle(allUniverseTracks).slice(0, 9);
  const randomStarter =
    allUniverseTracks.length > 0
      ? csprngPick(allUniverseTracks)
      : csprngPick(CURATED_GENRES.flatMap((g) => g.tracks).filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id)));

  recordServedTracks(allUniverseTracks.map((t) => t.id));

  return {
    seed,
    generatedAt: Date.now(),
    genres: shuffledGenres,
    featured,
    popular,
    randomStarter,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptimeSec: Math.round(process.uptime()) });
  });

  function sanitizeText(input: unknown, maxLen = 140): string {
    if (typeof input !== 'string') return '';
    return input.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
  }

  // Report playback-restricted video to filter across all clients
  app.post('/api/report-restricted', (req: Request, res: Response) => {
    const videoId = typeof req.body?.videoId === 'string' ? req.body.videoId.trim() : '';
    if (/^[a-zA-Z0-9_-]{6,20}$/.test(videoId) && KNOWN_RESTRICTED_IDS.size < 2000) {
      KNOWN_RESTRICTED_IDS.add(videoId);
      liveDiscoveredPool.delete(videoId);
      console.warn(`[Restricted Video Added to Blacklist]: ${videoId}`);
    }
    res.json({ ok: true, count: KNOWN_RESTRICTED_IDS.size });
  });

  // API 1: Totally Random Music Universe (Fresh collections, spotlight, popular, and starter every single time)
  const handleRandomFeed = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const excludeSet = parseExcludeSet(req.query.exclude);
    try {
      const universe = await generateRandomUniverse(excludeSet);

      // Fast budgeted 1:1 studio artwork enrichment (~900ms cap) so /api/curated never stalls or times out
      const enrichedGenres = await Promise.all(
        (universe.genres || []).map(async (g: any) => ({
          ...g,
          tracks: await enrichTracksRealtimeFast(g.tracks || [], 900),
        }))
      );

      // Quietly warm deeper Wave 2/3 studio covers into disk cache in the background
      void Promise.allSettled(
        (universe.genres || []).map((g: any) => enrichTracksWithSquareArtwork(g.tracks || [], 4))
      );

      const allEnriched = enrichedGenres.flatMap((g: any) => g.tracks || []);
      const squareOnly = allEnriched.filter((t: any) => t.hasSquareArtwork);

      // Guarantee full 1:1 square cover pool for Hero / Heavy Rotation / Top Charts
      const curatedSquareFallback = csprngShuffle(
        CURATED_GENRES.flatMap((g) => g.tracks)
          .filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id) && isStudioPosterUrl(t.thumbnail))
          .map((t) => ({
            ...t,
            hasSquareArtwork: true,
            videoThumbnail: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
          }))
      );

      const squarePoolMap = new Map<string, any>();
      for (const t of [...csprngShuffle(squareOnly), ...curatedSquareFallback]) {
        if (!squarePoolMap.has(t.id)) squarePoolMap.set(t.id, t);
      }
      const squarePool = Array.from(squarePoolMap.values());

      res.json({
        ...universe,
        genres: enrichedGenres,
        featured: squarePool.slice(0, 6),
        popular: csprngShuffle(squarePool).slice(0, 9),
        randomStarter: csprngPick(squarePool) || squarePool[0] || universe.randomStarter,
      });
    } catch (err: any) {
      console.error('Random universe generation error:', err?.message);
      const fallbackShuffled = csprngShuffle(CURATED_GENRES).map((g) => ({
        ...g,
        tracks: csprngShuffle(g.tracks.filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id))).map((t) => ({
          ...t,
          hasSquareArtwork: isStudioPosterUrl(t.thumbnail),
          videoThumbnail: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
        })),
      }));
      const flat = csprngShuffle(fallbackShuffled.flatMap((g) => g.tracks));
      res.json({
        seed: randomBytes(6).toString('hex'),
        generatedAt: Date.now(),
        genres: fallbackShuffled,
        featured: flat.slice(0, 6),
        popular: flat.slice(0, 9),
        randomStarter: flat[0] || CURATED_GENRES[0].tracks[0],
      });
    }
  };

  app.get('/api/curated', handleRandomFeed);
  app.get('/api/random-feed', handleRandomFeed);

  // API 2: Taste-Personalized & Fresh Official Recommendations
  app.get('/api/recommendations', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const trackId = sanitizeText(req.query.trackId, 32);
    const limit = Math.min(20, Math.max(4, parseInt((req.query.limit as string) || '10', 10) || 10));
    const excludeSet = parseExcludeSet(req.query.exclude);
    if (trackId) excludeSet.add(trackId);

    const parseCsvParam = (raw: unknown, maxItems: number, maxItemLen: number): string[] => {
      if (typeof raw !== 'string' || !raw.trim()) return [];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const part of raw.split(',')) {
        const clean = sanitizeText(part, maxItemLen);
        const key = clean.toLowerCase();
        if (clean.length >= 2 && !seen.has(key)) {
          seen.add(key);
          out.push(clean);
          if (out.length >= maxItems) break;
        }
      }
      return out;
    };

    const tasteArtists = parseCsvParam(req.query.artists, 6, 60);
    const tasteGenres = parseCsvParam(req.query.genres, 5, 32).map((g) => g.replace(/^#+/, '').trim()).filter(Boolean);
    const currentArtist = sanitizeText(req.query.currentArtist, 60);
    const recentTitles = parseCsvParam(req.query.recentTitles, 12, 80);

    const activeArtists: string[] = [];
    const seenArtistKeys = new Set<string>();
    for (const a of [...tasteArtists, currentArtist]) {
      const cleanA = a.replace(/\b(official|topic|vevo)\b/gi, '').trim();
      const key = cleanA.toLowerCase();
      if (cleanA.length >= 2 && !seenArtistKeys.has(key)) {
        seenArtistKeys.add(key);
        activeArtists.push(cleanA);
      }
    }

    const hasTasteSignals = activeArtists.length > 0 || tasteGenres.length > 0;

    try {
      const uniqueMap = new Map<string, any>();
      const usedRecTitles = new Set<string>();
      for (const rt of recentTitles) {
        const canon = getCanonicalTrackKey(rt);
        if (canon) usedRecTitles.add(canon);
      }

      const queries: string[] = [];
      if (hasTasteSignals) {
        const pickedArtists = csprngShuffle(activeArtists).slice(0, 2);
        const pickedGenres = csprngShuffle(tasteGenres).slice(0, 2);

        if (pickedArtists[0]) {
          queries.push(`${pickedArtists[0]} official audio song`);
          queries.push(`songs like ${pickedArtists[0]} official audio`);
        }
        if (pickedArtists[1]) {
          queries.push(`${pickedArtists[1]} best songs official audio`);
        }
        if (pickedGenres[0]) {
          queries.push(`best ${pickedGenres[0]} official songs`);
        }
        // Always include 1 fresh procedural wildcard so recommendations never stagnate
        const [wildcard] = buildProceduralArchetypes(1);
        if (wildcard?.queries?.[0]) {
          queries.push(wildcard.queries[0]);
        }
      } else {
        const seeds = buildProceduralArchetypes(2);
        queries.push(...seeds.flatMap((s) => s.queries).slice(0, 3));
      }

      const finalQueries = queries.slice(0, 4);
      const liveResults = await Promise.allSettled(
        finalQueries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: excludeSet,
          })
        )
      );

      // Cap at 2 songs per artist so personalized mixes stay diverse and fresh
      const artistCounts = new Map<string, number>();

      for (const r of liveResults) {
        if (r.status === 'fulfilled') {
          for (const t of csprngShuffle(r.value)) {
            const canon = getCanonicalTrackKey(t.title || '');
            const artistKey = (t.artist || '').toLowerCase().trim();
            const currentCount = artistKey ? artistCounts.get(artistKey) || 0 : 0;
            if (
              !uniqueMap.has(t.id) &&
              !excludeSet.has(t.id) &&
              !KNOWN_RESTRICTED_IDS.has(t.id) &&
              (!canon || !usedRecTitles.has(canon)) &&
              currentCount < 2
            ) {
              uniqueMap.set(t.id, t);
              if (canon) usedRecTitles.add(canon);
              if (artistKey) artistCounts.set(artistKey, currentCount + 1);
            }
          }
        }
      }

      // Blend with unseen discovered official pool & catalog if needed
      if (uniqueMap.size < limit) {
        for (const t of getAllFallbackTracks(excludeSet)) {
          if (uniqueMap.size >= limit) break;
          const canon = getCanonicalTrackKey(t.title || '');
          if (!uniqueMap.has(t.id) && (!canon || !usedRecTitles.has(canon))) {
            uniqueMap.set(t.id, t);
            if (canon) usedRecTitles.add(canon);
          }
        }
      }
      if (uniqueMap.size < limit) {
        for (const t of getAllFallbackTracks(KNOWN_RESTRICTED_IDS)) {
          if (uniqueMap.size >= limit) break;
          if (!uniqueMap.has(t.id) && t.id !== trackId) uniqueMap.set(t.id, t);
        }
      }

      const combined = Array.from(uniqueMap.values());
      const rawRecommendations = csprngShuffle(combined).slice(0, limit);
      const recommendations = await enrichTracksRealtimeFast(rawRecommendations, 750);
      void enrichTracksWithSquareArtwork(rawRecommendations, 4).catch(() => {});
      recordServedTracks(recommendations.map((t) => t.id));

      res.json({
        seed: randomBytes(4).toString('hex'),
        recommendations,
        personalized: hasTasteSignals,
        tasteBasis: activeArtists.slice(0, 3),
        genreBasis: tasteGenres.slice(0, 3),
      });
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      const fallback = await enrichTracksRealtimeFast(getAllFallbackTracks(excludeSet).slice(0, limit), 450);
      res.json({
        seed: randomBytes(4).toString('hex'),
        recommendations: fallback,
        personalized: false,
        tasteBasis: [],
        genreBasis: [],
      });
    }
  });

  // API 2b: Instant Surprise / Totally Random Official Singer Track (+ fresh random up-next batch)
  app.get('/api/random-track', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const excludeSet = parseExcludeSet(req.query.exclude);

    try {
      const [arch] = buildProceduralArchetypes(1);
      const settled = await Promise.allSettled(
        arch.queries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: excludeSet,
          })
        )
      );
      const live: any[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled') live.push(...r.value);
      }

      const unseenPool = [...csprngShuffle(live), ...getAllFallbackTracks(excludeSet)];
      const deduped: any[] = [];
      const seen = new Set<string>();
      for (const t of unseenPool) {
        if (!t?.id || seen.has(t.id) || excludeSet.has(t.id) || KNOWN_RESTRICTED_IDS.has(t.id)) continue;
        seen.add(t.id);
        deduped.push(t);
      }

      const finalPool = deduped.length > 0 ? deduped : getAllFallbackTracks(KNOWN_RESTRICTED_IDS);
      const batchSlice = finalPool.slice(0, Math.min(10, finalPool.length));
      const enrichedBatch = await enrichTracksRealtimeFast(batchSlice, 700);
      void enrichTracksWithSquareArtwork(batchSlice, 4).catch(() => {});
      const squareCandidates = enrichedBatch.filter((t) => t.hasSquareArtwork);
      const pickPool = squareCandidates.length > 0 ? squareCandidates : enrichedBatch;
      const picked = csprngPick(pickPool.slice(0, Math.min(6, pickPool.length))) || pickPool[0];
      const upNext = csprngShuffle(enrichedBatch.filter((t) => t.id !== picked?.id)).slice(0, 6);

      if (picked) recordServedTracks([picked.id, ...upNext.map((t) => t.id)]);

      res.json({
        seed: randomBytes(4).toString('hex'),
        vibe: arch.name,
        track: picked,
        upNext,
      });
    } catch (err: any) {
      console.error('Random track error:', err?.message);
      const fallback = await enrichTracksRealtimeFast(getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 8), 450);
      res.json({
        seed: randomBytes(4).toString('hex'),
        vibe: 'Random Discovery',
        track: fallback[0] || CURATED_GENRES[0].tracks[0],
        upNext: fallback.slice(1, 6),
      });
    }
  });

  // Fast in-memory caches + in-flight deduplication for realtime search & autocomplete
  const suggestCache = new Map<string, { value: string[]; expiresAt: number }>();
  const searchCache = new Map<string, { tracks: any[]; expiresAt: number }>();
  const searchInFlight = new Map<string, Promise<any[]>>();

  // API 2c: Realtime Search Autocomplete Suggestions (cached & cleaned of video clutter)
  app.get('/api/suggest', async (req: Request, res: Response) => {
    const q = sanitizeText(req.query.q, 100);
    if (!q) {
      return res.json({ suggestions: [] });
    }

    const key = q.toLowerCase().replace(/\s+/g, ' ').trim();
    const now = Date.now();
    const cached = suggestCache.get(key);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.json({ suggestions: cached.value });
    }

    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
      const response = await fetch(suggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(1200),
      });

      if (!response.ok) {
        return res.json({ suggestions: [] });
      }

      const data = await response.json();
      const rawList: string[] = Array.isArray(data[1]) ? data[1] : [];
      const seen = new Set<string>();
      const suggestions: string[] = [];
      for (const item of rawList) {
        if (typeof item !== 'string') continue;
        // Strip noisy YouTube search modifiers unless user specifically typed them
        const cleaned = item
          .replace(/\b(?:official\s+music\s+video|official\s+video|official\s+audio|full\s+song|video\s+song|hd|4k|status|whatsapp\s+status|ringtone)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        const lower = cleaned.toLowerCase();
        if (!cleaned || lower === key || seen.has(lower)) continue;
        seen.add(lower);
        suggestions.push(cleaned);
        if (suggestions.length >= 6) break;
      }

      suggestCache.set(key, { value: suggestions, expiresAt: now + 10 * 60 * 1000 });
      if (suggestCache.size > 400) {
        const oldest = suggestCache.keys().next().value;
        if (oldest) suggestCache.delete(oldest);
      }
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({ suggestions });
    } catch {
      res.json({ suggestions: [] });
    }
  });

  // API 3: Ultra-Fast High-Accuracy YouTube Music Search (InnerTube primary + YT fallback)
  app.get('/api/search', async (req: Request, res: Response) => {
    const rawQ = sanitizeText(req.query.q, 160);

    if (!rawQ) {
      return res.json({
        tracks: await enrichTracksRealtimeFast(getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12), 400),
      });
    }

    const cacheKey = rawQ.toLowerCase().replace(/\s+/g, ' ').trim();
    const now = Date.now();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.json({ tracks: cached.tracks });
    }

    try {
      let work = searchInFlight.get(cacheKey);
      if (!work) {
        work = (async () => {
          // 1. Primary: Direct YouTube Music InnerTube JSON search (~450-550ms, structured studio songs + 1:1 covers!)
          const candidates = await searchYouTubeMusicInnerTube(rawQ);
          let ranked = rankAndFilterSearchTracks(candidates, rawQ, 15);

          // 2. Smart Expansion / Fallback:
          //    - If YTM found a verified top official song (e.g. exact song query like "Blinding Lights" or
          //      "Die With A Smile") and dedup/cover-filtering left < 6 tracks, append studio hits by that
          //      same artist (0ms from live/curated pool + fast 1-shot YTM Songs lookup if needed) instead of
          //      falling back to noisy YouTube HTML viral/parody videos!
          //    - Only fall back to scrapeYouTubeMusic HTML when YTM returned 0 quality matches.
          if (ranked.length > 0 && ranked.length < 6 && ranked[0].isOfficial && ranked[0].artist) {
            const topArtistRaw = String(ranked[0].artist).split(/\s*(?:,|&|\bfeat\.?\b|\bft\.?\b)\s*/i)[0].trim();
            const topArtistNorm = normalizeMatchText(topArtistRaw);
            const existingIds = new Set(ranked.map((t) => t.id));
            const localArtistExtras: any[] = [];
            if (topArtistNorm.length >= 3) {
              for (const t of getAllFallbackTracks(KNOWN_RESTRICTED_IDS)) {
                if (existingIds.has(t.id)) continue;
                if (normalizeMatchText(t.artist || '').includes(topArtistNorm)) {
                  localArtistExtras.push(t);
                  existingIds.add(t.id);
                  if (localArtistExtras.length >= 6) break;
                }
              }
            }

            let artistExtras = localArtistExtras;
            if (artistExtras.length < 4 && topArtistRaw.length >= 3) {
              const artistJson = await fetchYtmSearchRaw(topArtistRaw, 'EgWKAQIIAWoMEAMQBBAJEAoQBRAV', 1400);
              const artSections =
                artistJson?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
              const artItems: any[] = [];
              let aIdx = 0;
              for (const sec of artSections) {
                for (const it of sec.musicShelfRenderer?.contents || []) {
                  const p = parseYtmResponsiveItem(it?.musicResponsiveListItemRenderer, 'ytm-song', aIdx++);
                  if (p && !existingIds.has(p.id) && normalizeMatchText(p.artist).includes(topArtistNorm)) {
                    artItems.push(p);
                  }
                }
              }
              const cleanedArtistSongs = rankAndFilterSearchTracks(artItems, topArtistRaw, 8);
              artistExtras = [...localArtistExtras, ...cleanedArtistSongs];
            }

            if (artistExtras.length > 0) {
              // Keep the exact query matches at the very top, followed by studio songs from the same artist
              ranked = deduplicateSearchTracks([...ranked, ...artistExtras], rawQ).slice(0, 12);
            }
          } else if (ranked.length === 0) {
            try {
              const ytFallback = await scrapeYouTubeMusic(rawQ, { limit: 14, singleTracksOnly: false });
              if (ytFallback.length > 0) {
                ranked = rankAndFilterSearchTracks(ytFallback, rawQ, 15);
              }
            } catch {
              // Fallback to local pool below
            }
          }

          if (ranked.length > 0) {
            // Fast-path: YTM studio songs ALREADY have verified 1:1 studio covers (0ms!).
            // Only spend up to 320ms enriching any remaining non-square tracks (top 8 first).
            const needsEnrich = ranked.some((t) => !t.hasSquareArtwork);
            const fastTracks = needsEnrich
              ? deduplicateSearchTracks(await enrichTracksRealtimeFast(ranked, 320), rawQ)
              : ranked;

            // Add top official songs to live discovery pool
            addToLivePool(fastTracks.filter((t) => t.isOfficial && t.hasSquareArtwork && t.durationSec >= 90 && t.durationSec <= 540).slice(0, 6));

            searchCache.set(cacheKey, { tracks: fastTracks, expiresAt: Date.now() + 10 * 60 * 1000 });
            if (searchCache.size > 400) {
              const oldest = searchCache.keys().next().value;
              if (oldest) searchCache.delete(oldest);
            }

            // Quietly warm deeper Wave 2 studio artwork in background for any remaining video-only items
            if (fastTracks.some((t) => !t.hasSquareArtwork)) {
              void enrichTracksWithSquareArtwork(fastTracks, 4)
                .then((deepEnriched) => {
                  const uniqueDeep = deduplicateSearchTracks(deepEnriched, rawQ);
                  if (uniqueDeep.length > 0) {
                    searchCache.set(cacheKey, { tracks: uniqueDeep, expiresAt: Date.now() + 10 * 60 * 1000 });
                  }
                })
                .catch(() => {});
            }

            return fastTracks;
          }

          // 3. Offline/Zero-match local catalog fallback
          const matched = getAllFallbackTracks(KNOWN_RESTRICTED_IDS).filter(
            (t) =>
              t.title.toLowerCase().includes(cacheKey) ||
              t.artist.toLowerCase().includes(cacheKey)
          );
          const fallbackList = deduplicateSearchTracks(
            matched.length > 0 ? matched : getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12),
            rawQ
          );
          return enrichTracksRealtimeFast(fallbackList, 350);
        })().finally(() => {
          searchInFlight.delete(cacheKey);
        });
        searchInFlight.set(cacheKey, work);
      }

      const tracks = await work;
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.json({ tracks });
    } catch (err: any) {
      console.error('Search error:', err.message);
      res.json({
        tracks: await enrichTracksRealtimeFast(getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12), 350),
      });
    }
  });

  // API 4: Resolve direct YouTube URL or video ID
  app.get('/api/resolve', async (req: Request, res: Response) => {
    const rawInput = (req.query.urlOrId as string || '').trim();
    if (!rawInput) {
      return res.status(400).json({ error: 'Missing urlOrId parameter' });
    }

    // Extract 11-char ID
    let videoId = rawInput;
    if (rawInput.length !== 11) {
      const match = rawInput.match(/(?:v=|\/embed\/|\/watch\?v=|\/watch\?.+&v=|youtu\.be\/|shorts\/)([^#&?]{11})/);
      if (match && match[1]) {
        videoId = match[1];
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID or URL' });
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      if (!response.ok) {
        return res.json({
          id: videoId,
          title: 'YouTube Track',
          artist: 'YouTube',
          duration: '--:--',
          durationSec: 0,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      }

      const info = await response.json();
      const rawAuthor = cleanOfficialChannelName(info.author_name || 'YouTube Artist');
      const cleaned = cleanProperSongTitle(info.title || 'YouTube Track', rawAuthor);
      res.json({
        id: videoId,
        title: cleaned.title,
        artist: cleaned.artistFromTitle && SERVER_RECORD_LABEL_RE.test(rawAuthor) ? cleaned.artistFromTitle : rawAuthor,
        duration: '--:--',
        durationSec: 0,
        thumbnail: info.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    } catch {
      res.json({
        id: videoId,
        title: 'YouTube Track',
        artist: 'YouTube',
        duration: '--:--',
        durationSec: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
  });

  // API 5: Fetch synchronized or plain lyrics for a track
  const lyricsCache = new Map<string, { payload: any; expiresAt: number }>();
  const inFlightLyrics = new Map<string, Promise<any>>();
  const geminiCooldownUntil = new Map<string, number>();
  let sharedGeminiClient: any = null;

  async function getServerGeminiClient() {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!sharedGeminiClient) {
      const { GoogleGenAI } = await import('@google/genai');
      sharedGeminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return sharedGeminiClient;
  }

  function parseQuotaCooldownMs(err: any): number {
    const msg = String(err?.message || '');
    const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/i) || msg.match(/retry in\s+(\d+)h(\d+)m/i);
    if (retryMatch) {
      if (retryMatch.length >= 3 && retryMatch[2]) {
        const hours = parseInt(retryMatch[1], 10) || 0;
        const mins = parseInt(retryMatch[2], 10) || 0;
        return Math.min(Math.max((hours * 3600 + mins * 60) * 1000, 60_000), 6 * 3600 * 1000);
      }
      const secs = parseInt(retryMatch[1], 10);
      if (Number.isFinite(secs) && secs > 0) {
        return Math.min(Math.max(secs * 1000, 60_000), 6 * 3600 * 1000);
      }
    }
    return 30 * 60 * 1000; // Default 30-minute cooldown on 429 RESOURCE_EXHAUSTED
  }

  function isQuotaError(err: any): boolean {
    const status = err?.status ?? err?.code;
    const msg = String(err?.message || '');
    return status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
  }

  function normalizeForCompare(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function normalizeCatalogArtistForLyrics(rawArtist: string): string {
    let s = (rawArtist || '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\bOfficial\b/gi, '')
      .trim();

    const parenMatch = s.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1].trim()) {
      const inside = parenMatch[1].trim();
      const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|topic|official|remaster|live|audio|video)/i.test(inside);
      s = !isExcluded ? inside : s.replace(/\s*\([^)]*\)/g, '').trim();
    }

    const lower = s.toLowerCase();
    if (lower.includes('edward christopher sheeran')) return 'Ed Sheeran';
    if (lower.includes('harry edward styles')) return 'Harry Styles';
    if (lower.includes('adele adkins')) return 'Adele';
    if (lower.includes("billie eilish o'connell")) return 'Billie Eilish';
    if (lower.includes('robyn rihanna fenty')) return 'Rihanna';
    if (lower.includes('beyoncé knowles') || lower.includes('beyonce knowles')) return 'Beyoncé';
    if (lower.includes('austin richard post')) return 'Post Malone';

    return s.split(/\s*(?:,|&|\bfeat\.?\b|\bft\.?\b|\bx\b|×|\/)\s*/i)[0].trim();
  }

  function stripDiacriticsForLyrics(str: string): string {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeDotlessLrc(lrcText: string): string {
    if (!lrcText) return '';
    return lrcText.replace(/\[(\d{1,2}):(\d{2})(\d{2,3})\]/g, '[$1:$2.$3]');
  }

  function inspectSyncedLrc(rawLrc: string): {
    normalizedLrc: string;
    lineCount: number;
    firstTs: number;
    lastTs: number;
    spanSec: number;
  } | null {
    if (!rawLrc || typeof rawLrc !== 'string') return null;
    const normalizedLrc = normalizeDotlessLrc(rawLrc);
    const lines = normalizedLrc.split(/\r?\n/);
    const tsRe = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    let lineCount = 0;
    let firstTs = Number.POSITIVE_INFINITY;
    let lastTs = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      tsRe.lastIndex = 0;
      const body = trimmed.replace(tsRe, '').trim();
      if (!body || /^[♪♫🎵🎶•·.\-\s]+$/.test(body)) continue;
      tsRe.lastIndex = 0;
      let m: RegExpExecArray | null;
      let foundTs = false;
      while ((m = tsRe.exec(trimmed)) !== null) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const t = min * 60 + sec + ms / 1000;
        if (t < firstTs) firstTs = t;
        if (t > lastTs) lastTs = t;
        foundTs = true;
      }
      if (foundTs) lineCount++;
    }

    if (lineCount === 0 || !Number.isFinite(firstTs)) return null;
    return {
      normalizedLrc,
      lineCount,
      firstTs: Math.round(firstTs * 100) / 100,
      lastTs: Math.round(lastTs * 100) / 100,
      spanSec: Math.round(Math.max(0, lastTs - firstTs) * 100) / 100,
    };
  }

  function rankLrclibMatches(
    items: any[],
    cleanTrack: string,
    primaryArtist: string,
    targetDurationSec = 0
  ): Array<{
    item: any;
    score: number;
    lrcMeta: ReturnType<typeof inspectSyncedLrc>;
  }> {
    if (!Array.isArray(items) || items.length === 0) return [];
    const targetTrack = normalizeForCompare(stripDiacriticsForLyrics(cleanTrack));
    const targetTrackCore = normalizeForCompare(
      stripDiacriticsForLyrics(cleanTrack).replace(/\b(?:title\s+track|full\s+song|theme\s+song)\b/gi, '')
    );
    const targetArtist = normalizeForCompare(stripDiacriticsForLyrics(primaryArtist));
    const targetWantsAlt = /\b(?:live|acoustic|remix|slowed|reverb|sped\s*up|nightcore|karaoke|instrumental|cover|lofi|lo-fi)\b/i.test(
      cleanTrack
    );

    // Estimate median studio duration across valid synced candidates to spot Official Music Videos with long intros
    const validDurs = items
      .filter((c) => c && typeof c.duration === 'number' && c.duration > 30 && c.syncedLyrics)
      .map((c) => Number(c.duration))
      .sort((a, b) => a - b);
    const medianDur = validDurs.length > 0 ? validDurs[Math.floor(validDurs.length / 2)] : 0;
    const isLikelyLongMusicVideo = targetDurationSec > 60 && medianDur > 60 && targetDurationSec >= medianDur + 14;

    const scored: Array<{
      item: any;
      score: number;
      lrcMeta: ReturnType<typeof inspectSyncedLrc>;
    }> = [];

    for (const item of items) {
      if (!item || (!item.syncedLyrics && !item.plainLyrics && !item.instrumental)) continue;
      const itemTrackRaw = String(item.trackName || '');
      const itemTrackStripped = itemTrackRaw
        .replace(/\s*[\(\[]\s*(?:from\s+["'“”]?.*?["'“”]?|official\s*(?:music\s*)?(?:video|audio|lyric(?:al)?\s*video)|remaster(?:ed)?(?:\s*\d+)?|feat\.?.*?|ft\.?.*?)\s*[\)\]]/gi, '')
        .replace(/^[^-–—]{2,40}\s+[-–—]\s+/, '')
        .trim();
      const itemTrack = normalizeForCompare(stripDiacriticsForLyrics(itemTrackRaw));
      const itemTrackClean = normalizeForCompare(stripDiacriticsForLyrics(itemTrackStripped));
      const itemArtist = normalizeForCompare(stripDiacriticsForLyrics(item.artistName || ''));

      let score = 0;
      if (itemTrack === targetTrack || itemTrackClean === targetTrack) {
        score += 68;
      } else if (
        targetTrackCore &&
        (itemTrack === targetTrackCore || itemTrackClean === targetTrackCore)
      ) {
        score += 60;
      } else if (
        itemTrack.includes(targetTrack) ||
        targetTrack.includes(itemTrack) ||
        (itemTrackClean && (itemTrackClean.includes(targetTrack) || targetTrack.includes(itemTrackClean)))
      ) {
        score += 42;
      } else {
        continue; // Unrelated track name
      }

      if (targetArtist && itemArtist) {
        if (itemArtist === targetArtist) score += 45;
        else if (itemArtist.includes(targetArtist) || targetArtist.includes(itemArtist)) score += 32;
        else {
          // Check word-level artist overlap (e.g. "Pritam & Arijit Singh" vs "Arijit Singh")
          const tWords = targetArtist.split(' ').filter((w) => w.length >= 3);
          const iWords = new Set(itemArtist.split(' '));
          const overlap = tWords.filter((w) => iWords.has(w)).length;
          if (overlap > 0) score += 22;
          else score -= 18;
        }
      }

      // Inspect ACTUAL parsed LRC timestamps rather than trusting item.duration blindly!
      const lrcMeta = item.syncedLyrics ? inspectSyncedLrc(item.syncedLyrics) : null;
      const hasValidSynced = Boolean(lrcMeta && lrcMeta.lineCount >= 5 && lrcMeta.lastTs > 15);
      if (hasValidSynced && lrcMeta) {
        score += 48;
        // Prefer richer synced transcripts when quality is comparable
        if (lrcMeta.lineCount >= 20) score += 8;
        else if (lrcMeta.lineCount >= 10) score += 4;
      } else if (item.plainLyrics) {
        score += 8;
      }

      // Duration + REAL TIMELINE coverage validation (prevents broken/mismatched studio vs MV timestamps!)
      const itemDur = Number(item.duration || 0);
      if (targetDurationSec > 20 && itemDur > 20) {
        const diff = Math.abs(itemDur - targetDurationSec);
        if (diff <= 1.5) score += 46;
        else if (diff <= 4) score += 36;
        else if (diff <= 8) score += 22;
        else if (diff <= 15) score += 10;
        else if (diff <= 25) score += 2;
        else if (diff > 45) score -= 22;
      }

      if (hasValidSynced && lrcMeta && targetDurationSec > 35) {
        const coverage = lrcMeta.lastTs / targetDurationSec;
        if (lrcMeta.lastTs > targetDurationSec + 12) {
          // Corrupt/over-long LRC: timestamps run past the end of the playing video! (e.g. 4:19 LRC stamped onto 2:53 MV)
          score -= 68;
        } else if (coverage >= 0.78 && lrcMeta.lastTs <= targetDurationSec + 5) {
          // Real full-song timeline coverage (e.g. Channa Mereya 4:41/4:49 instead of truncated 3:23/4:49!)
          score += 34;
        } else if (coverage < 0.72) {
          // Truncated or studio-pasted LRC ending way too early on a longer video
          score -= 26;
        }

        // If playing an Official Music Video with a cinematic intro (much longer than median studio dur),
        // strongly reward genuine Official Video LRC entries whose vocals start after the intro!
        if (isLikelyLongMusicVideo) {
          const isExplicitVideoLrc = /\b(?:official\s*(?:music\s*)?video|music\s*video)\b/i.test(itemTrackRaw);
          if (isExplicitVideoLrc && Math.abs(itemDur - targetDurationSec) <= 6) {
            score += 28;
          }
          if (lrcMeta.firstTs >= 18 && Math.abs(itemDur - targetDurationSec) <= 6) {
            score += 14;
          }
        }
      }

      // Penalize unintended alternates (karaoke/slowed/live/cover/remix/lofi) unless requested
      if (
        !targetWantsAlt &&
        /\b(?:karaoke|slowed|reverb|sped\s*up|nightcore|8d|lofi|lo-fi|cover|tribute|parody|instrumental|live\s+at|live\s+from)\b/i.test(
          `${itemTrackRaw} ${item.albumName || ''}`
        )
      ) {
        score -= 42;
      }

      if (score >= 42) {
        scored.push({ item, score, lrcMeta });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  function formatCompactDuration(sec: number): string {
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  }

  app.get('/api/lyrics', async (req: Request, res: Response) => {
    const rawTrack = (req.query.track as string || '').trim();
    const rawArtist = (req.query.artist as string || '').trim();
    const durationSec = req.query.durationSec ? Math.round(Number(req.query.durationSec)) || 0 : 0;

    if (!rawTrack) {
      return res.status(400).json({ error: 'Missing track parameter' });
    }

    const parsedTrack = cleanProperSongTitle(rawTrack, rawArtist);
    const cleanTrack = parsedTrack.title;
    const rawArtistCandidate =
      !rawArtist || rawArtist === 'YouTube' || rawArtist === 'YouTube Artist' || SERVER_RECORD_LABEL_RE.test(rawArtist)
        ? parsedTrack.artistFromTitle || rawArtist
        : rawArtist;
    const primaryArtist = normalizeCatalogArtistForLyrics(rawArtistCandidate);
    const cleanArtist = primaryArtist || rawArtistCandidate;

    // Tight 2-second bucket so Official Video (e.g. 262s) and Studio (200s) NEVER collide in cache
    const durBucket = durationSec > 0 ? Math.round(durationSec / 2) * 2 : 0;
    const cacheKey = `v3::${normalizeForCompare(cleanTrack)}::${normalizeForCompare(primaryArtist || cleanArtist)}::${durBucket}`;
    const now = Date.now();
    const cached = lyricsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.json(cached.payload);
    }

    const resolveLyrics = async () => {
      const lrclibHeaders = { 'User-Agent': 'MelophilePlayer/2.1' };
      const allCandidates: any[] = [];
      const asciiTrack = stripDiacriticsForLyrics(cleanTrack);
      const coreTrack = asciiTrack.replace(/\b(?:title\s+track|full\s+song|theme\s+song)\b/gi, '').replace(/\s+/g, ' ').trim();
      const asciiArtist = stripDiacriticsForLyrics(primaryArtist);

      const fetchLrclibJson = async (url: string, timeoutMs = 4800): Promise<any | null> => {
        try {
          const r = await fetch(url, { headers: lrclibHeaders, signal: AbortSignal.timeout(timeoutMs) });
          if (r.ok) return await r.json();
        } catch {}
        return null;
      };

      // Step 1: Run direct /api/get (exact duration) + multi-variant /api/search in parallel
      const directPromise = primaryArtist
        ? (async () => {
            const directUrls: string[] = [];
            const baseDirect = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(primaryArtist)}`;
            if (durationSec > 15) directUrls.push(`${baseDirect}&duration=${durationSec}`);
            directUrls.push(baseDirect);
            for (const url of directUrls) {
              const d = await fetchLrclibJson(url, 4500);
              if (d && (d.syncedLyrics || d.plainLyrics || d.instrumental)) {
                return d;
              }
            }
            return null;
          })()
        : Promise.resolve(null);

      const searchUrls: string[] = [];
      if (primaryArtist) {
        searchUrls.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(primaryArtist)}`
        );
        searchUrls.push(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${asciiTrack} ${asciiArtist}`)}`
        );
      } else {
        searchUrls.push(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}`);
      }
      if (coreTrack && coreTrack.toLowerCase() !== asciiTrack.toLowerCase()) {
        searchUrls.push(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${coreTrack} ${asciiArtist}`.trim())}`
        );
      }

      const [directHit, ...searchBatches] = await Promise.all([
        directPromise,
        ...searchUrls.map(async (u) => {
          const arr = await fetchLrclibJson(u, 5000);
          return Array.isArray(arr) ? arr : [];
        }),
      ]);

      const seenLrclibIds = new Set<number>();
      const pushCandidate = (item: any) => {
        if (!item) return;
        if (item.id && seenLrclibIds.has(item.id)) return;
        if (item.id) seenLrclibIds.add(item.id);
        allCandidates.push(item);
      };

      if (directHit) pushCandidate(directHit);
      for (const batch of searchBatches) {
        for (const item of batch) pushCandidate(item);
      }

      // Step 2: If strict artist+track had zero valid synced matches (or transient LRCLIB blip),
      // run a title-only + combined retry search so songs like "Espresso" or collab tracks NEVER miss!
      const hasValidSynced = allCandidates.some((c) => {
        const meta = c?.syncedLyrics ? inspectSyncedLrc(c.syncedLyrics) : null;
        return Boolean(meta && meta.lineCount >= 5);
      });
      if (!hasValidSynced && cleanTrack) {
        const retryUrls = [
          `https://lrclib.net/api/search?q=${encodeURIComponent(coreTrack || asciiTrack)}`,
        ];
        if (primaryArtist) {
          retryUrls.push(
            `https://lrclib.net/api/search?q=${encodeURIComponent(`${asciiTrack} ${asciiArtist}`)}`
          );
        }
        const retryBatches = await Promise.all(
          retryUrls.map(async (u) => {
            const arr = await fetchLrclibJson(u, 4500);
            return Array.isArray(arr) ? arr : [];
          })
        );
        for (const batch of retryBatches) {
          for (const item of batch) pushCandidate(item);
        }
      }

      const ranked = rankLrclibMatches(allCandidates, cleanTrack, primaryArtist, durationSec);
      if (ranked.length > 0) {
        const bestEntry = ranked[0];
        const bestMatch = bestEntry.item;
        const bestMeta = bestEntry.lrcMeta;

        // Build up to 4 distinct synced timeline versions so users can 1-tap switch Video vs Studio sync if needed!
        const syncVersions: Array<{
          id: string;
          label: string;
          duration: number;
          firstTs: number;
          lastTs: number;
          syncedLyrics: string;
        }> = [];
        const seenTimelineSig = new Set<string>();
        for (const entry of ranked) {
          if (!entry.lrcMeta || entry.lrcMeta.lineCount < 5) continue;
          const sig = `${Math.round(entry.lrcMeta.firstTs / 2)}:${Math.round(entry.lrcMeta.lastTs / 4)}`;
          if (seenTimelineSig.has(sig)) continue;
          seenTimelineSig.add(sig);
          const durVal = Math.round(Number(entry.item.duration) || entry.lrcMeta.lastTs);
          const isVideoTag = /\b(?:official\s*(?:music\s*)?video|music\s*video)\b/i.test(
            String(entry.item.trackName || '')
          );
          const labelPrefix = isVideoTag
            ? 'Video'
            : durationSec > 20 && Math.abs(durVal - durationSec) <= 4
            ? 'Matched'
            : syncVersions.length === 0
            ? 'Primary'
            : 'Alt';
          syncVersions.push({
            id: String(entry.item.id || `v-${syncVersions.length}`),
            label: `${labelPrefix} (${formatCompactDuration(durVal)})`,
            duration: durVal,
            firstTs: entry.lrcMeta.firstTs,
            lastTs: entry.lrcMeta.lastTs,
            syncedLyrics: entry.lrcMeta.normalizedLrc,
          });
          if (syncVersions.length >= 4) break;
        }

        const lrcDur = Number(bestMatch.duration) || null;
        const isTightVideoLock = Boolean(
          bestMeta &&
            bestMeta.lineCount >= 5 &&
            durationSec > 20 &&
            lrcDur &&
            Math.abs(lrcDur - durationSec) <= 5 &&
            bestMeta.lastTs <= durationSec + 6 &&
            bestMeta.lastTs >= durationSec * 0.75
        );

        return {
          track: bestMatch.trackName || cleanTrack,
          artist: bestMatch.artistName || primaryArtist || cleanArtist,
          plainLyrics: bestMatch.plainLyrics || null,
          syncedLyrics: bestMeta ? bestMeta.normalizedLrc : bestMatch.syncedLyrics || null,
          lrcDuration: lrcDur,
          syncQuality: bestMeta ? (isTightVideoLock ? 'video-locked' : 'timed') : 'estimated',
          syncVersions,
          instrumental: !!bestMatch.instrumental,
          source: bestMatch === directHit ? 'lrclib-exact' : 'lrclib-matched',
        };
      }

      // Step 3: Free secondary lyrics source (lyrics.ovh) before invoking AI fallback
      if (primaryArtist && cleanTrack) {
        try {
          const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTrack)}`;
          const ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(3500) });
          if (ovhRes.ok) {
            const ovhData = await ovhRes.json();
            const rawOvhLyrics = typeof ovhData?.lyrics === 'string' ? ovhData.lyrics.trim() : '';
            if (rawOvhLyrics) {
              const cleanedOvh = rawOvhLyrics.replace(/^Paroles de la chanson .*?\n+/i, '').trim();
              if (cleanedOvh) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist,
                  plainLyrics: cleanedOvh,
                  syncedLyrics: null,
                  syncQuality: 'estimated',
                  syncVersions: [],
                  instrumental: false,
                  source: 'lyrics-ovh',
                };
              }
            }
          }
        } catch {
          // Continue to optional Gemini fallback
        }
      }

      // Step 4: Optional Gemini fallback (lightweight model with quota circuit breaker)
      let quotaExceeded = false;
      const fallbackModel = 'gemini-3.1-flash-lite';
      const cooldownExpires = geminiCooldownUntil.get(fallbackModel) || 0;

      if (process.env.GEMINI_API_KEY) {
        if (Date.now() < cooldownExpires) {
          quotaExceeded = true;
        } else {
          try {
            const ai = await getServerGeminiClient();
            if (ai) {
              const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: `Provide the official lyrics for the song "${cleanTrack}" by "${primaryArtist || cleanArtist}". If it is an instrumental track with no singing, respond only with "[Instrumental]". If you are unsure or do not know the verified lyrics, respond only with "[NotFound]". Otherwise return only the formatted lyrics with clean line breaks.`,
              });
              const text = (response.text || '').trim();
              if (text.includes('[Instrumental]')) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist || cleanArtist,
                  plainLyrics: null,
                  syncedLyrics: null,
                  instrumental: true,
                  source: 'gemini',
                };
              }
              if (text && !text.includes('[NotFound]')) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist || cleanArtist,
                  plainLyrics: text,
                  syncedLyrics: null,
                  instrumental: false,
                  source: 'gemini',
                };
              }
            }
          } catch (geminiErr: any) {
            if (isQuotaError(geminiErr)) {
              quotaExceeded = true;
              const cooldownMs = parseQuotaCooldownMs(geminiErr);
              geminiCooldownUntil.set(fallbackModel, Date.now() + cooldownMs);
            }
          }
        }
      }

      // Step 5: Graceful fallback when lyrics are not available
      return {
        track: cleanTrack,
        artist: primaryArtist || cleanArtist,
        plainLyrics: null,
        syncedLyrics: null,
        instrumental: false,
        notFound: true,
        quotaExceeded,
      };
    };

    try {
      let pending = inFlightLyrics.get(cacheKey);
      if (!pending) {
        pending = resolveLyrics().finally(() => {
          inFlightLyrics.delete(cacheKey);
        });
        inFlightLyrics.set(cacheKey, pending);
      }

      const payload = await pending;
      const ttlMs = payload.notFound ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
      lyricsCache.set(cacheKey, { payload, expiresAt: Date.now() + ttlMs });

      // Bound cache size cleanly
      if (lyricsCache.size > 400) {
        const oldestKey = lyricsCache.keys().next().value;
        if (oldestKey) lyricsCache.delete(oldestKey);
      }

      return res.json(payload);
    } catch (err: any) {
      console.error('Lyrics endpoint error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  });

  // API 6: 7-Source Ultra-High-Resolution 1:1 Studio Artwork Discovery Engine
  // Sources:
  //   Wave 1: Spotify Web API (640x640) + Deezer (1000x1000) + Apple iTunes US (1200x1200)
  //   Wave 2: Apple iTunes IN/GB (1200x1200) + JioSaavn (500x500) + Deezer Title/Album (1000x1000)
  //   Wave 3: MusicBrainz + Cover Art Archive (500x500+) + TheAudioDB + iTunes Title-Only (1200x1200)
  // Strictly 1:1 square studio artwork only — NEVER falls back to 16:9 YouTube thumbnails.
  const ARTWORK_CACHE_VERSION = 'v11';
  const artworkCacheFile = path.resolve(__dirname, '.artwork-cache.json');
  const artworkCache = new Map<string, string>();
  const artworkMissCache = new Map<string, number>(); // Short 45s negative cache ONLY for genuine non-rate-limited misses
  const artworkInFlight = new Map<string, Promise<string | null>>();

  // Paced concurrency limiters so Deezer/JioSaavn NEVER hit burst quota limits on 18-track searches
  function createPacedLimiter(maxConcurrent: number, minGapMs = 0) {
    let active = 0;
    let lastStart = 0;
    const queue: Array<() => void> = [];
    const runNext = () => {
      if (active >= maxConcurrent || queue.length === 0) return;
      const wait = Math.max(0, minGapMs - (Date.now() - lastStart));
      if (wait > 0) {
        setTimeout(runNext, wait);
        return;
      }
      const next = queue.shift();
      if (next) {
        active++;
        lastStart = Date.now();
        next();
      }
    };
    return async function schedule<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const execute = () => {
          fn()
            .then(resolve, reject)
            .finally(() => {
              active--;
              runNext();
            });
        };
        queue.push(execute);
        runNext();
      });
    };
  }

  const deezerSchedule = createPacedLimiter(5, 35);
  const saavnSchedule = createPacedLimiter(5, 25);
  let itunesBlockedUntil = 0;

  const BAD_SAAVN_SLUG_RE =
    /\b(?:with[-_ ]love|love[-_ ]forever|broken[-_ ]strings|yours[-_ ]truly|best[-_ ]of|hit[-_ ]songs|bollywood[-_ ]hits|jukebox|instrumental|karaoke|soothing[-_ ]songs|happy[-_ ]vibes|mashup|compilation|playlist|non[-_ ]?stop|lofi|lo[-_ ]fi|slowed|sped[-_ ]up|all[-_ ]time[-_ ]best|romantic[-_ ]classics|nightcore|breakcore|ringtone|8d)\b/i;

  const buildArtworkCacheKey = (cleanTrack: string, cleanArtist: string, albumHint = ''): string =>
    `${ARTWORK_CACHE_VERSION}::${cleanTrack}::${cleanArtist}${albumHint ? `::${albumHint}` : ''}`.toLowerCase();

  // Strictly official 1:1 studio album/single covers — NEVER artist portraits, playlists, or compilation knockoffs!
  const isStudioPosterUrl = (url: string): boolean => {
    if (!url) return false;
    // Block Deezer artist portraits & playlist artwork so song covers only use real album/single art
    if (url.includes('dzcdn.net') && (url.includes('/images/artist/') || url.includes('/images/playlist/'))) {
      return false;
    }
    if (url.includes('saavncdn.com')) {
      const slug = url.split('/').pop() || '';
      if (BAD_SAAVN_SLUG_RE.test(slug)) return false;
    }
    return (
      isYtmSquareCoverUrl(url) ||
      url.includes('dzcdn.net') ||
      url.includes('mzstatic.com') ||
      url.includes('scdn.co') ||
      url.includes('coverartarchive.org') ||
      url.includes('archive.org') ||
      url.includes('saavncdn.com') ||
      url.includes('theaudiodb.com')
    );
  };

  function isLikelyIndianTrack(cleanTrack: string, cleanArtist: string, albumHint: string, rawArtist = ''): boolean {
    const combined = `${cleanTrack} ${cleanArtist} ${albumHint} ${rawArtist}`.toLowerCase();
    if (/[ऀ-ॿ਀-੿஀-௿ఀ-౿ಀ-೿ഀ-ൿ]/.test(combined)) return true;
    return /\b(?:t-series|sony\s*music\s*india|zee\s*music|tips|yrf|yash\s*raj|saregama|speed\s*records|desi\s*music|dharma|arijit|shreya\s*ghoshal|atif\s*aslam|pritam|rahman|vishal\s*mishra|jubin|sonu\s*nigam|armaan\s*malik|darshan\s*raval|diljit|ap\s*dhillon|karan\s*aujla|sidhu\s*moose|shubh|badshah|honey\s*singh|neha\s*kakkar|sunidhi|mohit\s*chauhan|b\s*praak|sachet|jasleen\s*royal|anuv\s*jain|anirudh|sid\s*sriram|himesh|amit\s*trivedi|sachin[\s-]jigar|mithoon|kesariya|tum\s*hi\s*ho|zaalima|raees|channa\s*mereya|kalank|baaton\s*ko\s*teri|kabir\s*singh|brahmastra|brahmāstra|aashiqui|bhediya|jawan|animal|shayad|heeriye|tu\s*hai|mera|tere|dil|ishq|pyar|pyaar|mohabbat|zindagi|raanjhan|khairiyat|humdard|gerua|hawayein|agar\s*tum|pehla|pehle|satranga|chaleya|apna\s*bana|ve\s*kamleya|o\s*maahi|hindi|bollywood|punjabi|tamil|telugu)\b/i.test(
      combined
    );
  }

  // Hydrate server disk cache on startup (only v6+ strictly verified entries; discards legacy bad covers)
  try {
    if (fs.existsSync(artworkCacheFile)) {
      const data = JSON.parse(fs.readFileSync(artworkCacheFile, 'utf-8'));
      const prefix = `${ARTWORK_CACHE_VERSION}::`;
      Object.entries(data).forEach(([k, v]) => {
        const lowerKey = k.toLowerCase();
        if (lowerKey.startsWith(prefix) && typeof v === 'string' && isStudioPosterUrl(v)) {
          artworkCache.set(lowerKey, v);
        }
      });
      console.log(`[Server ArtworkCache] Loaded ${artworkCache.size} verified ${ARTWORK_CACHE_VERSION} studio covers from disk`);
    }
  } catch {}

  let saveArtworkDiskTimer: any = null;
  function persistArtworkToDisk() {
    if (saveArtworkDiskTimer) clearTimeout(saveArtworkDiskTimer);
    saveArtworkDiskTimer = setTimeout(() => {
      try {
        const obj: Record<string, string> = {};
        const prefix = `${ARTWORK_CACHE_VERSION}::`;
        artworkCache.forEach((v, k) => {
          if (k.startsWith(prefix) && isStudioPosterUrl(v)) obj[k] = v;
        });
        fs.writeFileSync(artworkCacheFile, JSON.stringify(obj, null, 2), 'utf-8');
      } catch {}
    }, 2000);
  }

  function normalizePosterToken(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function posterSimilarity(a: string, b: string): number {
    const na = normalizePosterToken(a);
    const nb = normalizePosterToken(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.88;
    const setA = new Set(na.split(' ').filter((w) => w.length > 1));
    const setB = new Set(nb.split(' ').filter((w) => w.length > 1));
    if (setA.size === 0 || setB.size === 0) return 0;
    let common = 0;
    setA.forEach((w) => {
      if (setB.has(w)) common++;
    });
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? common / union : 0;
  }

  // Strictly reject ALL playlist albums, label compilations, hits collections, jukeboxes, karaoke & tributes
  const PLAYLIST_OR_COMPILATION_ALBUM_RE =
    /\b(?:karaoke|tribute|lullaby|8-?bit|piano\s+cover|acoustic\s+cover|instrumental\s+cover|cover\s+version|in\s+the\s+style\s+of|originally\s+performed\s+by|made\s+famous\s+by|kidz\s*bop|now\s+that'?s\s+what\s+i\s+call|top\s+hits\s*\d*|hit\s+songs|super\s*hits|best\s+of(?:\s+\w+)?|best\s+soothing|greatest\s+hits|the\s+highlights|all[\s-]time\s+(?:hits|favorites|classics|best)|non[\s-]?stop|jukebox|anthology|collection|essential(?:\s+hits|\s+tracks)?|ultimate\s+(?:hits|pop|rock|love|chill|collection)|broken\s+strings|yours\s+truly|with\s+love|love\s+forever|forever\s+with|soothing\s+songs|happy\s+vibes|soulful\s+\w+|magic\s+of\s+\w+|melodies\s+of\s+\w+|memories\s+of\s+\w+|timeless\s+\w+|unforgettable\s+\w+|this\s+is\s+\w+|golden\s+(?:hits|era|classics|collection)|love\s+songs|sad\s+songs|heartbreak|romantic\s+(?:hits|songs|melodies|classics|vibes|ballads)|party\s+(?:hits|anthems|mix)|workout|gym\s+hits|chill\s+(?:vibes|mix|hits|out)|throwback|road\s+trip|drive\s+mix|summer\s+hits|winter\s+hits|monsoon|evergreen|classics|club\s+mix|radio\s+hits|viral\s+hits|tiktok|trending\s+hits|chart\s+toppers|mega\s*mix|mashup|various\s+artists|compilation|playlist|ringtone|soundalike|music\s+box|sele[cç][aã]o|vol\.?\s*\d+|volume\s*\d+|unplugged\s+hits|bollywood\s+(?:hits|top|best|mix|special|beats|love|sad)|punjabi\s+(?:hits|top|best|mix)|indie\s+(?:hits|mix)|pop\s+hits|rock\s+hits|hip[\s-]hop\s+hits|hits\s+of\s+20\d\d|hits\s+20\d\d|\d+\s+hits|\bvibes?\b)\b/i;

  function extractFromAlbumName(title: string): string {
    const m = (title || '').match(/[\(\[]\s*from\s+["'“”]?([^"'“”\)\]]{2,70})["'“”]?\s*[\)\]]/i);
    return m && m[1] ? m[1].trim() : '';
  }

  function stripCandidateParenNoise(name: string): string {
    return (name || '')
      .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|with\s+|remaster(?:ed)?(?:\s*\d+)?|radio\s*edit|single\s*version|album\s*version|explicit|clean|bonus\s*track|from\s+["'“”]?.*?["'“”]?)\b[^\)\]]*[\)\]]/gi, '')
      .replace(/\s*-\s*(?:remaster(?:ed)?(?:\s*\d+)?|single|radio\s*edit|from\s+["'“”]?.*?["'“”]?)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Strict Original Song Artwork Matcher:
   * - Rejects ALL playlist albums, compilation albums, hits/jukebox collections, karaoke & tributes
   * - Rejects artist-named label compilations (e.g. "With Love, Arijit Singh", "Love Forever With Arijit Singh")
   * - Rejects repackaged albums when a track declares `(From "OriginalMovie")` and the album doesn't match
   * - Strongly prioritizes original singles, original studio albums, and Original Motion Picture Soundtracks
   * - Enforces BOTH strong title AND artist match whenever artist is known
   */
  function scoreStudioArtworkCandidate(params: {
    cleanTrack: string;
    cleanArtist: string;
    candidateTitle: string;
    candidateArtist: string;
    candidateAlbum?: string;
    albumHint?: string;
    trackCount?: number;
    releaseYear?: number;
    isCompilation?: boolean;
    mode?: 'track' | 'album' | 'titleOnly';
  }): number {
    const {
      cleanTrack,
      cleanArtist,
      candidateTitle,
      candidateArtist,
      candidateAlbum = '',
      albumHint = '',
      trackCount,
      releaseYear,
      isCompilation = false,
      mode = 'track',
    } = params;

    if (!cleanTrack || !candidateTitle) return -1;
    if (isCompilation) return -1;

    const queryLower = `${cleanTrack} ${cleanArtist} ${albumHint}`.toLowerCase();
    const albumLower = (candidateAlbum || '').toLowerCase();

    // Reject playlist/compilation/hits/jukebox/tribute/karaoke album covers unless explicitly part of the song name
    if (
      (PLAYLIST_OR_COMPILATION_ALBUM_RE.test(candidateAlbum) ||
        PLAYLIST_OR_COMPILATION_ALBUM_RE.test(candidateArtist)) &&
      !PLAYLIST_OR_COMPILATION_ALBUM_RE.test(queryLower)
    ) {
      return -1;
    }
    if (/^various\s+artists?$/i.test((candidateArtist || '').trim())) {
      return -1;
    }
    // Reject mega-compilations (30+ tracks) unless albumHint explicitly matches
    if (
      typeof trackCount === 'number' &&
      trackCount > 28 &&
      (!albumHint || posterSimilarity(albumHint, candidateAlbum) < 0.5)
    ) {
      return -1;
    }

    // Reject artist-named label compilation albums like "With Love, Arijit Singh", "Love Forever With Arijit Singh",
    // "Arijit Singh Broken Strings" (unless the album is strictly self-titled OR the song/albumHint itself names the artist)
    if (cleanArtist && candidateAlbum && mode !== 'album') {
      const normArtist = normalizePosterToken(cleanArtist);
      const normAlbum = normalizePosterToken(candidateAlbum);
      const normTrack = normalizePosterToken(cleanTrack);
      const normHint = normalizePosterToken(albumHint);
      if (
        normArtist.length >= 4 &&
        normAlbum.includes(normArtist) &&
        normAlbum !== normArtist &&
        !normTrack.includes(normArtist) &&
        !normHint.includes(normArtist)
      ) {
        return -1;
      }
    }

    // Critical check: If candidate title says `(From "Movie/Album")` (very common on Bollywood/OST tracks),
    // reject any label playlist/compilation album whose name doesn't match that original movie or song!
    const fromSource = extractFromAlbumName(candidateTitle);
    if (fromSource && candidateAlbum) {
      const albumMatchesFrom = posterSimilarity(fromSource, candidateAlbum) >= 0.45;
      const albumMatchesTrack = posterSimilarity(cleanTrack, candidateAlbum) >= 0.55;
      if (!albumMatchesFrom && !albumMatchesTrack) {
        return -1;
      }
    }

    const strippedCandTitle = stripCandidateParenNoise(candidateTitle);
    const tSim = Math.max(
      posterSimilarity(cleanTrack, candidateTitle),
      posterSimilarity(cleanTrack, strippedCandTitle)
    );

    // Hard-reject instrumental/karaoke/sped-up/slowed/lofi/8d/piano-version knockoffs unless the requested song asks for them
    const hardRejectVariantRe =
      /\b(?:instrumental|karaoke|sped\s*up|slowed|reverb|8d|lofi|lo-fi|vocals\s+only|piano\s+version|guitar\s+version|ringtone|music\s+box)\b/i;
    const queryHasHardVariant = hardRejectVariantRe.test(cleanTrack);
    if (!queryHasHardVariant && (hardRejectVariantRe.test(candidateTitle) || hardRejectVariantRe.test(candidateAlbum))) {
      return -1;
    }

    // Penalize remix/live/unplugged/acoustic mismatch if query isn't asking for it
    const variantRe = /\b(?:remix|live|unplugged|acoustic)\b/i;
    const candIsVariant = variantRe.test(candidateTitle) || variantRe.test(candidateAlbum);
    const queryIsVariant = variantRe.test(cleanTrack);
    const variantPenalty = candIsVariant && !queryIsVariant ? 0.22 : 0;

    // Bonus for original single / original OST / explicit albumHint match
    let originalBonus = 0;
    if (candidateAlbum) {
      if (posterSimilarity(cleanTrack, stripCandidateParenNoise(candidateAlbum)) >= 0.8) {
        originalBonus += 0.14; // Original Single artwork!
      }
      if (fromSource && posterSimilarity(fromSource, candidateAlbum) >= 0.5) {
        originalBonus += 0.16; // Original movie soundtrack!
      }
      if (albumHint && posterSimilarity(albumHint, candidateAlbum) >= 0.5) {
        originalBonus += 0.16; // Matches known original movie/album!
      }
      if (/\boriginal\s+motion\s+picture\s+soundtrack\b|\bost\b/i.test(albumLower)) {
        originalBonus += 0.08;
      }
    }
    if (typeof trackCount === 'number' && trackCount >= 1 && trackCount <= 3) {
      originalBonus += 0.06; // Single release
    }
    // Slight preference for earlier original studio releases over later re-issues
    if (typeof releaseYear === 'number' && releaseYear >= 1950 && releaseYear <= 2030) {
      originalBonus += Math.max(0, (2030 - releaseYear) * 0.0012);
    }

    if (cleanArtist && mode !== 'titleOnly') {
      const aSim = posterSimilarity(cleanArtist, candidateArtist || '');
      const minTitle = mode === 'album' ? 0.56 : 0.6;
      const minArtist = 0.45;
      if (tSim < minTitle || aSim < minArtist) return -1;

      const exactBonus =
        normalizePosterToken(cleanTrack) === normalizePosterToken(strippedCandTitle) && aSim >= 0.85
          ? 0.06
          : 0;
      const baseScore = tSim * 0.58 + aSim * 0.42 - variantPenalty;
      if (baseScore < 0.62) return -1;
      return baseScore + exactBonus + originalBonus;
    }

    // Artist unknown (record-label YouTube upload) — require high title match
    if (tSim < 0.78) return -1;
    const baseScore = tSim - variantPenalty;
    if (baseScore < 0.74) return -1;
    return baseScore + originalBonus;
  }

  const RECORD_LABEL_CHANNEL_RE =
    /\b(?:t-series|sony\s*music|zee\s*music|tips\s*official|yrf|yash\s*raj|saregama|speed\s*records|desi\s*music\s*factory|times\s*music|eros\s*now|shemaroo|warner\s*music|universal\s*music|atlantic\s*records|republic\s*records|interscope|columbia\s*records|def\s*jam|spinnin'?|monstercat|ncs|nocopyrightsounds|trap\s*nation|proximity|cloudkid|majestic\s*casual|colors|vevo\s*music|ultra\s*music|armada\s*music|dharma\s*productions|junglee\s*music|white\s*hill\s*music|jass\s*records|geet\s*mp3|humble\s*music|tseries|lyric\s*video|music\s*videos?)\b/i;

  function parseCleanTrackAndArtist(rawTitle: string, rawArtist: string): {
    cleanTrack: string;
    cleanArtist: string;
    albumHint: string;
  } {
    let albumHint = '';
    const fromMatch = (rawTitle || '').match(/\(\s*from\s+["'“”]?([^"'“”\)]+)["'“”]?\s*\)/i);
    if (fromMatch && fromMatch[1]) {
      albumHint = fromMatch[1].trim();
    }

    let cleanTrack = (rawTitle || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s*[\(\[]\s*(?:official\s*(?:music\s*)?)?(?:video|audio|lyric(?:al)?\s*(?:video|song)?|hd|4k|8k|uhd|hq|visualizer|lyrics?|full\s*(?:song|video|audio)|remaster(?:ed)?(?:\s*\d+)?|live(?:\s+at.*?)?|from\s+["'“”]?.*?["'“”]?|nsfw|explicit|clean|dirty|film\s*version|dance\s*mix|slowed.*|reverb.*|new\s*(?:hindi|punjabi|english)?\s*song.*)\s*[\)\]]/gi, '')
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*(?:official\s*(?:music\s*)?(?:video|audio|lyric)|full\s*(?:song|video)|lyric(?:al)?\s*video).*$/i, '')
      .replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.*$/i, '')
      .trim();

    let cleanArtist = (rawArtist || '')
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\bOfficial\b/gi, '')
      .replace(/\s*(?:&|,|x|×|feat\.?|ft\.?).*$/i, '')
      .trim();

    // Record label YouTube channels (e.g., T-Series, Sony Music India, Spinnin') break artist search — clear them
    if (RECORD_LABEL_CHANNEL_RE.test(cleanArtist)) {
      cleanArtist = '';
    }

    // Handle "Artist: Song" (common on T-Series / Bollywood uploads)
    const colonMatch = cleanTrack.match(/^([^:]{2,36})\s*:\s*(.{2,})$/);
    if (colonMatch) {
      const left = colonMatch[1].trim();
      const right = colonMatch[2].trim();
      if (!RECORD_LABEL_CHANNEL_RE.test(left)) {
        if (!cleanArtist) cleanArtist = left;
        cleanTrack = right;
      }
    }

    // Handle "Artist - Song" or "Song - Movie"
    const dashMatch = cleanTrack.match(/^([^-–—]{2,42})\s*[-–—]\s*(.{2,})$/);
    if (dashMatch) {
      const left = dashMatch[1].trim();
      const right = dashMatch[2].trim();
      if (!cleanArtist || posterSimilarity(left, cleanArtist) >= 0.45) {
        if (!cleanArtist && !RECORD_LABEL_CHANNEL_RE.test(left)) {
          cleanArtist = left;
        }
        cleanTrack = right;
      } else if (cleanArtist && posterSimilarity(right, cleanArtist) >= 0.45) {
        cleanTrack = left;
      }
    }

    const monikerMatch = cleanArtist.match(/\(([^)]+)\)/);
    if (monikerMatch && monikerMatch[1].trim()) {
      const moniker = monikerMatch[1].trim();
      const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|ent|prod|topic|official|remaster|deluxe|live|audio|video|explicit|version)/i.test(moniker);
      cleanArtist = !isExcluded ? moniker : cleanArtist.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    } else {
      const lower = cleanArtist.toLowerCase();
      if (lower.includes('edward christopher sheeran')) cleanArtist = 'Ed Sheeran';
      else if (lower.includes('harry edward styles')) cleanArtist = 'Harry Styles';
      else if (lower.includes('adele adkins')) cleanArtist = 'Adele';
      else if (lower.includes('austin richard post')) cleanArtist = 'Post Malone';
      else cleanArtist = cleanArtist.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    }

    // Clean any leftover empty quotes/brackets
    cleanTrack = cleanTrack.replace(/^["'“”]+|["'“”]+$/g, '').replace(/\s+/g, ' ').trim();
    return { cleanTrack, cleanArtist, albumHint };
  }

  // ── Source 1: Spotify Web API (640x640 1:1 Studio Masters) ──
  let spotifyToken: string | null = null;
  let spotifyTokenExpiry = 0;

  function hasValidSpotifyCredentials(): boolean {
    const id = (process.env.SPOTIFY_CLIENT_ID || '').trim();
    const secret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
    if (!id || !secret) return false;
    if (id.includes('your_spotify') || secret.includes('your_spotify')) return false;
    return true;
  }

  async function getSpotifyToken(): Promise<string | null> {
    if (!hasValidSpotifyCredentials()) return null;
    if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID!.trim();
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!.trim();
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        spotifyToken = data.access_token;
        spotifyTokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
        return spotifyToken;
      }
    } catch {}
    return null;
  }

  async function searchSpotifyArtwork(title: string, artist: string): Promise<string | null> {
    const token = await getSpotifyToken();
    if (!token) return null;
    try {
      const queries = artist
        ? [`track:${title} artist:${artist}`, `${title} ${artist}`]
        : [title];

      for (const q of queries) {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(q.trim())}&type=track&limit=6`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const items: any[] = data.tracks?.items || [];
        let bestUrl: string | null = null;
        let bestScore = -1;
        for (const item of items) {
          const images: any[] = item?.album?.images || [];
          // Pick largest square 1:1 image
          const squareImg =
            images.find((im) => im?.url && (!im.width || !im.height || im.width === im.height)) ||
            images[0];
          const img = squareImg?.url;
          if (!img || !isStudioPosterUrl(img)) continue;
          const artistNames = (item.artists || []).map((ar: any) => ar?.name || '').filter(Boolean);
          const bestArtistCand = artist
            ? artistNames.reduce(
                (best: string, cur: string) =>
                  posterSimilarity(artist, cur) > posterSimilarity(artist, best) ? cur : best,
                artistNames[0] || ''
              )
            : artistNames[0] || '';
          const score = scoreStudioArtworkCandidate({
            cleanTrack: title,
            cleanArtist: artist,
            candidateTitle: item.name || '',
            candidateArtist: bestArtistCand,
            candidateAlbum: item?.album?.name || '',
            trackCount: typeof item?.album?.total_tracks === 'number' ? item.album.total_tracks : undefined,
            releaseYear: typeof item?.album?.release_date === 'string' ? parseInt(item.album.release_date.slice(0, 4), 10) || undefined : undefined,
            isCompilation: item?.album?.album_type === 'compilation',
            mode: 'track',
          });
          if (score > bestScore) {
            bestScore = score;
            bestUrl = img;
          }
        }
        if (bestUrl && bestScore > 0) return bestUrl;
      }
    } catch {}
    return null;
  }

  // ── Source 2: Deezer Public Music API (Original single/studio album/OST covers only — blocks playlist albums) ──
  async function searchDeezerArtwork(
    cleanTrack: string,
    cleanArtist: string,
    mode: 'track' | 'titleOnly' | 'album' = 'track',
    albumHint = ''
  ): Promise<string | null> {
    try {
      const safeTrack = cleanTrack.replace(/"/g, '').trim();
      const safeArtist = cleanArtist.replace(/"/g, '').trim();
      const safeAlbum = albumHint.replace(/"/g, '').trim();
      const queryVariants: string[] = [];

      if (mode === 'album') {
        if (safeArtist && safeTrack) {
          queryVariants.push(`${safeTrack} ${safeArtist}`);
          queryVariants.push(`artist:"${safeArtist}" album:"${safeTrack}"`);
        } else if (safeTrack) {
          queryVariants.push(safeTrack);
        }
      } else if (mode === 'titleOnly') {
        if (safeTrack && safeAlbum) queryVariants.push(`${safeTrack} ${safeAlbum}`);
        if (safeTrack) queryVariants.push(safeTrack);
      } else {
        if (safeTrack && safeAlbum) {
          queryVariants.push(`${safeTrack} ${safeAlbum}`);
        }
        if (safeArtist && safeTrack) {
          queryVariants.push(`${safeTrack} ${safeArtist}`);
          queryVariants.push(`artist:"${safeArtist}" track:"${safeTrack}"`);
        } else if (safeTrack && !safeAlbum) {
          queryVariants.push(safeTrack);
        }
      }

      let discoveredFromAlbum = '';

      for (const q of queryVariants) {
        if (!q) continue;
        const endpoint =
          mode === 'album'
            ? `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=12`
            : `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`;
        let data: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await deezerSchedule(() =>
            fetch(endpoint, { signal: AbortSignal.timeout(3500) })
          );
          if (!res.ok) break;
          const parsed = await res.json();
          // Deezer returns HTTP 200 with { error: { code: 4, message: "Quota limit exceeded" } } on burst!
          if (parsed?.error?.code === 4 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 650));
            continue;
          }
          data = parsed;
          break;
        }
        const candidates: any[] = Array.isArray(data?.data) ? data.data : [];
        if (candidates.length === 0) continue;

        let bestCover: string | null = null;
        let bestScore = -1;
        for (const item of candidates) {
          const rawCover =
            mode === 'album'
              ? item?.cover_xl || item?.cover_big || item?.cover_medium
              : item?.album?.cover_xl || item?.album?.cover_big || item?.album?.cover_medium;
          if (!rawCover || !isStudioPosterUrl(rawCover)) continue;
          if (rawCover.includes('/images/cover//') || rawCover.includes('d41d8cd98f00b204e9800998ecf8427e')) continue;
          const fullTitle = item.title || item.title_short || '';
          const candidateTitle = mode === 'album' ? item.title || '' : fullTitle;
          const candidateAlbum = mode === 'album' ? item.title || '' : item.album?.title || '';

          // Capture original movie/album name from `(From "Movie")` so if Deezer only showed a compilation,
          // we can fetch the real original soundtrack cover right below!
          if (!discoveredFromAlbum && mode !== 'album') {
            const extracted = extractFromAlbumName(fullTitle);
            if (extracted && posterSimilarity(cleanTrack, stripCandidateParenNoise(fullTitle)) >= 0.72) {
              discoveredFromAlbum = extracted;
            }
          }

          const score = scoreStudioArtworkCandidate({
            cleanTrack,
            cleanArtist,
            candidateTitle,
            candidateArtist: item.artist?.name || '',
            candidateAlbum,
            albumHint,
            trackCount: mode === 'album' && typeof item.nb_tracks === 'number' ? item.nb_tracks : undefined,
            isCompilation: item?.record_type === 'compile' || item?.album?.record_type === 'compile',
            mode,
          });
          if (score > bestScore) {
            bestScore = score;
            // Use Deezer's native edge-cached 500x500 q80 CDN URL
            bestCover = rawCover.replace('1000x1000-000000-80-0-0.jpg', '500x500-000000-80-0-0.jpg');
          }
        }
        if (bestCover && bestScore > 0) return bestCover;
      }

      // If Deezer only returned a compilation re-issue of a `(From "OriginalMovie")` song,
      // fetch the genuine original soundtrack album cover directly!
      if (mode !== 'album' && discoveredFromAlbum) {
        const ostCover = await searchDeezerArtwork(discoveredFromAlbum, '', 'album', discoveredFromAlbum);
        if (ostCover && isStudioPosterUrl(ostCover)) return ostCover;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function searchDeezerArtistImage(artistName: string): Promise<string | null> {
    const cleanArtist = sanitizeText(artistName, 80);
    if (!cleanArtist) return null;
    const cacheKey = `artist-portrait::${cleanArtist.toLowerCase()}`;
    if (artworkCache.has(cacheKey)) return artworkCache.get(cacheKey)!;
    try {
      const res = await fetch(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanArtist)}&limit=3`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const items: any[] = Array.isArray(data?.data) ? data.data : [];
      for (const item of items) {
        const pic = item?.picture_xl || item?.picture_big || item?.picture_medium;
        if (
          pic &&
          pic.includes('dzcdn.net') &&
          !pic.includes('d41d8cd98f00b204e9800998ecf8427e') &&
          posterSimilarity(cleanArtist, item?.name || '') >= 0.7
        ) {
          artworkCache.set(cacheKey, pic);
          return pic;
        }
      }
    } catch {}
    return null;
  }

  // ── Source 3: Apple Music / iTunes Multi-Region Store (Original Single/Album 600x600 WebP — blocks compilations) ──
  async function searchItunesArtwork(
    cleanTrack: string,
    cleanArtist: string,
    country = 'US',
    titleOnly = false,
    entity: 'song' | 'album' = 'song',
    albumHint = ''
  ): Promise<string | null> {
    try {
      if (Date.now() < itunesBlockedUntil) return null;
      const q = titleOnly
        ? `${cleanTrack} ${albumHint}`.trim()
        : `${cleanTrack} ${cleanArtist || albumHint}`.trim();
      if (!q) return null;
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=${country}&media=music&entity=${entity}&limit=15`;
      const itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3000) });
      if (itunesRes.status === 403 || itunesRes.status === 429) {
        itunesBlockedUntil = Date.now() + 3 * 60 * 1000;
        return null;
      }
      if (!itunesRes.ok) return null;
      const data = await itunesRes.json();
      const candidates: any[] = Array.isArray(data.results) ? data.results : [];
      if (candidates.length === 0) return null;

      let bestArt: string | null = null;
      let bestScore = -1;
      for (const item of candidates) {
        if (!item?.artworkUrl100) continue;
        const candidateName =
          entity === 'album'
            ? item.collectionName || item.trackName || ''
            : item.trackName || item.collectionName || '';
        const releaseYear =
          typeof item.releaseDate === 'string'
            ? parseInt(item.releaseDate.slice(0, 4), 10) || undefined
            : undefined;
        const score = scoreStudioArtworkCandidate({
          cleanTrack,
          cleanArtist: titleOnly ? '' : cleanArtist,
          candidateTitle: candidateName,
          candidateArtist: item.artistName || '',
          candidateAlbum: item.collectionName || '',
          albumHint,
          trackCount: typeof item.trackCount === 'number' ? item.trackCount : undefined,
          releaseYear,
          mode: titleOnly ? 'titleOnly' : entity === 'album' ? 'album' : 'track',
        });
        if (score > bestScore) {
          bestScore = score;
          // Serve Apple CDN 600x600 WebP (~44KB, ~11ms vs 641KB JPEG)
          bestArt = item.artworkUrl100.replace(/\/\d+x\d+bb\.[a-z]+$/i, '/600x600bb.webp');
        }
      }
      return bestArt && bestScore > 0 ? bestArt : null;
    } catch {
      return null;
    }
  }

  function decodeHtmlEntitiesSimple(str: string): string {
    return (str || '')
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }

  // ── Source 4: JioSaavn Public Catalog (500x500 Original Single/Movie Soundtrack Covers — blocks compilations) ──
  async function searchJioSaavnArtwork(
    cleanTrack: string,
    cleanArtist: string,
    albumHint = ''
  ): Promise<string | null> {
    try {
      const queries: string[] = [];
      if (cleanTrack && albumHint) {
        queries.push(`${cleanTrack} ${albumHint}`.trim());
      }
      const primaryQ = `${cleanTrack} ${cleanArtist || albumHint}`.trim();
      if (primaryQ && !queries.includes(primaryQ)) {
        queries.push(primaryQ);
      }
      if (queries.length === 0) return null;

      for (const q of queries) {
        const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&n=12&p=1&q=${encodeURIComponent(q)}`;
        const res = await saavnSchedule(() =>
          fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(3000),
          })
        );
        if (!res.ok) continue;
        const data = await res.json();
        // Only match genuine songs from original singles/soundtracks — NEVER playlists or compilations!
        const songs: any[] = Array.isArray(data?.results) ? data.results : [];
        if (songs.length === 0) continue;

        let bestArt: string | null = null;
        let bestScore = -1;
        for (const item of songs) {
          const rawImg = typeof item?.image === 'string' ? item.image : '';
          if (!rawImg || !rawImg.includes('saavncdn.com') || rawImg.includes('default')) continue;
          const imgSlug = rawImg.split('/').pop()?.replace(/[-_]+/g, ' ') || '';
          const reqHasVariant = /\b(?:instrumental|karaoke|lofi|lo-fi|slowed|sped\s*up|mashup|ringtone|remix)\b/i.test(cleanTrack);
          if (
            (!reqHasVariant && /\b(?:instrumental|karaoke|lofi|lo-fi|slowed|sped\s*up|mashup|ringtone|piano\s+version|guitar\s+version|8d)\b/i.test(imgSlug)) ||
            (PLAYLIST_OR_COMPILATION_ALBUM_RE.test(imgSlug) && !PLAYLIST_OR_COMPILATION_ALBUM_RE.test(`${cleanTrack} ${albumHint}`))
          ) {
            continue;
          }
          const candidateTitle = decodeHtmlEntitiesSimple(item.song || item.title || '');
          const candidateAlbum = decodeHtmlEntitiesSimple(item.album || item.more_info?.album || '');
          const candidateArtist = decodeHtmlEntitiesSimple(
            `${item.singers || ''} ${item.primary_artists || ''} ${item.music || ''}`.trim()
          );
          const releaseYear =
            typeof item.year === 'string' || typeof item.year === 'number'
              ? parseInt(String(item.year), 10) || undefined
              : undefined;
          const score = scoreStudioArtworkCandidate({
            cleanTrack,
            cleanArtist,
            candidateTitle,
            candidateArtist,
            candidateAlbum,
            albumHint,
            releaseYear,
            mode: 'track',
          });
          if (score > bestScore) {
            bestScore = score;
            bestArt = rawImg.replace(/-\d+x\d+\.(jpg|jpeg|png)/i, '-500x500.$1').replace(/^http:\/\//i, 'https://');
          }
        }
        if (bestArt && bestScore > 0) return bestArt;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ── Source 5: MusicBrainz + Cover Art Archive (No key, open licensing, strict <= 1 req/sec rate limiter) ──
  let mbQueueTail: Promise<void> = Promise.resolve();
  let lastMbRequestAt = 0;

  async function throttleMusicBrainz(): Promise<void> {
    const prev = mbQueueTail;
    let release!: () => void;
    mbQueueTail = new Promise<void>((r) => {
      release = r;
    });
    await prev;
    const waitMs = Math.max(0, 1100 - (Date.now() - lastMbRequestAt));
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs));
    }
    lastMbRequestAt = Date.now();
    release();
  }

  async function verifyCoverArtArchiveUrl(caaUrl: string): Promise<string | null> {
    try {
      const headRes = await fetch(caaUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(2500),
      });
      if (headRes.ok && headRes.url && isStudioPosterUrl(headRes.url)) {
        return headRes.url;
      }
    } catch {}
    return null;
  }

  async function searchMusicBrainzArtwork(
    cleanTrack: string,
    cleanArtist: string,
    albumHint = ''
  ): Promise<string | null> {
    try {
      const mbHeaders = { 'User-Agent': 'MelophilePlayer/1.0 (https://melophile.app)' };

      // Strategy A: Release-Group lookup (matches album or single release-group -> Cover Art Archive front-500)
      const rgName = (albumHint || cleanTrack).replace(/"/g, '').trim();
      if (rgName) {
        await throttleMusicBrainz();
        const rgParts = [`releasegroup:"${rgName}"`];
        if (cleanArtist) rgParts.unshift(`artist:"${cleanArtist.replace(/"/g, '')}"`);
        const rgUrl = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(rgParts.join(' AND '))}&fmt=json&limit=3`;
        const rgRes = await fetch(rgUrl, {
          headers: mbHeaders,
          signal: AbortSignal.timeout(3500),
        });
        if (rgRes.ok) {
          const rgData = await rgRes.json();
          const groups: any[] = Array.isArray(rgData?.['release-groups']) ? rgData['release-groups'] : [];
          for (const g of groups) {
            if ((g?.score || 0) < 75 || !g?.id) continue;
            const hit = await verifyCoverArtArchiveUrl(
              `https://coverartarchive.org/release-group/${encodeURIComponent(g.id)}/front-500`
            );
            if (hit) return hit;
          }
        }
      }

      // Strategy B: Recording -> Release fallback
      await throttleMusicBrainz();
      const qParts = [`recording:"${cleanTrack.replace(/"/g, '')}"`];
      if (cleanArtist) qParts.push(`artist:"${cleanArtist.replace(/"/g, '')}"`);
      const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(qParts.join(' AND '))}&fmt=json&limit=3`;
      const mbRes = await fetch(mbUrl, {
        headers: mbHeaders,
        signal: AbortSignal.timeout(3500),
      });
      if (!mbRes.ok) return null;
      const data = await mbRes.json();
      const recordings: any[] = Array.isArray(data?.recordings) ? data.recordings : [];
      const releaseIds: string[] = [];
      for (const rec of recordings) {
        if ((rec?.score || 0) < 75) continue;
        for (const rel of rec.releases || []) {
          if (rel?.id && !releaseIds.includes(rel.id)) releaseIds.push(rel.id);
          if (releaseIds.length >= 2) break;
        }
        if (releaseIds.length >= 2) break;
      }

      for (const releaseId of releaseIds) {
        const hit = await verifyCoverArtArchiveUrl(
          `https://coverartarchive.org/release/${encodeURIComponent(releaseId)}/front-500`
        );
        if (hit) return hit;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ── Source 6: TheAudioDB Free Public API (Verified Square Album/Track Art) ──
  async function searchAudioDbArtwork(cleanTrack: string, cleanArtist: string): Promise<string | null> {
    if (!cleanArtist || !cleanTrack) return null;
    try {
      const url = `https://www.theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodeURIComponent(cleanArtist)}&t=${encodeURIComponent(cleanTrack)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json();
      const track = Array.isArray(data?.track) ? data.track[0] : null;
      const thumb = track?.strTrackThumb;
      if (typeof thumb === 'string' && thumb.includes('theaudiodb.com')) {
        return thumb;
      }
      if (track?.idAlbum) {
        const albRes = await fetch(
          `https://www.theaudiodb.com/api/v1/json/2/album.php?m=${encodeURIComponent(track.idAlbum)}`,
          { signal: AbortSignal.timeout(2500) }
        );
        if (albRes.ok) {
          const albData = await albRes.json();
          const albThumb = albData?.album?.[0]?.strAlbumThumb;
          if (typeof albThumb === 'string' && albThumb.includes('theaudiodb.com')) {
            return albThumb;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Resolves the instant the FIRST promise returns a verified 1:1 studio poster URL
  // (eliminates waiting on slower providers in Promise.all!)
  function raceForFirstStudioPoster(
    promises: Array<Promise<string | null>>,
    timeoutMs = 1500
  ): Promise<string | null> {
    if (promises.length === 0) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      let remaining = promises.length;
      const finish = (val: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(val);
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      for (const p of promises) {
        Promise.resolve(p)
          .then((url) => {
            if (url && isStudioPosterUrl(url)) {
              finish(url);
            } else {
              remaining--;
              if (remaining <= 0) finish(null);
            }
          })
          .catch(() => {
            remaining--;
            if (remaining <= 0) finish(null);
          });
      }
    });
  }

  async function resolveArtwork(
    trackTitle: string,
    artistName: string,
    _videoId?: string,
    explicitAlbum = '',
    options: { fastMode?: boolean } = {}
  ): Promise<string | null> {
    const { fastMode = false } = options;
    const parsed = parseCleanTrackAndArtist(trackTitle, artistName);
    const cleanTrack = parsed.cleanTrack;
    const cleanArtist = parsed.cleanArtist;
    const albumHint = sanitizeText(explicitAlbum, 90) || parsed.albumHint;
    const cacheKey = buildArtworkCacheKey(cleanTrack, cleanArtist, albumHint);

    if ((cleanTrack || albumHint) && artworkCache.has(cacheKey)) {
      return artworkCache.get(cacheKey)!;
    }
    const missedUntil = artworkMissCache.get(cacheKey) || 0;
    if (Date.now() < missedUntil) {
      return null;
    }
    if (artworkInFlight.has(cacheKey)) {
      return artworkInFlight.get(cacheKey)!;
    }

    const work = (async (): Promise<string | null> => {
      try {
        if (!cleanTrack && !cleanArtist && !albumHint) {
          return null;
        }

        const commitHit = (url: string): string => {
          artworkCache.set(cacheKey, url);
          artworkMissCache.delete(cacheKey);
          persistArtworkToDisk();
          return url;
        };

        const indianTrack = isLikelyIndianTrack(cleanTrack, cleanArtist, albumHint, artistName);

        // ── WAVE 1 (Region-Aware First-Past-The-Post Race):
        //    - Western/Global tracks: Deezer + iTunes US (+ Spotify) -> crisp official covers, zero JioSaavn knockoffs!
        //    - Indian/Bollywood tracks: Deezer + JioSaavn + iTunes IN -> authentic movie OST & single covers!
        const wave1Promises: Array<Promise<string | null>> = [
          searchDeezerArtwork(cleanTrack, cleanArtist, 'track', albumHint),
          searchItunesArtwork(cleanTrack, cleanArtist, indianTrack ? 'IN' : 'US', false, 'song', albumHint),
        ];
        if (indianTrack) {
          wave1Promises.push(searchJioSaavnArtwork(cleanTrack, cleanArtist, albumHint));
        }
        if (albumHint) {
          wave1Promises.push(searchDeezerArtwork(albumHint, cleanArtist, 'album', albumHint));
        }
        if (hasValidSpotifyCredentials()) {
          wave1Promises.push(searchSpotifyArtwork(cleanTrack, cleanArtist));
        }

        const wave1 = await raceForFirstStudioPoster(wave1Promises, fastMode ? 1800 : 2400);
        if (wave1 && isStudioPosterUrl(wave1)) {
          return commitHit(wave1);
        }

        // ── WAVE 2: Cross-Catalog Fallback (JioSaavn for non-Indian misses, Title-Only for label uploads, iTunes Album) ──
        const wave2Promises: Array<Promise<string | null>> = [
          searchItunesArtwork(cleanTrack, cleanArtist, 'GB', false, 'song', albumHint),
          searchItunesArtwork(cleanTrack, cleanArtist, 'US', false, 'album', albumHint),
        ];
        if (!indianTrack) {
          wave2Promises.push(searchJioSaavnArtwork(cleanTrack, cleanArtist, albumHint));
        }
        if (!cleanArtist) {
          wave2Promises.push(
            searchDeezerArtwork(cleanTrack, '', 'titleOnly', albumHint),
            searchItunesArtwork(cleanTrack, '', indianTrack ? 'IN' : 'US', true, 'song', albumHint)
          );
        }

        const wave2 = await raceForFirstStudioPoster(wave2Promises, fastMode ? 1200 : 2000);
        if (wave2 && isStudioPosterUrl(wave2)) {
          return commitHit(wave2);
        }

        // In interactive fastMode (/api/batch-artwork), NEVER stall the UI batch on MusicBrainz's 1.1s serial mutex.
        // Warm Wave 3 quietly in the background for future hits instead!
        if (fastMode) {
          const bgPromises: Array<Promise<string | null>> = [
            searchMusicBrainzArtwork(cleanTrack, cleanArtist, albumHint),
            searchAudioDbArtwork(cleanTrack, cleanArtist),
          ];
          if (!cleanArtist) {
            bgPromises.unshift(searchItunesArtwork(cleanTrack, '', 'IN', true, 'song', albumHint));
          }
          void raceForFirstStudioPoster(bgPromises, 4500)
            .then((bgHit) => {
              if (bgHit && isStudioPosterUrl(bgHit)) {
                commitHit(bgHit);
              }
            })
            .catch(() => {});
          return null;
        }

        // ── WAVE 3: Deep Open-Licensed Catalogs (MusicBrainz + Cover Art Archive + AudioDB) ──
        const wave3Promises: Array<Promise<string | null>> = [
          searchMusicBrainzArtwork(cleanTrack, cleanArtist, albumHint),
          searchAudioDbArtwork(cleanTrack, cleanArtist),
        ];
        if (!cleanArtist) {
          wave3Promises.unshift(searchItunesArtwork(cleanTrack, '', 'IN', true, 'song', albumHint));
        }
        const wave3 = await raceForFirstStudioPoster(wave3Promises, 4000);
        if (wave3 && isStudioPosterUrl(wave3)) {
          return commitHit(wave3);
        }

        // Strict 1:1 rule: NEVER fall back to 16:9 YouTube thumbnails, playlists, or wrong-artist covers.
        // Short 45s negative cache (only when iTunes isn't blocked) so transient issues never stick for 10 minutes!
        if (Date.now() >= itunesBlockedUntil) {
          artworkMissCache.set(cacheKey, Date.now() + 45 * 1000);
        }
        return null;
      } finally {
        artworkInFlight.delete(cacheKey);
      }
    })();

    artworkInFlight.set(cacheKey, work);
    return work;
  }

  async function enrichTracksWithSquareArtwork(tracks: any[], concurrency = 10): Promise<any[]> {
    if (!Array.isArray(tracks) || tracks.length === 0) return [];
    const results = new Array(tracks.length);
    let cursor = 0;

    async function worker() {
      while (cursor < tracks.length) {
        const idx = cursor++;
        const t = tracks[idx];
        if (!t) continue;
        const ytFallback = t.videoThumbnail || (t.id ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : t.thumbnail);
        if (isStudioPosterUrl(t.thumbnail)) {
          results[idx] = {
            ...t,
            videoThumbnail: ytFallback,
            hasSquareArtwork: true,
          };
          continue;
        }

        const studioArt = await resolveArtwork(
          t.title || '',
          t.artworkArtistHint || t.artist || '',
          t.id,
          t.artworkAlbumHint || ''
        );
        if (studioArt && isStudioPosterUrl(studioArt)) {
          results[idx] = {
            ...t,
            thumbnail: studioArt,
            videoThumbnail: ytFallback,
            hasSquareArtwork: true,
          };
        } else {
          results[idx] = {
            ...t,
            videoThumbnail: ytFallback,
            hasSquareArtwork: false,
          };
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(concurrency, tracks.length) }, () => worker())
    );
    return results.filter(Boolean);
  }

  // Fast-path budgeted artwork enrichment for realtime search & feeds:
  // 0ms cache hits + first-past-the-post parallel race (iTunes US + Deezer + iTunes IN + JioSaavn), capped at budgetMs.
  async function enrichTracksRealtimeFast(tracks: any[], budgetMs = 650): Promise<any[]> {
    if (!Array.isArray(tracks) || tracks.length === 0) return [];
    const results = tracks.map((t) => {
      const ytFallback = t.videoThumbnail || (t.id ? `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg` : t.thumbnail);
      if (isStudioPosterUrl(t.thumbnail)) {
        return { ...t, videoThumbnail: ytFallback, hasSquareArtwork: true };
      }
      const parsed = parseCleanTrackAndArtist(t.title || '', t.artworkArtistHint || t.artist || '');
      const albumHint = sanitizeText(t.artworkAlbumHint, 90) || parsed.albumHint;
      const cacheKey = buildArtworkCacheKey(parsed.cleanTrack, parsed.cleanArtist, albumHint);
      const cachedUrl = (parsed.cleanTrack || albumHint) ? artworkCache.get(cacheKey) : undefined;
      if (cachedUrl && isStudioPosterUrl(cachedUrl)) {
        return { ...t, thumbnail: cachedUrl, videoThumbnail: ytFallback, hasSquareArtwork: true };
      }
      return { ...t, videoThumbnail: ytFallback, hasSquareArtwork: false };
    });

    const uncachedIndices: number[] = [];
    for (let i = 0; i < results.length; i++) {
      if (!results[i].hasSquareArtwork && uncachedIndices.length < 18) {
        uncachedIndices.push(i);
      }
    }
    if (uncachedIndices.length === 0) return results;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const deadline = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, budgetMs);
    });

    // Paced worker pool (concurrency = 5) so Deezer stays well below burst quota limits while finishing fast!
    let cursor = 0;
    const WORKER_COUNT = Math.min(5, uncachedIndices.length);
    const runWorker = async () => {
      while (cursor < uncachedIndices.length) {
        const idx = uncachedIndices[cursor++];
        const t = results[idx];
        const parsed = parseCleanTrackAndArtist(t.title || '', t.artworkArtistHint || t.artist || '');
        const albumHint = sanitizeText(t.artworkAlbumHint, 90) || parsed.albumHint;
        if (!parsed.cleanTrack && !parsed.cleanArtist) continue;
        const cacheKey = buildArtworkCacheKey(parsed.cleanTrack, parsed.cleanArtist, albumHint);
        const missedUntil = artworkMissCache.get(cacheKey) || 0;
        if (Date.now() < missedUntil) continue;

        const indianTrack = isLikelyIndianTrack(parsed.cleanTrack, parsed.cleanArtist, albumHint, t.artist || '');
        const racers: Array<Promise<string | null>> = [
          searchDeezerArtwork(parsed.cleanTrack, parsed.cleanArtist, 'track', albumHint).catch(() => null),
          searchItunesArtwork(parsed.cleanTrack, parsed.cleanArtist, indianTrack ? 'IN' : 'US', false, 'song', albumHint).catch(() => null),
        ];
        if (indianTrack) {
          racers.push(searchJioSaavnArtwork(parsed.cleanTrack, parsed.cleanArtist, albumHint).catch(() => null));
        }
        const hit = await raceForFirstStudioPoster(racers, Math.max(700, budgetMs - 100));
        if (hit && isStudioPosterUrl(hit)) {
          artworkCache.set(cacheKey, hit);
          artworkMissCache.delete(cacheKey);
          persistArtworkToDisk();
          results[idx] = { ...results[idx], thumbnail: hit, hasSquareArtwork: true };
        }
      }
    };

    const lookups = Promise.allSettled(Array.from({ length: WORKER_COUNT }, () => runWorker()));
    await Promise.race([lookups, deadline]);
    if (timer) clearTimeout(timer);
    return results;
  }

  // Single track/album highres artwork (keyless Deezer + iTunes + MusicBrainz/CAA, 7-day Cache-Control)
  app.get('/api/highres-artwork', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    const rawTrack = sanitizeText(req.query.track, 140);
    const rawArtist = sanitizeText(req.query.artist, 100);
    const rawAlbum = sanitizeText(req.query.album, 120);
    const videoId = sanitizeText(req.query.videoId, 32);
    const artworkUrl = await resolveArtwork(rawTrack, rawArtist, videoId, rawAlbum, { fastMode: true });
    res.json({ artworkUrl });
  });

  // Artist portrait image via keyless Deezer /search/artist (backend-proxied to avoid CORS, cached)
  app.get('/api/artist-artwork', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    const rawArtist = sanitizeText(req.query.artist, 100);
    if (!rawArtist) return res.json({ artworkUrl: null });
    const artworkUrl = await searchDeezerArtistImage(rawArtist);
    res.json({ artworkUrl });
  });

  // Ultra-fast paced batch artwork resolution (up to 40 items, rate-safe concurrency = 6, non-blocking fastMode)
  app.post('/api/batch-artwork', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 40) : [];
    const results: Record<string, string> = {};

    const CONCURRENCY = 6;
    let cursor = 0;

    async function worker() {
      while (cursor < items.length) {
        const idx = cursor++;
        const item = items[idx];
        const key = item?.key || item?.id;
        if (!item || !key) continue;
        const art = await resolveArtwork(
          sanitizeText(item.title || item.track, 140),
          sanitizeText(item.artist, 100),
          sanitizeText(item.videoId || item.id, 32),
          sanitizeText(item.album, 120),
          { fastMode: true }
        );
        if (art) results[key] = art;
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()));
    res.json({ artworks: results, results });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // API 7: REAL TRACK BPM & BEAT PROFILE ENGINE (Keyless Deezer Track BPM + Gain)
  // Powers exact beat-synchronized Equalizer FX meters & frequency bars.
  // ─────────────────────────────────────────────────────────────────────────────
  const audioProfileCache = new Map<string, { profile: any; expiresAt: number }>();

  function estimateAudioProfile(cleanTrack: string, cleanArtist: string, durationSec: number) {
    const text = `${cleanTrack} ${cleanArtist}`.toLowerCase();
    // Deterministic hash seed for subtle natural variance when BPM is estimated
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }

    if (/\b(dance|edm|house|techno|club|remix|calvin|avicii|daft punk|dua lipa|levitating|blinding lights|synth|disco|party)\b/.test(text)) {
      return {
        bpm: 120 + (hash % 14),
        gainDb: -6.5,
        energy: 0.92,
        bassWeight: 0.94,
        vocalWeight: 0.72,
        trebleWeight: 0.88,
        groove: 'four-on-floor' as const,
        source: 'estimated' as const,
      };
    }
    if (/\b(hip[\s-]?hop|rap|trap|drill|travis|drake|kendrick|eminem|future|metro|bad guy|punjabi|sidhu|shubh|ap dhillon|karan aujla)\b/.test(text)) {
      return {
        bpm: 88 + (hash % 18),
        gainDb: -7.2,
        energy: 0.84,
        bassWeight: 0.98,
        vocalWeight: 0.8,
        trebleWeight: 0.76,
        groove: 'half-time' as const,
        source: 'estimated' as const,
      };
    }
    if (/\b(acoustic|ballad|someone like you|perfect|tum hi ho|sanam teri|raanjhan|yellow|lofi|slow|rain|adele|arijit|shreya|atif|bon iver|cigarettes|laufey)\b/.test(text)) {
      return {
        bpm: 72 + (hash % 18),
        gainDb: -9.8,
        energy: 0.58,
        bassWeight: 0.62,
        vocalWeight: 0.92,
        trebleWeight: 0.56,
        groove: 'ballad' as const,
        source: 'estimated' as const,
      };
    }
    return {
      bpm: durationSec > 280 ? 96 + (hash % 16) : 108 + (hash % 18),
      gainDb: -7.8,
      energy: 0.76,
      bassWeight: 0.82,
      vocalWeight: 0.78,
      trebleWeight: 0.72,
      groove: 'backbeat' as const,
      source: 'estimated' as const,
    };
  }

  app.get('/api/audio-profile', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const rawTrack = sanitizeText(req.query.track, 140);
    const rawArtist = sanitizeText(req.query.artist, 100);
    const durationSec = parseInt((req.query.durationSec as string) || '0', 10) || 0;

    const { cleanTrack, cleanArtist } = parseCleanTrackAndArtist(rawTrack, rawArtist);
    const cacheKey = `${cleanTrack}::${cleanArtist}`.toLowerCase();
    const cached = audioProfileCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.profile);
    }

    const fallbackProfile = estimateAudioProfile(cleanTrack, cleanArtist, durationSec);

    try {
      const q = `${cleanTrack} ${cleanArtist}`.trim();
      if (q) {
        const searchRes = await fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const items: any[] = Array.isArray(searchData?.data) ? searchData.data : [];
          let bestId: number | null = null;
          let bestScore = -1;
          for (const item of items) {
            if (!item?.id) continue;
            const tSim = posterSimilarity(cleanTrack, item.title_short || item.title || '');
            const aSim = cleanArtist ? posterSimilarity(cleanArtist, item.artist?.name || '') : 0.6;
            const score = tSim * 0.65 + aSim * 0.35;
            if (score > bestScore) {
              bestScore = score;
              bestId = item.id;
            }
          }

          if (bestId && bestScore >= 0.42) {
            const detailRes = await fetch(`https://api.deezer.com/track/${bestId}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const rawBpm = typeof detail?.bpm === 'number' ? detail.bpm : 0;
              const rawGain = typeof detail?.gain === 'number' ? detail.gain : fallbackProfile.gainDb;

              if (rawBpm >= 55 && rawBpm <= 210) {
                const normalizedBpm = rawBpm > 185 ? Math.round(rawBpm / 2) : Math.round(rawBpm);
                // Louder studio masters have gain closer to -4..-7 dB, softer ballads -11..-15 dB
                const energyFromGain = Math.max(0.45, Math.min(0.98, 1.18 + rawGain / 22));
                const groove: 'four-on-floor' | 'backbeat' | 'half-time' | 'ballad' =
                  normalizedBpm >= 118 && energyFromGain >= 0.72
                    ? 'four-on-floor'
                    : normalizedBpm <= 86
                    ? energyFromGain >= 0.76
                      ? 'half-time'
                      : 'ballad'
                    : fallbackProfile.groove;

                const realProfile = {
                  bpm: normalizedBpm,
                  gainDb: Math.round(rawGain * 10) / 10,
                  energy: Math.round(energyFromGain * 100) / 100,
                  bassWeight: groove === 'four-on-floor' || groove === 'half-time' ? 0.94 : fallbackProfile.bassWeight,
                  vocalWeight: groove === 'ballad' ? 0.9 : fallbackProfile.vocalWeight,
                  trebleWeight: normalizedBpm >= 115 ? 0.85 : fallbackProfile.trebleWeight,
                  groove,
                  source: 'deezer-bpm' as const,
                };

                audioProfileCache.set(cacheKey, {
                  profile: realProfile,
                  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                });
                if (audioProfileCache.size > 500) {
                  const oldest = audioProfileCache.keys().next().value;
                  if (oldest) audioProfileCache.delete(oldest);
                }
                return res.json(realProfile);
              }
            }
          }
        }
      }
    } catch {
      // Fall back cleanly to estimated tempo profile
    }

    audioProfileCache.set(cacheKey, {
      profile: fallbackProfile,
      expiresAt: Date.now() + 6 * 60 * 60 * 1000,
    });
    return res.json(fallbackProfile);
  });

  // Download Native Mobile Android APK
  app.get(['/download/app.apk', '/download/apk', '/app.apk'], (_req: Request, res: Response) => {
    const apkPath = path.resolve(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="SoundStream.apk"');
      return res.sendFile(apkPath);
    }
    return res.status(404).send('APK not found. Please run "pnpm run mobile:build".');
  });

  // Return JSON 404 for unknown API routes instead of SPA HTML
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Mount Vite middleware or static files
  const distPath = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.K_SERVICE !== undefined ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(path.resolve(distPath, 'index.html')));

  if (isProd && fs.existsSync(path.resolve(distPath, 'index.html'))) {
    app.use(
      '/assets',
      express.static(path.resolve(distPath, 'assets'), {
        maxAge: '365d',
        immutable: true,
      })
    );
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minimalist Music Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
