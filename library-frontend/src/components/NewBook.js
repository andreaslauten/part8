import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { ALL_BOOKS, ALL_AUTHORS, CREATE_BOOK } from './queries'


const NewBook = (props) => {
  const [title, setTitle] = useState('Subscriptions on client')
  const [author, setAuthor] = useState('Me  ')
  const [published, setPublished] = useState('2022')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const resultBooks = useQuery(ALL_BOOKS)

  const [ createBook ] = useMutation(CREATE_BOOK, {
    refetchQueries: [ { query: ALL_BOOKS }, { query: ALL_AUTHORS } ]
  })

  if (!props.show) {
    return null
  }

  if (resultBooks.loading) {
    return <div>loading...</div>
  }

  const books = resultBooks.data.allBooks

  const submit = async (event) => {
    event.preventDefault()

    if (title && published && author) {
      if (books.find(book => book.title === title)) {
        window.alert("Book already exists!")
      } else {
        const publishedInt = parseInt(published) 
        createBook({  variables: { title, author, published: publishedInt, genres } })
    
        setTitle('')
        setPublished('')
        setAuthor('')
        setGenres([])
        setGenre('')
      }
    } else {
      window.alert("Please fill out all relevant fields!")
    }

  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

export default NewBook
