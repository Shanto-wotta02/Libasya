import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  originalPrice?: number;
  currentPrice?: number;
  discount?: number;
  imageUrl: string;
  category: string;
  stock: number;
  featured: boolean;
  offerCode: string | null;
  offerEndsAt: string | null;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type PersistedCartState = {
  items: CartItem[];
};

type CartStore = PersistedCartState & {
  hasHydrated: boolean;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

function normalizeQuantity(quantity: number) {
  return Math.max(1, Math.min(99, Math.round(quantity)));
}

function isLegacyCartItems(value: unknown): value is CartItem[] {
  return Array.isArray(value);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.product.id === product.id);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, product, quantity: normalizeQuantity(item.quantity + 1) }
                  : item,
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity: 1 }],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      updateItemQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.product.id !== productId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.product.id === productId
                ? { ...item, quantity: normalizeQuantity(quantity) }
                : item,
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'libasya_cart',
      storage: createJSONStorage<PersistedCartState>(() => localStorage, {
        reviver: (key, value) => {
          if (key === '' && isLegacyCartItems(value)) {
            return {
              state: {
                items: value,
              },
              version: 0,
            };
          }

          return value;
        },
      }),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
