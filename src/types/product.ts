export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  size?: string;
  color?: string;
  image?: string;
  sku: string;
  images?: string[];
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
