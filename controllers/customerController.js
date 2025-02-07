const User = require("../models/usermodel");
const customerInfo = async (req, res) => {
  try {
    const admin = req.session.admin;
    if (!admin) return res.redirect("/admin/login");
    const users = await User.find({});
    res.render("admin/customers", { users });
  } catch (error) {}
};
const blockCustomer = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.updateOne({ _id: userId }, { $set: { isBlocked: true } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log("error while blocking user", error);
    res.redirect("/admin/error");
  }
};

const unBlockCustomer = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.updateOne({ _id: userId }, { $set: { isBlocked: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log("error while unblocking user", error);
    res.redirect("/admin/error");
  }
};
module.exports = { customerInfo, blockCustomer, unBlockCustomer };
