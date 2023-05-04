const bcrypt = require("bcrypt");
const Admin = require('../models/adminSchema');
const User = require("../models/userSchema");
// const adminHelper= require("../helpers/adminHelper.js") ;

exports.postLogin = async (req, res) => {
    try {
      const newAdmin = await Admin.findOne({ name: req.body.name });
      console.log(newAdmin);
      if (newAdmin) {
        bcrypt.compare(req.body.password, newAdmin.password).then((status) => {
          if (status) {
            console.log("Admin exist");
            req.session.Admin = newAdmin;
            req.session.AdminloggedIn = true;
            console.log(newAdmin);
            res.redirect("/admin/dashboard");
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
  

  // exports.user= function(req, res, next) {
  //   res.render('admin/user',{noShow:true});
  // };

  exports.dashboard= function(req, res, next) {
    res.render('admin/dashboard',{noShow:true});
  };
  exports.banner= function(req, res, next) {
    res.render('admin/banner',{noShow:true});
  };
  exports.category= function(req, res, next) {
    res.render('admin/category',{noShow:true});
  };
  exports.coupons=function(req, res, next) {
    res.render('admin/coupons',{noShow:true});
  };
  exports.order=function(req, res, next) {
    res.render('admin/order',{noShow:true});
  };




  //admin side user controller
exports.user = async(req,res)=>{
    try{
      let adminDetails =req.session.admin;
        const userList = await User.find({});
        res.render('admin/user',{userList,admin:true,adminDetails,noShow:true});
      }catch(error){
        console.log(error);
      }
  }
  
  //admin side user management below 
   exports.blockUser = async(req,res)=>{
      await User.updateOne({_id: req.params.id},{ isActive: false });
      res.redirect('/admin/user')
   }
   exports.unBlockUser = async(req,res)=>{
      await User.updateOne({_id: req.params.id}, { isActive: true });
      res.redirect('/admin/user')
  }
  
  
  exports.logout=function(req,res){
    req.session.loggedIn = false
   req.session.admin=null
   res.redirect('/admin')
  };

  
