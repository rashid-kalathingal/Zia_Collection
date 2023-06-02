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
const Wallet = require("../models/walletSchema");
const { returnOrder } = require("./orderController");

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

exports.dashboard = async (req, res, next) => {
  let adminDetails = req.session.admin;
  const orders = await Order.find({})
    .populate({
      path: "products.item",
      model: "Product",
    })
    .exec();

  const totalQuantity = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      accumulator += product.quantity;
    });
    return accumulator;
  }, 0);

  const totalProfit = orders.reduce((acc, order) => {
    return acc + order.totalAmount;
  }, 0);

  const totalShipped = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      if (product.deliverystatus === "shipped") {
        accumulator += 1;
      }
    });
    return accumulator;
  }, 0);
  const totalCancelled = orders.reduce((accumulator, order) => {
    order.products.forEach((product) => {
      if (product.orderstatus === "cancelled") {
        accumulator += 1;
      }
    });
    return accumulator;
  }, 0);

 
  //console.log(orders.products,"zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");


 

  const categoryCounts = await (async () => {
    try {
      // Retrieve all orders
      console.log(orders, "order details");
  
      // Object to store category names and their respective count
      const categoryCount = {};
  
      // Iterate over the orders
      for (const order of orders) {
        // Iterate over the products within each order
        for (const product of order.products) {
          // Retrieve the category from the "item" field
          const categoryId = product.item.category;
  
          // Populate the category field with actual category data
          const category = await Category.findById(categoryId).exec();
  
          // Increment the category count
          if (category) {
            const categoryName = category.category;
  
            if (categoryCount[categoryName]) {
              categoryCount[categoryName].count++;
            } else {
              categoryCount[categoryName] = {
                name: categoryName,
                count: 1,
              };
            }
          }
        }
      }
  
      // Object to store category names and their respective count
      const categoryCounts = {};
  
      // Output the category names and counts
      for (const categoryName in categoryCount) {
        const categoryData = categoryCount[categoryName];
        console.log(`Category: ${categoryData.name}, Count: ${categoryData.count}`);
        categoryCounts[categoryData.name] = categoryData.count;
      }
  
      console.log(categoryCounts);
  
      // Return the categoryCounts object
      return categoryCounts;
    } catch (error) {
      console.error(error);
    }
  })();
  
  
  
     console.log(categoryCounts,"cxcxccxcxccxccxcxc");




  function countPaymentMethods(orders) {
    let paymentCounts = {
      RazorPay: 0,
      COD: 0,
      Wallet: 0,
    };

    for (let order of orders) {
      const paymentMethod = order.paymentMethod;

      switch (paymentMethod) {
        case "RazorPay":
          paymentCounts.RazorPay++;
          break;
        case "COD":
          paymentCounts.COD++;
          break;
        case "Wallet":
          paymentCounts.Wallet++;
          break;
      }
    }

    return paymentCounts;
  }

  function calculatePaymentMethodPercentage(orders) {
    let paymentCounts = countPaymentMethods(orders);
    let totalOrders = orders.length;

    let paymentPercentages = {};

    for (let paymentMethod in paymentCounts) {
      let count = paymentCounts[paymentMethod];
      let percentage = (count / totalOrders) * 100;
      paymentPercentages[paymentMethod] = percentage.toFixed(2) + "%";
    }

    return paymentPercentages;
  }

  const paymentPercentages = calculatePaymentMethodPercentage(orders);
  console.log(paymentPercentages);

  //console.log(totPayment,"xxxxxxxxxxxx");

  const startOfYear = new Date(new Date().getFullYear(), 0, 1); // start of the year
  const endOfYear = new Date(new Date().getFullYear(), 11, 31); // end of the year

  let orderBasedOnMonths = await Order.aggregate([
    // match orders within the current year
    { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } } },

    // group orders by month
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $push: "$$ROOT" },
      },
    },

    // project the month and orders fields
    {
      $project: {
        _id: 0,
        month: "$_id",
        orders: 1,
      },
    },
    {
      $project: {
        month: 1,
        orderCount: { $size: "$orders" },
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  // console.log(orderBasedOnMonths, "vall");
  order_count = orderBasedOnMonths[0]["orderCount"];
  // console.log(order_count);
  //  console.log(totalQuantity,totalProfit,totalShipped,totalCancelled,'ordercount')
  res.render("admin/dashboard", {
    admin: true,
    adminDetails,
    totalQuantity,
    order_count,
    totalProfit,
    totalShipped,
    totalCancelled,
    orderBasedOnMonths,
    noShow: true,
    paymentPercentages,
    categoryCounts,
  });
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

    res.render("admin/order", { noShow: true });
  } catch (error) {
    console.log(error);
  }
};

exports.orderDetailsAdmin = async (req, res) => {
  try {
    const idString = String(req.params.id);
    const [orderId, productId] = idString.split("&");
    console.log(orderId, "Order ID");
    console.log(productId, "Product ID");

    const deliveryStatus = req.body.deliveryStatus;

    let orders = await Order.find({ _id: orderId })
      .populate({
        path: "products.item",
        model: "Product",
      })
      .exec();
     
    for (let i = 0; i < orders.length; i++) {
      let order = orders[i];
      let product = order.products.find(
        (product) => product.item._id.toString() === productId
      );
      console.log(product, "Product found");

      console.log(order.paymentMethod, "1");
      console.log(product.deliverystatus, "2");
      console.log(product.orderstatus, "3");
      console.log(product.currentPrice, "4");
      console.log(product.reason,"5");

      let walletPayment = order.paymentMethod;
      let walletDelivery = product.deliverystatus;
      let walletOrderstatus = product.orderstatus;
      let walletBalance = product.currentPrice;
      let reason=product.reason;

      if (walletOrderstatus === "cancelled" && walletDelivery === "cancelled") {
        
        if (walletPayment === "RazorPay") {
          // Add Razorpay amount to wallet balance

          const wallet = await Wallet.findOne({ userId: order.userId });
          if (wallet) {
            wallet.balance += walletBalance;
            // wallet.transactions.push({
            //   date: new Date(),
            //   type: "credit",
            //   value: walletBalance,
            //   reason: reason
            // });
        
            await wallet.save();
            console.log("1234");
            console.log(wallet);
          }
        }
      } else if (
        walletOrderstatus === "returned" ||
        walletDelivery === "returned"
      ) {
        // Add all payment amounts (COD and Razorpay) to wallet balance
        const wallet = await Wallet.findOne({ userId: order.userId });
        if (wallet) {
          order.products.forEach((orderProduct) => {
            wallet.balance += walletBalance;
            // wallet.transactions.push({
            //   date: new Date(),
            //   type: "credit",
            //   value: walletBalance,
            //   reason: reason
            // });
          });
          await wallet.save();
          console.log("12345");
          console.log(wallet);
        }
      }

      if (product) {
        if (deliveryStatus === "cancelled") {
          product.orderstatus = deliveryStatus;
          product.deliverystatus = deliveryStatus;
        } else {
          product.orderstatus = "confirmed";
          product.deliverystatus = deliveryStatus;
        }

        await order.save();
      }
    }

    res.redirect("/admin/order");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
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
  let adminDetails = req.session.AdminloggedIn;
  let orders = await Order.find()
    .populate({
      path: "userId",
      model: "User",
      select: "name email",
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
  var startingDate = req.body.startingDate;
  var endingDate = req.body.endingDate;

  let orders = await Order.find()
    .populate({
      path: "userId",
      model: "User",
      select: "name email",
    })
    .populate({
      path: "products.item",
      model: "Product",
    })
    .exec();

  // Filter the orders based on the starting and ending dates
  var filteredOrders = orders.filter(function(order) {
    var orderDate = new Date(order.createdAt).toISOString().split("T")[0];
    return orderDate >= startingDate && orderDate <= endingDate;
  });

  res.send(filteredOrders);
};
