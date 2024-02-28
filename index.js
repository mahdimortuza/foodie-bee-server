const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('foodie-bee');
        const adminCollection = db.collection('admin');
        const collection = db.collection('supplies');
        const dashboardDataCollection = db.collection('data')
        const donationDataCollection = db.collection('donation')
        const communityCollection = db.collection('community')
        const testimonialCollection = db.collection('testimonial')
        const volunteerCollection = db.collection('volunteer')


        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await adminCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await adminCollection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

           try {
             // Find user by email
             const user = await adminCollection.findOne({ email });
             if (!user) {
                 return res.status(401).json({ message: 'Invalid email or password' });
             }
 
             // Compare hashed password
             const isPasswordValid = await bcrypt.compare(password, user.password);
             if (!isPasswordValid) {
                 return res.status(401).json({ message: 'Invalid email or password' });
             }
 
             // Generate JWT token
             const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
            
             const refreshToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
                res.cookie('refreshToken', refreshToken)

             res.json({
                 success: true,
                 message: 'Login successful',
                 token
             });
 
             
           } catch (error) {
            console.log(error)
            res.status(500).json({error: "Internal server error"})
            
           }
        });

        


        // ==============================================================
        // WRITE YOUR CODE HERE
        // ==============================================================

        // create a supply post
        app.post('/api/v1/supplies', async(req, res) => {
            const newSupply = req.body

            try {
                const result  = await collection.insertOne(newSupply)
                res.status(201).json(result)
            } catch (error) {
                console.log(error)
                res.status(500).json({error: "Internal server error"})
                
            }
        })

        // get all supply post  

        app.get('/api/v1/supplies', async(req, res) => {
        try {
            const result = await collection.find({}).toArray()
            res.status(200).json(result)
        } catch (error) {
            console.error('Error fetching supply:', err);
            res.status(500).json({error: "Internal server error"})
                }
        })

        // get limited supply post  
        app.get('/api/v1/limited-supplies', async(req, res) => {
            const limit =  parseInt(req.query.limit) || 6
            try {
                const result = await collection.find({}).limit(limit).toArray()
                res.status(200).json(result)
            } catch (error) {
                console.error('Error fetching supply:', err);
                res.status(500).json({error: "Internal server error"})
                    }
            })

// get single supply post 
app.get('/api/v1/supplies/:id', async(req, res) => {
    const supplyId = req.params.id

    try {
        const result = await collection.findOne({_id: new ObjectId(supplyId)})
        res.status(200).json({result})
    } catch (error) {
        console.log("Error fetching supply", error)
        res.status(500).json({error: "Internal server error"})
    }
})

         
// update supply data into db
app.patch('/api/v1/supplies/:id', async (req, res) => {
    const supplyId = req.params.id;
    const updatedSupplyData = req.body;

    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(supplyId) },
        { $set: updatedSupplyData }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ error: 'Data not found' });
      } else {
        res.json({ message: 'Data updated successfully' });
      }
    } catch (err) {
      console.error('Error updating Data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  //delete supply post 
  app.delete('/api/v1/supplies/:id', async(req, res) => {
    const supplyId = req.params.id

    try {
        const result = await collection.deleteOne(
            {_id:new ObjectId(supplyId)}
            )

        if(result.deletedCount === 0){
            res.status(404).json({error: "Supply not found."})
        }
        else{
            res.status(201).json({message: "Supply deleted successfully"})
        }
    } catch (error) {
        console.log("Can not delete the task.", error)
        res.status(500).json({ error: 'Internal Server Error' });
    }
  })


  // data collection controlling operations 

  // create data into db

  app.post('/api/v1/data', async(req, res) => {
    const data = req.body
    try {
        const result = await dashboardDataCollection.insertOne(data)
        res.status(201).json(result)
    } catch (error) {
        console.log("Can not post data", error)
        res.status(500).json({error: "Internal server error"})
    }
  })

  //get data from the db
  app.get('/api/v1/data', async(req, res) => {
    try {
        const result = await dashboardDataCollection.find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        console.log("Error fetching data", error)
        res.status(500).json({error: "Internal server error"})
    }
  })

  // update dashboard data into db
  app.patch('/api/v1/data/:id', async(req, res) => {
    const dataId = req.params.id
    const updatedData = req.body

    try {
        const result = await dashboardDataCollection.updateOne(
            {_id: new ObjectId(dataId)},
            {$set: updatedData}
        )

        if(result.matchedCount === 0){
            res.status(404).json({error: "Data not found"})
        }else{
            res.json({message: "Data updated successfully"})
        }
    } catch (error) {
        console.error('Error updating Data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    }
  })

   // make a donation post
   app.post('/api/v1/donate', async(req, res) => {
    const donation = req.body

    try {
        const result  = await donationDataCollection.insertOne(donation)
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
        
    }
})

// make a community post
app.post('/api/v1/community', async(req, res) => {
    const community = req.body

    try {
        const result  = await communityCollection.insertOne(community)
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
        
    }
})

app.get('/api/v1/community', async(req, res) => {
    try {
        const result = await communityCollection.find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        console.log("Error fetching data", error)
        res.status(500).json({error: "Internal server error"})
    }
  })


// make a testimonial post
app.post('/api/v1/testimonial', async(req, res) => {
    const testimonial = req.body

    try {
        const result  = await testimonialCollection.insertOne(testimonial)
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
        
    }
})

app.get('/api/v1/testimonial', async(req, res) => {
    try {
        const result = await testimonialCollection.find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        console.log("Error fetching data", error)
        res.status(500).json({error: "Internal server error"})
    }
  })


  // make a volunteer subscription
app.post('/api/v1/volunteer', async(req, res) => {
    const volunteer = req.body

    try {
        const result  = await volunteerCollection.insertOne(volunteer)
        res.status(201).json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Internal server error"})
        
    }
})

app.get('/api/v1/volunteer', async(req, res) => {
    try {
        const result = await volunteerCollection.find({}).toArray()
        res.status(200).json(result)
    } catch (error) {
        console.log("Error fetching data", error)
        res.status(500).json({error: "Internal server error"})
    }
  })



        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}



run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});



// // Middleware to verify access token
// function verifyAccessToken(req, res, next) {
//     const accessToken = req.headers.authorization;

//     if (!accessToken) {
//         return res.status(401).json({ message: 'Access token not provided' });
//     }

//     try {
//         // Verify the access token
//         const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         console.log(error);
//         res.status(401).json({ message: 'Invalid access token' });
//     }
// }

// // Example of using the middleware in a protected route
// app.get('/api/v1/protected-route', verifyAccessToken, (req, res) => {
//     // Access token is valid, continue with the route logic
//     res.json({ message: 'Protected route accessed successfully' });
// });
