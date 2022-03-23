const express = require('express');
const user = require('./user');

const app = express();

app.post('/enroll', async (req, res) => {
  try {
    await user.enroll(req.body.email, req.body.secret);
  } catch (err) {
    // next(err);
    res.error(500);
  }
});

app.listen(4000);

// async function test() {
//   try {
//     await user.enroll('customer1@gmail.com', 'dEvrDyiyCHia');
//   } catch (err) {
//     console.log(err);
//   }
// }

// test();
