const expressAsyncHandler = require("express-async-handler");
const Chat = require('../models/chatModel');
const User = require("../models/userModel");
const mongoose = require('mongoose')

const accessChat = expressAsyncHandler( async(req, res) =>{
    const {userId} = req.body;

    if(!userId){
        console.log("userId param not sent with request");
        return res.sendStatus(400);
    }
    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            {users: {$elemMatch: {$eq: req.user._id}}},
            {users: {$elemMatch: {$eq: userId } } }
        ]
    }).populate("users", "-password").populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: 'name pic email'
    })

    if(isChat.length > 0){
        res.send(isChat[0])
    }
    else{
        var chatData  = {
            chatName : 'sender',
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try{
            const createdChat = await Chat.create(chatData);

            const FullChat = await Chat.findOne({_id: createdChat._id})
            .populate('users', '-password');

            res.status(200).send(FullChat)
        }
        catch(err){
            res.status(400);
            throw new Error(err.message);
        }

    }
})

const fetchChats = expressAsyncHandler( async(req, res) => {
    try{
        Chat.find({
            users: {$elemMatch: {$eq: req.user._id} }
        })
        .populate('users', "-password")
        .populate('groupAdmin', "-password")
        .populate('latestMessage')
        .sort({updatedAt: -1})
        .then( async( result) => {
            result = await User.populate(result, {
                path: "latestMessage.sender",
                select: "name pic email",
            })
            res.status(200).send(result)
        })

    }
    catch(error){
        res.status(400);
        throw new Error(error.message);
    }
})

const createGroupChat = expressAsyncHandler( async(req, res) => {
    if(!req.body.users || !req.body.name){
        return res.status(400).send({message: "Please Fill all the feilds"});
    }

    //we can't send array directly so we have to send the array in stringfy format and here we have to parse it to make it back to it's original form
    var users = JSON.parse(req.body.users)

    if( users.length < 2){
        return res
            .status(400)
            .send("More than 2 users are required to form a froup chat");
    }

    //adding the current logined user (the user how creates the group, that does come in the user array in the req.body)
    users.push(req.user);

    try{

        //to create the group 
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        });

        //fetch the group from the db and send it back to the user  
        const fullGroupChat = await Chat.findOne({
            _id : groupChat._id
        })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat);
    }
    catch(error){
        res.status(400)
        throw new Error("someting went wrong")
    }
    

})


const renameGroup = expressAsyncHandler( async(req, res) => {
    const {chatId, chatName} = req.body;
    
    
    try{    
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId
        ,{
            chatName
        },{
            new: true,
        }
        ).populate("users", "-password")
        .populate("groupAdmin", "-password")

        if(!updatedChat){
            res.status(404);
            throw new Error("Chat not found");
        }
        else{
            res.json(updatedChat);
        }
    }
    catch(err){
        console.log(err);
        throw new Error(err.message)
    }
    
})

const addToGroup = expressAsyncHandler( async(req, res) => {
    const {chatId, userId} = req.body

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {users: userId},
        },{
            new: true,
        }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(added){
        res.json(added)
    }
    else{
        res.status(404)
        throw new Error("Added new member to group failed!")
    }
})

const removeFromGroup = expressAsyncHandler( async(req, res)=>{
const {chatId, userId} = req.body

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: {users: userId},
        },{
            new: true,
        }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(removed){
        res.json(removed)
    }
    else{
        res.status(404)
        throw new Error("Added new member to group failed!")
    }
})

module.exports = {accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup}