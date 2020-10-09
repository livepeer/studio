import Router from 'express/lib/router'
import { db } from '../store'
const app = Router()
const stripe = require('stripe')(process.env.LP_STRIPE_SECRET_KEY)
const endpointSecret = process.env.LP_STRIPE_WEBHOOK_SECRET
import { products } from '../config'

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
  if (event.type === 'invoice.created') {
    let invoice = event.data.object

    if (invoice.status === 'draft') {
      const { data: userIds } = await req.store.query({
        kind: 'user',
        query: { stripeCustomerId: invoice.customer },
      })
      const user = await req.store.get(`user/${userIds[0]}`, false)
      const usageRes = await db.stream.usage(
        user.id,
        invoice.period_start,
        invoice.period_end,
        {
          useReplica: false,
        },
      )
      // Invoice items based on usage
      await Promise.all(
        products[user.stripeProductId].usage.map(async (product) => {
          if (product.name === 'Transcoding') {
            let quantity = Math.round(
              (usageRes.sourceSegmentsDuration / 60).toFixed(2),
            )
            await stripe.invoiceItems.create({
              customer: user.stripeCustomerId,
              invoice: invoice.id,
              currency: 'usd',
              subscription: user.stripeCustomerSubscriptionId,
              unit_amount_decimal: product.price * 100,
              quantity,
              description: product.description,
            })
          }
        }),
      )
    }
  }

  // Return a response to acknowledge receipt of the event
  res.sendStatus(200)
})

async function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

// Migrate existing users to stripe
app.post('/migrate-users', async (req, res) => {
  if (process.env.LP_STRIPE_SECRET_KEY != req.body.stripeSecretKey) {
    res.status(403)
    res.json({ errors: ['unauthorized'] })
  }

  const { data: userIds } = await req.store.query({
    kind: 'user',
    query: {},
  })

  for (let index = 0; index < userIds.length; index++) {
    const id = userIds[index]
    let user = await req.store.get(`user/${id}`, false)

    const { data } = await stripe.customers.list({
      email: user.email,
    })

    if (!data.length) {
      // create the stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
      })

      // fetch prices associated with free plan
      const items = await stripe.prices.list({
        lookup_keys: products['prod_0'].lookupKeys,
      })

      // Subscribe the user to the free plan
      const subscription = await stripe.subscriptions.create({
        cancel_at_period_end: false,
        customer: customer.id,
        items: items.data.map((item) => ({ price: item.id })),
      })
      await sleep(500)

      // Update user's customer, product, subscription, and payment id in our db
      user = {
        ...user,
        stripeCustomerId: customer.id,
        stripeProductId: 'prod_0',
        stripeCustomerSubscriptionId: subscription.id,
        stripeCustomerPaymentMethodId: null,
      }
      await req.store.replace(user)
    }
  }
  res.json(userIds)
})

app.get('/retrieve-subscription', async (req, res) => {
  let { stripeCustomerSubscriptionId } = req.query
  const subscription = await stripe.subscriptions.retrieve(
    stripeCustomerSubscriptionId,
  )
  res.status(200)
  res.json(subscription)
})

app.get('/retrieve-invoices', async (req, res) => {
  let { stripeCustomerId } = req.query
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
  })
  res.status(200)
  res.json(invoices)
})

export default app
