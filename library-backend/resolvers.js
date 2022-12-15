const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { UserInputError, AuthenticationError } = require('@apollo/server')
const jwt = require('jsonwebtoken')
const User = require('./models/user')
const Book = require('./models/book')
const Author = require('./models/author')
const author = require('./models/author')

const JWT_SECRET = process.env.JWT_SECRET

const filterByAuthor = (books, author) => {
    return author ? books.filter(book => book.author.name === author) : books
}
  
const filterByGenre = (books, genre) => {
    return genre ? books.filter(book => 
        book.genres.find(bookGenre => bookGenre === genre))
        : books
}

const resolvers = {
    Query: {
      me: (root, args, context) => {
        return context.currentUser
      },
      bookCount: async () => Book.collection.countDocuments(),
      authorCount: async () => Book.collection.countDocuments(),
      allBooks: async (root, args) => {
        const books = await Book.find({}).populate('author')
        const filteredByGenre = filterByGenre(books, args.genre)
        const filteredByAuthor = filterByAuthor(filteredByGenre, args.author)
        return filteredByAuthor
      },
      allAuthors: async () => {
        const authors = await Author.find({})
        return authors 
      }
    },
    Author: {
      books: async (root) => {
        const books = await Book.find({}).populate('author')
        return books.filter(book => book.author.name === root.name)
      },
      bookCount: async (root, args, context) => {
        const author = root
        return author.books.length
      } 
    },
    Mutation: {
      createUser: async (root, args) => {
        const user = new User({ username: args.username, favouriteGenre: args.favouriteGenre })
        return user.save()
          .catch(error => {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          })
      },
      login: async (root, args) => {
        const user = await User.findOne({ username: args.username })
        if ( !user || args.password !== 'secret' ) {
          throw new UserInputError("wrong credentials")
        }
    
        const userForToken = {
          username: user.username,
          favouriteGenre: user.favouriteGenre,
          id: user._id,
        }
    
        return { value: jwt.sign(userForToken, JWT_SECRET) }
      },
      addBook: async (root, args, {currentUser}) => {
        if (!currentUser) {
          throw new AuthenticationError("not authenticated")
        }
        const existingAuthor = await Author.findOne({ name: args.author })
        let author = undefined
        if (!existingAuthor) {
          author = new Author({
            name: args.author
          })
        } else {
          author = existingAuthor
        }
        const book = new Book({ ...args, author: author })
        author.books.push(book)
        try {
          await author.save()
          await book.save()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          })
        }
        pubsub.publish('BOOK_ADDED', { bookAdded: book })
        return book
      },
      editAuthor: async (root, args, {currentUser}) => {
        if (!currentUser) {
          throw new AuthenticationError("not authenticated")
        }
  
        const author = await Author.findOne({ name: args.name })
        author.born = args.setBornTo
        try {
          await author.save()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
        return author
      }
    },
    Subscription: {
      bookAdded: {
        subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
      }
    }
  }

  module.exports = resolvers