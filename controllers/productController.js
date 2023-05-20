const Product = require("../models/productSchema");
const multer = require("multer");
const Category = require("../models/categorySchema");

//storage creating using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

//getting add product page
exports.addProductPage = async (req, res) => {
  let adminDetails = req.session.admin;
  const category = await Category.find();
  res.render("admin/AddProduct", {
    admin: true,
    adminDetails,
    noShow: true,
    category,
  });
};

//addnew product
exports.postProduct = (req, res, next) => {
  upload.array("image", 4)(req, res, async (err) => {
    try {
      const newProduct = new Product({
        name: req.body.name,
        gender: req.body.gender,
        category: req.body.category,
        description: req.body.description,
        price: req.body.price,
        images: req.files.map((file) => file.filename),
      });
      await Product.create(newProduct);
      console.log(newProduct);
      res.redirect("/admin/product");
    } catch (error) {
      console.log(error);
    }
  });
};

//render product page
exports.AllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.render("admin/Product", { admin: true, products, noShow: true });
  } catch (error) {
    console.log(error);
  }
};

//getting edit product page
exports.getEditProductPage = async (req, res) => {
  try {
    const editProduct = await Product.findOne({ _id: req.params.id });
    let adminDetails = req.session.admin;
    res.render("admin/editProduct", {
      editProduct,
      admin: true,
      adminDetails,
      noShow: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//changes happens on edit page
exports.editProduct = async (req, res) => {
  upload.array("image", 4)(req, res, async (err) => {
    try {
      const items = await Product.updateOne({ _id: req.params.id });

      const updatedData = {
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        price: req.body.price,
      };

      if (req.files && req.files.length > 0) {
        updatedData.images = req.files.map((file) => file.filename);
      } else {
        updatedData.images = items.images;
      }

      const updatedProducts = await Product.updateOne(
        { _id: req.params.id },
        updatedData
      );

      await res.redirect("/admin/product");
      console.log("redirected");
    } catch (error) {
      console.log(error);
    }
  });
};
//
exports.deleteProduct = async (req, res) => {
  console.log(req.params.id, "///////////");
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.redirect("back");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
