const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

    app.post("/movies", async (req, res) => {
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
