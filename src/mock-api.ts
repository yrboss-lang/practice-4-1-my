import { Book } from './task1-types';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchBooks(): Promise<Book[]> {
  await delay(800);

  if (Math.random() < 0.2) {
    throw new Error('Сбой сети. Не удалось загрузить книги.');
  }

  const raw = localStorage.getItem('catalog');
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return parsed.books || [];
}

export async function saveBooks(books: Book[]): Promise<void> {
  await delay(500);

  localStorage.setItem('catalog', JSON.stringify({
    id: 'main',
    books: books,
  }));
}