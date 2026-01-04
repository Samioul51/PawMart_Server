import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);

// Contact request limiter

const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    message: {
        success: false,
        message: "Too many messages sent. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const uri = `mongodb+srv://${process.env.Name}:${process.env.Password}@cluster0.tugpfto.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const db = client.db('PawMart');
        const categories = db.collection('categories');
        const listings = db.collection('listings');
        const orders = db.collection('orders');
        const contact = db.collection('contact');


        // All categories

        app.get('/categories', async (req, res) => {
            try {
                const cat = await categories.find().toArray();
                res.send({
                    success: true,
                    data: cat
                });
            }
            catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        // All Items

        app.get('/listings', async (req, res) => {
            try {
                const { page = 1, limit = 12, category, search, sort } = req.query;
                const skip = (parseInt(page) - 1) * parseInt(limit);

                let filter = {};

                function escapeRegex(text) {
                    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                }

                // Category filter
                if (category && category !== 'All')
                    filter.category = { $regex: escapeRegex(category), $options: 'i' };



                // Search filter 
                if (search)
                    filter.name = { $regex: search, $options: 'i' };

                // Sorting
                let sortOption = {};
                if (sort === 'price_asc')
                    sortOption.price = 1;
                else if (sort === 'price_desc')
                    sortOption.price = -1;
                else
                    sortOption.date = -1;

                const total = await listings.countDocuments(filter);

                const data = await listings.find(filter)
                    .sort(sortOption)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .toArray();

                res.send({
                    success: true,
                    data,
                    total,
                    page: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit))
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });


        // Single Item

        app.get('/listings/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const item = await listings.findOne({ _id: new ObjectId(id) });
                // console.log(item);
                res.send({
                    success: true,
                    data: item
                });
            }
            catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                })
            }
        });

        // Order

        app.post('/order', async (req, res) => {
            try {
                const newOrder = req.body;
                const result = await orders.insertOne(newOrder);
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ success: false, message: error.message })
            }
        })

        // All orders

        app.get('/orders', async (req, res) => {
            try {
                const list = await orders.find().toArray();
                res.send({
                    success: true,
                    data: list
                });
            }
            catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                })
            }
        });

        // Add new listing

        app.post('/listing', async (req, res) => {
            try {
                const newListing = req.body;
                const result = await listings.insertOne(newListing);
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ success: false, message: error.message })
            }
        })

        // Delete listing

        app.delete('/listings/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await listings.deleteOne(query);
                res.send(result);
            }
            catch (error) {
                res.status(500).send({ success: false, message: error.message })
            }
        })

        // Update listing

        app.patch('/listings/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;

                const result = await listings.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            name: updatedData.name,
                            price: updatedData.price,
                            location: updatedData.location,
                            description: updatedData.description,
                            image: updatedData.image,
                            date: updatedData.date
                        }
                    }
                )

                res.send({
                    success: true,
                    message: 'Listing updated successfully'
                })
            }
            catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                })
            }
        })

        // Contact Form

        app.post("/contact", contactLimiter, async (req, res) => {
            try {
                const newMessage = req.body;
                const result = await contact.insertOne(newMessage);
                res.send(result);
            } catch (error) {
                res.status(500).send({ success: false, message: error.message });
            }
        });

        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server running...")
})

app.listen(port, () => {
    console.log(`server running on ${port}`);
})