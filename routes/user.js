var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const Product = require('../controllers/productController')
const mongoose= require('mongoose')
const User = require("../models/userSchema");

//middleware for preventing loading for strangers
function userauth(req,res, next){
  if(req.session && req.session.user && req.session.userloggedIn){
    res.redirect("/home")
  }else{
    next()
  }
}
function verify(req,res, next){
  if(req.session && req.session.user && req.session.userloggedIn ){
    next();
  }else{
    res.redirect("/login")
  }
} 


/* GET users listing. */
router.get('/home',verify,cartController.cartCount,userController.home) 
router.get('/',userauth,cartController.cartCount,userController.home)
router.get('/login',userauth, userController.login)
router.get('/about',cartController.cartCount,userController.about)
router.get('/product',cartController.cartCount, userController.product)

router.get('/blog',cartController.cartCount,userController.blog)
router.get('/contact',cartController.cartCount,userController.contact) 
router.get('/signUp',userauth,userController.signUp)
router.get('/OTP',userauth,userController.OTP)
router.get('/logout',userController.logout)
router.get('/oneproduct/:id',cartController.cartCount,userController.oneproduct)
router.get('/Men',cartController.cartCount,userController.Men)
router.get('/Women',cartController.cartCount,userController.Women)
 router.post('/signup', userController.postSignup)
 router.post('/login',userController.postLogin)
 router.post("/sendotp", userController.sendOtp);
 router.post("/verifyotp", userController.verifyOtp);
 router.post("/emailexists", userController.emailVerify);
 //router.get('/singleProduct/:id',userController.userSingleProduct)

//cart
//router.get('/shoping-cart', userController.shopping_cart)
router.get('/addtocart/:id',cartController.cartCount,cartController.addtoCart)   //userController.isLogin,
router.get('/cart',cartController.cartCount,cartController.getCartProducts,userController.shopping_cart)
router.post('/changeProductQuantity',cartController.changeProductQuantity)
router.post('/removeItem',cartController.removeItem)
router.get('/product-size-selector',cartController.productSizeSelector)

module.exports = router;
