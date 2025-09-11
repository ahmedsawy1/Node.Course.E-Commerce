const express = require("express")
const mongoose = require("mongoose")
require("dotenv").config()
const i18next = require("i18next")
const backend = require("i18next-fs-backend")
const middleware = require("i18next-http-middleware")
const cors = require("cors")

const categoryRouter = require("./routes/category.route")


i18next
    .use(backend)
    .use(middleware.LanguageDetector)
    .init({
        fallbackLng: "en",
        backend:{
            loadPath: "locales/{{lng}}.json"
        }
    })

const app = express()
const port = process.env.PORT
const api = process.env.API 

app.use(middleware.handle(i18next))
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000", "https://mydmoain.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"]
}))

app.use(`${api}/categories`, categoryRouter)

app.get(`${api}/health`, (req, res) => {
    res.send(req.t("validationFailed"))
})

mongoose
    .connect(process.env.CONNECT_STRING)
    .then(() => console.log("Connected to MongoDB Successfully ^_^"))
    .catch((err) => console.log(err))

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})