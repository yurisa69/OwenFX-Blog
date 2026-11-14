// Software data types for OwenFX

export interface Software {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  downloadUrl: string;
  updatedAt: string;
  imageUrl?: string;
  version?: string;
  size?: string;
  platform?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}
