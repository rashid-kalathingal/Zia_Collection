const bcrypt = require("bcrypt");
const User = require("../models/userSchema");
const otp = require("../controllers/otp");
const mongoose = require("mongoose");
const Product=require("../models/productSchema")

exports.postSignup = async (req, res) => {
  try {
   
    const existingUser  = await User.findOne({email:req.body.email})
    if(existingUser){
      console.log(`User with ${req.body.email} already exist`)
      res.redirect('/signup')
    }else{
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
  }} catch (error) {
    console.log(error);
    res.redirect("/signup");
  }
};



exports.postLogin = async (req, res) => {
  try {
    const newUser = await User.findOne({ email: req.body.email ,isActive:true});
    console.log(newUser);
    if (newUser ) {
    
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
    }
  } catch (error) {
    console.log(error);
  }
}; 

exports.home=async function (req, res, next) {
  try{
    const products = await Product.find();
          loggedin=req.session.userloggedIn
   // console.log("zzzzz");
   const cartCount = req.cartCount;
    res.render('user/home',{noShow:true,products,loggedin,cartCount})
  }catch(error){
    console.log(error);
  }  
};


exports.login= function(req, res, next) {
  loggedin=req.session.userloggedIn
  
    res.render('user/login',{noShow:true, loggedin})
   
  };

exports.about= function(req, res, next) {
  loggedin=req.session.userloggedIn
  const cartCount = req.cartCount;
  res.render('user/about',{loggedin,cartCount})
};

exports.product=function(req, res, next) {
  const cartCount = req.cartCount;
  loggedin=req.session.userloggedIn
  res.render('user/product',{loggedin,cartCount})
};





exports.oneproduct = async (req,res)=>{
  try {
    let id = req.params.id
   // console.log(id);
    const singleProduct = await Product.findById(req.params.id);
    console.log(singleProduct);
   // let objId = new ObjectId(id)
    
   // let singleProduct = await Product.findOne({_id:objId})
   // let user = req.session.user;

    // Access cartCount value from req object
  //const cartCount = req.cartCount;
  loggedin=req.session.userloggedIn
  const cartCount = req.cartCount;
    res.render('user/oneproduct',{singleProduct,loggedin,cartCount})//passing the singleProduct values while rendering the page...
  } catch (error) {
    console.log(error)
  }
}



exports.blog= function(req, res, next) {
  loggedin=req.session.userloggedIn
  const cartCount = req.cartCount;
  res.render('user/blog',{loggedin,cartCount})
};

exports.shopping_cart= function(req, res, next) {
  loggedin=req.session.userloggedIn
  // console.log("🔥🔥🔥🔥🔥");
  const cartCount = req.cartCount;
   res.render('user/cart',{loggedin,cartCount})
};

exports.contact=function(req, res, next) {
  loggedin=req.session.userloggedIn
  const cartCount = req.cartCount;
  res.render('user/contact',{loggedin,cartCount})
};

exports.signUp=function(req, res, next) {
  loggedin=req.session.userloggedIn
  res.render('user/signUp1',{noShow:true,loggedin})
};

exports.OTP= function(req, res, next) {
  loggedin=req.session.userloggedIn
  res.render('user/OTP',{noShow:true,loggedin})
};

exports.logout=function(req,res){
  req.session.userloggedIn = false
 req.session.user=null
 res.redirect('/login')
};


exports.Men=async function(req, res, next) {
  try{
    const products = await Product.find({"gender":"Men"});
    loggedin=req.session.userloggedIn
    const cartCount = req.cartCount;
  res.render('user/Men',{products,loggedin,cartCount})
}catch(error){
  console.log(error);
}   
};

exports.Women=async function(req, res, next) {
  try{
    const products = await Product.find({"gender":"Women"});
    loggedin=req.session.userloggedIn
    const cartCount = req.cartCount;
  res.render('user/Women',{products,loggedin,cartCount})
}catch(error){
  console.log(error);
}   
};




exports.emailVerify= async (req, res, next) => {
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
},

//otp send and verifications
exports.sendOtp= async (req, res, next) => {
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
},

exports.verifyOtp= async (req, res, next) => {
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
  }