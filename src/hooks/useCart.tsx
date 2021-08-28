import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockOfProduct = await api.get<Stock>(`/stock/${productId}`);
      const amountInStock = stockOfProduct.data.amount;

      const productExists = cart.find((product) => product.id === productId);

      if (productExists && productExists.amount < amountInStock) {
        const updateProduct = cart.map(
          (product) => product.id === productId
            ? ({
              ...product,
              amount: product.amount + 1,
            })
            : product
        );

        setCart(updateProduct);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updateProduct)
        );
      } else if (productExists && productExists.amount >= amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const response = await api.get<Product>(`/products/${productId}`);

        const newProduct = {
          ...response.data,
          amount: 1,
        };

        setCart((prevState) => [...prevState, newProduct]);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, newProduct])
        );
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId);

      if (productExists) {
        const removeProduct = cart.filter((product) => product.id !== productId);

        setCart(removeProduct);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(removeProduct)
        );
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const stockOfProduct = await api.get<Stock>(`/stock/${productId}`);
      const amountInStock = stockOfProduct.data.amount;

      const productExists = cart.find((product) => product.id === productId);

      if (productExists && amount <= amountInStock) {
        const updateProduct = cart.map(
          (product) => product.id === productId
            ? ({
              ...product,
              amount: product.amount + 1,
            })
            : product
        );

        setCart(updateProduct);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updateProduct)
        );
      } else if (productExists && amount > amountInStock) {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
