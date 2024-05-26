// backend/index.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
const port = 5000;

// Setup multer for file handling
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

let results = [];
let subscriptionPrices = [];

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const { basePrice, pricePerCreditLine, pricePerCreditScorePoint } = req.body;

  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  if (!basePrice || !pricePerCreditLine || !pricePerCreditScorePoint) {
    return res.status(400).send({ message: 'Pricing parameters are missing' });
  }

  results = [];
  subscriptionPrices = []; // Array to store subscription prices

  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Extract CreditScore and CreditLines from CSV data
      const { CreditScore, CreditLines } = data;

      // Calculate SubscriptionPrice
      const subscriptionPrice = calculateSubscriptionPrice(CreditScore, CreditLines, basePrice, pricePerCreditLine, pricePerCreditScorePoint);

      // Store subscription price in array
      subscriptionPrices.push(subscriptionPrice);

      results.push(data);
    })
    .on('end', () => {
      fs.unlinkSync(file.path); // Clean up the uploaded file

      // Calculate total number of pages
      const totalPages = Math.ceil(results.length / 1500);

      res.send({
        message: 'File uploaded and processed successfully',
        data: results.slice(0, 1500),
        subscriptionPrices: subscriptionPrices.slice(0, 1500),
        totalPages,
      });
    })
    .on('error', (error) => {
      console.error(error);
      res.status(500).send({ message: 'Error processing file' });
    });
});

app.get('/data', (req, res) => {
  const { page = 1, limit = 1500 } = req.query;

  // Calculate offset
  const offset = (page - 1) * limit;

  // Get paginated data
  const paginatedResults = results.slice(offset, offset + limit);
  const paginatedSubscriptionPrices = subscriptionPrices.slice(offset, offset + limit);

  res.send({
    data: paginatedResults,
    subscriptionPrices: paginatedSubscriptionPrices,
    totalPages: Math.ceil(results.length / limit),
  });
});

function calculateSubscriptionPrice(creditScore, creditLines, basePrice, pricePerCreditLine, pricePerCreditScorePoint) {
  // Calculate SubscriptionPrice using the formula
  const subscriptionPrice = parseFloat(basePrice) + (parseFloat(pricePerCreditLine) * creditLines) + (parseFloat(pricePerCreditScorePoint) * creditScore);

  return subscriptionPrice;
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
