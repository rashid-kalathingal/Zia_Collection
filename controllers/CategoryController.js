const Category = require("../models/categorySchema");
const multer = require("multer");

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

//find all category from database and render admin side category page
exports.category = async (req, res) => {
  try {
    const categorys = await Category.find({});
    res.render("admin/category", { admin: true, categorys, noShow: true });
  } catch (error) {
    console.log(error);
  }
};
//render add category page
exports.addCategoryPage = async (req, res) => {
  let adminDetails = req.session.admin;
  res.render("admin/AddCategory", { admin: true, adminDetails, noShow: true });
};

//add new category in database
exports.postCategory = async (req, res) => {
  upload.array("image", 4)(req, res, async (err) => {
    try {
      console.log(req.body, "jhgjhhh");
      console.log(req.files);
      const newCategory = new Category({
        category: req.body.category,
        gender: req.body.gender,
        description: req.body.description,
        images: req.files.map((file) => file.filename),
      });
      await Category.create(newCategory);
      console.log(newCategory);
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error);
    }
  });
};

//these codes for block and unblock the category
exports.blocksCategory = async (req, res) => {
  await Category.updateOne({ _id: req.params.id }, { isListed: false });
  res.redirect("/admin/category");
};
exports.unBlocksCategory = async (req, res) => {
  await Category.updateOne({ _id: req.params.id }, { isListed: true });
  res.redirect("/admin/category");
};

//render edit category page
exports.getEditCategoryPage = async (req, res) => {
  try {
    const editCategory = await Category.findOne({ _id: req.params.id });
    let adminDetails = req.session.admin;
    res.render("admin/editCategory", {
      editCategory,
      admin: true,
      adminDetails,
      noShow: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//changes or edit the current category
exports.editCategory = async (req, res) => {
  try {
    const items = await Category.updateOne(
      { _id: req.params.id },
      {
        category: req.body.category,
        gender: req.body.gender,
        description: req.body.description,
      }
    );

    console.log(items);
    await res.redirect("/admin/category");
    console.log("redirected");
  } catch (error) {
    console.log(error);
  }
};
