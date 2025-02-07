const User = require("../models/usermodel");
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartSchema");
const Wallet = require("../models/walletSchema");
const Category = require("../models/categorySchema");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.user; // Ensure user ID is stored in session properly.
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User not logged in or session expired." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "productName productOffer regularPrice productImage category",
        populate: { path: "category", select: "categoryOffer" }, // Populate category offer
      })
      .exec();

    console.log("Cart details from user:", cart);
    if (!cart || cart.items.length === 0) {
      return res.render("user/cart", { username: user.username });
    }
    const cartDetails = cart.items
      .filter((item) => item.quantity > 0) // Only include items with quantity greater than 0
      .map((item) => {
        const salePrice = calculateSalePrice(item.productId); // Calculate the sale price dynamically
        const categoryOffer = item.productId.category?.categoryOffer || 0;
        const productOffer = item.productId.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;
        const actualTotal = item.productId.regularPrice * item.quantity;
        const OfferDiscount = actualTotal - salePrice;

        return {
          productId: item.productId._id,
          productName: item.productId.productName,
          regularPrice: item.productId.regularPrice.toFixed(2),
          salePrice: salePrice.toFixed(2),
          quantity: item.quantity,
          totalPrice: (item.quantity * salePrice).toFixed(2), // Use sale price for total price
          productImage: item.productId.productImage[0], // Assuming multiple images
          status: item.status,
          totalOffer,
          actualTotal,
          OfferDiscount,
        };
      });

    const shippingCharge = 50.0;
    const grandTotal = cartDetails
      .reduce((acc, item) => acc + parseFloat(item.totalPrice), 0)
      .toFixed(2);
    const actualCartTotal = cartDetails
      .reduce((acc, item) => acc + parseFloat(item.actualTotal), 0)
      .toFixed(2);
    const actualCartOfferDiscount = cartDetails
      .reduce((acc, item) => acc + parseFloat(item.OfferDiscount), 0)
      .toFixed(2);
    const netQuantity = cartDetails.length;
    const totalWithShipping = (parseFloat(grandTotal) + shippingCharge).toFixed(
      2
    );
   console.log("cart details", cartDetails);

    res.render("user/cart", {
      message: "Cart details retrieved successfully.",
      data: cartDetails,
      grandTotal: totalWithShipping,
      actualCartTotal,
      actualCartOfferDiscount,
      netQuantity,
      shippingCharge: shippingCharge,
      username: user.username,
      cartId: cart._id,
    });
  } catch (error) {
    console.error("Error retrieving cart:", error);
    res
      .status(500)
      .json({ message: "Error retrieving cart.", error: error.message });
  }
};
// Utility function to calculate salePrice
function calculateSalePrice(product) {
  const categoryOffer = product.category?.categoryOffer || 0; // Default to 0 if no category offer
  const productOffer = product.productOffer || 0; // Default to 0 if no product offer
  const totalOffer = categoryOffer + productOffer; // Sum of both offers
  const regularPrice = product.regularPrice; // Regular price of the product
  const discountAmount = (totalOffer / 100) * regularPrice; // Calculate discount amount
  return regularPrice - discountAmount; // Sale price after applying the discount
}
const checkProductStock = async (productId, requestedQuantity) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    if (product.quantity < 1) {
      return { success: false, message: `No enough stock available.` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error checking product stock:", error);
    return { success: false, message: "Error checking product stock." };
  }
};

const addToCart = async (req, res) => {
  try {
    console.log("Starting to process add to cart...");
    const { productId } = req.body;
    const userId = req.session.user;

    if (!productId || !userId) {
      return res
        .status(400)
        .json({ message: "Product ID and User ID are required." });
    }

    const product = await Product.findById(productId).populate(
      "category",
      "categoryOffer"
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const salePrice = calculateSalePrice(product);
    console.log("calculated saleprice:", salePrice);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    if (cart.items.length >= 3) {
      return res
        .status(400)
        .json({ message: "You can only add up to 3 items in your cart." });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      const requestedQuantity = existingItem.quantity + 1;

      // Check if enough stock is available
      const stockCheck = await checkProductStock(productId, requestedQuantity);
      if (!stockCheck.success) {
        return res.status(400).json({ message: stockCheck.message });
      }

      if (existingItem.quantity < 3) {
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.quantity * salePrice;

        // Decrease stock in the Product collection
        product.quantity -= 1;
        await product.save();
      } else {
        return res
          .status(400)
          .json({ message: "You cannot add more than 3 of this product." });
      }
    } else {
      const stockCheck = await checkProductStock(productId, 1);
      if (!stockCheck.success) {
        return res.status(400).json({ message: stockCheck.message });
      }

      cart.items.push({
        productId,
        quantity: 1,
        price: salePrice,
        totalPrice: salePrice,
      });

      // Decrease stock in the Product collection
      product.quantity -= 1;
      await product.save();
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select:
          "productName category brand salePrice regularPrice productImage productOffer",
        populate: { path: "category", select: "categoryOffer" },
      })
      .exec();

    const cartDetails = populatedCart.items.map((item) => {
      const dynamicSalePrice = calculateSalePrice(item.productId);

      const discount = cart.coupon?.discount || 0;
      console.log("discount in the cart", discount);

      return {
        productId: item.productId._id,
        productName: item.productId.productName,
        productImage: item.productId.productImage[0],
        category: item.productId.category,
        brand: item.productId.brand,
        salePrice: dynamicSalePrice,
        quantity: item.quantity,
        totalPrice: item.quantity * dynamicSalePrice,
        discount,
      };
    });
    console.log("Final Response Data:", cartDetails);

    const shippingCharge = 50.0;
    const grandTotal = cartDetails.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );
    const actualCartTotal = cartDetails.reduce(
      (acc, item) => acc + item.actualTotal,
      0
    );
    const totalWithShipping = (parseFloat(grandTotal) + shippingCharge).toFixed(
      2
    );

    res.json({
      success: true,
      message: "Item added to cart",
      data: cartDetails,
      grandTotal: totalWithShipping,
      actualCartTotal,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ message: "Error adding to cart.", error: error.message });
  }
};

const changeQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  console.log(quantity);

  try {
    // Fetch the product and its category to calculate the sale price
    const product = await Product.findOne({ _id: productId }).populate(
      "category",
      "categoryOffer"
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const currentCart = await Cart.findOne({ "items.productId": productId });
    if (!currentCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    const currentQuantity =
      currentCart.items.find((item) => item.productId.toString() === productId)
        ?.quantity || 0;

    // Ensure requested quantity is not negative
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than or equal to 0",
      });
    }

    // Calculate the quantity change
    const quantityChange = quantity - currentQuantity;

    // Handle stock availability
    if (quantityChange > 0 && quantityChange > product.quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
        availableStock: product.quantity, // Optionally include available stock
      });
    }
    // Calculate sale price
    const salePrice = calculateSalePrice(product); // Use the function to calculate sale price
    const totalPrice = salePrice * quantity;

    if (quantity === 0) {
      // Remove item from the cart if quantity is 0
      const removedItem = await Cart.updateOne(
        { "items.productId": productId },
        { $pull: { items: { productId } } } // Pull item from cart
      );

      // Restore stock for removed quantity
      if (removedItem.modifiedCount > 0) {
        product.quantity += currentQuantity;
        await product.save();

        return res.json({
          success: true,
          message: "Item removed from cart",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Failed to remove item from cart" });
      }
    } else if (quantity > 0) {
      // Update item's quantity and total price
      const updatedItem = await Cart.updateOne(
        { "items.productId": productId },
        {
          $set: {
            "items.$.quantity": quantity,
            "items.$.price": salePrice, // Update the sale price
            "items.$.totalPrice": totalPrice,
          },
        }
      );

      if (updatedItem.modifiedCount > 0) {
        // Update product stock
        product.quantity -= quantityChange; // Decrease stock if incremented
        await product.save();

        return res.json({
          success: true,
          message: "Quantity updated successfully",
          salePrice,
          totalPrice,
          quantity,
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Failed to update quantity" });
      }
    } else {
      // Invalid quantity
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than or equal to 0",
      });
    }
  } catch (err) {
    console.error("Error in changeQuantity:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Backend route to check if enough stock is available
const checkStock = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check if there’s enough stock
    if (product.quantity >= quantity) {
      return res.json({ success: true, isStockAvailable: true });
    } else {
      return res.json({ success: true, isStockAvailable: false });
    }
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  const mongoose = require("mongoose");

  try {
    const { productId } = req.body; // Retrieve productId from the request body
    const userId = req.session.user; // Assuming you're using session to identify the user
    console.log(typeof productId); // Check if it's a string (which is expected)
    console.log(userId);
    if (!productId || !userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Product ID and User ID are required.",
        });
    }

    // Convert productId to an ObjectId if it's a string
    const productObjectId = new mongoose.Types.ObjectId(productId);
    // Find the 's cart
    const cart = await Cart.findOne({ userId: userId }); // Correct query format { userId: userId }
    if (!cart) {
      console.log("Cart not found");
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart." });
    }
    const deletedQuantity = item.quantity; // Quantity of the product being removed

    // Remove the product from the cart's items array
    const updatedCart = await Cart.updateOne(
      { userId, "items.productId": productObjectId }, // Use ObjectId for comparison
      { $pull: { items: { productId: productObjectId } } } // Remove item with the specific productId
    );
    console.log("Updated Cart:", updatedCart);

    const refreshedCart = await Cart.findOne({ userId });

    if (refreshedCart.items.length === 0) {
      // If cart is empty, mark it as deleted and reset fields
      refreshedCart.isDeleted = true;
      refreshedCart.items = [];
      refreshedCart.coupon = null; // Clear coupon details
      refreshedCart.grandTotal = 0; // Reset totals
      refreshedCart.discount = 0;

      await refreshedCart.save();
      console.log("Cart marked as deleted and reset.");
    }

    // Add the deleted quantity back to the product stock
    const product = await Product.findById(productObjectId);
    if (product) {
      product.quantity += deletedQuantity; // Restore stock
      await product.save();
      console.log(`Restored ${deletedQuantity} units to product stock.`);
      console.log(product.quantity);
    } else {
      console.log("Product not found while trying to restore stock.");
    }
    if (updatedCart.modifiedCount > 0) {
      return res.json({ success: true, message: "Product deleted from cart." });
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: "Failed to delete product from cart.",
        });
    }
  } catch (error) {
    console.error("Error deleting product from cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  getCartPage,
  addToCart,
  changeQuantity,
  deleteProduct,
  checkStock,
};
 