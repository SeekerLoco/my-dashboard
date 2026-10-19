// Journal card: link to John's BuJo-GTD Journal (Google Doc). Space below is reserved for key bullets Piper may supply later.
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';

const JOURNAL_URL =
  'https://docs.google.com/document/d/1V-KsrpFo3CYb13AnsEtERVO7SssOq0_CXrG7exMAzR8/edit?usp=sharing';

export default function JournalCard() {
  return (
    <Card accent="blue">
      <CardTitle icon="📓" accent="blue">
        <a
          href={JOURNAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
        >
          Journal
        </a>
      </CardTitle>
      <a
        href={JOURNAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-sky-300 hover:underline"
      >
        Open BuJo-GTD Journal ↗
      </a>
      {/* Reserved: key bullets from Piper will go here */}
      <div className="min-h-16" />
    </Card>
  );
}
