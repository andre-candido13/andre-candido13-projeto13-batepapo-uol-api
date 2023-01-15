import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import joi from "joi"
import dotenv from "dotenv"
import dayjs from "dayjs"


dotenv.config()

const app = express()

app.use(express.json())

app.use(cors())


const mongoClient = new MongoClient(process.env.DATABASE_URL)

let db

let hora = dayjs().format("HH:mm:ss")

mongoClient.connect()
.then(() => {
    db = mongoClient.db()
    console.log("foi daora mongodb!")
})
.catch(() => {
    console.log("falhou")  
})



app.get("/participants", async (req, res) => {

    const { name } = req.body

    const participants = await db.collection("participants").find().toArray()
    res.send(participants)

})


app.post("/participants", async (req, res) => {

    const { name } = req.body
    
try {
    const partsExiste = await db.collection("participants").findOne({ name })

    if (partsExiste) { return res.status(409).send("Esse usuário já existe")}

   const parts = await db.collection("participants").insertOne({ name: name, lastStatus: Date.now() })
   .then(() => {
    res.status(201).send("Usuario cadastrado!")
   })

   const messages = await db.collection("participants").insertOne({ 
    from: name, 
    to: 'Todos', 
    text: 'entra na sala...', 
    type: 'status', 
    time: hora})
    .then(() => {
        res.status(201)
    })

} catch (err) {
    return res.status(422)
}

})




app.post("/messages", async (req, res) => {

const { to, text, type} = req.body
const { user } = req.headers

try {

const mensagem = await db.collection("messages").insertOne({ from: user, to, text, type, time: hora})
.then(() => {
    return res.status(201).send(mensagem)
})

} catch (err) {
 
 console.log(err)
}

app.get("/messages", async (req, res) => {

const { limit } = req.query

try {

const mensagem = await db.collection("messages").find().toArray()
const limite = (mensagem.length - limit)
return res.send(mensagem.slice(limite))

} catch(err) {
    res.status(500)
}



})






})



app.listen(5000, () => {
    console.log("foi legal!")

})