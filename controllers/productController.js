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
            .select('productName productDesc regularPrice quantity  productImage'); // Specify the fields to include
        
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
    try {
        const { productName, productDesc, category, regularPrice ,quantity} = req.body;
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
            productImage: imagePaths, // Save all paths directly to productImage
        });

        await newProduct.save();

        res.status(200).json({ message: 'Product added successfully!', product: newProduct,redirectUrl: '/admin/products'  });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product.' });
    }
};

//  const addProduct = async (req, res) => {
//     const { productName, productDesc, category, regularPrice } = req.body; 
//     const productImage = req.files; 

//     console.log('Form Data:', req.body); 
//     console.log('Uploaded Images:', productImage); 

//     if (!productName || !productDesc || !category) {
//         return res.status(400).send('Missing required fields');
//     }
//     const imageUrls = req.files.map(file => `/uploads/re-image/${file.filename}`);

//     try {
//         const newProduct = new Product({
//             productName,
//             productDesc,
//             category, // Save the selected category's ID
//             regularPrice,
//            productImage : imageUrls, // Store the file data if necessary
//         });

//         await newProduct.save();
//         res.redirect('/admin/products'); 
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };
// const addProduct = async (req, res) => {
//     const { productName, productDesc, category, regularPrice } = req.body;
//     const productImages = req.files;

//     console.log('Form Data:', req.body);
//     console.log('Uploaded Images:', productImages);

//     if (!productName || !productDesc || !category) {
//         return res.status(400).send('Missing required fields');
//     }

//     try {
//         // Process original and cropped images
//         const imageUrls = [];
//         const croppedImageUrls = [];

//         for (const file of productImages) {
//             const originalPath = `/uploads/re-image/${file.filename}`;
//             imageUrls.push(originalPath);

//             // Create cropped version of the image
//             const cropper = require('sharp'); // Use sharp for server-side cropping
//             const croppedFilename = `cropped-${Date.now()}-${file.filename}`;
//             const croppedPath = path.join(__dirname, '../public/uploads/re-image', croppedFilename);

//             await cropper(file.path) // Path to the original file
//                 .resize(300, 300, { fit: 'cover' }) // Crop dimensions (modify as needed)
//                 .toFile(croppedPath);

//             croppedImageUrls.push(`/uploads/re-image/${croppedFilename}`);
//         }

//         // Save product to the database
//         const newProduct = new Product({
//             productName,
//             productDesc,
//             category,
//             regularPrice,
//             productImage: [...imageUrls, ...croppedImageUrls], // Combine original and cropped URLs
//         });

//         await newProduct.save();
//         res.redirect('/admin/products');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };
// const addProduct = async (req, res) => {
//     const { productName, productDesc, category, regularPrice } = req.body;
//     const croppedImages = req.body['croppedImages[]']; // Array of cropped images sent from the frontend

//     try {
//         if (!productName || !productDesc || !category || !croppedImages) {
//             return res.status(400).send('Missing required fields');
//         }

//         // Save product details in the database
//         const newProduct = new Product({
//             productName,
//             productDesc,
//             category,
//             regularPrice,
//             productImage: croppedImages, // Save all cropped images
//         });

//         await newProduct.save();
//         res.status(200).json({ message: 'Product saved successfully' });
//     } catch (error) {
//         console.error('Error saving product:', error);
//         res.status(500).send('Server Error');
//     }
// };


// const addProduct = async (req, res) => {
//     const { productName, productDesc, category, regularPrice } = req.body;
//     const croppedImages = req.body['croppedImages[]']; // Handle array of cropped images
//     const originalImage = req.file; // Handle original image

//     const imageUrls = [];

//     // Save original image
//     if (originalImage) {
//         const originalPath = `/uploads/re-image/${originalImage.filename}`;
//         imageUrls.push(originalPath);
//     }

//     // Save cropped images
//     if (Array.isArray(croppedImages)) {
//         for (const base64Image of croppedImages) {
//             const base64Data = base64Image.replace(/^data:image\/jpeg;base64,/, '');
//             const filename = `cropped-${Date.now()}.jpg`;
//             const filePath = path.join(__dirname, '../public/uploads/re-image', filename);

//             fs.writeFileSync(filePath, base64Data, 'base64');
//             imageUrls.push(`/uploads/re-image/${filename}`);
//         }
//     } else if (croppedImages) {
//         // Single cropped image (if not sent as array)
//         const base64Data = croppedImages.replace(/^data:image\/jpeg;base64,/, '');
//         const filename = `cropped-${Date.now()}.jpg`;
//         const filePath = path.join(__dirname, '../public/uploads/re-image', filename);

//         fs.writeFileSync(filePath, base64Data, 'base64');
//         imageUrls.push(`/uploads/re-image/${filename}`);
//     }

//     // Save product to database
//     const newProduct = new Product({
//         productName,
//         productDesc,
//         category,
//         regularPrice,
//         productImage: imageUrls,
//     });

//     try {
//         await newProduct.save();
//         res.json({ success: true, product: newProduct });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };



// const addProduct = async (req, res) => {
//     const { productName, productDesc, category, regularPrice } = req.body;
//     const productImages = req.files; // Original uploaded images from Multer

//     console.log('Form Data:', req.body);
//     console.log('Uploaded Images:', productImages);

//     if (!productName || !productDesc || !category) {
//         return res.status(400).send('Missing required fields');
//     }

//     try {
//         // Initialize arrays for storing image URLs
//         const imageUrls = []; // For original images
//         const croppedImageUrls = []; // For cropped images

//         // Process and store original images
//         if (productImages) {
//             productImages.forEach((file) => {
//                 const originalPath = `/uploads/re-image/${file.filename}`;
//                 imageUrls.push(originalPath);
//             });
//         }

//         // Process cropped images sent as base64 in req.body['croppedImages[]']
//         const croppedImages = req.body['croppedImages[]']; // Cropped images array
//         console.log('Cropped Images:', croppedImages); // Debug cropped images

//         if (croppedImages) {
//             if (Array.isArray(croppedImages)) {
//                 // Handle multiple cropped images
//                 croppedImages.forEach((image, index) => {
//                     const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
//                     const filename = `cropped-${Date.now()}-${index}.jpg`;
//                     const filePath = path.join(__dirname, '../public/uploads/re-image', filename);
//                     fs.writeFileSync(filePath, base64Data, 'base64');
//                     croppedImageUrls.push(`/uploads/re-image/${filename}`);
//                 });
//             } else {
//                 // Handle a single cropped image
//                 const base64Data = croppedImages.replace(/^data:image\/jpeg;base64,/, '');
//                 const filename = `cropped-${Date.now()}.jpg`;
//                 const filePath = path.join(__dirname, '../public/uploads/re-image', filename);
//                 fs.writeFileSync(filePath, base64Data, 'base64');
//                 croppedImageUrls.push(`/uploads/re-image/${filename}`);
//             }
//         }

//         // Save product to the database
//         const newProduct = new Product({
//             productName,
//             productDesc,
//             category,
//             regularPrice,
//             productImage: [...imageUrls, ...croppedImageUrls], // Combine original and cropped URLs
//         });

//         await newProduct.save();
//         res.redirect('/admin/products');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };



;

//module.exports = { addProduct };


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
                isListed: category._id.toString() === product.category.toString()
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
// const editProduct = async (req, res) => {
//     const { id } = req.params; // Extract product ID from route parameters
//     const { productName, productDesc, category,quantity, regularPrice } = req.body; // Extract form data
//     // const images = req.files?.map(file => file.filename); // Extract uploaded files (if any)

//     try {
//         // Find the product by ID
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         // Update product fields
//         product.productName = productName || product.productName;
//         product.productDesc = productDesc || product.productDesc;
//         product.category = category || product.category;
//         product.regularPrice = regularPrice || product.regularPrice;
//         product.quantity = quantity || product.quantity
//         // product.productImage=productImage || product.productImage;
        
//         // if ( productImage&& productImage.length >= 1) {
//         //     product.productImage = productImage; // Update image array
//         // }

//         // Save the updated product
//         await product.save();

//         // Redirect to the products list
//         res.redirect('/admin/products');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };




 // Adjust the path as per your project structure
 
//  const editProduct = async (req, res) => {
//      try {
//          const { id } = req.params; // Product ID from request params
//          const { productName, productDesc, category, regularPrice, quantity, deleteImages } = req.body;
//          const files = req.files || [];
 
//          // Find the product by ID
//          const product = await Product.findById(id);
//          if (!product) {
//              return res.status(404).json({ error: 'Product not found' });
//          }
 
//          // Handle deletion of images
//          if (deleteImages && Array.isArray(deleteImages)) {
//              for (const imagePath of deleteImages) {
//                  // Construct the absolute path of the image
//                  const absolutePath = path.join(__dirname, "../public/uploads/re-image", path.basename(imagePath));
 
//                  // Remove the image from the filesystem
//                  if (fs.existsSync(absolutePath)) {
//                      fs.unlinkSync(absolutePath);
//                  }
 
//                  // Remove the image path from the product's productImage array
//                  product.productImage = product.productImage.filter(img => img !== imagePath);
//              }
//          }
 
//          // Handle new image uploads
//          const imagePaths = [];
//          for (const file of files) {
//              const fileName = `${Date.now()}_${file.originalname}`;
//              const destinationPath = path.join(__dirname, "../public/uploads/re-image", fileName);
 
//              // Move the file from Multer's temporary location to the desired location
//              await fs.promises.rename(file.path, destinationPath);
 
//              // Add the new image path to the array
//              imagePaths.push(`/uploads/re-image/${fileName}`);
//          }
 
//          // Update product image array with new image paths
//          product.productImage = [...product.productImage, ...imagePaths];
 
//          // Update other product fields
//          product.productName = productName || product.productName;
//          product.productDesc = productDesc || product.productDesc;
//          product.category = category || product.category;
//          product.regularPrice = regularPrice || product.regularPrice;
//          product.quantity = quantity || product.quantity;
 
//          // Save the updated product to the database
//          await product.save();
 
//          res.status(200).json({ message: 'Product updated successfully!', product });
//      } catch (err) {
//          console.error(err);
//          res.status(500).json({ error: 'Failed to update product.' });
//      }
//  };



const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { productName, productDesc, category, regularPrice, quantity } = req.body;
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

const viewCart = async(req,res)=>{
    try {
       

        res.render('user/cart')
    } catch (error) {
        
    }

}


const addToCart = async(req,res)=>{
        try {
            res.render('user/cart')
        } catch (error) {
            console.error("error while adding to cart",error)
            res.redirect("/user/error")
        }
}

 module.exports ={
    getProducts,getAddProductPage,addProduct,geteditProduct,editProduct,deleteProduct,addnew,getaddnew,
    getProductDetails,
    viewCart,addToCart
 }


   











 