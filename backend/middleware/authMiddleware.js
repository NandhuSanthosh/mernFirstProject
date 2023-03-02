const jwt = require('jsonwebtoken')
const User = require("../models/userModel.js")
const asyncHandler = require("express-async-handler")

const protect = asyncHandler( async(req, res, next) =>{
    let token;


    if(req.headers['authorization']){
        try{

            //token will look something like
            // Bearer sfargergfasdf 

            //the split method splits the token by " " (space) and it will store
            //the result in an array and return it
            //then we taken the first index of the array 
            //the 0th would be the Bearer
            const authHeader = req.headers['authorization']
            token = authHeader.split(' ')[1];


            //the token is encrypted i guess in this will decrypt the token using the secret key and store that in the docode variable
            const decode = jwt.verify(token, process.env.JWT_SECRET);

            //using the decode variable with contains the id of the use we find that details of the user in the db and return it without 
            //the password
            req.user = await User.findById(decode.id).select("-password");

            next();
        }
        catch(err){
            res.sendStatus(401)
            throw new Error("Not authorized, token failed ")
        }
    }   
    // if(!token){
    //     res.sendStatus(401)
    //     throw new Error("Not authorized, no token")
    // }
})

module.exports = {protect}