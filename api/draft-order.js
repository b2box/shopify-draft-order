const axios = require("axios");

module.exports = async (req, res) => {
  // Configurar encabezados CORS para permitir solicitudes desde tu dominio
  res.setHeader('Access-Control-Allow-Origin', 'https://www.b2-box.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar la solicitud OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cartData = req.body;
    const draftOrder = {
      draft_order: {
        line_items: cartData.items.map(item => ({
          title: `${item.title} (${item.variant})`,
          price: item.unitPrice.toFixed(2),
          quantity: item.quantity
        })),
        shipping_line: {
          title: cartData.shipping.method,
          price: cartData.shipping.cost.toFixed(2)
        },
        applied_discount: cartData.discounts.length > 0 ? {
          description: cartData.discounts.map(d => d.title).join(", "),
          value: cartData.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2),
          value_type: "fixed_amount"
        } : null,
        note: JSON.stringify(cartData),
        email: cartData.customer.email
      }
    };

    const response = await axios.post(
      "https://5abc43-02.myshopify.com/admin/api/2023-10/draft_orders.json",
      draftOrder,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true, draftOrder: response.data.draft_order });
  } catch (error) {
    console.error("Proxy error:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
