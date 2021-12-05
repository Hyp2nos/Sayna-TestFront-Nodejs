import express from 'express';
import Datastore from 'nedb';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import dotenv from 'dotenv'; 

dotenv.config();
//Token
const tokenUsers = process.env.TOKEN_USERS;
const tokenUsersPrenium = process.env.TOKEN_USERS_PRENIUM;
const tokenAdmin = process.env.TOKEN_ADMIN;

//Database
const dbUsers = new Datastore({filename : "users"});
const dbSongs = new Datastore({filename: "songs"})
const dbBills = new Datastore({filename: "bills"})
const dbCarts = new Datastore({filename: "carts"})
dbUsers.loadDatabase();
dbSongs.loadDatabase();
dbBills.loadDatabase();
dbCarts.loadDatabase();

//Ratelimiter
const limiter =  rateLimit({
    windowMs : 2*60*1000,
    max: 5
});


//Lancement d'express
const app = express();

app.use(express.json());
app.use("/login",limiter);
//API PLAN

//Affichage de la page index.html
app.get("/" , (req,res)=>{
   try {
        res.sendFile("index.html",{root: '.'});
   } catch (error) {
       res.sendFile("404.html", { root: "." });
   }
});

//Authentification d'un utilisateur
app.post("/login",(req,res)=>{

    const email = req.query.email || req.body.email;
    const pass = req.query.password || req.body.password;       
    const donneManquant = {
        "error":true,"message":"Email/password manquants"
    }

    if (email!= null && pass!= null) {
       dbUsers.find({ $and: [{ email: email },{password:pass}] }, (err, docs) => {
           console.log();
         if (docs.length != 0) {
           res.status(200).send({
             error: false,
             message: "L'utilisateur a été authentifié succés",
             user: {
               firstname: docs[0].firstname,
               lastname: docs[0].lastname,
               role: "xxxxx",
               sexe: docs[0].sexe,
               dateNaissance: docs[0].dateNaissance,
               createdAt: "xxxx",
               updateAt: "xxxxx",
               subscription: "xxxx",
             },
             token: "xxxx",
           });
         } else {
           res
             .status(400)
             .send({ error: true, message: "Email/password incorrect" });
         }
       });   
    }
    else{
        res.status(400).send(donneManquant);
    }
})

//Inscription d'un utilisateur
app.post("/register",(req,res)=>{

    const email = req.query.email || req.body.email;
    const pass = req.query.password || req.body.password;
    const firstname = req.query.firstname || req.body.firstname;
    const lastname = req.query.lastname || req.body.lastname;
    const date_naissance = req.query.date_naissance || req.body.dateNaissance;
    const sexe = req.query.sexe || req.body.sexe;
    const succes = {
        "error":false,"message":"L'utilisateur a bien été créé avec succés","user":{
            "firstname":firstname,"lastname":lastname,"email":email,"sexe":sexe,"datetNaissance":date_naissance,"createdAt":"xxxxx","updateAt":"xxxx","subscription":0
        }
    };
    const error1 = {
        "error":true,"message":"Une ou plusieurs données obligatoire sont manquantes"
    }
    if (email!=null && pass!= null && firstname !=null && lastname != null && date_naissance !=null && sexe != null) {      
       if (validator.isEmail(email) && pass.length >6) {
            dbUsers.find({ email: email }, (err, docs) => {
              if (docs.length != 0) {
                res.status(409).send({"error":true,"message":"Un compte utilisant cette adresse mail est deéjà enregistré"})
              } else {
                dbUsers.insert(req.body);
                res.status(200).send(succes);
              }
            });
        }else{
            res.status(409).send({"error":true,"message":"Une ou plusieurs données sont erronées"});
        }
    }
    else{
        res.status(400).send(error1);
    }
})

//Ajout de carte bancaire
app.put("/user/cart",(req, res) => {
    const succes = {
        "error":false,"message":"Vos données ont été mise à jour"
    };
    const cartNumber = req.body.cartNumber;
    const month = req.body.month;
    const year = req.body.year;
    const defaul = req.body.defaul;
    if (cartNumber!= null && year!= null && month!=null && defaul!= null) {
        if (cartNumber.length>4 && month.length==2 && year.length==4) {
            const bearerToken = bearer(req);
         if (bearerToken == tokenUsers || bearerToken ==  tokenUsersPrenium) {
              dbCarts.find({ cartNumber:cartNumber }, (err, docs) => {
                if (docs.length != 0) {
                  res.status(409).send({ error: true,message:"La carte existe déjà"});
                } else {
                  dbCarts.insert(req.body);
                  res.status(200).send(succes);
                }
              });
         } else {
          if (bearerToken == tokenAdmin) {
              res.status(403).send({"error":true,"message":"Vos droits d'accès ne permettent pas d'accéder à la ressource"})
          }else{
            res.status(401).send({ error: true, message: "Votre token n'est pas correct" });
          }
         }   
        }else{
            res.status(409).send({"error":true,"message":"Une ou plusieurs données sont erronées"})
        }
    }else{
        res.status(402).send({"error":"true","message":"Informations bancaire incorrectes"});
    }
})

//Suppression du compte
app.delete("/user",(req,res)=>{
    const bearerToken = bearer(req);
    if (bearerToken == tokenUsers || bearerToken == tokenUsersPrenium) {
      res.status(200).send({ error: false, message: "Votre compte a été supprimé avec succès" });
    } else {
      res.status(401).send({ error: true, message: "Votre token n'est pas correct" });
    }
})

//Listing des sources audio
app.get("/songs",(req,res)=>{
    const bearerToken = bearer(req);
    if (bearerToken == tokenUsersPrenium) {
        dbSongs.find({},(err,docs)=>{
             res.status(200).send({
               error: false,
               songs: docs
             });
        })
    } else {
     if (bearerToken == tokenUsers) {
        res.status(403).send({ error: true, message: "Votre adonnement ne permet pas d'accéder à la ressource" });
     }else{
        res.status(401).send({ error: true, message: "Votre token n'est pas correct" });
     }
    }

})

//Récupération d'une souece audio
app.get("/songs/:id",(req,res)=>{
    const bearerToken = bearer(req);
    const id = req.params.id;
   if (id!=null) {
        if (bearerToken == tokenUsersPrenium) {
            dbSongs.find({_id:id}, (err, docs) => {
              res.status(200).send({
                error: false,
                songs: docs[0],
              });
            });
        } else {
            res.status(403).send({
              error: true,
              message:"Votre adonnement ne permet pas d'accéder à la ressource",
            });
        }
   }else{
    res.status(409).send({"error":true,"message":"L'audio n'est pas accessibles"})
   }
})

//Récupération des factures
app.get("/bills",(req,res)=>{
    const bearerToken = bearer(req); 
    if (bearerToken==tokenAdmin) {
        dbBills.find({},(err,docs)=>{
             res.status(200).send({
               error: false,
               bill: docs,
             });
        })
    }else{
        res.status(403).send({"error":true,"message":"Vos droits d'accés ne permettent pas d'accéder à la ressource"})
    }

})

function bearer(req) {
    const bearerHeader = req.headers["authorization"];
    if (bearerHeader) {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        return bearerToken;
    }
}

app.listen(3000, (err) =>{
    if (err) {
        console.log(err);
    }
    console.log("Le server est lancer");
})