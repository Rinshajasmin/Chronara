const User = require('../models/usermodel')
const Product = require('../models/productSchema')
const mongoose = require('mongoose')

const addToWishlist = async(req,res)=>{
    try {
        const {productId}=req.body
        const userId = req.session.user
        const user = await User.findById(userId)

        if(!user.wishlist.includes(productId)){
            wishlist.push(productId)
            await user.save()
            res.status(200).json({ success: true, message: 'Product added to wishlist' });

        }else{
            res.status(400).json({ success: false, message: 'Product already in wishlist' });
        }
    } catch (error) {
        console.log("error while adding to wishlist",error)
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: productId } },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Product removed from wishlist', wishlist: user.wishlist });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const viewWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId).populate('wishlist');

        res.render('user/wishlist', { products: user.wishlist ,username:user.username});
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).send('Error fetching wishlist');
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        if (!userId || !productId) {
            return res.status(400).json({ success: false, message: 'User ID and Product ID are required.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if product is already in the wishlist
        const isWishlisted = user.wishlist.includes(productId);

        if (isWishlisted) {
            // Remove from wishlist
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            return res.json({ success: true, message: 'Product removed from wishlist', isWishlisted: false });
        } else {
            // Add to wishlist
            user.wishlist.push(productId);
            await user.save();
            return res.json({ success: true, message: 'Product added to wishlist', isWishlisted: true });
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




module.exports={removeFromWishlist,addToWishlist,viewWishlist,toggleWishlist}
