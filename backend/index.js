const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const user = require('./user');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post('/enroll', async (req, res) => {
  try {
    const walletContent = await user.enroll(req.body.email, req.body.secret);
    res.json({ walletContent });
  } catch (err) {
    // next(err);
    console.log(err);
    res.error(500);
  }
});

app.post('/getuser', async (req, res) => {
  try {
    const user = await user.getUser(req.body.email, req.body.wallet);
    res.json(user);
  } catch (err) {
    console.log(err);
    res.error(500);
  }
});

app.post('/addread', async (req, res) => {
  try {
    const read = await user.addRead(req.body.email, req.body.wallet, req.body.readVal);
    res.json(read);
  } catch (err) {
    console.log(err);
    res.error(500);
  }
});

app.listen(9999);
console.log('started');

// async function test() {
//   try {
//     await user.enroll('customer1@gmail.com', 'dEvrDyiyCHia');
//   } catch (err) {
//     console.log(err);
//   }
// }

// test();
