const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const SHOP = process.env.SHOPIFY_STORE;
const TOKEN = process.env.ADMIN_API_TOKEN;

app.get('/track-order', async (req, res) => {
  const orderNumber = req.query.order_number;
  if (!orderNumber) return res.status(400).json({ message: 'Order number required' });

  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2024-01/orders.json?name=${orderNumber}`, {
      headers: {
        'X-Shopify-Access-Token': TOKEN
      }
    });

    const orders = response.data.orders;
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

    const order = orders[0];
    const status = order.fulfillment_status || 'unfulfilled';
    const trackingNumbers = order.fulfillments.map(f => f.tracking_numbers).flat();

    res.json({
      order_number: order.name,
      status: status,
      tracking: trackingNumbers
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
