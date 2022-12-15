const { execute, subscribe } = require('graphql')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const http = require('http')
const mongoose = require('mongoose')
const User = require('./models/user')
const Book = require('./models/book')
require('dotenv').config();
const jwt = require('jsonwebtoken')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const DataLoader = require('dataloader')

const JWT_SECRET = process.env.JWT_SECRET

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

mongoose.set('debug', true);

const start = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })
  const serverCleanup = useServer({ schema }, wsServer)

  const batchBooks = async (keys) => {

    const books = await Book.find({id: { $in: keys }})

    // const books = await Book.findAll({
    //   where: {
    //     id: {
    //       $in: keys,
    //     },
    //   },
    // });
  
    return keys.map(key => books.find(book => book.id === key));
  };

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const contextObject = { 
        currentUser: undefined,
        loaders: {
          book: new DataLoader(keys => batchBooks(keys))
        }
      }

      const auth = req ? req.headers.authorization : null
      if (auth && auth.toLowerCase().startsWith('bearer ')) {
        const decodedToken = jwt.verify(
          auth.substring(7), JWT_SECRET
        )
        contextObject.currentUser = await User.findById(decodedToken.id)
      } else {
        contextObject.currentUser = undefined
      }
      return contextObject
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ]
  })
  
  await server.start()

  app.use(
    '/',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const contextObject = { 
          currentUser: undefined,
          loaders: {
            book: new DataLoader(keys => batchBooks(keys))
          }
        }

        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
          const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
          contextObject.currentUser = await User.findById(decodedToken.id)
        } else {
          contextObject.currentUser = undefined
        }
        return contextObject 
      },
    })
  )

  const PORT = 4000

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  )
}

// call the function that does the setup and starts the server
start()