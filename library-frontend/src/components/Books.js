import { useQuery } from '@apollo/client'
import { useState } from 'react'
import { ALL_BOOKS } from './queries'

const Books = (props) => {
  const result = useQuery(ALL_BOOKS)
  const [currentGenre, setCurrentGenre] = useState('Crimi')

  if (result.loading) {
    return <div>loading...</div>
  }

  const books = result.data.allBooks
  const genresWithDuplicates = books.map(book => book.genres).flat(1)
  const genres = [...new Set(genresWithDuplicates)];

  const booksFiltered = () => {
    if (currentGenre) {
      return books.filter(book => book.genres.find(genre => genre === currentGenre))
    }
    return books
  }

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>books</h2>
      <div>in genre <b>{currentGenre}</b></div>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksFiltered().map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres.map(genre => (
        <button key={genre} onClick={() => setCurrentGenre(genre)} >{genre}</button>
      ))}
      <button onClick={() => setCurrentGenre(undefined)} >all genres</button>
    </div>
  )
}

export default Books
