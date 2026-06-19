import { useEffect, useState } from 'react';
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Search, Filter, BookmarkCheck, X, BookMarked, FileText, Highlighter, Eye, Clock, Star } from 'lucide-react';
import { storage, Book } from '../../lib/storage';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { EmptyState, Badge } from '../common/EmptyState';

const BOOK_CATEGORIES = [
  { id: 'all', label: 'All Books', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'budgeting', label: 'Budgeting', icon: <span className="text-lg">📊</span> },
  { id: 'saving', label: 'Saving', icon: <span className="text-lg">💰</span> },
  { id: 'investing', label: 'Investing', icon: <span className="text-lg">📈</span> },
  { id: 'mindset', label: 'Mindset', icon: <span className="text-lg">🧠</span> },
  { id: 'debt', label: 'Debt Management', icon: <span className="text-lg">💳</span> },
  { id: 'general', label: 'General Finance', icon: <span className="text-lg">📘</span> },
];

export function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      let data = await storage.getAllBooks();
      if (data.length === 0) {
        await storage.initializeDefaultBooks();
        data = await storage.getAllBooks();
      }
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentChapter(book.currentPage || 0);
    setIsReadingModalOpen(true);
  };

  const handleNextChapter = async () => {
    if (!selectedBook || currentChapter >= selectedBook.chapters.length - 1) return;
    const newChapter = currentChapter + 1;
    setCurrentChapter(newChapter);
    const updated = { ...selectedBook, currentPage: newChapter };
    await storage.updateBook(updated);
    setSelectedBook(updated);
    setBooks(books.map(b => b.id === updated.id ? updated : b));
  };

  const handlePrevChapter = () => {
    if (currentChapter <= 0) return;
    setCurrentChapter(currentChapter - 1);
  };

  const handleToggleBookmark = async () => {
    if (!selectedBook) return;
    const bookmarkedPages = [...selectedBook.bookmarkedPages];
    if (bookmarkedPages.includes(currentChapter)) {
      const index = bookmarkedPages.indexOf(currentChapter);
      bookmarkedPages.splice(index, 1);
    } else {
      bookmarkedPages.push(currentChapter);
    }
    const updated = { ...selectedBook, bookmarkedPages };
    await storage.updateBook(updated);
    setSelectedBook(updated);
    setBooks(books.map(b => b.id === updated.id ? updated : b));
  };

  const handleMarkAsRead = async (book: Book) => {
    const updated = { ...book, isRead: true };
    await storage.updateBook(updated);
    setBooks(books.map(b => b.id === updated.id ? updated : b));
  };

  const handleAddNote = async () => {
    if (!selectedBook || !userNote.trim()) return;
    const notes = [...selectedBook.notes];
    const existingNoteIndex = notes.findIndex(n => n.page === currentChapter);
    if (existingNoteIndex >= 0) {
      notes[existingNoteIndex].note = userNote;
    } else {
      notes.push({ page: currentChapter, note: userNote });
    }
    const updated = { ...selectedBook, notes };
    await storage.updateBook(updated);
    setSelectedBook(updated);
    setBooks(books.map(b => b.id === updated.id ? updated : b));
    setUserNote('');
  };

  const getReadingProgress = (book: Book): number => {
    if (book.chapters.length === 0) return 0;
    return Math.round(((book.currentPage || 0) + 1) / book.chapters.length * 100);
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      budgeting: '#10B981',
      saving: '#F59E0B',
      investing: '#3B82F6',
      mindset: '#8B5CF6',
      debt: '#EF4444',
      general: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Library</h1>
          <p className="text-gray-500 dark:text-gray-400">Master personal finance with our curated book collection</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <BookOpen className="w-4 h-4" />
          {books.length} books available
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Books</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{books.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{books.filter(b => b.isRead).length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {books.filter(b => b.currentPage > 0 && !b.isRead).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bookmarks</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {books.reduce((sum, b) => sum + b.bookmarkedPages.length, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {BOOK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="w-6 h-6" />}
            title="No books found"
            description={searchQuery ? "Try a different search term" : "No books in this category yet"}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => {
            const progress = getReadingProgress(book);
            const categoryColor = getCategoryColor(book.category);

            return (
              <Card
                key={book.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => openBook(book)}
              >
                {/* Book Cover */}
                <div
                  className="relative h-48 rounded-t-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: book.coverColor }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <div className="relative text-center p-4">
                    <BookMarked className="w-12 h-12 text-white/80 mx-auto mb-2" />
                    <h3 className="text-white font-bold text-sm line-clamp-2">{book.title}</h3>
                    <p className="text-white/70 text-xs mt-1">{book.author}</p>
                  </div>
                  {book.isRead && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <BookmarkCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {book.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {book.totalPages} pages
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {book.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {book.currentPage > 0 && !book.isRead && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="w-3 h-3" />
                      Chapter {book.currentPage + 1} of {book.chapters.length}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reading Modal */}
      <Modal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        title={selectedBook?.title || 'Reading'}
        size="lg"
      >
        {selectedBook && (
          <div className="space-y-4">
            {/* Chapter Navigation */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={handlePrevChapter}
                  disabled={currentChapter === 0}
                >
                  Prev
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Chapter {currentChapter + 1} of {selectedBook.chapters.length}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextChapter}
                  disabled={currentChapter >= selectedBook.chapters.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedBook.bookmarkedPages.includes(currentChapter)
                      ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {selectedBook.bookmarkedPages.includes(currentChapter) ? (
                    <BookmarkCheck className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>
                {!selectedBook.isRead && currentChapter === selectedBook.chapters.length - 1 && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkAsRead(selectedBook)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>

            {/* Chapter Content */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedBook.chapters[currentChapter]?.title}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedBook.chapters[currentChapter]?.content}
                </p>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Notes
              </h4>
              {selectedBook.notes.filter(n => n.page === currentChapter).map((note, index) => (
                <div
                  key={index}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-2"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">{note.note}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note for this chapter..."
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button variant="primary" size="sm" onClick={handleAddNote}>
                  Add
                </Button>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedBook.author}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsReadingModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
