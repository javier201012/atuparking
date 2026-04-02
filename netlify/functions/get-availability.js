import { MongoClient } from 'mongodb'
import { buildAvailabilityPayload, normalizeDateList } from '../../booking.js'

const mongoUri = process.env.MONGODB_URI
const mongoDbName = process.env.MONGODB_DB_NAME || 'caravanas'

let mongoClientPromise
let indexesReady = false

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

async function getAvailabilityCollection() {
  if (!mongoUri) {
    throw new Error('Falta configurar MONGODB_URI en Netlify.')
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(mongoUri)
    mongoClientPromise = client.connect()
  }

  const client = await mongoClientPromise
  const database = client.db(mongoDbName)
  const collection = database.collection('availabilitySettings')

  if (!indexesReady) {
    await collection.createIndex({ updatedAt: -1 })
    indexesReady = true
  }

  return collection
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Metodo no permitido.' })
  }

  try {
    const collection = await getAvailabilityCollection()
    const settings = await collection.findOne({ _id: 'primary' })
    const unavailableDates = normalizeDateList(settings?.unavailableDates)
    const availability = buildAvailabilityPayload(unavailableDates)

    return jsonResponse(200, {
      ...availability,
      isFullyBooked: Boolean(settings?.isFullyBooked),
      updatedAt: settings?.updatedAt || null,
    })
  } catch (error) {
    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo leer la disponibilidad.',
    })
  }
}