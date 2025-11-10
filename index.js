import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
        await client.connect();

        const db=client.db('PawMart');
        const categories=db.collection('categories');
        const listings=db.collection('listings');
        const orders=db.collection('orders');


        // All categories

        app.get('/categories',async (req,res)=>{
            try{
                const cat=await categories.find().toArray();
                res.send({
                    success:true,
                    data:cat
                });
            }
            catch(error){
                res.status(500).send({
                    success:false,
                    message:error.message
                });
            }
        });

        await client.db("admin").command({ ping: 1 });
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