const Admin = require('../models/adminmodel')
const Wallet = require('../models/walletSchema')
const Order = require('../models/orderSchema')
const Product = require('../models/productSchema');

// const getDashBoard = async (req, res) => {
//     try {
//         // Fetch all orders that are not deleted
//         const orders = await Order.find({ isDeleted: false });

//         // Get today's date range (start and end of the day)
//         const today = new Date();
//         const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Midnight
//         const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day

//         // Filter today's orders
//         const todaysOrders = orders.filter(order => {
//             const orderDate = new Date(order.createdOn); // Replace `createdOn` with your order's date field
//             return orderDate >= startOfDay && orderDate <= endOfDay;
//         });

//         // Calculate today's data
//         const todaysSalesCount = todaysOrders.length; // Total number of orders today
//         const todaysSales = todaysOrders.reduce((acc, order) => acc + order.finalAmount, 0).toFixed(2); // Total revenue today
        
//         const todaysDiscount= todaysOrders.reduce((acc, order) => acc + order.discounts, 0); // Total items sold today (replace `totalItems` with your field)
//         const todaysRevenue = (parseFloat(todaysSales) - parseFloat(todaysDiscount)).toFixed(2);


//          // Pass data to the dashboard view
//         res.render('admin/dashBoard', {
//             todaysSalesCount,
//             todaysRevenue,
//             todaysSales,
//             todaysDiscount
//         });
//     } catch (error) {
//         console.error('Error generating dashboard data:', error);
//         res.status(500).send({ error: 'Failed to generate dashboard data' });
//     }
// };

const getDashBoard = async (req, res) => {
    try {
        // Fetch all orders that are not deleted

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Midnight
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day

        const ordersforday = await Order.find({
            isDeleted: false,
            status: { $nin: ['Returned', 'Cancelled'] },
            paymentStatus: 'Paid',
            createdOn: { 
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lte: new Date(today.setHours(23, 59, 59, 999)),  // Less than or equal to end of today
            }
          });
           const orders = await Order.find({isDeleted:false, status: { $nin: ['Returned', 'Cancelled'] },
            paymentStatus: 'Paid',})

       
        // Filter today's orders
        const todaysOrders = ordersforday.filter(order => {
            const orderDate = new Date(order.createdOn); // Replace `createdOn` with your order's date field
            return orderDate >= startOfDay && orderDate <= endOfDay;
        });
        

        // Calculate today's data
        const todaysSalesCount = todaysOrders.length; // Total number of orders today
        const todaysSales = todaysOrders.reduce((acc, order) => acc + order.finalAmount, 0).toFixed(2); // Total revenue today
        const todaysDiscount = todaysOrders.reduce((acc, order) => acc + order.discounts, 0); // Total discounts today
        const todaysRevenue = (parseFloat(todaysSales) - parseFloat(todaysDiscount)).toFixed(2);

        const currentYear = new Date().getFullYear();

        // Months names
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
        ];

        // Monthly revenue data for the current year
        let monthlyRevenueData = Array(12).fill(0);

        orders.forEach(order => {
            const orderDate = new Date(order.createdOn);
            if (orderDate.getFullYear() === currentYear) {
                const monthIndex = orderDate.getMonth(); // 0-indexed month
                const revenue = order.finalAmount - order.discounts;
                monthlyRevenueData[monthIndex] += revenue;
            }
        });


        const categorySales = await Order.aggregate([
            {
                $match: {
                  paymentStatus: "Paid", // Include only paid orders
                  status: { $nin: ["Returned", "Cancelled"] } // Exclude orders with these statuses
                }
              },
            { $unwind: "$orderItems" },
            {
              $lookup: {
                from: "products", // Collection name for Product
                localField: "orderItems.product",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            { $unwind: "$productDetails" },
            {
              $lookup: {
                from: "categories", // Collection name for Category
                localField: "productDetails.category",
                foreignField: "_id",
                as: "categoryDetails"
              }
            },
            { $unwind: "$categoryDetails" },
            {
              $group: {
                _id: "$categoryDetails.name", // Group by category name
                totalSales: { $sum: "$finalAmount" } // Sum the final amount
              }
            },
            { $sort: { totalSales: -1 } }, // Sort categories by total sales (optional)
            { $limit: 3 } // Limit to top 3 most sold products

          ]);


          const productSales = await Order.aggregate([
            {
              $match: {
                paymentStatus: "Paid", // Include only paid orders
                status: { $nin: ["Returned", "Cancelled"] } // Exclude orders with these statuses
              }
            },
            { $unwind: "$orderItems" }, // Flatten the orderItems array
            {
              $lookup: {
                from: "products", // Lookup the Products collection
                localField: "orderItems.product", // Match by product ID from orderItems
                foreignField: "_id", // Match the _id in Products collection
                as: "productDetails" // Store the joined product details in productDetails field
              }
            },
            { $unwind: "$productDetails" }, // Unwind the productDetails array to access product details
            {
              $group: {
                _id: "$orderItems.product", // Group by product ID (product field in orderItems)
                productName: { $first: "$productDetails.productName" }, // Get the product name from productDetails
                totalQuantitySold: { $sum: "$orderItems.quantity" } // Sum the quantities sold
              }
            },
            { $sort: { totalQuantitySold: -1 } }, // Sort by total quantity sold
            { $limit: 3 } // Limit to top 3 most sold products
          ]);
          
          const brandSales = await Order.aggregate([
            {
                $match: {
                  paymentStatus: "Paid", // Include only paid orders
                  status: { $nin: ["Returned", "Cancelled"] } // Exclude orders with these statuses
                }
              },
              { $unwind: "$orderItems" }, // Flatten the orderItems array
              {
                $lookup: {
                  from: "products", // Lookup the Products collection
                  localField: "orderItems.product", // Match by product ID from orderItems
                  foreignField: "_id", // Match the _id in Products collection
                  as: "productDetails" // Store the joined product details in productDetails field
                }
              },
              { $unwind: "$productDetails" }, // Unwind the productDetails array to access product details
              {
                $group: {
                    _id: "$productDetails.brand", // Group by brand
                    brand: { $first: "$productDetails.brand" }, // Get the product name from productDetails
                  totalQuantitySold: { $sum: "$orderItems.quantity" }, // Sum the quantities sold
                }
              },
              { $sort: { totalQuantitySold: -1 } }, // Sort by total quantity sold (or total sales if you want value)
              { $limit: 3 } // Limit to top 3 most sold products
          ]);
          
          console.log("Brand sales:", brandSales);
          
          // Calculate the percentage of each brand's total sales
          const totalBrandSales = brandSales.reduce((acc, curr) => acc + curr.totalQuantitySold, 0);
          brandSales.forEach(brand => {
            brand.percentage =Math.round ((brand.totalQuantitySold / totalBrandSales) * 100); // Calculate percentage for each brand
          });
          
         
      
          console.log("category sales",categorySales)
          const totalSales = categorySales.reduce((acc, curr) => acc + curr.totalSales, 0);
    categorySales.forEach(category => {
      category.percentage = Math.round((category.totalSales / totalSales) * 100); // Percentage
      


      const totalProductSales = productSales.reduce((acc, curr) => acc + curr.totalQuantitySold, 0);
      productSales.forEach(product => {
        product.percentage = Math.round((product.totalQuantitySold / totalProductSales) * 100); // Rounded to nearest whole number
    });

      

    });

        // Pass data to the dashboard view
        res.render('admin/dashBoard', {
            todaysSalesCount,
            todaysRevenue,
            todaysSales,
            todaysDiscount,
            defaultLabels: months,
            defaultRevenueData: monthlyRevenueData.map(val => parseFloat(val.toFixed(2))),
            defaultChartLabel: `Monthly Revenue for ${currentYear}`,
             categorySales: JSON.stringify(categorySales)  ,
             productSales: JSON.stringify(productSales),
             brandSales:JSON.stringify(brandSales)
                 });
    } catch (error) {
        console.error('Error generating dashboard data:', error);
        res.status(500).send({ error: 'Failed to generate dashboard data' });
    }
};
const getFilteredRevenue = async (req, res) => {
    try {
        const { filterType, month } = req.body;
        console.log("selected filter",req.body)

        if (filterType === 'yearly') {
            // Fetch all orders and aggregate revenue by month
            const orders = await Order.find({ isDeleted: false });
            let monthlyRevenueData = Array(12).fill(0);

            orders.forEach(order => {
                const orderDate = new Date(order.createdOn);
                const monthIndex = orderDate.getMonth(); // 0-indexed month
                const revenue = order.finalAmount - order.discounts;
                monthlyRevenueData[monthIndex] += revenue;
            });

            res.json({
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
                monthlyRevenueData: monthlyRevenueData.map(val => parseFloat(val.toFixed(2))),
            });
        } else if (filterType === 'monthly') {
            // Fetch orders for a specific month and calculate daily revenue
            const year = new Date().getFullYear(); // Example: Default year, or include it in the request body
            const orders = await Order.find({ isDeleted: false });
            let dailyRevenueData = [];
            const daysInMonth = new Date(year, month, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const dailyOrders = orders.filter(order => {
                    const orderDate = new Date(order.createdOn);
                    return (
                        orderDate.getFullYear() === year &&
                        orderDate.getMonth() + 1 === parseInt(month) &&
                        orderDate.getDate() === day
                    );
                });

                const dailyTotal = dailyOrders.reduce((sum, order) => sum + (order.finalAmount - order.discounts), 0);
                dailyRevenueData.push(dailyTotal.toFixed(2));
            }

            res.json({
                days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
                dailyRevenueData: dailyRevenueData.map(val => parseFloat(val)),
            });
        } else {
            res.status(400).send({ error: 'Invalid filter type' });
        }
    } catch (error) {
        console.error('Error generating revenue data:', error);
        res.status(500).send({ error: 'Failed to generate revenue data' });
    }
};




module.exports={
    getDashBoard,
    getFilteredRevenue
}