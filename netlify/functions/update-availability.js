import { MongoClient } from 'mongodb'
import { buildAvailabilityPayload, normalizeDateList } from '../../booking.js'

const mongoUri = process.env.MONGODB_URI
const mongoDbName = process.env.MONGODB_DB_NAME || 'caravanas'
const adminPanelPassword = process.env.ADMIN_PANEL_PASSWORD || ''

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
  if (event.httpMethod !== 'PUT') {
    return jsonResponse(405, { error: 'Metodo no permitido.' })
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const isFullyBooked = Boolean(payload?.isFullyBooked)

    if (!adminPanelPassword) {
      return jsonResponse(500, {
        error: 'Falta configurar ADMIN_PANEL_PASSWORD en Netlify.',
      })
    }

    if (String(payload?.password || '') !== adminPanelPassword) {
      return jsonResponse(401, {
        error: 'Contrasena de administracion incorrecta.',
      })
    }

    const unavailableDates = normalizeDateList(payload?.unavailableDates)
    const collection = await getAvailabilityCollection()
    const updatedAt = new Date().toISOString()

    await collection.updateOne(
      { _id: 'primary' },
      {
        $set: {
          unavailableDates,
          isFullyBooked,
          updatedAt,
        },
      },
      { upsert: true },
    )

    const availability = buildAvailabilityPayload(unavailableDates)

    return jsonResponse(200, {
      ...availability,
      isFullyBooked,
      updatedAt,
    })
  } catch (error) {
    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la disponibilidad.',
    })
  }
}