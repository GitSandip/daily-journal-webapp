require("dotenv").config()
const express=require('express')
const ejs=require('ejs')
const JsonWebToken=require("jsonwebtoken")
const bodyParser=require('body-parser')
const _ =require('lodash')
const mongoose=require('mongoose')
const Bcrypt =require("bcryptjs")
const {homeData, aboutData, contact} = require('./data.js')

mongoose.set({'strictQuery':false})

const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}))
app.set('veiw engine','ejs');

const homeContent= homeData;
const aboutContent= aboutData;
const contactContent=contact;

mongoose.connect("mongodb://localhost:27017/Journal",{useNewUrlParser:true});

const PostSchema=new mongoose.Schema({
    name:String,
    postContent:String
});



const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    }
    
});



const PostDB=mongoose.model("PostDB",PostSchema);
const User =mongoose.model("User",UserSchema);

//-----------------------------------------------------------------------------------------------------------
app.get("/signup",(req,res)=>{
    res.sendFile(__dirname+"/signup.html");
});

app.get("/signin",(req,res)=>{
    res.sendFile(__dirname+"/signin.html");
})



//for sign-up

app.post("/signup",(req,res)=>{
    console.log(req.body);
    if(!req.body.email || !req.body.password){
        console.log("user credential required")
        return
    }

    User.create({
        email:req.body.email,
        password:Bcrypt.hashSync(req.body.password,10),
        name:req.body.name
    }).then((user)=>{
        const token=JsonWebToken.sign({id:user._id,email:user.email},process.env.SECRET_KEY)
        
    }).catch((err)=>{
        console.log(err);
    });
    res.redirect("/home");
});

// for login 

app.post("/signin",(req,res)=>{
    if(!req.body.email || !req.body.password){
        console.log("user credential required")
        return
    }

    User.findOne({email:req.body.email}).then((user)=>{     
        if(!user){
            console.log("user not exist");
        }else{
            if(!Bcrypt.compareSync(req.body.password,user.password)){
                document.getElementById("error-message").innerHTML = "Wrong password!";
                document.getElementById("error-message").style.color = "red";
                console.log("inccorect password");
            }else{
                const token=JsonWebToken.sign({id:user._id,email:user.email},process.env.SECRET_KEY)
                res.redirect("/home");

            }
        }
    }).catch((err)=>{
        console.log(err);
    });
    
});

//--------------------------------------------------------------------------------------------------------------

app.get("/home",(req,res)=>{
    PostDB.find().then(function(posts){
        console.log(posts)
        res.render("index.ejs",{text:homeContent,postsContents:posts})
    });

    // console.log(posts);
});

app.get("/About",(req,res)=>{
    res.render("About.ejs",{Abouttxt:aboutContent})
})

app.get("/contact",(req,res)=>{
    res.render("contact.ejs",{contacttxt:contactContent})
})

app.get("/compose",(req,res)=>{
    res.render("compose.ejs")

    const title=req.body;
    console.log(title)

})

app.get("/post/:id",(req,res)=>{        //route parameters
    
    let route=_.lowerCase(req.params.id);
    console.log(route);
    PostDB.findOne({name:route}).then(function(foundItem){
        console.log(foundItem);
        let pageTitle=_.capitalize(foundItem.name);
        let pageContent=foundItem.postContent;
        res.render("newPost.ejs",{pageTitle:pageTitle,pageContent:pageContent});
        console.log(pageTitle +"  "+route);
    });

})

app.post("/",function(req,res){ 
    const title=_.lowerCase(req.body.Title);
    const post=req.body.Post;
    
    const newPost = new PostDB({
        name:title,
        postContent:post
    });

    newPost.save();
    res.redirect("/home")
})

app.listen(8080,function(){
    console.log("server start...")
})  