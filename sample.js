require("dotenv").config()
const express=require('express')
const ejs=require('ejs')
const JsonWebToken=require("jsonwebtoken")
const bodyParser=require('body-parser')
const _ =require('lodash')
const mongoose=require('mongoose')
const Bcrypt =require("bcryptjs")

mongoose.set({'strictQuery':false})

const app=express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}))
app.set('veiw engine','ejs');

const homeContent=`Welcome to My Daily Journal, your personal space to document your daily experiences, thoughts, and reflections. With our easy-to-use web application, you can create and manage your daily entries with just a few clicks.

Features:

Create and edit entries: Write about your day, your goals, or anything else that comes to mind. You can save your entries as drafts and edit them later.
Add photos and videos: You can upload photos and videos to your entries to capture your memories.
Search and filter: Easily find past entries by searching or filtering by date, tags, or keywords.
Private and secure: Your journal entries are private and secure. Only you can access them, and they are stored in encrypted format.
Getting started:
To get started, simply create an account and start writing your first entry. You can access your journal from any device with an internet connection, so you can write on the go or from the comfort of your own home.

Join the thousands of people who use My Daily Journal to record their thoughts and experiences every day. Sign up now and start your journey towards self-reflection and personal growth.`
const aboutContent=`Welcome to My Daily Journal, a web application designed to help you record your daily experiences, thoughts, and reflections. Our mission is to provide a simple and secure platform for people to document their lives, and to encourage self-reflection and personal growth.

Why keep a journal?
Journaling has been shown to have numerous benefits for mental and emotional well-being. By writing down your thoughts and feelings, you can gain insight into your emotions, clarify your goals, and reduce stress. Plus, keeping a record of your experiences can help you track your progress and see how far you've come.

Our values:

Simplicity: We believe that journaling should be easy and intuitive. That's why we've designed our application to be simple and straightforward, with a clean and minimalist interface that puts the focus on your content.
Security: We take the security and privacy of your data seriously. Our servers are hosted on secure networks, and all communication with our application is encrypted. Your journal entries are stored in encrypted format and are only accessible by you.
Accessibility: We believe that journaling should be accessible to everyone, regardless of their background or circumstances. That's why we've made our application available online, so that you can access it from any device with an internet connection.
Our team:
We are a team of passionate developers and designers who are committed to creating a high-quality journaling experience. We're constantly working to improve our application and add new features, and we welcome feedback from our users.

Thank you for choosing My Daily Journal as your personal space for self-reflection and personal growth. If you have any questions or comments, please don't hesitate to contact us.`
const contactContent=`We value your feedback and would love to hear from you! If you have any questions, comments, or suggestions regarding My Daily Journal, please don't hesitate to get in touch.

\nEmail:\n
You can reach us at support@mydailyjournal.com for any inquiries or feedback related to our application. We aim to respond to all emails within 24 hours.

\nSocial Media:\n
You can also follow us on our social media channels for updates and announcements about our application. We are active on Twitter, Facebook, and Instagram.

\nFeedback:\n
We welcome your feedback and suggestions to improve our application. If you have an idea for a new feature or functionality that you would like to see in My Daily Journal, please let us know. We value your input and strive to make our application as useful and user-friendly as possible.

\nThank you for choosing My Daily Journal as your personal space for self-reflection and personal growth. We look forward to hearing from you soon!`

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

app.post("/signup", (req, res) => {
    if (!req.body.email || !req.body.password) {
      console.log("user credential required");
      return;
    }
  
    User.create({
      email: req.body.email,
      password: Bcrypt.hashSync(req.body.password, 10),
      name: req.body.name,
    })
      .then((user) => {
        const token = JsonWebToken.sign(
          { id: user._id, email: user.email },
          process.env.SECRET_KEY
        );
        res.cookie("token", token);
        res.redirect("/home");
      })
      .catch((err) => {
        console.log(err);
      });
  });

// for login 

app.post("/signin", (req, res) => {
    if (!req.body.email || !req.body.password) {
      console.log("user credential required");
      return;
    }
  
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          console.log("user not exist");
          return;
        }
  
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          console.log("incorrect password");
          return;
        }
  
        const token = JsonWebToken.sign(
          { id: user._id, email: user.email },
          process.env.SECRET_KEY
        );
        res.cookie("token", token);
        res.redirect("/home");
      })
      .catch((err) => {
        console.log(err);
      });
  });

//--------------------------------------------------------------------------------------------------------------

app.get("/home",(req,res)=>{
    const token = req.cookies.token;
    if(token){
        PostDB.find().then(function(posts){
            console.log(posts)
            res.render("index.ejs",{text:homeContent,postsContents:posts})
        });
    }
    else{
        res.sendFile(__dirname+"/signup.html");
    }
    

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