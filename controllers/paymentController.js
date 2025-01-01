const razorpay = require("../services/razorpayService");

const createOrder = async (req, res) => {
  try {
     const { amount } = req.body;
  
    const options = {
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    //res.status(500).json({ success: false, message: "Unable to create order" });
  }
};

const getPaymentPage = async (req, res) => {
  try {
      // Extract orderId and amount from the query parameters
      const { orderId, amount } = req.query;

      // Log the values for debugging
      console.log("Order ID:", orderId);
      console.log("Amount:", amount);

      // Render the Razorpay payment page and pass the order details to the view
      res.render('user/razorpayPayment', {
          orderId,
          amount, // Pass amount to the view for Razorpay integration
      });
  } catch (error) {
      console.log("Error loading payment page", error);
      res.redirect('/user/error');
  }
};


const getKey = async(req,res)=>{

        res.json({ key: process.env.RAZORPAY_KEY_ID });
      
}

module.exports = { createOrder,getPaymentPage ,getKey};
