var express = require("express");
var router = express.Router();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const CategoryController = require("../controllers/CategoryController");
const Product = require("../models/productSchema");
const couponControllers = require("../controllers/couponControllers");
const bannerController = require("../controllers/bannerController");
const offerController = require("../controllers/offerController");
const {adminauth,verify} = require('../middleware/admin')


/* GET home page. */
router.get("/", adminauth, function (req, res, next) {
  res.render("admin/login", { noShow: true });
});

router.get("/dashboard", verify, adminController.dashboard);
router.get("/category", verify, CategoryController.category);
router.get("/product", verify, productController.AllProducts);

//user controller in admin side
router.get("/user", verify, adminController.user);
router.get("/block/:id", adminController.blockUser);
router.get("/unBlock/:id", adminController.unBlockUser);


//product controller in admin side
router.get("/addProduct", productController.addProductPage);
router.post("/addProduct", productController.postProduct);
router.get("/editProduct/:id", productController.getEditProductPage);
router.post("/editProduct/:id", productController.editProduct);
router.get("/softdeleteproduct/:id", adminController.softdeleteproduct);
router.get("/undoproduct/:id", adminController.undoproduct);

//category controller in admin side
router.get("/addCategory", CategoryController.addCategoryPage);
router.post("/addCategory", CategoryController.postCategory);
router.get("/blocks/:id", CategoryController.blocksCategory);
router.get("/unBlocks/:id", CategoryController.unBlocksCategory);
router.get("/editCategory/:id", CategoryController.getEditCategoryPage);
router.post("/editCategory/:id", CategoryController.editCategory);

//order controller in admin side
router.get("/order", verify, adminController.Orders);
router.post("/order-details/:id", adminController.orderDetailsAdmin);

router.get("/logout", adminController.logout);
router.post("/login", adminController.postLogin);

//coupons
router.get("/coupon", verify, couponControllers.couponPage);
router.post("/coupon", couponControllers.postCoupon);
router.patch("/coupon-disable/:id", couponControllers.disableCoupon);
router.patch("/coupon-enable/:id", couponControllers.enableCoupon);
router.get("/edit-coupon", couponControllers.editCoupon);
router.post("/update-coupon", couponControllers.updateCoupon);

//banner controller
router.get("/banner",verify, bannerController.getBanner);
router.post("/banner", bannerController.addBanner);


router.get("/sales-report", adminController.salesSummary);
router.post("/filterOrders", adminController.salesReport);

//offer
router.get("/offer", verify, offerController.offer);
router.post("/offer", verify, offerController.postoffer);

module.exports = router;
