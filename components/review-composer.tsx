'use client';

import { FormEvent, useState } from 'react';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Send, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const textAreaClass =
  'min-h-28 w-full rounded-[1.1rem] border border-charcoal/10 bg-white px-4 py-3 text-sm leading-6 text-charcoal outline-none placeholder:text-charcoal/35 focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/30';

export function ReviewComposer({
  productId,
  productName,
}: {
  productId?: string;
  productName?: string;
}) {
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null,
  );

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quote,
          rating,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? 'Review could not be submitted.');
      }

      setQuote('');
      setRating(5);
      setMessage({
        tone: 'success',
        text: 'Review submitted and published.',
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Review could not be submitted.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-charcoal/10 bg-white/82 p-5 shadow-luxury backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2">
        <Star className="size-5 fill-gold text-gold" />
        <h2 className="text-xl font-semibold text-charcoal">
          {productName ? `Review ${productName}` : 'Write a Review'}
        </h2>
      </div>

      <Show
        when="signed-in"
        fallback={
          <div className="grid gap-3 rounded-[1.1rem] border border-charcoal/10 bg-champagne/40 p-4 sm:grid-cols-2">
            <SignInButton mode="redirect">
              <Button className="h-11 rounded-full bg-charcoal text-ivory hover:bg-ink" type="button">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <Button
                className="h-11 rounded-full border-charcoal/10 bg-white text-charcoal hover:bg-champagne"
                type="button"
                variant="outline"
              >
                Sign up
              </Button>
            </SignUpButton>
          </div>
        }
      >
        <form className="grid gap-4" onSubmit={submitReview}>
          <div>
            <p className="text-sm font-semibold text-charcoal/70" id="review-rating-label">
              Rating
            </p>
            <div
              aria-labelledby="review-rating-label"
              className="mt-2 flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3 py-2 shadow-sm"
              role="radiogroup"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full text-charcoal/28 transition-all hover:bg-gold/10 hover:text-gold',
                    rating >= value && 'text-gold',
                    rating === value && 'bg-gold/15 ring-1 ring-gold/30',
                  )}
                  role="radio"
                  type="button"
                  onClick={() => setRating(value)}
                >
                  <Star className={cn('size-5', rating >= value && 'fill-current')} />
                </button>
              ))}
              <span className="ml-auto pr-2 text-sm font-semibold text-charcoal/55">
                {rating}/5
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal/70" htmlFor="review-quote">
              Review
            </label>
            <textarea
              id="review-quote"
              className={cn('mt-2', textAreaClass)}
              minLength={12}
              placeholder="Share fit, fabric, delivery, or overall experience."
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              required
            />
          </div>
          {message ? (
            <div
              className={cn(
                'rounded-[1rem] border px-4 py-3 text-sm font-semibold',
                message.tone === 'success' &&
                  'border-spruce/20 bg-spruce/10 text-spruce',
                message.tone === 'error' && 'border-oxblood/25 bg-oxblood/10 text-oxblood',
              )}
            >
              {message.text}
            </div>
          ) : null}
          <Button
            className="h-11 rounded-full bg-charcoal text-ivory shadow-lg shadow-charcoal/15 hover:bg-ink"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Submitting...' : 'Submit Review'}
            <Send className="size-4" />
          </Button>
        </form>
      </Show>
    </div>
  );
}
