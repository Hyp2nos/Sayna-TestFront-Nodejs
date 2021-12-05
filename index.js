import express from 'express';
import Datastore from 'nedb';


const token = "7YUVFTGH";
const tokenPrenium = "AZFTHGJK";
const tokenAdmin = "GHTJKLMB"
const dbUsers = new Datastore({filename : "users"});
dbUsers.loadDatabase();

//Lancement d'express
const app = express();

app.use(express.json());

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
    const pass = req.query.password || req.body.email;
    const succes =
        {"error":false,"message":"L'utilisateur a été authentifié succés","user":{"firstname":"xxxxx","lastname":"xxxxx","role":"xxxxx","sexe":"xxxxxx","dateNaissance":"xxxx-xx-xx","createdAt":"xxxx","updateAt":"xxxxx","subscription":"xxxx"},"token":"xxxx"}
    ;
    const donneManquant = {
        "error":true,"message":"Email/password manquants"
    }

    if (email!= null && pass!= null) {
        res.status(200).send(succes);
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
    }

    const error1 = {
        "error":true,"message":"Une ou plusieurs données obligatoire sont manquantes"
    }

    if (email!=null && pass!= null && firstname !=null && lastname != null && date_naissance !=null && sexe != null) {
       
        res.status(200).send(succes);
    }
    else{
        res.status(400).send(error1);
    }
})

//Ajout de carte bancaire
app.put("/user/cart",(req, res) => {
    const succes = {
        "errror":false,"message":"Vos données ont été mise à jour"
    }
    const bearerToken = bearer(req);
        if (bearerToken == token) {
            res.status(200).send(succes);
        }else{
            res.status(401).send({"error":true,"message":"Votre token n'est pas correct"});
        }
    

})

//Suppression du compte
app.delete("/user",(req,res)=>{
    const bearerToken = bearer(req);
    if (bearerToken == token) {
      res.status(200).send({ error: false, message: "Votre compte a été supprimé avec succès" });
    } else {
      res.status(401).send({ error: true, message: "Votre token n'est pas correct" });
    }
})

//Listing des sources audio
app.get("/songs",(req,res)=>{
    const bearerToken = bearer(req);
    const succes = {
        "error":false,"songs":[{
            "id":"xxxxx","name":"xxxxx","url":"xxxx","cover":"xxxx","time":"xxxx","createdAt":"xxxx","updateAt":"xxxxx","type":"xxxxx"
        }]
    };
    if (bearerToken == tokenPrenium) {
      res.status(200).send(succes);
    } else {
     if (bearerToken == token) {
        res.status(403).send({ error: true, message: "Votre adonnement ne permet pas d'accéder à la ressource" });
     }else{
        res.status(401).send({ error: true, message: "Votre token n'est pas correct" });
     }
    }

})

//Récupération d'une souece audio
app.get("/songs/:id",(req,res)=>{
    const bearerToken = bearer(req);
    const succes = {
      error: false,
      songs: 
        {
          id: "xxxxx",
          name: "xxxxx",
          url: "xxxx",
          cover: "xxxx",
          time: "xxxx",
          createdAt: "xxxx",
          updateAt: "xxxxx",
          type: "xxxxx",
        }
    };
    const id = req.params.id;
   if (id!=null) {
        if (bearerToken == tokenPrenium) {
          res.status(200).send(succes);
        } else {
          if (bearerToken == token) {
            res.status(403).send({
              error: true,
              message:
                "Votre adonnement ne permet pas d'accéder à la ressource",
            });
          } else {
            res
              .status(401)
              .send({ error: true, message: "Votre token n'est pas correct" });
          }
        }
   }else{
    res.status(409).send({"error":true,"message":"L'audio n'est pas accessibles"})
   }
})

//Récupération des factures
app.get("/bills",(req,res)=>{
    const bearerToken = bearer(req);
    const succes = {
        "error":false,"bill":[{
            "id":"xxxxx","id_Stripe":"xxxxx","date_payment":"xxxxx","monatant_ht":"xxxxxxx","montant_ttc":"xxxxxx","source":"Stripe","createdAt":"xxxxx","updateAt":"xxxxxx"
        }]
    };
    if (bearerToken==tokenAdmin) {
        res.status(200).send(succes);
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