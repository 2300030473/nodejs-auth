const Image=require('../models/Image');
const {uploadToCloudinary}=require('../helpers/cloudinaryHelper')
const fs=require('fs')

const cloudinary=require('../config/cloudinary')

const uploadImagecontroller=async(req,res)=>{
    try{
        // check if file is missing in req object
        if(!req.file){
            return res.status(400).json({
                succcess:false,
                message:'file is required. please upload an image'
            })
        }
        //upload to cloudinary
        const {url,publicId}=await uploadToCloudinary(req.file.path)

        //store the image url and public id along with the uploaded user id in the database

        const newUploadedImage=new Image({
            url,
            publicId,
            uploadedBy:req.userInfo.userId
        })
        await newUploadedImage.save();
        //delete the file from local storage
        fs.unlinkSync(req.file.path);
        res.status(201).json({
            success:true,
            message:'Image uploaded successfully',
            image:newUploadedImage,
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:'something went wrong! please try again'
        })
    }
};

const fetchImagesContoller=async(req,res)=>{
    try{
        const page=parseInt(req.query.page)||1;
        const limit=parseInt(req.query.limit)||2;

        const skip=(page-1)*limit;

        const sortBy=req.query.sortBy||'createdAt';
        const sortOrder=req.query.sortOrder==='asc'?1:-1

        const totalImages=await Image.countDocuments();
        const totalPages=Math.ceil(totalImages/limit)

        const sortObj={};
        sortObj[sortBy]=sortOrder
        const images=await Image.find().sort(sortObj).skip(skip).limit(limit);
        if(images){
            res.status(200).json({
                succcess:true,
                curentPage:page,
                totalPages:totalPages,
                totalImages:totalImages,
                data:images,
            })
        }
    }catch(e){
        console.log(error);
        res.status(500).json({
            success:false,
            message:'something went wrong! please try again'
        })
    }
}

const deleteImageController=async(req,res)=>{
    try{
        const getCurrentIdOfImagetoBeDeleted=req.params.id;
        const userId=req.userInfo.userId;

        const image=await Image.findById(getCurrentIdOfImagetoBeDeleted)
        if(!image){
            return res.status(404).json({
                success:false,
                message:"Image is not found"
            })
        }

        //chck if this image is uploaded by the current user who is trying to delete this image

        if(image.uploadedBy.toString()!==userId){
            return res.status(403).json({
                succes:false,
                message:"you are not authorized to delete this image because you havent uploaded it ."
            })
        }
        //delete this image first from cloudinary storage
        await cloudinary.uploader.destroy(image.publicId);

        //delete this image from mongodb 

        await Image.findByIdAndUpdate(getCurrentIdOfImagetoBeDeleted)
        res.status(200).json({
            success:true,
            message:'Image deleted successfully'
        })

    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:'something went wrong! please try again'
        })
    }
}

module.exports={
    uploadImagecontroller,
    fetchImagesContoller,
    deleteImageController,
}