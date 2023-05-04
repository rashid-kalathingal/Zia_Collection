const Category = require('../models/categorySchema')


exports.category = async(req,res)=>{
    try{
        const categorys = await Category.find({});
        res.render('admin/category',{admin:true,categorys,noShow:true});
      }catch(error){
        console.log(error);
      }
}

exports.addCategoryPage = async(req,res)=>{
    let adminDetails =req.session.admin;
    res.render('admin/AddCategory',{admin:true,adminDetails,noShow:true})
  }


exports.postCategory =async (req,res)=>{
    console.log(req.body);
    try{
      const newCategory = new Category({
          category: req.body.category,
          gender: req.body.gender,
          description: req.body.description,
      });
      await Category.create(newCategory);
      console.log(newCategory)
      res.redirect('/admin/category');
    }catch(error){
      console.log(error);
    }
   
  }
  

  exports.blocksCategory = async(req,res)=>{
    await Category.updateOne({_id: req.params.id},{ isListed: false });
    res.redirect('/admin/category')
 }
 exports.unBlocksCategory = async(req,res)=>{
    await Category.updateOne({_id: req.params.id}, { isListed: true });
    res.redirect('/admin/category')
}

exports.getEditCategoryPage = async(req,res)=>{
    try{
         const editCategory = await Category.findOne({_id: req.params.id})
         let adminDetails =req.session.admin;
         res.render('admin/editCategory',{editCategory,admin:true,adminDetails,noShow:true})
      }catch(error){
         console.log(error);
      }
    
  }
  
  
  exports.editCategory = async(req,res)=>{

     try{
      const items = await Category.updateOne({_id:req.params.id},{
        category: req.body.category,
        gender: req.body.gender,
        description: req.body.description,
      })
  
      console.log(items)
      await res.redirect('/admin/category');
      console.log('redirected')
     }catch(error){
       console.log(error)
     }
    };
  
  