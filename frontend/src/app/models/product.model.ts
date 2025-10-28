export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  countInStock: number;
  createdAt?: Date;
  updatedAt?: Date;
}