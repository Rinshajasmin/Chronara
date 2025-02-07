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
            .select('productName productDesc regularPrice brand quantity  productImage')// Specify the fields to include
            .sort({createdAt:-1});
        
        res.render('admin/products', { products });;
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
 }
 const getAddProductPage = async (req, res) => {
    try {
        const category = await Category.find({isListed:true});
        res.render('admin/addProducts', { category });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
const addProduct = async (req, res) => {
    try {
        const { productName, productDesc, category, regularPrice ,quantity,brand,productOffer} = req.body;
        console.log(req.body)
        const files = req.files || [];

        const imagePaths = []; // Array to store paths of all images

        for (const file of files) {
            const fileName = `${Date.now()}_${file.originalname}`;
            const destinationPath = `public/uploads/${fileName}`;

            // Copy the file from Multer's saved path to the desired location
            await fs.promises.copyFile(file.path, destinationPath);

            // Add the destination path to the imagePaths array
            imagePaths.push(`/uploads/${fileName}`);
        }

        // Create the new product with the images array
        const newProduct = new Product({
             productName,
             productDesc,
              category,
             regularPrice,
             quantity,
             brand,
             productOffer,
            productImage: imagePaths, // Save all paths directly to productImage
        });

        await newProduct.save();

         res.status(200).json({ message: 'Product added successfully!', product: newProduct,redirectUrl: '/admin/products'  });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product.' });
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
        const categories = await Category.find({isListed:true});

        // Add isSelected property to each category
        const updatedCategories = categories.map(category => {
            return {
                _id: category._id,
                name: category.name,
                isSelected: category._id.toString() === product.category.toString()
            };
        });

        // Render the edit form
        res.render('admin/editProImage', {
            product,
            categories: updatedCategories
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    } 
};
const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { productName, productDesc, category, regularPrice, quantity,brand } = req.body;
        const files = req.files || [];


        // Parse removedImages safely
        const removedImages = req.body.removedImages ? JSON.parse(req.body.removedImages) : [];

        // Update product details
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.productName = productName;
        product.productDesc = productDesc;
        product.category = category;
        product.brand = brand;
        product.regularPrice = regularPrice;
        product.quantity = quantity;

        // Remove images from the filesystem
        for (const imagePath of removedImages) {
            if (imagePath && typeof imagePath === 'string') {
                
                const absolutePath = path.join(__dirname, '../public', imagePath); // Adjust base path as needed
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                }

                // Remove the image from the database
                product.productImage = product.productImage.filter((img) => img !== imagePath);
            } else {
                console.warn('Invalid image path encountered:', imagePath);
            }
        }

        // Handle new image uploads
         const imagePaths = [];
         for (const file of files) {
             const fileName = `${Date.now()}_${file.originalname}`;
             const destinationPath = path.join(__dirname, "../public/uploads/re-image", fileName);
 
             // Move the file from Multer's temporary location to the desired location
             //await fs.promises.rename(file.path, destinationPath);
             await fs.promises.copyFile(file.path, destinationPath);

 
             // Add the new image path to the array
             imagePaths.push(`/uploads/re-image/${fileName}`);
         }
 
         // Update product image array with new image paths
         product.productImage = [...product.productImage, ...imagePaths];

        await product.save();
        res.setHeader("Content-Type", "application/json");

        res.json({ message: 'Product updated successfully', product ,redirectUrl: '/admin/products'});
    } catch (error) {
        console.error('Error in editProduct:', error);
        res.status(500).json({ message: 'Failed to update product', error: error.message });
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
const getaddnew = async(req,res)=>{
    res.render('admin/addProductsnew')

}
const addnew = async(req,res)=>{
    try{
    const products = req.body
    const productExists = await Product.findOne({
        productName:products.productName
    }) 

    if(!productExists){
        const productImage=[]
        if(req.files&&req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                const originalImagePath = req.files[i].path
                const resizedImagePath = path .join('public','uploads','re-image',req.files[i].filename)
                await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath);
                images.push(req.files[i].filename)
            }
        }
        const categoryId = await Category.findOne({name:products.category})

        if(!categoryId){
            return res.status(400).json("invalid category name")
        }
            const newProduct = new Product({
                productName:products.productName,
                description:products.description,
                brand:products.brand,
                category:categoryId._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                createdOn:new Date(),
                quantity:products.quantity,
                size:products.size,
                color:products.color,
                productImage:productImage,
                status:"available"



            });
            await newProduct.save()
            return res.redirect('/admin/addProductsnew')
        }else{
            return res.status(400).json("product already exist")
        }
    }catch(error){
        console.error("error saving product",error)
        return res.redirect("/admin/error")
    }
}
const getProductDetails = async(req,res)=>{
try {
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const productId = req.query.id;
    const product = await Product.findById(productId).populate("category")
    const findCategory = product.category;
    const categoryOffer = findCategory?.categoryOffer || 0
    const productOffer = product.productOffer || 0;
    const totalOffer = categoryOffer + productOffer;
    const regularPrice = product.regularPrice


    const discountAmount = (totalOffer / 100) * regularPrice;  // Calculate the discount amount
    const salePrice = regularPrice - discountAmount; 
    res.render("user/productDetails",{
        _id:product._id,
        user:userData,
        product:product,
        quantity:product.quantity,
        category:findCategory,
        totalOffer:totalOffer,
        categoryOffer:categoryOffer,
        productOffer:productOffer,
        salePrice:salePrice,
        username:userData.username,
        


    });

} catch (error) {
    console.log("error while fetching the product details",error)
    res.redirect("/user/error")
}
}

 module.exports = {
   getProducts,
   getAddProductPage,
   addProduct,
   geteditProduct,
   editProduct,
   deleteProduct,
   addnew,
   getaddnew,
   getProductDetails,
 };


   











 