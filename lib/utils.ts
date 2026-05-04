import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
