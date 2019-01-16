//==========================================
//All dependencies will be here.
//==========================================

var express =require("express");
var app=express();
var {mongoose}=require("./db/mongoose.js");
var {Todo}=require('./models/todo.js');
var bodyparser=require('body-parser');
var {ObjectID}=require("mongodb");
var {User}=require('./models/user.js');
const _=require('lodash');
const {authenticate}=require('./middleware/authenticate');

var cookieParser = require("cookie-parser");

app.use(cookieParser());

const port=process.env.PORT||3200;
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/views'));
//==========================================
// All routes and process here 
//==========================================

     
 
    //Post route
			app.post('/todos/:token',authenticate,(req,res)=>{
                
                var todo=new Todo({
                	text:req.body.text,
                	completed:req.body.completed,
                  _creater:req.user._id,
                  ttype:req.body.ttype
                });

               todo.save().then((doc)=>{
               	res.status(200).send("successfully Created!!");
               },
               (e)=>{
               	res.status(400).send(e);

               });


			});

     

	//Get Route
			app.get('/todos/:token',authenticate,(req,res)=>{
				
				Todo.find({
          _creater:req.user._id
        }).then((todos)=>{
					res.send(todos);
				},(e)=>{
				 res.send("There might be an error");
				});
				
			});		

	//Get by id
	
	    app.get('/todos/single/:token/:id',authenticate,(req,res)=>{
	    	var id =req.params.id;
             if(!ObjectID.isValid(id)){
             	return res.send("Id is not valid");
             }
             Todo.findOne({
              _id:id,
              _creater:req.user._id
             }).then((todo)=>{
             	if(!todo){
                 return res.status(404).send("No such todo is present in database it might be deleted");
             	}
             	res.send(todo);


             }).catch((e)=>{
             	res.status(400).send(e);
             });

	    });

	//Delete Route

	   app.delete('/todos/:token/:id',authenticate,(req,res)=>{
	   	var id=req.params.id;
	   	if(!ObjectID.isValid(id)){
	   		return res.send("Id is not valid");
	   	}
	   	Todo.findOneAndRemove({
        _id:id,
        _creater:req.user._id
      }).then((todo)=>{
	   		if(!todo){
	   			return res.send("No item is deleted");
	   		}
	   		res.send("successfully deleted!!");
	   	}).catch((e)=>{
	   		res.status(400).send(e);
	   	});
	   });

    //update Route

       app.patch("/todos/:token/:id",authenticate,(req,res)=>{
       	var id =req.params.id;
       	if(!ObjectID.isValid(id)){
       		return res.send("Id is not valid");
       	}
        var body=req.body;
       	Todo.findOneAndUpdate({_id:id,_creater:req.user._id},{$set:body},{new:true}).then((todo)=>{
       		if(!todo){
       			return res.status(400).send("No such todo exist");
       		}
       		res.send("successfully Updated!!");

       	}).catch((e)=>{
       		res.status(400).send("ERROR!!");
       	});
       });






//================================================
// user routes 
//================================================
    //post route for signup


     app.post('/users',(req,res)=>{

         var body=_.pick(req.body,['email','password']);
         body.email=body.email.toLowerCase();
         
         var user =new User(body);

         user.save().then(()=>{
          return user.generateAuthToken();
          
         }).then((token)=>{
          
          res.setHeader('Set-Cookie',[`x-auth=${token}`]);
          res.send(`You are successfully logged in and your access token is : ${token}`);
         }).catch((e)=>{
        
          res.status(400).send('Error!');
         });

     });
  //get route

  app.get('/users/me/:token',authenticate,(req,res)=>{
    res.send(req.user);
  });

  //post route for login

  app.post('/users/login',(req,res)=>{
    

         var body=_.pick(req.body,['email','password']);
         body.email=body.email.toLowerCase();
         User.findByCredentials(body.email,body.password).then((user)=>{
         return user.generateAuthToken();
         }).then((token)=>{
            
          res.send(`Token is :${token}`);
            
          })
          .catch((e)=>{
          res.status(400).send('Invalid Access');
         });

  });
   

   //delete route for user
    app.delete('/users/me/:token',authenticate,(req,res)=>{
        var token=req.params.token;
        req.user.removeToken(token).then(()=>{
          
          res.status(200).send('Token is deleted');
        },()=>{
          res.status(400).send();
        });
    });
//==========================================
//authenticate function
//==========================================



//==========================================
// The server  port Route
//==========================================



app.listen(port,()=>{
	console.log(`I am listening at port ${port}`);
})