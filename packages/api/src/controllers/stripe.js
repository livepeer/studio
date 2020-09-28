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

  console.log(event.type)
  // Handle the event
  // Review important events for Billing webhooks
  // https://stripe.com/docs/billing/webhooks
  switch (event.type) {
    case 'invoice.created':
      const invoice = event.data.object

      if (invoice.finalized_at || invoice.status !== 'draft') {
        // This invoice is already finalized. It's an initial
        // subscription charge or the customer changed subscriptions
        // which means we can't modify it.
        res.status(200).send()
        return
      }

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

      // Invoice items
      await Promise.all(
        products[user.stripeProductId].usage.map(async (product) => {
          if (product.name === 'Transcoding') {
            let quantity = Math.round(
              (usageRes.sourceSegmentsDuration / 60).toFixed(2),
            )
            const invoice = await stripe.invoiceItems.create({
              customer: user.stripeCustomerId,
              invoice: invoice.id,
              currency: 'usd',
              unit_amount_decimal: product.price * 100,
              quantity,
              description: product.description,
            })
            return invoice
          }
        }),
      )

      break
    default:
      // Unexpected event type
      return res.status(400).end()
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true })
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
