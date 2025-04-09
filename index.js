const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const SHOP = process.env.SHOPIFY_STORE;
const TOKEN = process.env.ADMIN_API_TOKEN;

app.get('/track-order', async (req, res) => {
  const orderNumber = req.query.order_number;

  if (!orderNumber) {
    return res.status(400).json({ message: 'Missing order number' });
  }

  try {
    const response = await fetch(
      `https://${SHOP}/admin/api/2023-10/orders.json?name=${orderNumber}&status=any`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.orders && data.orders.length > 0) {
      const order = data.orders[0];
      const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';

      const trackingNumbers = [];

      if (order.fulfillments && order.fulfillments.length > 0) {
        order.fulfillments.forEach((fulfillment) => {
          if (fulfillment.tracking_numbers && fulfillment.tracking_numbers.length > 0) {
            trackingNumbers.push(...fulfillment.tracking_numbers);
          }
        });
      }

      res.json({
        order_number: order.name,
        status: fulfillmentStatus,
        tracking: trackingNumbers,
      });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
