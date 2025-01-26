const Admin = require('../models/adminmodel')
const Wallet = require('../models/walletSchema')
const Order = require('../models/orderSchema')
const Product = require('../models/productSchema');
const PDFDocument = require('pdfkit');
const fs = require('fs');


// const getSalesPage = async(req,res)=>{
//     try {
        

//         const orders= await Order.find({})
 
//         let totalSales=0;
//         let totalDiscounts =0;
//         let totalOrders = orders.length

//         orders.forEach(order => {
        

//             totalSales+=order.finalAmount;
//             totalDiscounts+=order.discounts;
            
//         });



//         res.render('admin/sales',{
//             totalSales:totalSales,
//             totalDiscounts:totalDiscounts,
//             totalOrders
//         }

//         )
//     } catch (error) {
//         console.log("error while fetching sales",error)
//         res.redirect('/admin/error')
        
//     }

// }

// const getSalesPage= async (req, res) => {
//     try {
//         const { filterType = 'weekly', startDate, endDate } = req.body;

//         let filter = {};

//         if (filterType === 'daily') {
//             const today = new Date();
//             filter = {
//                 createdOn: {
//                     $gte: new Date(today.setHours(0, 0, 0, 0)),
//                     $lte: new Date(today.setHours(23, 59, 59, 999)),
//                 },
//             };
//         } else if (filterType === 'weekly') {
//             const today = new Date();
//             const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
//             const weekEnd = new Date(weekStart);
//             weekEnd.setDate(weekEnd.getDate() + 6);

//             filter = {
//                 createdOn: {
//                     $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
//                     $lte: new Date(weekEnd.setHours(23, 59, 59, 999)),
//                 },
//             };
//         } else if (filterType === 'monthly') {
//             const today = new Date();
//             const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//             const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//             filter = {
//                 createdOn: {
//                     $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)),
//                     $lte: new Date(endOfMonth.setHours(23, 59, 59, 999)),
//                 },
//             };
//         } else if (filterType === 'custom' && startDate && endDate) {
//             filter = {
//                 createdOn: {
//                     $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
//                     $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
//                 },
//             };
//         }

//         // Fetch orders based on the filter
//         const orders = await Order.find(filter);
//         orders.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));


//         // Calculate report data
//         const report = {
//             totalOrders: orders.length,
//             totalSales: orders.reduce((acc, order) => acc + order.finalAmount, 0),
//             totalDiscounts: orders.reduce((acc, order) => acc + order.discounts, 0),
//         };

//         const ordersWithNetSales = orders.map(order => ({
//             ...order.toObject(),
//             netSales: order.originalTotalPrice - order.discounts,
//         }));

//         res.render('admin/sales', { report, orders:ordersWithNetSales, filterType});
//     } catch (error) {
//         console.error('Error generating sales report:', error);
//         res.status(500).send({ error: 'Failed to generate sales report' });
//     }
// }
const filterOrders = (filterType, startDate, endDate) => {
    let filter = {};

    const today = new Date();

    if (filterType === 'daily') {
        filter = {
            createdOn: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lte: new Date(today.setHours(23, 59, 59, 999)),
            },
        };
    } else if (filterType === 'weekly') {
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        filter = {
            createdOn: {
                $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
                $lte: new Date(weekEnd.setHours(23, 59, 59, 999)),
            },
        };
    } else if (filterType === 'monthly') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        filter = {
            createdOn: {
                $gte: new Date(startOfMonth.setHours(0, 0, 0, 0)),
                $lte: new Date(endOfMonth.setHours(23, 59, 59, 999)),
            },
        };
    } else if (filterType === 'custom' && startDate && endDate) {
        filter = {
            createdOn: {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            },
        };
    }

    return filter;
};
 


const getSalesPage = async (req, res) => {
    try {
        
        let { filterType, startDate, endDate } = req.query;

        
        if (!filterType) {
            filterType = "weekly"; 
        }

        // Determine the date range based on the filterType
        const filter = filterOrders(filterType, startDate, endDate);

        const query = {
            ...filter, // Include the date range filter
            paymentStatus: "Paid", // Only orders with paymentStatus as "paid"
            status: { $nin: ["Returned", "Cancelled"] } // Exclude orders with status "returned" or "cancelled"
        };

        // Fetch orders based on the filter
        const orders = await Order.find(query);
        orders.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn)); // Sort orders by date (most recent first)

        // Calculate report data
        const report = {
            totalOrders: orders.length,
            totalSales: orders.reduce((acc, order) => acc + order.finalAmount, 0),
            totalDiscounts: orders.reduce((acc, order) => acc + order.discounts, 0),
        };

        // Add net sales to each order
        const ordersWithNetSales = orders.map(order => ({
            ...order.toObject(),
            netSales: (order.originalTotalPrice - order.discounts)+50,
        }));

        res.render('admin/sales', { report, orders: ordersWithNetSales, filterType });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send({ error: 'Failed to generate sales report' });
    }
};


const postSalesReport = async (req, res) => {
    try {
        const { action, filterType, startDate, endDate } = req.body; // Handle form submission
        console.log(req.body)
        

        if (action === 'view') {
            const filter = filterOrders(filterType, startDate, endDate);

            // Fetch orders based on the filter
            const orders = await Order.find(filter);
            orders.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

            // Calculate report data
            const report = {
                totalOrders: orders.length,
                totalSales: orders.reduce((acc, order) => acc + order.finalAmount, 0),
                totalDiscounts: orders.reduce((acc, order) => acc + order.discounts, 0),
            };

            const ordersWithNetSales = orders.map(order => ({
                ...order.toObject(),
                netSales: order.originalTotalPrice - order.discounts,
            }));

            return res.render('admin/sales', { report, orders: ordersWithNetSales, filterType ,filterType: filterType,
                startDate: startDate,
                endDate: endDate});

        } else if (action === 'pdf') {
            // If action is pdf, call the generateSalesPDF function
            const filePath = await generateSalesPDF({ filterType, startDate, endDate });
            return res.status(200).json({ message: 'PDF generated successfully', filePath });
        }
        

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send({ error: 'Failed to generate sales report' });
    }
};


const generateSalesPDF = async (req, res) => {
    const { tableData, startDate,endDate,filterType} = req.body;

    console.log("reqbody while pdf generation",req.body)
    

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    const fileName = 'Sales_Report.pdf';

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Title Section
    doc.fontSize(20).text('Chronara Sales Report', { align: 'center' });
    doc.moveDown(0.5);

     // Helper Functions to Calculate Date Ranges
     const getCurrentWeekRange = () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        return {
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: endOfWeek.toISOString().split('T')[0],
        };
    };

    const getCurrentMonthRange = () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
        return {
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
            monthName: monthName,
        };
    };

     // Add the custom date range if available
     if (filterType === 'custom' && startDate && endDate) {
        doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'left' });
    } else if (filterType === 'weekly') {
        const weekRange = getCurrentWeekRange();
        doc.fontSize(12).text(`Weekly Report: ${weekRange.startDate} to ${weekRange.endDate}`, { align: 'left' });
    } else if (filterType === 'monthly') {
        const monthRange = getCurrentMonthRange();
        doc.fontSize(12).text(`Monthly Report: ${monthRange.monthName}`, { align: 'left' });
    } else {
        doc.fontSize(12).text(`Report Type: ${filterType}`, { align: 'left' });
    }

    doc.moveDown(1);



    
    // Add an Underline Below the Title
    const underlineStartX = 50;
    const underlineEndX = doc.page.width - 50;
    doc.moveTo(underlineStartX, 100).lineTo(underlineEndX, 100).stroke();

    // Table Configuration
    const headers = ['Date', 'Order ID', 'Total Amount', 'Discount', 'Net Sales'];
    const columnWidths = [100, 150, 100, 100, 100];
    const rowHeight = 40; // Height for each row
    const startX = 50;
    let y = 120; // Starting Y position

    // Variables to hold totals
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalNetSales = 0;

    // Function to format currency values
    const formatCurrency = (value) => {
        return `₹${parseFloat(value).toFixed(2)}`; // Format value with ₹ and two decimal places
    };

    // Draw a single row (header or data)
    const drawRow = (row, isHeader = false) => {
        // Draw background for header
        if (isHeader) {
            doc.rect(startX, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
               .fill('#cccccc')
               .stroke();
        }

        // Draw cells for each column
        let currentX = startX;
        row.forEach((cell, index) => {
            // Check if this is a data row (not header row)
            if (y > 120) { // Adjust this based on your table start position (header row is typically at the top)
                // If the cell contains a price (e.g., columns for Total Amount, Net Sales, Discount)
                if (index === 2 || index === 4 || index === 3) { // Price columns
                    const cleanedValue = cell.replace(/[^\d.-]/g, ''); // Remove non-numeric characters
                    const numericValue = parseFloat(cleanedValue);

                    // Update totals if the value is numeric
                    if (!isNaN(numericValue)) {
                        if (index === 2) totalAmount += numericValue;
                        if (index === 3) totalDiscount += numericValue;
                        if (index === 4) totalNetSales += numericValue;
                        
                        // Format the cell with 2 decimal places
                        cell = numericValue.toFixed(2);
                    } else {
                        cell = "0.00"; // Default value if it's not a valid number
                    }
                }
            }

            // Draw border for the cell
            doc
                .rect(currentX, y, columnWidths[index], rowHeight)
                .stroke();

                const textHeight = 12; // Set text height based on the font size used (adjust if needed)
                const textY = y + (rowHeight - textHeight) / 2; // Calculate vertical center position for text
        

            // Draw the text in the cell
            doc
                .fontSize(12)
                .font(isHeader ? 'Helvetica-Bold' : 'Helvetica') // Use system fonts
                .fillColor('black')
                .text(cell, currentX + 5, textY, { width: columnWidths[index] - 10, align: 'center' }); // Add cell content
            currentX += columnWidths[index]; // Move to the next column
        });
        y += rowHeight; // Move to the next row
    };

    // Draw Table Headers
    drawRow(headers, true);

    // Draw Table Data
    tableData.forEach((row) => {
        // Add a new page if content exceeds page height
        if (y + rowHeight > doc.page.height - 50) {
            doc.addPage();
            y = 50; // Reset Y position
            drawRow(headers, true); // Redraw headers on new page
        }
        drawRow(row);
    });

    // Draw Total Row at the end of the table
    const totalRow = [
        'Total', // For the first column, it will show "Total"
        '', // Empty for Order ID
        formatCurrency(totalAmount.toFixed(2)), // Total of Total Amount column
        formatCurrency(totalDiscount.toFixed(2)), // Total of Discount column
        formatCurrency(totalNetSales.toFixed(2)), // Total of Net Sales column
    ];

    drawRow(totalRow, false); // Draw the total row

    const lineY = y + 10; // Adjust the position slightly below the total row
doc.moveTo(startX, lineY).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), lineY).stroke();

const reportDate1 = new Date().toLocaleString();
doc.fontSize(12).text(`Report Generated on: ${reportDate1}`, startX, lineY + 10, { align: 'right' }); // Adjust Y-position
    
    // Finalize the PDF
    doc.end();
};







// const generateSalesPDF = async (req, res) => {
//     const { tableData } = req.body;

//     // Create a new PDF document
//     const doc = new PDFDocument({ margin: 50 });
//     const fileName = 'Sales_Report.pdf';

//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

//     doc.pipe(res);

//     // Title Section
//     doc.fontSize(20).text('Chronara Sales Report', { align: 'center' });
//     doc.moveDown(0.5);

//     // Add Date of Report Generation
//     const reportDate = new Date().toLocaleString();
//     doc.fontSize(12).text(`Date: ${reportDate}`, { align: 'right' });
//     doc.moveDown(1);

//     // Add an Underline Below the Title
//     const underlineStartX = 50;
//     const underlineEndX = doc.page.width - 50;
//     doc.moveTo(underlineStartX, 100).lineTo(underlineEndX, 100).stroke();

//     // Table Configuration
//     const headers = ['Date', 'Order ID', 'Total Amount', 'Discount', 'Net Sales'];
//     const columnWidths = [100, 150, 100, 100, 100];
//     const rowHeight = 30; // Height for each row
//     const startX = 50;
//     let y = 120; // Starting Y position

//     // Draw a single row (header or data)
//     const drawRow = (row, isHeader = false) => {
//         // Draw background for header
//         if (isHeader) {
//             doc.rect(startX, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
//                .fill('#cccccc')
//                .stroke();
//         }

//         // Draw cells for each column
//         let currentX = startX;
//         row.forEach((cell, index) => {
//             // Check if this is a data row (not header row)
//             if (y > 120) { // Adjust this based on your table start position (header row is typically at the top)
//                 // If the cell contains a price (e.g., columns for Total Amount, Net Sales)
//                 if (index === 2 || index === 4 || index===3) { // Assuming price-related columns are at index 2 and 4
//                     // Remove any non-numeric characters (e.g., currency symbols, commas)
//                     const cleanedValue = cell.replace(/[^\d.-]/g, ''); // Regex to remove anything that's not a number, dot, or minus sign
                    
//                     // Convert to a float and format to 2 decimal places
//                     const numericValue = parseFloat(cleanedValue);
                    
//                     // If it's a valid number, format it, otherwise default to "0.00"
//                     if (!isNaN(numericValue)) {
//                         cell = numericValue.toFixed(2); // Format to 2 decimals
//                     } else {
//                         cell = "0.00"; // Default value if it's not a valid number
//                     }
//                 }
//             }
        
//             // Draw border for the cell
//             doc
//                 .rect(currentX, y, columnWidths[index], rowHeight)
//                 .stroke(); 
        
//             // Draw the text in the cell
//             doc
//                 .fontSize(12)
//                 .font(isHeader ? 'Helvetica-Bold' : 'Helvetica') // Use system fonts
//                 .fillColor('black')
//                 .text(cell, currentX + 5, y + 5, { width: columnWidths[index] - 10, align: 'center' }); // Add cell content
//             currentX += columnWidths[index]; // Move to the next column
//         });
//         y += rowHeight; // Move to the next row
//          // Move to the next row
//          // Move to the next row
//     };

//     // Draw Table Headers
//     drawRow(headers, true);

//     // Draw Table Data
//     tableData.forEach((row) => {
//         // Add a new page if content exceeds page height
//         if (y + rowHeight > doc.page.height - 50) {
//             doc.addPage();
//             y = 50; // Reset Y position
//             drawRow(headers, true); // Redraw headers on new page
//         }
//         drawRow(row);
//     });

//     // Finalize the PDF
//     doc.end();
// };



;



// const generateSalesPDF = (req, res) => {
//     console.log(req.body)
//     const { startDate, endDate } = req.body;

//     // Ensure the dates are passed correctly
//     if (!startDate || !endDate) {
//         return res.status(400).send("Start Date or End Date is missing");
//     }

//     // Convert the start and end date to Date objects (if they are strings)
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     // Fetch orders within the date range (update this according to your model)
//     Order.find({
//         createdOn: { $gte: start, $lte: end }
//     })
//     .then(orders => {
//         const doc = new PDFDocument();
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
//         doc.pipe(res);

//         // Add header to PDF
//         doc.fontSize(14).text(`Sales Report from ${startDate} to ${endDate}`, { align: 'center' });

//         // Add table headers
//         doc.fontSize(12).text('Order ID | Total Amount | Discount | Net Sales', { align: 'left' });
//         doc.text('---------------------------------------------');

//         // Add order details to the PDF
//         orders.forEach(order => {
//             doc.text(`${order.orderId} | ₹${order.originalTotalPrice} | ₹${order.discounts} | ₹${order.netSales}`);
//         });

//         doc.end();
//     })
//     .catch(err => {
//         console.error("Error fetching orders:", err);
//         res.status(500).send("Error generating sales report");
//     });
// };




// const generateSalesPDF = async (req, res) => {
//     try {
//         const { filterType, startDate, endDate } = req.body;
//         const filter = filterOrders(filterType, startDate, endDate);

//         // Fetch orders
//         const orders = await Order.find(filter);

//         // Generate PDF
//         const doc = new PDFDocument();
//         const filePath = `./public/sales-report-${Date.now()}.pdf`;
//         doc.pipe(fs.createWriteStream(filePath));

//         doc.fontSize(20).text('Sales Report', { align: 'center' });
//         doc.moveDown();
//         doc.fontSize(15).text(`Filter Type: ${filterType}`, { underline: true });
//         if (startDate && endDate) {
//             doc.text(`Date Range: ${startDate} - ${endDate}`);
//         }

//         doc.moveDown();
//         orders.forEach((order, index) => {
//             doc.text(
//                 `${index + 1}. Order ID: ${order.orderId}, Date: ${order.createdOn.toDateString()}, Total: ₹${order.originalTotalPrice}, Discount: ₹${order.discounts}, Net: ₹${order.netSales}`
//             );
//         });

//         doc.end();
//         res.status(200).json({ message: 'PDF generated successfully', filePath });
//     } catch (error) {
//         console.error('Error generating PDF:', error);
//         res.status(500).send('Failed to generate PDF');
//     }
// };


const ExcelJS = require('exceljs');

const generateSalesExcel = async (req, res) => {
    const { tableData ,startDate,endDate,filterType} = req.body;
    
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Title styling and merging
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Chronara Sales Report';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subtitle styling for the generated date
    worksheet.mergeCells('A2:E2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Generated on: ${new Date().toLocaleString()}`;
    subtitleCell.font = { italic: true, size: 10 };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:E3');
    const infoCell = worksheet.getCell('A3');
    if (startDate && endDate) {
        infoCell.value = `Date Range: ${startDate} to ${endDate}`;
    } else {
        infoCell.value = `Report Type: ${filterType}`;
    }

    infoCell.font = { italic: true, size: 10 };
    infoCell.alignment = { vertical: 'middle', horizontal: 'center' };


    // Define column headers
    const headers = ['Order Date', 'Order ID', 'Total Amount', 'Discount', 'Net Amount'];
    const headerRow = worksheet.addRow(headers);

    // Style the header row
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Function to clean numeric values
    const cleanNumericValue = (value) => {
        if (!value) return 0; // Handle empty or undefined values
        const cleanedValue = value.toString().replace(/[^0-9.]/g, ''); // Remove non-numeric characters
        return parseFloat(cleanedValue) || 0; // Parse as float or fallback to 0
    };

    // Add table data rows
    tableData.forEach((row) => {
        const newRow = worksheet.addRow([
            row[0], // Order Date
            row[1], // Order ID
            cleanNumericValue(row[2]), // Total Amount
            cleanNumericValue(row[3]), // Discount
            cleanNumericValue(row[4]), // Net Amount
        ]);

        newRow.getCell(3).alignment = { horizontal: 'center' };
        newRow.getCell(4).alignment = { horizontal: 'center' };
        newRow.getCell(5).alignment = { horizontal: 'center' };
    });

    // Add the totals row at the bottom
    const totalAmount = tableData.reduce((sum, row) => sum + cleanNumericValue(row[2]), 0);
    const totalDiscount = tableData.reduce((sum, row) => sum + cleanNumericValue(row[3]), 0);
    const totalNetSales = tableData.reduce((sum, row) => sum + cleanNumericValue(row[4]), 0);

    const totalsRow = worksheet.addRow([
        'Totals',
        '',
        totalAmount.toFixed(2),
        totalDiscount.toFixed(2),
        totalNetSales.toFixed(2),
    ]);

    // Style the totals row
    totalsRow.font = { bold: true };
    totalsRow.alignment = { horizontal: 'center' };

    // Set column widths
    worksheet.columns = [
        { width: 15 }, // Order Date
        { width: 30 }, // Order ID
        { width: 15 }, // Total Amount
        { width: 15 }, // Discount
        { width: 15 }, // Net Amount
    ];

    // Set border styles
    const rowsToStyle = [headerRow, ...worksheet.getRows(3, tableData.length + 1), totalsRow];
    rowsToStyle.forEach((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    // Set response headers to download the file
    const fileName = 'Sales_Report.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
};




module.exports={getSalesPage,generateSalesPDF,postSalesReport,generateSalesExcel}
