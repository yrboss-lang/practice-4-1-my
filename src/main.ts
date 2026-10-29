import './styles.css';
import { Book } from './task1-types';
import { applyFilters, filterByAuthor, filterByMinYear } from './task3-filters';
import { createBookFromForm } from './task4-integration';
import { filterByTitle, sortBooks } from './task5-utils';
import { BookCatalog } from './task6-classes';
import { Wishlist } from './task7-wishlist';
import { fetchBooks, saveBooks } from './mock-api';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success', data: T }
  | { status: 'error', message: string };

let state: AsyncState<Book[]> = { status: 'loading' };

let errorMessage = '';

let catalog: BookCatalog;
let wishlist: Wishlist;

const bookList = document.querySelector('#bookList') as HTMLDivElement;
const form = document.querySelector('#bookForm') as HTMLFormElement;
const filterBtn = document.querySelector('#applyFilters') as HTMLButtonElement;
const authorInput = document.querySelector('#filterAuthor') as HTMLInputElement;
const yearInput = document.querySelector('#filterYear') as HTMLInputElement;
const errorMessageEl = document.querySelector('#errorMessage') as HTMLDivElement;
const searchInput = document.querySelector('#searchInput') as HTMLInputElement;
const sortBySelect = document.querySelector('#sortBy') as HTMLSelectElement;
const wishlistContainer = document.querySelector('#wishlistContainer') as HTMLDivElement;

function createBookCard(book: Book): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'book-card';

  const titleEl = document.createElement('h3');
  titleEl.textContent = `${book.title} — ${book.authors.join(', ')}${book.year ? `, ${book.year}` : ''}`;
  card.append(titleEl);

  if (book.rating !== undefined) {
    const ratingEl = document.createElement('p');
    ratingEl.textContent = `Рейтинг: ${book.rating}`;
    card.append(ratingEl);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Удалить';
  deleteBtn.addEventListener('click', async () => {
    if (state.status !== 'success') return;

    const newBooks = state.data.filter(b => b.id !== book.id);
    
    try {
      await saveBooks(newBooks);
      catalog.removeBook(book.id);
      state = { status: 'success', data: newBooks };
      render();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Ошибка удаления';
      render();
    }
  });
  card.append(deleteBtn);

  const favBtn = document.createElement('button');
  favBtn.textContent = wishlist.has(book.id) ? '❤️ В избранном' : '🤍 В избранное';
  favBtn.addEventListener('click', () => {
    wishlist.toggle(book.id);
    localStorage.setItem('wishlist', JSON.stringify(wishlist.getIds()));
    render();
  });
  card.append(favBtn);

  return card;
}

function renderBooks(books: Book[]) {
  bookList.innerHTML = '';
  if (books.length === 0) {
    bookList.textContent = 'Книги не найдены.';
    return;
  }
  books.forEach(book => {
    bookList.append(createBookCard(book));
  });
}

function renderWishlist() {
  if (!wishlist || !catalog) return;
  wishlistContainer.innerHTML = '';
  const favBooks = wishlist.getFavorites(catalog);
  if (favBooks.length === 0) {
    wishlistContainer.textContent = 'Пока ничего не добавлено';
    return;
  }
  favBooks.forEach(book => {
    wishlistContainer.append(createBookCard(book));
  });
}

function render() {
  bookList.innerHTML = '';
  wishlistContainer.innerHTML = '';
  
  errorMessageEl.textContent = errorMessage;

  switch (state.status) {
    case 'idle':
      bookList.textContent = 'Ожидание...';
      break;

    case 'loading':
      bookList.textContent = 'Загрузка данных...';
      break;

    case 'success':
      if (!catalog) {
        catalog = new BookCatalog('main', state.data);
        const savedWishlist = localStorage.getItem('wishlist');
        wishlist = new Wishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      } else {
        catalog = new BookCatalog('main', state.data);
      }
      
      renderBooks(state.data);
      renderWishlist();
      break;

    case 'error':
      const errorContainer = document.createElement('div');
      errorContainer.style.color = 'red';
      errorContainer.textContent = `Ошибка: ${state.message}`;
      
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Повторить попытку';
      retryBtn.addEventListener('click', initApp);
      
      errorContainer.append(document.createElement('br'), retryBtn);
      bookList.append(errorContainer);
      break;
  }
}

async function initApp() {
  state = { status: 'loading' };
  render();

  try {
    const books = await fetchBooks();
    state = { status: 'success', data: books };
  } catch (error) {
    state = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
  render();
}

initApp();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessageEl.textContent = '';
  errorMessage = '';

  if (state.status !== 'success') return;

  try {
    const formData = new FormData(form);
    const newBook = createBookFromForm(formData);
    
    const newBooks = [...state.data, newBook];
    
    await saveBooks(newBooks);
    
    catalog.addBook(newBook);
    state = { status: 'success', data: newBooks };
    form.reset();
    render();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Ошибка при сохранении';
    render();
    setTimeout(() => {
      errorMessage = '';
      render();
    }, 3000);
  }
});

function refreshList() {
  if (state.status !== 'success') return;

  const filters: ((book: Book) => boolean)[] = [];
  if (authorInput.value.trim()) filters.push(filterByAuthor(authorInput.value.trim()));
  if (yearInput.value) filters.push(filterByMinYear(parseInt(yearInput.value, 10)));
  if (searchInput.value.trim()) filters.push(filterByTitle(searchInput.value.trim()));

  const filteredBooks = applyFilters(state.data, filters);
  renderBooks(sortBooks(filteredBooks, sortBySelect.value as 'year' | 'rating'));
}

filterBtn.addEventListener('click', refreshList);
searchInput.addEventListener('input', refreshList);
sortBySelect.addEventListener('change', refreshList);