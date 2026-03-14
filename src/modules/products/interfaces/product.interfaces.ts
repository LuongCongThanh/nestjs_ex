export interface ProductImage {
  url: string;
  isMain?: boolean;
  alt?: string;
}

export interface ProductDimension {
  width: number;
  height: number;
  length: number;
  unit: 'cm' | 'mm' | 'in';
}

export interface ProductSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}
