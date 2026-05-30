# Libasya Storefront

Premium Punjabi e-commerce storefront built with Next.js, Tailwind CSS, Prisma, and Neon/PostgreSQL.

## Run locally

```bash
npm install
cp .env.example .env
# edit DATABASE_URL in .env
npm run generate
npm run db:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Main pages

- `/` — polished storefront homepage
- `/shop` — all products
- `/best-sellers` — featured products
- `/offers` — active discounts
- `/login` and `/signup` — customer auth
- `/admin` — product, user, and storefront settings dashboard

## Notes

The UI has been redesigned with a premium visual system: glass cards, smoother spacing, responsive hero, product cards, offer sections, auth screens, and shared listing pages. The Prisma schema is included in `prisma/schema.prisma`.
