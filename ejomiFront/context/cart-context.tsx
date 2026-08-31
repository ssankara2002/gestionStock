"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "@/types/product"

export interface CartItem {
  product: Product
  quantity: number
  discount?: number // Percentage discount for this line item
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  applyDiscount: (productId: string, discount: number) => void
  applyCartDiscount: (discount: number) => void
  cartDiscount: number
  totalItems: number
  subtotal: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartDiscount, setCartDiscount] = useState(0)

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    const savedDiscount = localStorage.getItem("cartDiscount")

    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }

    if (savedDiscount) {
      setCartDiscount(Number(savedDiscount))
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
    localStorage.setItem("cartDiscount", String(cartDiscount))
  }, [items, cartDiscount])

  const addItem = (product: Product, quantity: number) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        return [...prevItems, { product, quantity }]
      }
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setItems([])
    setCartDiscount(0)
  }

  const applyDiscount = (productId: string, discount: number) => {
    setItems((prevItems) => prevItems.map((item) => (item.product.id === productId ? { ...item, discount } : item)))
  }

  const applyCartDiscount = (discount: number) => {
    setCartDiscount(discount)
  }

  // Calculate total items in cart
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  // Calculate subtotal (before any discounts)
  const subtotal = items.reduce((total, item) => total + item.product.prixVente * item.quantity, 0)

  // Calculate total (after all discounts)
  const total =
    items.reduce((total, item) => {
      const itemTotal = item.product.prixVente * item.quantity
      const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0
      return total + (itemTotal - itemDiscount)
    }, 0) *
    (1 - cartDiscount / 100)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyDiscount,
        applyCartDiscount,
        cartDiscount,
        totalItems,
        subtotal,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
