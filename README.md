# Virtual List (JetBrains assignment)

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
# or
yarn install
yarn dev
# or
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## File structure

The file structure of the project is partially dictated by the Next.js.

* `/mock` - the directory containing mock data with 100 000 mock messages and a very simple script to generate a different set if needed.
* `/src/clientApi` - the directory with client side data fetchers
* `/src/components` - the directory with all the react components of this project except for so-called `pages` which are used by Next.js to create page routes based on file structure
* `/src/pages` - the directory defining page routes
    * _app.js - root component for Next.js app. Required to set global styles
    * global.css - global Next.js styles
* `/src/pages/api` - the directory defining api routes
* `/src/utils` - the directory with general helpers
