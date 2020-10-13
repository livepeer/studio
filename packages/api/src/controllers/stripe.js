import Router from 'express/lib/router'
import { db } from '../store'
import Stripe from 'stripe'
import { products } from '../config'

const app = Router()
const endpointSecret = process.env.LP_STRIPE_WEBHOOK_SECRET
const stripe = new Stripe(process.env.LP_STRIPE_SECRET_KEY)

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'invoice.created') {
    let invoice = event.data.object

    if (invoice.status !== 'draft') {
      // we don't need to do anything
      return res.sendStatus(200)
    }

    const [users] = await db.user.find(
      { stripeCustomerId: invoice.customer },
      { useReplica: false },
    )

    if (users.length < 1) {
      res.status(404)
      return res.json({ errors: ['user not found'] })
    }

    const user = users[0]
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
          let quantity = Math.round(usageRes.sourceSegmentsDuration / 60)
          await stripe.invoiceItems.create({
            customer: user.stripeCustomerId,
            invoice: invoice.id,
            currency: 'usd',
            period: {
              start: invoice.period_start,
              end: invoice.period_end,
            },
            subscription: user.stripeCustomerSubscriptionId,
            unit_amount_decimal: product.price * 100,
            quantity,
            description: product.description,
          })
        }
      }),
    )
  }

  // Return a response to acknowledge receipt of the event
  return res.sendStatus(200)
})

async function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

// Migrate existing users to stripe
app.post('/migrate-users', async (req, res) => {
  if (process.env.LP_STRIPE_SECRET_KEY != req.body.stripeSecretKey) {
    res.status(403)
    return res.json({ errors: ['unauthorized'] })
  }

  const [users] = await db.user.find(
    {},
    { limit: 9999999999, useReplica: false },
  )

  for (let index = 0; index < users.length; index++) {
    let user = users[index]

    const { data } = await stripe.customers.list({
      email: user.email,
    })

    if (data.length === 0) {
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

      // Update user's customer, product, subscription, and payment id in our db
      await db.user.update(user.id, {
        stripeCustomerId: customer.id,
        stripeProductId: 'prod_0',
        stripeCustomerSubscriptionId: subscription.id,
        stripeCustomerPaymentMethodId: null,
      })

      // sleep for a 200 ms to get around stripe rate limits
      await sleep(500)
    }
  }
  res.json(users)
})

export default app
