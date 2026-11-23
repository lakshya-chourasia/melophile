import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  parseDurationToSeconds,
  extractYouTubeId,
  getNextTrackIndex,
  getPrevTrackIndex,
  cleanTrackTitle,
  parseLrcLyrics,
  findActiveLyricIndex,
  getLyricLineProgress,
  extractCatalogArtistName,
  getDynamicTrackTag,
  getFullSingerName,
  deduplicateTracksBySong,
} from './playerUtils.js';

test('formatTime correctly formats seconds into mm:ss and hh:mm:ss', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(45), '0:45');
  assert.equal(formatTime(60), '1:00');
  assert.equal(formatTime(75), '1:15');
  assert.equal(formatTime(273), '4:33');
  assert.equal(formatTime(3600), '1:00:00');
  assert.equal(formatTime(3665), '1:01:05');
  assert.equal(formatTime(-10), '0:00');
});

test('parseDurationToSeconds correctly parses various YouTube duration strings', () => {
  assert.equal(parseDurationToSeconds('0:00'), 0);
  assert.equal(parseDurationToSeconds('3:45'), 225);
  assert.equal(parseDurationToSeconds('4:33'), 273);
  assert.equal(parseDurationToSeconds('1:02:15'), 3735);
  assert.equal(parseDurationToSeconds('invalid'), 0);
});

test('extractYouTubeId extracts IDs from varied valid YouTube URLs and raw IDs', () => {
  // Raw 11-char ID
  assert.equal(extractYouTubeId('yKNxeF4KMsY'), 'yKNxeF4KMsY');
  assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');

  // Standard watch URLs
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=yKNxeF4KMsY&t=45s'),
    'yKNxeF4KMsY'
  );

  // Short youtu.be URLs
  assert.equal(
    extractYouTubeId('https://youtu.be/yKNxeF4KMsY?si=abc123xyz'),
    'yKNxeF4KMsY'
  );

  // Embed URLs
  assert.equal(
    extractYouTubeId('https://www.youtube.com/embed/yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Music YouTube URLs
  assert.equal(
    extractYouTubeId('https://music.youtube.com/watch?v=yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Shorts URLs
  assert.equal(
    extractYouTubeId('https://youtube.com/shorts/yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Invalid strings
  assert.equal(extractYouTubeId(''), null);
  assert.equal(extractYouTubeId('https://google.com'), null);
  assert.equal(extractYouTubeId('not-a-youtube-url'), null);
});

test('getNextTrackIndex handles sequential, repeat all, and repeat one modes', () => {
  const queueLen = 5;

  // Sequential progression
  assert.equal(getNextTrackIndex(0, queueLen, 'off', false), 1);
  assert.equal(getNextTrackIndex(1, queueLen, 'off', false), 2);
  assert.equal(getNextTrackIndex(3, queueLen, 'off', false), 4);
  assert.equal(getNextTrackIndex(4, queueLen, 'off', false), null); // End of queue

  // Repeat All
  assert.equal(getNextTrackIndex(4, queueLen, 'all', false), 0);

  // Repeat One
  assert.equal(getNextTrackIndex(2, queueLen, 'one', false), 2);
});

test('getPrevTrackIndex restarts track if playing > 3s, or goes to prev track', () => {
  const queueLen = 4;
  // If > 3 seconds, should return same index to restart track
  assert.equal(getPrevTrackIndex(2, queueLen, 12), 2);

  // If <= 3 seconds, should go to previous track
  assert.equal(getPrevTrackIndex(2, queueLen, 1.5), 1);
  assert.equal(getPrevTrackIndex(0, queueLen, 0.5), 3); // Wraps around
});

test('cleanTrackTitle strips all video/promo/metadata crap and returns only the proper song name', () => {
  const res1 = cleanTrackTitle('Coldplay - Yellow (Official Video)');
  assert.equal(res1.title, 'Yellow');
  assert.equal(res1.artistFromTitle, 'Coldplay');

  const res2 = cleanTrackTitle('Lofi Girl - Synthwave Beats [Visualizer]');
  assert.equal(res2.title, 'Synthwave Beats');
  assert.equal(res2.artistFromTitle, 'Lofi Girl');

  const res3 = cleanTrackTitle('Acoustic Breeze (Lyrics)');
  assert.equal(res3.title, 'Acoustic Breeze');

  assert.equal(cleanTrackTitle('Queen – Bohemian Rhapsody (Official Video Remastered)').title, 'Bohemian Rhapsody');
  assert.equal(cleanTrackTitle('Daft Punk - Instant Crush (Video) ft. Julian Casablancas').title, 'Instant Crush');
  assert.equal(cleanTrackTitle('Tum Hi Ho (From "Aashiqui 2")').title, 'Tum Hi Ho');
  assert.equal(
    cleanTrackTitle('LYRICAL: Kesariya | Brahmāstra | Ranbir Kapoor | Alia Bhatt | Pritam | Arijit Singh').title,
    'Kesariya'
  );
  assert.equal(
    cleanTrackTitle('Full Video: Tera Ban Jaunga | Kabir Singh | Shahid K, Kiara A').title,
    'Tera Ban Jaunga'
  );
  assert.equal(
    cleanTrackTitle('Arijit Singh: Pachtaoge | Vicky Kaushal, Nora Fatehi | Jaani, B Praak').title,
    'Pachtaoge'
  );
  assert.equal(
    cleanTrackTitle("BTS (방탄소년단) 'Dynamite' Official MV").title,
    'Dynamite'
  );
  assert.equal(
    cleanTrackTitle("BLACKPINK - 'How You Like That' M/V").title,
    'How You Like That'
  );
  assert.equal(
    cleanTrackTitle('A.R. Rahman - Kun Faya Kun Full Video Song | Rockstar | Ranbir Kapoor').title,
    'Kun Faya Kun'
  );
  assert.equal(
    cleanTrackTitle('Lana Del Rey - Summertime Sadness (Official Music Video) - 4K Remaster').title,
    'Summertime Sadness'
  );
  assert.equal(
    cleanTrackTitle('01. Starboy (feat. Daft Punk) [Clean]').title,
    'Starboy'
  );
  assert.equal(
    cleanTrackTitle('Channa Mereya Full Video - ADHM | Ranbir Kapoor, Anushka | Arijit Singh | Pritam', 'Sony Music India').title,
    'Channa Mereya'
  );
});

test('parseLrcLyrics accurately converts LRC timestamps and text into sorted lyric lines', () => {
  const lrc = `
    [00:15.50] Look at the stars
    [00:19.20] Look how they shine for you
    [00:24.00] And everything you do
  `;
  const parsed = parseLrcLyrics(lrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].time, 15.5);
  assert.equal(parsed[0].text, 'Look at the stars');
  assert.equal(parsed[1].time, 19.2);
  assert.equal(parsed[1].text, 'Look how they shine for you');
  assert.equal(parsed[2].time, 24);
  assert.equal(parsed[2].text, 'And everything you do');

  // Empty input returns empty array
  assert.deepEqual(parseLrcLyrics(''), []);
});

test('findActiveLyricIndex detects correct current line based on playback time', () => {
  const lines = [
    { time: 10, text: 'First line' },
    { time: 20, text: 'Second line' },
    { time: 30, text: 'Third line' },
  ];

  assert.equal(findActiveLyricIndex(lines, 0), -1);
  assert.equal(findActiveLyricIndex(lines, 9.8), 0); // within 0.25s anticipation
  assert.equal(findActiveLyricIndex(lines, 15), 0);
  assert.equal(findActiveLyricIndex(lines, 20.5), 1);
  assert.equal(findActiveLyricIndex(lines, 35), 2);
});

test('getDynamicTrackTag accurately generates relevant dynamic hashtags', () => {
  assert.equal(getDynamicTrackTag('Days of Thunder', 'The Midnight'), '#SYNTHWAVE');
  assert.equal(getDynamicTrackTag('Someone Like You', 'Adele'), '#RELATIONSHIPS');
  assert.equal(getDynamicTrackTag('Yellow', 'Coldplay'), '#ALT-ROCK');
  assert.equal(getDynamicTrackTag('Alone', 'Marshmello'), '#RELATIONSHIPS');
  assert.equal(getDynamicTrackTag('Resonance', 'HOME'), '#CHILLOUT');
  assert.equal(getDynamicTrackTag('Bloom', 'The Paper Kites'), '#ACOUSTIC');
  assert.equal(getDynamicTrackTag('Shape of You', 'Ed Sheeran', '6.2B views'), '#GLOBAL-HIT');
});

test('getFullSingerName correctly maps stage names, mononyms, and bands to full singer names', () => {
  assert.equal(getFullSingerName('Adele'), 'Adele Adkins');
  assert.equal(getFullSingerName('Coldplay'), 'Chris Martin (Coldplay)');
  assert.equal(getFullSingerName('Queen'), 'Freddie Mercury (Queen)');
  assert.equal(getFullSingerName('The Weeknd'), 'Abel Tesfaye (The Weeknd)');
  assert.equal(getFullSingerName('The Killers'), 'Brandon Flowers (The Killers)');
  assert.equal(getFullSingerName('Arctic Monkeys'), 'Alex Turner (Arctic Monkeys)');
  assert.equal(getFullSingerName('Avicii', 'Wake Me Up'), 'Aloe Blacc (Avicii)');
  assert.equal(getFullSingerName('Haim'), 'Danielle Haim (HAIM)');
  assert.equal(getFullSingerName('Ed Sheeran'), 'Edward Christopher Sheeran');
  assert.equal(getFullSingerName('Harry Styles'), 'Harry Edward Styles');
  assert.equal(getFullSingerName('Dua Lipa'), 'Dua Lipa');
});

test('parseLrcLyrics supports [offset:ms], Enhanced LRC words, and instrumental breaks', () => {
  const lrc = `
    [offset:500]
    [00:10.50] <00:10.50>Look <00:11.00>at <00:11.50>the <00:12.00>stars
    [00:14.50]
    [00:25.50] Look how they shine
  `;
  const parsed = parseLrcLyrics(lrc);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].time, 10);
  assert.equal(parsed[0].endTime, 14);
  assert.equal(parsed[0].text, 'Look at the stars');
  assert.equal(parsed[0].words?.length, 4);
  assert.equal(parsed[0].words?.[0].text, 'Look');
  assert.equal(parsed[1].time, 25);
});

test('parseLrcLyrics rescues dotless centisecond timestamps and strips metadata credit lines', () => {
  const lrc = `
    [00:01.00] Synced by: RandomUploader
    [00:02.00] Lyrics by: Mithoon
    [00:1555] Hum tere bin ab reh nahi sakte
    [00:2150] Tere bina kya wajood mera
    [01:05:40] Tujhse juda gar ho jaayenge
  `;
  const parsed = parseLrcLyrics(lrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].time, 15.55);
  assert.equal(parsed[0].text, 'Hum tere bin ab reh nahi sakte');
  assert.equal(parsed[1].time, 21.5);
  assert.equal(parsed[2].time, 65.4);
});

test('findActiveLyricIndex & getLyricLineProgress respect sync offset', () => {
  const lines = [
    { time: 10, endTime: 14, text: 'Line 1' },
    { time: 20, endTime: 24, text: 'Line 2' },
  ];
  assert.equal(findActiveLyricIndex(lines, 15, 5), 1);
  assert.equal(findActiveLyricIndex(lines, 15, -6), -1);
  assert.equal(getLyricLineProgress(lines, 0, 12, 0), 0.5);
});

test('extractCatalogArtistName maps legal/full singer names back to studio catalog artist names', () => {
  assert.equal(extractCatalogArtistName('Abel Tesfaye (The Weeknd)'), 'The Weeknd');
  assert.equal(extractCatalogArtistName('Edward Christopher Sheeran'), 'Ed Sheeran');
  assert.equal(extractCatalogArtistName('Chris Martin (Coldplay)'), 'Coldplay');
  assert.equal(extractCatalogArtistName('Freddie Mercury (Queen)'), 'Queen');
  assert.equal(extractCatalogArtistName('Adele Adkins'), 'Adele');
});

test('deduplicateTracksBySong collapses duplicate uploads of the same song and keeps the best studio version', () => {
  const raw = [
    {
      id: 'lyric-1',
      title: 'The Weeknd - Blinding Lights (Lyrics)',
      artist: '7clouds',
      durationSec: 201,
      isOfficial: false,
      hasSquareArtwork: false,
    },
    {
      id: 'official-video',
      title: 'The Weeknd - Blinding Lights (Official Video)',
      artist: 'The Weeknd',
      durationSec: 262,
      isOfficial: true,
      hasSquareArtwork: true,
      thumbnail: 'https://is1-ssl.mzstatic.com/blinding.jpg',
    },
    {
      id: 'official-audio',
      title: 'Blinding Lights (Official Audio)',
      artist: 'The Weeknd - Topic',
      durationSec: 200,
      isOfficial: true,
      hasSquareArtwork: true,
      thumbnail: 'https://is1-ssl.mzstatic.com/blinding.jpg',
    },
    {
      id: 'slowed-1',
      title: 'Blinding Lights (Slowed + Reverb)',
      artist: 'Vibe Music',
      durationSec: 245,
      isOfficial: false,
      hasSquareArtwork: false,
    },
    {
      id: 'other-song',
      title: 'Starboy (Official Video)',
      artist: 'The Weeknd',
      durationSec: 230,
      isOfficial: true,
      hasSquareArtwork: true,
    },
  ];

  const deduped = deduplicateTracksBySong(raw, 'blinding lights');
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].id, 'official-video');
  assert.equal(deduped[1].id, 'other-song');

  // Distinct verified official artists sharing a song title should both remain when searching broadly
  const sameTitleDifferentArtists = [
    { id: 'halo-1', title: 'Halo', artist: 'Beyoncé', durationSec: 261, isOfficial: true, hasSquareArtwork: true },
    { id: 'halo-2', title: 'Halo', artist: 'Depeche Mode', durationSec: 270, isOfficial: true, hasSquareArtwork: true },
  ];
  assert.equal(deduplicateTracksBySong(sameTitleDifferentArtists, 'pop hits').length, 2);

  // Real-world YouTube search variants (live broadcasts, covers, dash-attached artist, dance mix, pipe-l)
  const ytVariants = [
    { id: 'ed-1', title: 'Shape of You', artist: 'Ed Sheeran', durationSec: 234, isOfficial: true, hasSquareArtwork: true },
    { id: 'ed-2', title: 'Shape Of You ( cover by J.Fla )', artist: 'JFlaMusic', durationSec: 195, isOfficial: true, hasSquareArtwork: false },
    { id: 'ed-3', title: 'shape of you -Ed sheeran', artist: "Chayan's Creation", durationSec: 234, isOfficial: false, hasSquareArtwork: false },
    { id: 'ed-4', title: 'Shape of You (The Biggest Weekend)', artist: 'BBC Radio 1', durationSec: 260, isOfficial: true, hasSquareArtwork: false },
  ];
  const dedupedShape = deduplicateTracksBySong(ytVariants, 'shape of you');
  assert.equal(dedupedShape.length, 1);
  assert.equal(dedupedShape[0].id, 'ed-1');

  const kesariyaVariants = [
    { id: 'k-1', title: 'Kesariya', artist: 'SonyMusicIndia', durationSec: 268, isOfficial: true, hasSquareArtwork: true },
    { id: 'k-2', title: 'Kesariya (Dance Mix)', artist: 'SonyMusicIndia', durationSec: 210, isOfficial: true, hasSquareArtwork: false },
    { id: 'k-3', title: 'Kesariya l Brahmāstra l Ranbir Kapoor, Alia, Pritam', artist: 'Pritam', durationSec: 268, isOfficial: true, hasSquareArtwork: false },
  ];
  const dedupedKesariya = deduplicateTracksBySong(kesariyaVariants, 'kesariya');
  assert.equal(dedupedKesariya.length, 1);
  assert.equal(dedupedKesariya[0].id, 'k-1');
});


