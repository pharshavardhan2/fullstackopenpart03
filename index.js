require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()
app.use(express.static('dist'))
app.use(express.json())
morgan.token('req-body', (req, res) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'))

app.get('/api/persons', (req, res, next) => {
  Person.find({})
    .then(people => {
      res.json(people)
    })
    .catch(error => next(error))
})

app.get('/info', (req, res) => {
  Person.countDocuments({})
    .then(count => res.send(`<p>Phonebook has info for ${count} people</p><p>${new Date().toString()}</p>`))
    .catch(error => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) res.json(person)
      else res.status(404).end()
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(result => res.status(204).end())
    .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const { name, number } = req.body

  const person = new Person({ name, number })

  person.save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const { name, number } = req.body

  Person.findByIdAndUpdate(
    req.params.id, 
    { name, number }, 
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => res.json(updatedPerson))
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).json({error: 'unknown endpoint'})
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') return res.status(400).json({error: 'bad formatted id'})
  if (error.name === 'ValidationError') return res.status(400).json({error: error.message})

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})