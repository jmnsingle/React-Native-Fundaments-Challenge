import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@goMarketplace:products',
      );

      if (loadedProducts) {
        setProducts(JSON.parse(loadedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async productId => {
      const oldProduct = [...products];

      const productIndex = oldProduct.findIndex(old => old.id === productId);

      oldProduct[productIndex].quantity += 1;

      setProducts(oldProduct);

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(oldProduct),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async newProduct => {
      const oldProduct = [...products];

      const hasProduct = oldProduct.findIndex(old => old.id === newProduct.id);

      if (hasProduct < 0) {
        const currentProduct = { ...newProduct, quantity: 1 };

        oldProduct.push(currentProduct);
        setProducts(oldProduct);
        await AsyncStorage.setItem(
          '@goMarketplace:products',
          JSON.stringify(products),
        );
      } else {
        increment(newProduct.id);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async productId => {
      const oldProduct = [...products];

      const productIndex = oldProduct.findIndex(old => old.id === productId);

      if (oldProduct[productIndex].quantity === 1) {
        oldProduct.splice(productIndex, 1);
      } else {
        oldProduct[productIndex].quantity -= 1;
      }

      setProducts(oldProduct);

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(oldProduct),
      );
    },

    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
