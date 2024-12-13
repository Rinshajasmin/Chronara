const Product = require('../models/productSchema')
const Category = require('../models/categorySchema')
const User = require('../models/usermodel')
 const fs = require('fs')
 const path = require('path')
 const sharp = require('sharp')

//  const getAddProductPage = async(req,res)=>{
//     try {
//         const category = await Category.find({isListed:true}) 
//         res.render("admin/Products",{category})
//     } catch (error) {
//         res.redirect('/admin/error')
//     }
//  }
 
    const getProducts = async (req, res) => {
        try {
            const products = await Product.find({ isDeleted: false }) // Filter out deleted products
            .populate('category', 'name') // Include the category name
            .select('productName productDesc regularPrice stock productImage'); // Specify the fields to include
        
        res.render('admin/products', { products });;
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
 }
 const getAddProductPage = async (req, res) => {
    try {
        const category = await Category.find();
        res.render('admin/addProducts', { category });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const addProduct = async (req, res) => {
    const { productName, productDesc, category, regularPrice } = req.body; 
    const productImage = req.files; 

    console.log('Form Data:', req.body); 
    console.log('Uploaded Images:', productImage); 

    if (!productName || !productDesc || !category) {
        return res.status(400).send('Missing required fields');
    }
    const imageUrls = req.files.map(file => `/uploads/re-image/${file.filename}`);

    try {
        const newProduct = new Product({
            productName,
            productDesc,
            category, // Save the selected category's ID
            regularPrice,
           productImage : imageUrls, // Store the file data if necessary
        });

        await newProduct.save();
        res.redirect('/admin/products'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const geteditProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Fetch all categories
        const categories = await Category.find();

        // Add isSelected property to each category
        const updatedCategories = categories.map(category => {
            return {
                _id: category._id,
                name: category.name,
                isSelected: category._id.toString() === product.category.toString()
            };
        });

        // Render the edit form
        res.render('admin/editProduct', {
            product,
            categories: updatedCategories
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const editProduct = async (req, res) => {
    const { id } = req.params; // Extract product ID from route parameters
    const { productName, productDesc, category, regularPrice } = req.body; // Extract form data
    // const images = req.files?.map(file => file.filename); // Extract uploaded files (if any)

    try {
        // Find the product by ID
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Update product fields
        product.productName = productName || product.productName;
        product.productDesc = productDesc || product.productDesc;
        product.category = category || product.category;
        product.regularPrice = regularPrice || product.regularPrice;

        
        if ( productImage&& productImage.length >= 1) {
            product.productImage = productImage; // Update image array
        }

        // Save the updated product
        await product.save();

        // Redirect to the products list
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const deleteProduct = async (req, res) => {
    const { id } = req.params; // Extract product ID from route parameters

    try {
        // Find the product and mark it as deleted
        const product = await Product.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true } // Return the updated product
        );

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Redirect back to the products list
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


 module.exports ={
    getProducts,getAddProductPage,addProduct,geteditProduct,editProduct,deleteProduct
 }


   











 