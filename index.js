import express from 'express';
import Datastore from 'nedb';


const db = new Datastore({filename : "data"});
db.loadDatabase();

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

    const email = req.query.email;
    const pass = req.query.password;
    const envoie =
        {"error":false,"message":"L'utilisateur a été authentifié succés","user":{"firstname":"xxxxx","lastname":"xxxxx","role":"xxxxx","sexe":"xxxxxx","dateNaissance":"xxxx-xx-xx","createdAt":"xxxx","updateAt":"xxxxx","subscription":"xxxx"},"token":"xxxx"}
    ;
    const donneManquant = {
        "error":true,"message":"Email/password manquants"
    }

    if (email!= null && pass!= null) {
        res.status(200).send(envoie);
    }
    else{
        res.status(400).send(donneManquant);
    }
})

app.listen(3000, (err) =>{
    if (err) {
        console.log(err);
    }
    console.log("Le server est lancer");
})