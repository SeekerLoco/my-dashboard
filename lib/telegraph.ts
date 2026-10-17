// The Daily Telegraph: issue data (all placeholder/fictional) and helpers.
//
// How issues are stored (for a future feeder bot):
// - ISSUES below holds one Issue per local date: { date: 'YYYY-MM-DD', stories: Story[] }.
// - To publish a new day, append an Issue with that date; story ids only need to be unique within the issue.
// - Only the last 7 days (today plus 6 prior, local time) are shown; older issues are ignored.
//   Pruning: a feeder can simply drop entries older than 7 days from ISSUES (nothing else references them).

import { getLocalDateString } from '@/lib/dates';

export type SectionId =
  | 'front'
  | 'local'
  | 'us-world'
  | 'markets'
  | 'sports'
  | 'irreverent'
  | 'weather';

export type Story = {
  id: string;
  section: SectionId;
  headline: string;
  dek: string;
  byline: string;
  date: string; // YYYY-MM-DD
  body: string[];
  frontPage?: boolean; // shown on the Front Page (first one is the lead)
};

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'front', label: 'Front Page' },
  { id: 'local', label: 'Local' },
  { id: 'us-world', label: 'US and World' },
  { id: 'markets', label: 'Markets' },
  { id: 'sports', label: 'Sports' },
  { id: 'irreverent', label: 'Irreverent' },
  { id: 'weather', label: 'Weather' },
];

const ISSUE_2026_10_17: Story[] = [
  {
    id: 'referee-whistle',
    section: 'sports',
    frontPage: true,
    headline: 'Local Referee Blows Whistle So Loud, Geese Reschedule Migration',
    dek: 'Witnesses describe the Saturday-morning blast as "decisive" and "honestly a little much."',
    byline: 'By Penny Offside, Sports Desk',
    date: '2026-10-17',
    body: [
      'A routine offside call at the U12 fields turned historic Saturday when the center referee produced a whistle blast heard three neighborhoods away.',
      'A flock of Canada geese overhead reportedly circled twice before filing an amended flight plan. "We respect the call," one goose did not say.',
      'Parents on the sideline agreed the call was correct, a first in recorded league history.',
    ],
  },
  {
    id: 'moon-shots',
    section: 'markets',
    frontPage: true,
    headline: 'Moon Shots Portfolio Spotted Pointing Vaguely Upward',
    dek: 'Analysts at the kitchen table urge patience, snacks.',
    byline: 'By Bull N. Bear, Markets Editor',
    date: '2026-10-17',
    body: [
      'The household’s most-watched chart drew a crowd of one this morning as its line wiggled with real conviction.',
      '"This is a long-term thing," said a source holding a coffee mug, before checking the chart again four minutes later.',
    ],
  },
  {
    id: 'homework-treaty',
    section: 'local',
    frontPage: true,
    headline: 'Historic Homework Treaty Signed at Dinner Table',
    dek: 'Terms include screen time after math, and dessert after everything.',
    byline: 'By Ima Kidd, Local News',
    date: '2026-10-16',
    body: [
      'After weeks of negotiations, both parties agreed to a framework that observers call "fragile but promising."',
      'A dispute over whether spelling counts as homework was tabled until Tuesday.',
    ],
  },
  {
    id: 'pothole-fame',
    section: 'local',
    frontPage: true,
    headline: 'Neighborhood Pothole Gets Its Own Fan Club',
    dek: 'Members meet weekly to admire its depth and resilience.',
    byline: 'By Rhoda Waye, Local News',
    date: '2026-10-16',
    body: [
      'What began as a minor nuisance has become a beloved landmark, complete with a hand-painted sign.',
      'City crews say it is on the list. The fan club says it is not going anywhere.',
    ],
  },
  {
    id: 'sunny-forecast',
    section: 'weather',
    frontPage: true,
    headline: 'Forecast Calls for Sun, Mountains, and Mild Jacket Indecision',
    dek: 'Mornings chilly, afternoons warm, layers recommended.',
    byline: 'By Stormy Skye, Weather Center',
    date: '2026-10-17',
    body: [
      'Expect classic fall conditions: a frosty start, a T-shirt lunch, and a scramble for a hoodie by sunset.',
      'There is a 0% chance anyone remembers where they left their gloves.',
    ],
  },
  {
    id: 'yellow-card-dog',
    section: 'sports',
    headline: 'Dog Shown Yellow Card for Excessive Celebration',
    dek: 'The golden retriever accepted the caution with grace and a tail wag.',
    byline: 'By Penny Offside, Sports Desk',
    date: '2026-10-15',
    body: [
      'The pup ran onto the pitch after a goal and refused to leave until it got belly rubs.',
    ],
  },
  {
    id: 'lemonade-ipo',
    section: 'markets',
    headline: 'Lemonade Stand Announces Surprise IPO',
    dek: 'Shares priced at 25 cents, plus a free cookie.',
    byline: 'By Bull N. Bear, Markets Editor',
    date: '2026-10-14',
    body: ['The young founders cite strong demand and a very sunny quarter.'],
  },
  {
    id: 'library-record',
    section: 'local',
    headline: 'Library Book Returned 40 Years Late, Fine Waived for Good Story',
    dek: 'The book was, fittingly, about time travel.',
    byline: 'By Rhoda Waye, Local News',
    date: '2026-10-13',
    body: [
      'Librarians said the tale of its journey was worth more than the fine.',
    ],
  },
  {
    id: 'pancake-summit',
    section: 'irreverent',
    headline: 'Saturday Pancake Summit Ends in Record Stack',
    dek: 'Syrup reserves reported critically low.',
    byline: 'By Ima Kidd, Irreverent Desk',
    date: '2026-10-17',
    body: [
      'Officials confirmed a stack of eleven before the plate surrendered.',
    ],
  },
  {
    id: 'wind-weekend',
    section: 'weather',
    headline: 'Breezy Weekend Expected to Rearrange Everyone’s Leaves',
    dek: 'Your leaves, your neighbor’s yard.',
    byline: 'By Stormy Skye, Weather Center',
    date: '2026-10-16',
    body: ['Gusts will redistribute leaves fairly, according to no one.'],
  },
  {
    id: 'sock-union',
    section: 'irreverent',
    headline: 'Missing Socks Form Union, Demand Better Dryer Conditions',
    dek: 'Spokes-sock says the lint trap "has seen things."',
    byline: 'By Lefty Unmatched, Irreverent Desk',
    date: '2026-10-17',
    body: [
      'A coalition of single socks emerged from behind the dryer Saturday with a list of demands, including gentler spin cycles and reunification with their partners.',
      'Management (Dad) has agreed to talks but refuses to discuss the sock that went missing in 2019.',
    ],
  },
  {
    id: 'remote-witness',
    section: 'irreverent',
    headline: 'TV Remote Enters Witness Protection After Couch Incident',
    dek: 'Last seen between the cushions, now living under a new name.',
    byline: 'By Cush N. Crevice, Irreverent Desk',
    date: '2026-10-16',
    body: [
      'Authorities believe the remote fled after one too many arguments over what to watch.',
      'It is now reportedly going by "The Clicker" and enjoying a quiet life inside a laundry basket.',
    ],
  },
  {
    id: 'cat-ceo',
    section: 'irreverent',
    headline: 'Household Cat Named CEO, Immediately Schedules Nap',
    dek: 'First executive order: all sunbeams belong to the cat.',
    byline: 'By Whisker Wells, Irreverent Desk',
    date: '2026-10-15',
    body: [
      'In a unanimous vote of one, the cat assumed leadership of the household Friday.',
      'Shareholders were told to expect "significant restructuring of the couch."',
    ],
  },
  {
    id: 'moon-daylight',
    section: 'us-world',
    headline: 'Moon Requests Daytime Shift, Citing "Feeling Overlooked"',
    dek: 'Sun says it is "open to a job share."',
    byline: 'By Luna Tick, US and World Desk',
    date: '2026-10-17',
    body: [
      'In a rare public statement, the Moon said it was tired of working nights while the Sun gets all the beach days.',
      'Astronomers say negotiations could take several billion years, which is about average for a committee.',
    ],
  },
  {
    id: 'speed-limit-snails',
    section: 'us-world',
    headline: 'Nation’s Snails Petition for Lower Speed Limits on Sidewalks',
    dek: 'Proposed limit: "whatever feels comfortable, honestly."',
    byline: 'By Shelly Slowe, US and World Desk',
    date: '2026-10-16',
    body: [
      'A petition signed by thousands of snails arrived this week, delivered by a snail, and is expected to be read by spring.',
      'Skateboarders have called the proposal "a lot."',
    ],
  },
  {
    id: 'world-hug-day',
    section: 'us-world',
    headline: 'Every Country Agrees on Best Pizza Topping; Summit Ends Early',
    dek: 'Delegates spent the extra time at a bowling alley.',
    byline: 'By Marge Herita, US and World Desk',
    date: '2026-10-15',
    body: [
      'In a surprise outcome, all delegations voted for "extra cheese" within the first five minutes.',
      'The pineapple question was politely tabled for future generations.',
    ],
  },
];

export type Issue = { date: string; stories: Story[] };

export const ISSUES: Issue[] = [
  { date: '2026-10-17', stories: ISSUE_2026_10_17 },
];

export const WINDOW_DAYS = 7;

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(n: number): string {
  let out = '';
  for (const [v, r] of ROMAN)
    while (n >= v) {
      out += r;
      n -= v;
    }
  return out;
}

// Whole days between two YYYY-MM-DD dates (calendar math via UTC components, so no DST/zone drift).
function dayDiff(from: string, to: string): number {
  const ms = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((ms(to) - ms(from)) / 86400000);
}

const FIRST_ISSUE = '2026-10-17';

// Volume = year - 2025. No. 1 on 2026-10-17, +1 per day, resets to No. 1 every Jan 1 (so day of year from 2027).
export function issueNumbering(date: string): {
  volume: number;
  number: number;
  label: string;
} {
  const year = Number(date.slice(0, 4));
  const volume = year - 2025;
  const start = year === 2026 ? FIRST_ISSUE : `${year}-01-01`;
  const number = dayDiff(start, date) + 1;
  return { volume, number, label: `Vol. ${toRoman(volume)} · No. ${number}` };
}

// Issues within the rolling window (today + 6 prior), newest first.
export function getRecentIssues(today = getLocalDateString()): Issue[] {
  return ISSUES.filter((i) => {
    const age = dayDiff(i.date, today);
    return age >= 0 && age < WINDOW_DAYS;
  }).sort((a, b) => b.date.localeCompare(a.date));
}

// The requested issue if it's in the window, otherwise the latest one (or undefined if none).
export function resolveIssue(
  date: string | null,
  today = getLocalDateString(),
): Issue | undefined {
  const recent = getRecentIssues(today);
  return recent.find((i) => i.date === date) ?? recent[0];
}

// Stories for a section; Front Page returns the front-page picks (lead first).
export function getSectionStories(
  issue: Issue | undefined,
  section: SectionId,
): Story[] {
  const stories = issue?.stories ?? [];
  return section === 'front'
    ? stories.filter((s) => s.frontPage)
    : stories.filter((s) => s.section === section);
}

// Latest issue and its top front-page headlines for the dashboard card.
export function getTopHeadlines(limit = 5): {
  issue?: Issue;
  stories: Story[];
} {
  const issue = resolveIssue(null);
  return { issue, stories: getSectionStories(issue, 'front').slice(0, limit) };
}

// Deep link to a story inside a given issue.
export function storyHref(issue: Issue, story: Story): string {
  return `/telegraph?issue=${issue.date}&section=${story.section}#${story.id}`;
}
