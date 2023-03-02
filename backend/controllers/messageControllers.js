
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const expressAsyncHandler = require('express-async-handler');

const sendMessage = expressAsyncHandler( async(req, res)=>{
    const  { content, chatId } = req.body;

    if(!content || !chatId){
        console.log("Invalid data passed into request")
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    }

    try {
        //putting the message in the db
        var message = await Message.create(newMessage)  

        // we put the message in the database now we have to respond to the user for that we need 
        //  details of the fields, most of the fields in the message is the id, so we are populating
        // the fields from the respective collection to give responce to the user.

        //populating sender's name and pic
        message = await message.populate("sender", "name pic");

        //populatin the details of the chat
        message = await message.populate("chat");

        //populating the users in the chat 
        message = await User.populate(message, {
            path: "chat.users",
            select: 'name pic email',
        })

        //making the latest message of the chat to this message
        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message
        })

        res.json(message);
        console.log(message)
    } catch (error) {
        res.status(400)
        throw new Error(error.message);
    }
});


const allMessage = expressAsyncHandler(async(req, res) => {
    try {
        const messages = await Message.find({chat: req.params.chatId})
            .populate("sender", "name pic email")
            .populate("chat")

        res.json(messages)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

module.exports  ={sendMessage, allMessage}