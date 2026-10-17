// The Daily Telegraph: placeholder story data (all fictional) and helpers. A bot will fill this in later.

export type SectionId =
  'front' | 'local' | 'markets' | 'sports' | 'family' | 'weather';

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
  { id: 'markets', label: 'Markets' },
  { id: 'sports', label: 'Sports' },
  { id: 'family', label: 'Family' },
  { id: 'weather', label: 'Weather' },
];

export const STORIES: Story[] = [
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
    section: 'family',
    frontPage: true,
    headline: 'Historic Homework Treaty Signed at Dinner Table',
    dek: 'Terms include screen time after math, and dessert after everything.',
    byline: 'By Ima Kidd, Family Bureau',
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
    section: 'family',
    headline: 'Saturday Pancake Summit Ends in Record Stack',
    dek: 'Syrup reserves reported critically low.',
    byline: 'By Ima Kidd, Family Bureau',
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
];

// Stories for a section; Front Page returns the front-page picks (lead first).
export function getSectionStories(section: SectionId): Story[] {
  return section === 'front'
    ? STORIES.filter((s) => s.frontPage)
    : STORIES.filter((s) => s.section === section);
}

// Top 5 front-page headlines for the dashboard card.
export function getTopHeadlines(limit = 5): Story[] {
  return getSectionStories('front').slice(0, limit);
}

// Deep link to a story inside the Telegraph page.
export function storyHref(story: Story): string {
  return `/telegraph?section=${story.section}#${story.id}`;
}
