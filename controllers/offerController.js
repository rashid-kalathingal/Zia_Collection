const Offer = require("../models/offerSchema");
const Category = require("../models/categorySchema");

exports.offer = async function (req, res, next) {
  try {
    const offer = await Offer.find({});
    const categories = await Category.find({});
    const categoryList = categories.map((category) => category.category);
    console.log(categoryList);
    res.render("admin/offer", { categoryList, noShow: true, offer });
  } catch (error) {
    next(error);
  }
};

// POST method for the form submission
exports.postoffer = async (req, res, next) => {
  try {
    const { title, discount, category, expires } = req.body;

    // Create a new offer document
    const newOffer = new Offer({
      title,
      discount,
      category,
      endDate: expires,
    });

    // Save the offer to the database
    const savedOffer = await newOffer.save();

    // Redirect or render a success message
    res.redirect("/admin/offer"); // Assuming there's a route for displaying all offers
  } catch (error) {
    next(error);
  }
};
