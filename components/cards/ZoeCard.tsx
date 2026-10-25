// "Hi Zoe" card: a simple greeting that links to CO Spirit Signs.
import Card from '@/components/Card';
import CardTitle from '@/components/CardTitle';

export default function ZoeCard() {
  return (
    <Card accent="pink">
      <a
        href="https://COspiritsigns.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <CardTitle icon="👋" accent="pink">
          <span className="font-semibold hover:underline">Hi Zoe</span>
        </CardTitle>
        <p className="mt-3 text-sm text-pink-300 hover:underline">
          Visit COspiritsigns.com →
        </p>
      </a>
    </Card>
  );
}
