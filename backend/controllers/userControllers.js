const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const generateToken = require('../config/generateToken')

const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password, pic} = req.body;

    if( !name || !email || !password) {
        res.status(400);
        throw new Error("Please Enter all the Feilds    ")
    }

    const userExists = await User.findOne( {email});

    if(userExists){
        res.status(400);
        throw new Error("The email is associated with another account.")
    }

    const user = await User.create({
        name,
        email,
        password,
        pic,
    });

    if (user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
    }else{
        res.status(400);
        throw new Error("Failed to create the user");
    }

});


const authUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body;

     const user = await User.findOne({email});

     if(user && (await user.matchPassword(password))){
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
     }
     else{
        res.status(401);
        throw new Error('Invalid Email or Password'); 
     }
});

// /api/user?search=piyush
const allUsers = asyncHandler( async(req, res) => {

    //if req.query.search is true then it will assign the db query in the keyword if req.query.search is false
    //then it wll assign {} to keyword, here keyword is the query variable.
    const keyword = req.query.search 
    ? {
        $or: [
            {name: {$regex: req.query.search, $options: "i"}},
            {email: {$regex: req.query.search, $options: "i"}},
        ],
    }
    : {};


    //the first find method find all the using with matching email or name and the next find method find the users expect the 
    //current user, we don't want to find our name when searching for somebody with similar name\
    let userId = req.user._id.toString();

        const users = await  User.find(keyword).find( {_id : {$ne : userId}})
        res.send(users);

    // const users = await (await User.find(keyword))


})

module.exports = {registerUser, authUser, allUsers};
