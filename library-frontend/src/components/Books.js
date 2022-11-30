import { useQuery } from '@apollo/client'
import { useState } from 'react'
import BookTable from './BookTable'
import { ALL_BOOKS, BOOKS_FILTERED } from './queries'

const Books = (props) => {
  const [currentGenre, setCurrentGenre] = useState(undefined)
  const resultBooks = useQuery(ALL_BOOKS)
  const resultBooksFiltered = useQuery(BOOKS_FILTERED, {
    variables: { genre: currentGenre },
    skip: !currentGenre,
    fetchPolicy: 'no-cache'
  })

  if (resultBooks.loading || resultBooksFiltered.loading) {
    return <div>loading...</div>
  }

  const books = resultBooks.data.allBooks
  const booksFiltered = resultBooksFiltered.data ? resultBooksFiltered.data.allBooks : books
  const genresWithDuplicates = books.map(book => book.genres).flat(1)
  const genres = [...new Set(genresWithDuplicates)];

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>books</h2>
      <div>in genre <b>{currentGenre}</b></div>
      <BookTable books={booksFiltered} />
      {genres.map(genre => (
        <button key={genre} onClick={() => setCurrentGenre(genre)} >{genre}</button>
      ))}
      <button onClick={() => setCurrentGenre(undefined)} >all genres</button>
    </div>
  )
}

export default Books
