import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'
import Stripe from 'stripe'
import {
  BRAND_NAME,
  buildAvailabilityPayload,
  calculateFirstMonthCharge,
  normalizeDateList,
  normalizeIsoDate,
} from '../../booking.js'

const mongoUri = process.env.MONGODB_URI
const mongoDbName = process.env.MONGODB_DB_NAME || 'caravanas'

let mongoClientPromise
let reservationsIndexesReady = false
let availabilityIndexesReady = false

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

async function getReservationsCollection() {
  if (!mongoUri) {
    throw new Error('Falta configurar MONGODB_URI en Netlify.')
  }

  if (!mongoClientPromise) {
    const client = new MongoClient(mongoUri)
    mongoClientPromise = client.connect()
  }

  const client = await mongoClientPromise
  const database = client.db(mongoDbName)
  const collection = database.collection('reservations')

  if (!reservationsIndexesReady) {
    await collection.createIndex({ id: 1 }, { unique: true })
    await collection.createIndex({ createdAt: -1 })
    reservationsIndexesReady = true
  }

  return collection
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

  if (!availabilityIndexesReady) {
    await collection.createIndex({ updatedAt: -1 })
    availabilityIndexesReady = true
  }

  return collection
}

async function readAvailabilitySettings() {
  const collection = await getAvailabilityCollection()
  const settings = await collection.findOne({ _id: 'primary' })

  return {
    unavailableDates: normalizeDateList(settings?.unavailableDates),
    isFullyBooked: Boolean(settings?.isFullyBooked),
    updatedAt: settings?.updatedAt || null,
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Metodo no permitido.' })
  }

  let reservationId = ''

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonResponse(500, {
        error: 'Falta configurar STRIPE_SECRET_KEY en Netlify.',
      })
    }

    const payload = JSON.parse(event.body || '{}')
    const { firstName, lastName, email, phone, dni, plate, startDate } = payload
    const normalizedStartDate = normalizeIsoDate(startDate)

    if (!firstName || !lastName || !email || !phone || !dni || !plate || !normalizedStartDate) {
      return jsonResponse(400, {
        error: 'Nombre, apellido, email, telefono, DNI, matricula y fecha de entrada son obligatorios.',
      })
    }

    const availabilitySettings = await readAvailabilitySettings()

    if (availabilitySettings.isFullyBooked) {
      return jsonResponse(400, {
        error: 'Estamos completos en este momento.',
      })
    }

    const availability = buildAvailabilityPayload(availabilitySettings.unavailableDates)
    const selectedDate = availability.availableDates.find((date) => date.iso === normalizedStartDate)

    if (!selectedDate) {
      return jsonResponse(400, {
        error: 'La fecha seleccionada ya no esta disponible. Elige otra antes de pagar.',
      })
    }

    const firstMonthCharge = calculateFirstMonthCharge(normalizedStartDate)

    if (!firstMonthCharge) {
      return jsonResponse(400, {
        error: 'No se pudo calcular el primer pago prorrateado.',
      })
    }

    const reservations = await getReservationsCollection()
    reservationId = randomUUID()

    await reservations.insertOne({
      id: reservationId,
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      phone: String(phone),
      dni: String(dni),
      plate: String(plate),
      startDate: normalizedStartDate,
      firstMonthCharge,
      status: 'pending_checkout',
      createdAt: new Date().toISOString(),
    })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const appUrl =
      event.headers.origin ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      'http://localhost:8888'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      billing_address_collection: 'required',
      customer_email: String(email),
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: firstMonthCharge.amountCents,
            product_data: {
              name: `${BRAND_NAME} - alta inicial prorrateada`,
              description: `${firstMonthCharge.daysRemaining} dias hasta fin de mes a ${firstMonthCharge.dailyRateLabel} por dia.`,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: firstMonthCharge.monthlyRateCents,
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: `${BRAND_NAME} - plaza mensual`,
              description: `Renovacion mensual automatica el primer dia de cada mes desde ${firstMonthCharge.nextBillingDateLabel}.`,
            },
          },
        },
      ],
      subscription_data: {
        trial_end: firstMonthCharge.nextBillingAnchorUnix,
      },
      metadata: {
        business: BRAND_NAME,
        plan: 'alta-prorrateada-y-renovacion-mensual',
        reservationId,
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        phone: String(phone),
        dni: String(dni),
        plate: String(plate),
        startDate: normalizedStartDate,
        firstMonthDays: String(firstMonthCharge.daysRemaining),
        firstMonthAmountCents: String(firstMonthCharge.amountCents),
        nextBillingDate: firstMonthCharge.nextBillingDateIso,
      },
    })

    await reservations.updateOne(
      { id: reservationId },
      {
        $set: {
          status: 'checkout_created',
          stripeSessionId: session.id,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    return jsonResponse(200, { url: session.url, reservationId })
  } catch (error) {
    if (reservationId) {
      const reservations = await getReservationsCollection()
      await reservations.updateOne(
        { id: reservationId },
        {
          $set: {
            status: 'checkout_failed',
            errorMessage:
              error instanceof Error
                ? error.message
                : 'No se pudo crear la sesion de pago.',
            updatedAt: new Date().toISOString(),
          },
        },
      )
    }

    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo crear la sesion de pago.',
    })
  }
}
