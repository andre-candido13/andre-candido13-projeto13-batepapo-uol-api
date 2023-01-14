import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(express.json())

app.use(cors())


const mongoClient = new MongoClient(process.env.DATABASE_URL)

let db;

mongoClient.connect()
.then(() => {
    db = mongoClient.db()
    console.log("foi daora mongodb!")
})
.catch(() => {
    console.log("falhou")  
})



app.get("/participants", (req, res) => {

    const { name } = req.body

    const participants = db.collection("participants").find().toArray()
    res.send(participants)

})


app.post("/participants", (req, res) => {

    const { name } = req.body

   const parts = db.collection("participants").insertOne({ name: name, lastStatus: Date.now() })
   .then(() => {
    res.status(201).send("Usuario cadastrado!")
   })
   .catch(() => {
    res.status(422).send("Erro")
   })

   const parts2 = db.collection("participants").find({ name })

   if (!parts2)
   return res.status(409).send("Este usuário já existe!")
})




app.listen(6000, () => {
    console.log("foi legal!")

})