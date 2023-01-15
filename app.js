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




const participantSchema = joi.object({
    name: joi.string().empty().required()
})

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required(),
    user: joi.required()
})



app.get("/participants", async (req, res) => {

    const { name } = req.body

    try{

    const participants = await db.collection("participants").find().toArray()
    res.send(participants)

    } catch(err) {
        return res.status(500).send(err.message)
    }

})


app.post("/participants", async (req, res) => {

    const { name } = req.body


    const validation = participantSchema.validate({ name }, { abortEarly: false })
    if (validation.error) {
        const erro = validation.error.details.map((err) => {
            return err.message
        })
        return res.status(422).send(erro)
    }

    try {
        const partsExiste = await db.collection("participants").findOne({ name })

        if (partsExiste) { return res.status(409).send("Esse usuário já existe") }

        const parts = await db.collection("participants").insertOne({ name: name, lastStatus: Date.now() })
            .then(() => {
                res.status(201).send("Usuario cadastrado!")
            })

         await db.collection("messages").insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: hora
        })
            .then(() => {
                res.status(201)
            })

    } catch (err) {
        return res.status(500).send(err.message)
    }

})




app.post("/messages", async (req, res) => {

    const { to, text, type } = req.body
    const { user } = req.headers


    const validation = messageSchema.validate({ to, text, type, user }, { abortEarly: false })
    if (validation.error) {
        const erro = validation.error.details.map((err) => {
            return err.message
        })
        return res.status(422).send(erro)
    }

    try {

        const userRepeat = await db.collection("participants").findOne({user: user.user})
        if (!userRepeat) {
            return res.status(422).send("Usuario já existe")
        }
            
        await db.collection("messages").insertOne({ 
             from: user,
             to: to,
             text: text,
             type: type,
             time: hora })
         return res.sendStatus(201)

    } catch (err) {

        return res.status(500).send(err.message)
    }

})


app.get("/messages", async (req, res) => {

    const limit = Number(req.query.limit)
    const { user } = req.headers

    try {

        if (limit <= 0 || limit === NaN) {
            return res.sendStatus(422)
        }

        const msg = await db.collection("messages").find({ $or: [ {from: user}, {to: user} ] }).toArray()
        const inverse= [...msg].reverse()
        if(!limit){
            return res.send(msg)
        }

        res.send(inverse.slice(0, limit))

    } catch (err) {
       return res.status(500).send(err.message)
    }

})

app.post("/status", async (req, res) =>{

const { user } = req.headers

try{

let usuarioExistente = await db.collection("participants").findOne({ name: user })
if (!usuarioExistente) {
    return res.status(404).send("Usuário não encontrado") }


    await db.collection("participants").updateOne({name: user}, {$set: {lastStatus: Date.now()}})

    res.status(200)


} catch (err) {
 return res.status(404).send(err.message)
    
}

})



app.listen(5000, () => {
    console.log("foi legal!")

})