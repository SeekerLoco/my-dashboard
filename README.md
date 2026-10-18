This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## The Daily Telegraph: publishing an issue

Thaddeus Pendelton writes one JSON per day to `/home/box/shared/telegraph/YYYY-MM-DD.json`. Issues live in the repo at `data/telegraph/YYYY-MM-DD.json`. `data/telegraph/index.ts` is generated, so don't edit it by hand. The site shows the last 7 days.

Nightly steps, run from the repo root:

```bash
git pull
node scripts/telegraph-publish.mjs            # today (America/Denver); or pass YYYY-MM-DD, or --src <file>
npx tsc --noEmit -p .
npx eslint lib/telegraph.ts app/telegraph data/telegraph scripts
npm run build                                 # needs NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY set (placeholders are fine)
git add data/telegraph
git commit -m "GB: Publish Daily Telegraph YYYY-MM-DD"
git push origin main
```

The script validates the file and stops with a clear error if it's invalid. Missing sections are marked unavailable. It also deletes issue files older than 7 days and rebuilds the index. `node scripts/telegraph-publish.mjs --index-only` only prunes and re-indexes.
