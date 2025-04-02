const user = require('../models/user')
const bcrypt= require('bcryptjs')
const jwt=require('jsonwebtoken')

// register controller
const registerUser=async(req,res)=>{
    try{
        //extract user info from our request body
        const {username,email,password,role}=req.body

        // check if the user already exits in our database

        const checkExistingUser=await user.findOne({$or:[{username},{email}]})
        if(checkExistingUser){
            return res.status(400).json({
                success:true,
                message:'User is already exists either with same username or same email.please try with a different username or email '
            })
        }

        // hash user password

        const salt= await bcrypt.genSalt(10)
        const hashedPassword= await bcrypt.hash(password,salt);

        //create a new user and save in database 

        const newlyCreatedUser= new user({
            username,
            email,
            password:hashedPassword,
            role:role|| 'user'
        })

        await newlyCreatedUser.save()

        if(newlyCreatedUser){
            res.status(201).json({
                success:true,
                message:'User registered succesfully!'
            })
        }else{
            res.status(400).json({
                success:false,
                message:'Unable to register User! please try again'
            })
        }

    }catch(e){
        console.log(e);
        res.status(500).json({
            success:false,
            message:'Some error occured! please try again'
        })
    }
}

//login controller

const loginUser=async(req,res)=>{
    try{
        const {username,password}=req.body
        // find if the current user is exists in database or not
        const User=await user.findOne({username});
        if(!User){
            return res.status(400).json({
                success:false,
                message:`User doesn't exist`
            })
        }
        // if the password is correct or not
        const isPasswordMatch=await bcrypt.compare(password,User.password);
        if(!isPasswordMatch){
            return res.status(400).json({
                success:false,
                message:'Invalid credentials'
            })
        }
        
        //create user token
        const accessToken=jwt.sign({
            userId:User._id,
            username:User.username,
            role:User.role
        },process.env.JWT_SECRET_KEY,{
            expiresIn:'15m'
        })

        res.status(200).json({
            success:true,
            message:'Logged in successful',
            accessToken
        })
        

    }catch(e){
        console.log(e);
        res.status(500).json({
            success:false,
            message:'Some error occured! please try again'
        })
    }
}


const changePassword=async(req,res)=>{
    try{
        const userId=req.userInfo.userId

        // extract old and new password
        const {oldPassword,newPassword}=req.body

        //find the current logged in user
        const User=await user.findById(userId)
        if(!User){
            return res.status(400).json({
                success:false,
                message:'User not found'
            })
        }

        // check if the old password is correct
        
        const isPasswordMatch= await bcrypt.compare(oldPassword,User.password);
        if(!isPasswordMatch){
            return res.status(400).json({
                success:false,message:"Old password is not correct ! please try again.",
            })
        }

        // hash the new password
        const salt=await bcrypt.genSalt(10)
        const newhashedPassword=await bcrypt.hash(newPassword,salt);

        //update user password
        User.password=newhashedPassword
        await User.save();
        res.status(200).json({
            succes:true,
            message:'Password changed successfully',
        })
    }catch(e){
        console.log(e);
        res.status(500).json({
            success:false,
            message:'Some error occured! please try again'
        })
    }
}
module.exports={registerUser,loginUser,changePassword}