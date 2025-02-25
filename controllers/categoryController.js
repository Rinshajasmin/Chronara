const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");

const categoryInfo = async (req, res) => {
  try {
    const admin = req.session.admin;
    const category = await Category.find({ isListed: true });
    res.render("admin/category", { category });
  } catch (error) {
    console.log("error");
    res.redirect("/admin/error");
  }
};
const getaddCategory=async(req,res)=>{
 try {
  res.render("admin/addCategory")
 } catch (error) {
  console.log("error");
  res.redirect("/admin/error");
 }
}
const addCategory = async (req, res) => {
  const { name, description ,categoryOffer} = req.body;
  console.log("received",req.body);

  // Check for empty fields
  if (!name || !description || !categoryOffer) {
    return res
      .status(400)
      .json({ error: "Name and description are required." });
  }

  try {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      
    });

    if (existingCategory) {
      return res.status(400).json({success:false, error: "Category already exists." });
    }

    const newCategory = new Category({ name, description,categoryOffer });
    await newCategory.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Category added successfully!', 
      redirectUrl: '/admin/Category' 
    });
    

    // return res.status(201).json({sucess:true, message: "Category added successfully." });
  } catch (error) {
    console.error("Error adding category:", error); // Log errors for debugging
    return res.status(500).json({ error: "Internal server error." });
  }
};


const geteditCategory=async(req,res)=>{
  try {
    const id=req.params.id
    const category=await Category.findById(id)
    res.render('admin/editCategory',{category})
  } catch (error) {
    console.log("error in editing the category",error)
    res.redirect("/admin/error")
  }
}

// const editCategory = async (req, res) => {
//   const id = req.params.id;
//   const { name ,description,categoryOffer} = req.body; // Ensure form input name matches

//   console.log("Request Body:", req.body);
//   console.log("ID received:", id);

//   try {
//     const category = await Category.findById(id);

//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }

//     category.name = name;
//     category.description = description;
//     category.categoryOffer = categoryOffer
//     await category.save();
//     res.redirect("/admin/category");
//     // res.json({ message: 'Category updated successfully' });
//   } catch (error) {
//     console.error("Error updating category:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const editCategory = async (req, res) => {
  const id = req.params.id;
  const { name, description, categoryOffer } = req.body;

  console.log("Request Body:", req.body);
  console.log("ID received:", id);

  try {
    const existingCategory = await Category.findOne({ name });

    if (existingCategory && existingCategory._id.toString() !== id) {
      return res.status(400).json({ success:false,error: "Category name already exists." });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    category.name = name;
    category.description = description;
    category.categoryOffer = categoryOffer;
    await category.save();

    res.json({ success: true, message: "Category updated successfully!" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



const deleteCategory = async (req, res) => {
  const { id } = req.params; // Extract product ID from route parameters

  try {
    // Find the product and mark it as deleted
    const id = req.params.id;
   
    const category = await Category.findByIdAndUpdate(
      id,
      { isListed: false },
      { new: true } // Return the updated product
    );

    if (!category) {
      return res.status(404).send("category not found");
    }

    // Redirect back to the products list
    res.redirect("/admin/category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
module.exports = {
  categoryInfo,
  getaddCategory,
  addCategory,
  addCategory,
  geteditCategory,
  editCategory,
  deleteCategory,
};
