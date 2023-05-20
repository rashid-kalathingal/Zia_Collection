const bcrypt = require("bcrypt");
const Admin = require("../models/adminSchema");
const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Order = require("../models/orderSchema");
const XLSX = require("xlsx");
const { ObjectId } = require("mongodb");
const jsPDF = require("jspdf");
const PDFDocument = require("pdfkit");

//checking user data with existing data
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

exports.dashboard = function (req, res, next) {
  res.render("admin/dashboard", { noShow: true });
};
exports.banner = function (req, res, next) {
  res.render("admin/banner", { noShow: true });
};
exports.category = function (req, res, next) {
  res.render("admin/category", { noShow: true });
};

exports.order = function (req, res, next) {
  res.render("admin/order", { noShow: true });
};

exports.sales = function (req, res, next) {
  res.render("admin/salesreport", { noShow: true });
};

//admin side user controller
exports.user = async (req, res) => {
  try {
    let adminDetails = req.session.admin;
    const userList = await User.find({});
    res.render("admin/user", {
      userList,
      admin: true,
      adminDetails,
      noShow: true,
    });
  } catch (error) {
    console.log(error);
  }
};

//admin side user management below
exports.blockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: false });
  res.redirect("/admin/user");
};
exports.unBlockUser = async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { isActive: true });
  res.redirect("/admin/user");
};
//admin side order management and manipulate page
exports.Orders = async (req, res) => {
  let userId = req.session.user;
  try {
    let orders = await Order.find()
      .populate({
        path: "userId",
        model: "User",
        select: "name email", // select the fields you want to include from the User document
      })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();

    res.locals.orders = orders;

    //console.log(orders,"all orders");

    res.render("admin/Order", { noShow: true });
  } catch (error) {
    console.log(error);
  }
};
//deatil of order shown in admin page
exports.orderDetailsAdmin = async (req, res) => {
  console.log(req.body, "selected ");

  let productId = req.query.productId;
  let orderId = req.query.orderId;

  const deliveryStatus = req.body.deliveryStatus;

  let orders = await Order.find({ _id: orderId })
    .populate({
      path: "products.item",
      model: "Product",
    })
    .exec();

  console.log(orders, "ord");

  let product = null;
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    product = order.products.find(
      (product) => product.item._id.toString() === productId
    );
    console.log(product, "products found");
    if (product) {
      if (deliveryStatus == "cancelled") {
        product.orderstatus = deliveryStatus;
        product.deliverystatus = deliveryStatus;
      } else {
        product.orderstatus = "confirmed";
        product.deliverystatus = deliveryStatus;
      }

      await order.save();
      break; // Exit the loop once product is found
    }
  }

  res.redirect("/admin/order");
};

exports.logout = function (req, res) {
  req.session.loggedIn = false;
  req.session.admin = null;
  res.redirect("/admin");
};

//admin side user management below
exports.softdeleteproduct = async (req, res) => {
  try {
    await Product.updateOne({ _id: req.params.id }, { deleted: true }).exec();
    res.redirect("/admin/product");
  } catch (error) {
    console.error(error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }
};

exports.undoproduct = async (req, res) => {
  try {
    await Product.updateOne({ _id: req.params.id }, { deleted: false }).exec();
    res.redirect("/admin/product");
  } catch (error) {
    console.error(error);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }
};

exports.salesSummary = async (req, res) => {
  let adminDetails = req.session.admin;
  let orders = await Order.find()
    .populate({
      path: "userId",
      model: "User",
      select: "name email", // select the fields you want to include from the User document
    })
    .populate({
      path: "products.item",
      model: "Product",
    })
    .exec();

  if (req.session.AdminloggedIn.orderThisWeek) {
    res.locals.orders = req.session.AdminloggedIn.orderThisWeek;
    req.session.AdminloggedIn.orderThisWeek = null;
  } else if (req.session.AdminloggedIn.orderThisMonth) {
    res.locals.orders = req.session.AdminloggedIn.orderThisMonth;
    req.session.AdminloggedIn.orderThisMonth = null;
  } else if (req.session.AdminloggedIn.orderThisDay) {
    res.locals.orders = req.session.AdminloggedIn.orderThisDay;
    req.session.AdminloggedIn.orderThisDay = null;
  } else if (req.session.AdminloggedIn.orderThisYear) {
    res.locals.orders = req.session.AdminloggedIn.orderThisYear;
    req.session.AdminloggedIn.orderThisYear = null;
  } else {
    res.locals.orders = orders;
  }
  console.log(orders, "sales reprot order summaryu");
  res.render("admin/salesReport", { admin: true, adminDetails, noShow: true });
};

exports.salesReport = async (req, res) => {
  console.log(req.body.selector, "report body ");
  const selector = req.body.selector;

  // Extracting the relevant parts based on the selector
  let year, month, weekStart, weekEnd, day;
  if (selector.startsWith("year")) {
    year = parseInt(selector.slice(5));
  } else if (selector.startsWith("month")) {
    const parts = selector.split("-");
    year = parseInt(parts[1]);
    month = parseInt(parts[2]);
  } else if (selector.startsWith("week")) {
    const today = new Date();
    weekStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    weekEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay() + 6
    );
    console.log(weekStart, "weekstart");
    console.log(weekEnd, "weekEnd");
  } else if (selector.startsWith("day")) {
    day = new Date(selector.slice(4));
    day.setHours(0, 0, 0, 0);
  }

  if (weekStart && weekEnd) {
    const orderThisWeek = await Order.find({
      createdAt: { $gte: weekStart, $lte: weekEnd },
    })
      .populate({
        path: "userId",
        model: "User",
        select: "name email", // select the fields you want to include from the User document
      })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
    req.session.AdminloggedIn.orderThisWeek = orderThisWeek;
    console.log(orderThisWeek, "details of this week");
    return res.redirect("/admin/sales-report");
  }

  if (year && month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const orderThisMonth = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate({
        path: "userId",
        model: "User",
        select: "name email", // select the fields you want to include from the User document
      })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
    req.session.AdminloggedIn.orderThisMonth = orderThisMonth;
    console.log(orderThisMonth, "details of this month");
    return res.redirect("/admin/sales-report");
  }

  if (day) {
    const startOfDay = new Date(day);
    const endOfDay = new Date(day);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setSeconds(endOfDay.getSeconds() - 1);
    const orderThisDay = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate({
        path: "userId",
        model: "User",
        select: "name email", // select the fields you want to include from the User document
      })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
    req.session.AdminloggedIn.orderThisDay = orderThisDay;
    console.log(orderThisDay, "details of this day");
    return res.redirect("/admin/sales-report");
  }
  if (year) {
    const orderThisYear = await Order.find({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59, 999),
      },
    })
      .populate({
        path: "userId",
        model: "User",
        select: "name email", // select the fields you want to include from the User document
      })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
    req.session.AdminloggedIn.orderThisYear = orderThisYear;
    console.log(orderThisYear, "details of this year");
    return res.redirect("/admin/sales-report");
  }
};
