const express = require("express"),
    passport = require("passport"),
    session = require("express-session"),
    path = require("path"),
    authRouter = require("./auth"),
    app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")));

// session middleware to store and add user sessions for Auth0
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

// initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRouter);

// middleware to ensure user is authenticated and protect pages
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login.html");
}


// DATABASE CONNECTION
const { ObjectId } = require("mongodb");

let collection;

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.USERNM}:${process.env.PASS}@${process.env.HOST}/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
        const db = client.db("MyDatabase");
        collection = db.collection("MyCollection");
        // Send a ping to confirm a successful connection
        await client.db("MyDatabase").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );

        app.get("/docs", async (req, res) => {
            if (collection !== null) {
                const docs = await collection.find({}).toArray();
                res.json(docs);
            }
        });
    } catch (err) {
        console.error(err);
        await client.close();
    }

}
run().catch(console.dir);

// Middleware to check if db is connected
middleware_db_check = (req, res, next) => {
    if (collection !== null) {
        next();
    } else {
        res.status(503).send();
    }
};
app.use(middleware_db_check);


// ROUTES
// calculates days left until task due
function calculateDaysDue(dueDateStr) {
    if (!dueDateStr) return null; 

    const today = new Date();
    const dueDate = new Date(dueDateStr);

    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue;
}

// protect main page
app.get("/", ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "app", "index.html"));
});

// get tasks from db
app.get("/tasks", ensureAuthenticated, async (req, res) => {
    try {
        const tasks = await collection.find({}).toArray();
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch tasks." });
    }
})

// get a single task from db
app.get("/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
        const taskID = req.params.id;
        const task = await collection.findOne({_id: new ObjectId(taskID)})
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch task." });
    }
});

// add a task
app.post("/add", ensureAuthenticated, async (req, res) => {
    // from req.body (data sent by client) get task info
    const { title, description, dueDate } = req.body;

    // calculate daysUntilDue
    const daysUntilDue = calculateDaysDue(dueDate);

    // create task with daysUntilDue and insert into db
    const task = { title, description, dueDate, daysUntilDue };
    const result = await collection.insertOne(task);
    
    const insertedTask = { _id: result.insertedId, ...task };
    res.json(insertedTask);
});

// update a task
app.put("/update/:id", ensureAuthenticated, async (req, res) => {
    const { title, description, dueDate } = req.body;

    daysUntilDue = calculateDaysDue(dueDate);

    const updatedTask = await collection.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: { title, description, dueDate, daysUntilDue } },
        { returnDocument: "after" }
    );

    res.json(updatedTask);
});

// remove a task
// assumes req.body takes form { _id:5d91fb30f3f81b282d7be0dd } etc.
app.delete("/delete/:id", ensureAuthenticated, async (req,res) => {
    const result = await collection.deleteOne({
        _id: new ObjectId(req.params.id),
    });
    
    res.json( { success: result.deletedCount === 1 } );
})

app.listen(process.env.PORT || 3000);
