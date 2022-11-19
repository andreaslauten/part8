import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import { ALL_AUTHORS, EDIT_AUTHOR } from './queries'
import Select from 'react-select';

const Authors = (props) => {
  const [born, setBorn] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ { query: ALL_AUTHORS } ]
  })

  const result = useQuery(ALL_AUTHORS)

  if (result.loading) {
    return <div>loading...</div>
  }

  const authors = result.data.allAuthors

  const options = authors.map(author => ({
    value: author.name,
    label: author.name
  }))

  const submit = async (event) => {
    event.preventDefault()

    const bornInt = parseInt(born)
    editAuthor({  variables: { name: selectedOption.value, setBornTo: bornInt } })

    setSelectedOption(null)
    setBorn('')
  }

  if (!props.show) {
    return null
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <Select
          defaultValue={selectedOption}
          onChange={setSelectedOption}
          options={options}
        />
        <div>
          born
          <input 
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  )
}

export default Authors
