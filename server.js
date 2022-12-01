const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

const app = express()

app.use(bodyParser.json())

mongoose.connect("mongodb://0.0.0.0:27017/projet")

const Plat = mongoose.model("plat", { "name": String, "description": String, "price": Number  })
const Panier = mongoose.model("panier", { name: String })

// Create
app.post("/plat", (req, res) => {
  const platToSave = new Plat(req.body)
  platToSave.save().then((plat) => res.json(plat))
})

// Read All
app.get("/plats", async (req, res) => {
  Plat.find()
    .then((plats) => res.json(plats))
    .catch(() => res.status(404).end())
})

// Read one by ID
app.get("/plats/:id", async (req, res) => {
  Plat.findById(req.params.id)
    .then((plat) => res.json(plat))
    .catch(() => res.status(404).end())
})

// Update one by ID
app.put("/plats/:id", async (req, res) => {
  Plat.findByIdAndUpdate(req.params.id, req.body)
    .then((plat) => res.json(plat))
    .catch(() => res.status(404).end())
})

// Delete one by ID
app.delete("/plats/:id", async (req, res) => {
  Plat.findOneAndDelete(req.params.id)
    .then((plat) => res.json(plat))
    .catch(() => res.status(404).end())
})

/*
app.get("*", (req, res) => {
  res.status(404).end()
})*/

app.listen(3000, () => {
    console.log(`Server Started at http://localhost:${3000}`)
})