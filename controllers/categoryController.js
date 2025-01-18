const Category = require('../models/categorySchema')

const categoryInfo = async(req,res)=>{
    try{
    const admin =req.session.admin
    const category = await Category.find({isListed:true})
    res.render('admin/category',{category})
    }catch(error){
       console.log("error")
       res.redirect("/admin/error")
    }
}
const addCategory = async (req, res) => {
    const { name, description } = req.body;
    console.log(req.body); 
  
    // Check for empty fields
    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required." });
    }
  
    try {
      const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
  
      if (existingCategory) {
        return res.status(400).json({ error: "Category already exists." });
      }
  
      const newCategory = new Category({ name, description });
      await newCategory.save();
  
      return res.status(201).json({ message: "Category added successfully." });
    } catch (error) {
      console.error("Error adding category:", error); // Log errors for debugging
      return res.status(500).json({ error: "Internal server error." });
    }
  };
  
// const editCategory = async(req,res)=>{
//   const id=req.params.id
//     const {name,description} = req.body;
//     console.log(req.body)
//     try {
//         // Find the category by its ID
//         const category = await Category.findById(id);

//         if (!category) {
//             return res.status(404).json({ error: "Category not found" });
//         }

//         // Update the category's details
//         category.name = name;
//         category.description = description;

//         // Save the updated category
//         await category.save();

//         // Redirect or send success message
//         res.json({ message: "Category updated successfully" });
//     } catch (error) {
//         return res.status(500).json({ error: "Internal server error" });
//     }
    
// }


const editCategory = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body; // Ensure form input name matches

  console.log('Request Body:', req.body);
  console.log('ID received:', id);

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    category.name = name;
    await category.save();
    res.redirect('/admin/category')
    // res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


 

const deleteCategory = async(req,res)=>{
  const { id } = req.params; // Extract product ID from route parameters

    try {
        // Find the product and mark it as deleted
        const id = req.params.id
        const category = await Category.findByIdAndUpdate(
            id,
            { isListed: false },
            { new: true } // Return the updated product
        );

        if (!category) {
            return res.status(404).send('category not found');
        }

        // Redirect back to the products list
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
    
}  
module.exports = {categoryInfo,addCategory,addCategory,editCategory,deleteCategory}