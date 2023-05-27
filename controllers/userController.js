const bcrypt = require("bcrypt");
const User = require("../models/userSchema");
const otp = require("../controllers/otp");
const mongoose = require("mongoose");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Banner = require("../models/bannerSchema");
const Address = require("../models/addressSchema");
const Offer = require("../models/offerSchema");
const ObjectId = mongoose.Types.ObjectId;
//add new user and also checking that new user also existing
exports.postSignup = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      console.log(`User with ${req.body.email} already exist`);
      res.redirect("/signup");
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      // console.log(req.body.name);
      const newUser = new User({
        id: Date.now().toString(),
        name: req.body.name,
        mobile: req.body.mobile,
        email: req.body.email,
        password: hashedPassword,
        status: false,
        isActive: true,
      });
      User.create(newUser);
      console.log(newUser);
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.redirect("/signup");
  }
};

//checking user data with existing data and also validate email and password
exports.postLogin = async (req, res) => {
  try {
    const newUser = await User.findOne({ email: req.body.email });
    console.log(newUser);
    if (newUser.isActive) {
      bcrypt.compare(req.body.password, newUser.password).then((status) => {
        if (status) {
          console.log("user exist");
          req.session.user = newUser;
          req.session.userloggedIn = true;
          console.log(newUser);
          res.redirect("/");
        } else {
          req.session.loginErr = "Invalid Email or Password";
          console.log("password is not matching");
          res.status(400).redirect("/login");
        }
      });
    } else {
      console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
      req.session.loginErr = "your are blocked!!!";
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

//render home page with some parameter shows in render page like product
exports.home = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 8;
    const docCount = await Product.countDocuments({});
    const products = await Product.find({ deleted: false })
      .skip((page - 1) * perPage)
      .limit(perPage);
    const banner = await Banner.find();

    loggedin = req.session.userloggedIn;
    const user = req.session.user || "";
    const username = user.name;
    // console.log("zzzzz");
    const cartCount = req.cartCount;
    res.render("user/home", {
      noShow: true,
      products,
      loggedin,
      cartCount,
      username,
      totalPages: Math.ceil(docCount / perPage),
      currentPage: page,
      perPage,
      banner,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.login = function (req, res, next) {
  loggedin = req.session.userloggedIn;

  res.render("user/login", {
    noShow: true,
    loggedin,
    loginErr: req.session.loginErr,
  });
  req.session.loginErr = false;
  req.session.save();
};

exports.about = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  const cartCount = req.cartCount;
  res.render("user/about", { loggedin, cartCount });
};
//getting products
exports.product = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 8;
    const docCount = await Product.countDocuments({});
    const products = await Product.find()
      .skip((page - 1) * perPage)
      .limit(perPage);
    loggedin = req.session.userloggedIn;
    const categories = await Category.find({ isListed: true });
    const cartCount = req.cartCount;

    res.render("user/product", {
      loggedin,
      cartCount,
      products,
      categories,
      totalPages: Math.ceil(docCount / perPage),
      currentPage: page,
      perPage,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.profile = async (req, res, next) => {
  let user = req.session.user;
  let userData = await User.findOne({ user });
  const cartCount = req.cartCount;
  loggedin = req.session.userloggedIn;
  const addressData = await Address.find({ user: user._id });
  const address = addressData[0].address;
  res.render("user/profile", { loggedin, cartCount, user, address, userData });
};

//preview for single product
exports.oneproduct = async (req, res) => {
  try {
    let id = req.params.id;
    // console.log(id);
    const singleProduct = await Product.findById(req.params.id);
    console.log(singleProduct, "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    // let objId = new ObjectId(id)
    let proid = new ObjectId(singleProduct.category);
    console.log(proid, "xyxyxyxyxyxyx");
    const categoryInfo = await Category.aggregate([
      {
        $match: {
          _id: proid,
        },
      },
    ]);
    let categoryName = categoryInfo[0].category;
    console.log(categoryInfo, "jjjjjjjjjjjjjjjjjjj");
    console.log(categoryName, "jjjjjjjjjjjjjjjjjjj");

    const offer = await Offer.find({ category: categoryName });
    console.log(offer, "gggg");
    let offerdiscount;
    if (offer.length > 0) {
      offerdiscount = offer[0].discount;
      console.log(offerdiscount, "yyeyyeyeyeyye");
    }

    // let singleProduct = await Product.findOne({_id:objId})
    // let user = req.session.user;

    // Access cartCount value from req object
    //const cartCount = req.cartCount;
    const products = await Product.find();
    loggedin = req.session.userloggedIn;
    const cartCount = req.cartCount;
    res.render("user/oneproduct", {
      singleProduct,
      loggedin,
      cartCount,
      products,
      categoryName,
      offerdiscount,
    }); //passing the singleProduct values while rendering the page...
  } catch (error) {
    console.log(error);
  }
};

//render blog page
exports.blog = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  const cartCount = req.cartCount;
  res.render("user/blog", { loggedin, cartCount });
};
//render shopping cart
exports.shopping_cart = function (req, res, next) {
  loggedin = req.session.userloggedIn;

  const cartCount = req.cartCount;
  res.render("user/cart", { loggedin, cartCount });
};
//render contact
exports.contact = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  const cartCount = req.cartCount;
  res.render("user/contact", { loggedin, cartCount });
};
//render signup page
exports.signUp = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  res.render("user/signUp1", { noShow: true, loggedin });
};
//render forgetpage
exports.forgetPassword = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  res.render("user/passwordForget", { noShow: true, loggedin });
};
//render otp page
exports.OTP = function (req, res, next) {
  loggedin = req.session.userloggedIn;
  res.render("user/OTP", { noShow: true, loggedin });
};
//render logout
exports.logout = function (req, res) {
  req.session.userloggedIn = false;
  req.session.user = null;
  res.redirect("/login");
};

//render men page
exports.Men = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 8;
    const docCount = await Product.countDocuments({});
    const products = await Product.find({ gender: "Men" , deleted:"false" })
      .skip((page - 1) * perPage)
      .limit(perPage);
    loggedin = req.session.userloggedIn;
    const cartCount = req.cartCount;
    res.render("user/Men", {
      products,
      loggedin,
      cartCount,
      totalPages: Math.ceil(docCount / perPage),
      currentPage: page,
      perPage,
    });
  } catch (error) {
    console.log(error);
  }
};
//render women page
exports.Women = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 8;
    const docCount = await Product.countDocuments({});
    const products = await Product.find({ gender: "Women" })
      .skip((page - 1) * perPage)
      .limit(perPage);
    loggedin = req.session.userloggedIn;
    const cartCount = req.cartCount;
    res.render("user/Women", {
      products,
      loggedin,
      cartCount,
      totalPages: Math.ceil(docCount / perPage),
      currentPage: page,
      perPage,
    });
  } catch (error) {
    console.log(error);
  }
};

//verify email for validation
(exports.emailVerify = async (req, res, next) => {
  const response = {};
  try {
    const vUser = await User.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
    }).exec();
    if (vUser) {
      response.success = false;
      res.status(500).send({
        response,
        success: false,
        message: "User found",
      });
    } else {
      res.status(200).send({ success: true, message: "No user found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error verifying user" });
  }
}),
  //otp send and verifications
  (exports.sendOtp = async (req, res, next) => {
    const response = {};
    try {
      console.log(req.body.mobile);
      if (!req.session.otP) {
        req.session.otP = Math.floor(100000 + Math.random() * 900000);
      } else {
      }
      console.log(req.session.otP);
      otp
        .OTP(req.body.mobile, req.session.otP)
        .then((response) => {
          console.log("aaaaa");
          response.success = true;
          console.log(response);

          res.status(200).send({
            response,
            success: true,
            message: "OTP Sent successfully",
          });
        })
        .catch((error) => {
          console.log("gggg");
          res
            .status(500)
            .send({ success: false, message: "Error sending OTP" });
        });
    } catch (error) {
      console.log(error);
    }
  }),
  //sended otp and enter otp varification
  (exports.verifyOtp = async (req, res, next) => {
    const response = {};
    try {
      if (parseInt(req.body.userOtp) === req.session.otP) {
        res.status(200).send({
          success: true,
          response,
          message: "OTP verified successfully",
        });
      } else {
        req.session.errmsg = "Invalid Otp";
        res.status(500).send({ success: false, message: "Invalid Otp" });
      }
    } catch (error) {
      console.log(error);
    }
  });

exports.addToWishList = async (req, res) => {};

exports.getSignOtpIn = (req, res, next) => {
  res.render("user/otpLogin", {
    title: "user",
    err_msg: req.session.errmsg,
    loggedin: false,
    noShow: true,
    cartItems: req.cartItems,
  });
  req.session.errmsg = null;
};
//////////////////////
exports.verifyMobileOtp = async (req, res, next) => {
  try {
    if (parseInt(req.body.userOtp) === req.session.otP) {
      const newUser = await User.findOne({ mobile: req.body.mobile });
      if (newUser) {
        if (newUser.isActive === true) {
          console.log("user exists");
          req.session.user = newUser;
          req.session.userloggedIn = true;
          console.log(newUser);
          res.redirect("/home");
        } else {
          req.session.errmsg = "Account was Blocked. Contact Us.";
          res.status(402).redirect("/login");
        }
      } else {
        req.session.errmsg = "Invalid Username or Password";
        res.status(400).redirect("/login");
      }
    } else {
      req.session.errmsg = "Invalid OTP";
      res.status(500).send({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.mobileVerify = async (req, res, next) => {
  const response = {};
  try {
    const newUser = await User.findOne({ mobile: req.body.mobile });
    console.log("dbxs");
    if (newUser) {
      response.success = true;
      console.log("dbxs", response);

      res.status(200).send({
        response,
        success: true,
        message: "User found",
      });
    } else {
      console.log("dbxsdxsa");

      res.status(500).send({ success: false, message: "No user found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error verifying user" });
  }
};

exports.verifyMobileOtpwithforget = async (req, res, next) => {
  try {
    const { mobile, userOtp } = req.body;

    // Verify the OTP
    if (parseInt(userOtp) !== req.session.otP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Find the user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the user account is active
    if (!user.isActive) {
      return res
        .status(402)
        .json({ success: false, message: "Account was blocked. Contact us." });
    }

    req.session.user = user;
    res
      .status(200)
      .json({ success: true, message: "OTP verification successful" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again later.",
      });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.session.user._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password
    await User.updateOne({ _id: userId }, { password: hashedPassword });

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again later.",
      });
  }
};
