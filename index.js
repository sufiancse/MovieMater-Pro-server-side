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

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;

    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access." });
  }
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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
    // await client.connect();

    const db = client.db("movie-master-pro-db");
    const movieCollections = db.collection("movies");
    const watchListCollections = db.collection("watchList");
    const userCollections = db.collection("users");

    // users api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };

      const existingUser = await userCollections.findOne(query);
      if (existingUser) {
        res.send({ message: "User already exist." });
      } else {
        const result = await userCollections.insertOne(newUser);
        res.send(result);
      }
    });

    app.get('/api/users', async (req, res) => {
      const cursor = userCollections.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    // movie collections
    // app.get
    app.get("/api/movies", async (req, res) => {
      const { genres, minRating, maxRating } = req.query;

      let filter = {};

      if (genres) {
        const genreArray = genres.split(",");
        filter.genre = { $in: genreArray };
      }

      if (minRating && maxRating) {
        filter.rating = {
          $gte: parseFloat(minRating),
          $lte: parseFloat(maxRating),
        };
      }

      const cursor = movieCollections.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/latest-movies", async (req, res) => {
      const cursor = movieCollections
        .find()
        .sort({ releaseYear: "desc" })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/top-rated-movies", async (req, res) => {
      const cursor = movieCollections.find().sort({ rating: -1 }).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/movies/my-collections", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await movieCollections.find({ addedBy: email }).toArray();
      res.send(result);
    });

    app.get("/api/movies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollections.findOne(query);
      res.send(result);
    });

    // app.put(edit)
    app.put("/movies/update/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = await movieCollections.updateOne(filter, update);
      res.send(result);
    });

    // app.delete(remove)
    app.delete("/movies/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await movieCollections.deleteOne(filter);
      res.send(result);
    });

    // app.post(data send client to database)
    app.post("/movies", verifyToken, async (req, res) => {
      const newMovie = req.body;
      const result = await movieCollections.insertOne(newMovie);
      res.send(result);
    });

    //all about watch list collections here
    app.post("/movies/watch-list", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await watchListCollections.insertOne(data);
      res.send(result);
    });

    app.get("/movies/watch-list", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await watchListCollections
        .find({ watchList_by: email })
        .toArray();
      res.send(result);
    });

    app.delete("/movies/watch-list/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: id };
      const result = await watchListCollections.deleteOne(filter);
      res.send(result);
    });

    // testing database, comment this section before deploy in vercel
    // await client.db("admin").command({ ping: 1 });
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
