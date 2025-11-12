const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const verifyToken = async (req, res, next) =>{
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token = authorization.split(" ")[1]
  try{
    const decoded = await admin.auth().verifyIdToken(token)
    // console.log('inside token', decoded)
    req.token_email = decoded.email

    next()
  }
  catch(err){
    return res.status(401).send({message: 'unauthorized access.'})
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vaa5xch.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("movie-master-pro-db");
    const movieCollections = db.collection("movies");

    // movie collections
    // app.get
    app.get("/api/movies", async (req, res) => {
      const cursor = movieCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/latest-movies", async (req, res) => {
      const cursor = movieCollections.find().sort({ releaseYear: 'desc' }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/top-rated-movies", async (req, res) => {
      const cursor = movieCollections.find().sort({ rating: -1 }).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/api/movies/:id', async (req, res) => {
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await movieCollections.findOne(query)
        res.send(result)
    })

    // app.put(edit)
    app.put('/movies/update/:id', async (req, res) => {
        const id = req.params.id
        const data = req.body
        const filter = {_id: new ObjectId(id)}
        const update ={
            $set: data,
        }
        const result = await movieCollections.updateOne(filter,update)
        res.send(result)
    })

    // app.delete(remove)
    app.delete('/movies/:id', async (req, res) => {
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const result = await movieCollections.deleteOne(filter)
        res.send(result)
    })

    // app.post(data send client to database)
    app.post("/movies",verifyToken, async (req, res) => {
      const newMovie = req.body;
      const result = await movieCollections.insertOne(newMovie)
      res.send(result)
    });

    // testing database, comment this section before deploy in vercel
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
