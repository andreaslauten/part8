import { useLazyQuery, useQuery } from '@apollo/client'
import { useEffect } from 'react'
import BookTable from './BookTable'
import { ALL_BOOKS, BOOKS_FILTERED } from './queries'
import { ME } from './queries'

const Recommend = (props) => {
  const resultMe = useQuery(ME)
  const resultBooks = useQuery(ALL_BOOKS)
  const [fetchBooksFiltered, resultBooksFiltered] = useLazyQuery(BOOKS_FILTERED)

  useEffect(() => {
    if (!resultMe.loading) {
      fetchBooksFiltered({
        variables: { genre: resultMe.data.me.favouriteGenre },
        skip: resultMe.loading,
        fetchPolicy: 'no-cache'
      })
    }
  }, [fetchBooksFiltered, resultMe.data, resultMe.loading])

  if (resultBooks.loading || resultBooksFiltered.loading) {
    return <div>loading...</div>
  }
  const me = resultMe.data.me
  const books = resultBooks.data.allBooks
  const booksFiltered = resultBooksFiltered.data ? resultBooksFiltered.data.allBooks : books

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>recommendations</h2>
      <div>books in your favourite genre <b>{me.favouriteGenre}</b></div>
      <BookTable books={booksFiltered} />
    </div>
  )
}

export default Recommend