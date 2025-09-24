const express = require('express');
const app = express();
const port = 3000;


//curl -X GET http://localhost:3000/
// Define a route for GET requests to the root path
const handlerGET = (req, res) => {
  res.send({
    url : req.url,
    method : req.method
  });
};

app.get('/', handlerGET);

// Define a route for POST requests to /submit
const handlerPOST = (req, res) => {
  res.send('Data submitted!');
};
app.post('/submit', handlerPOST);


function handleupdate(req,res){
  res.send('Data updated!');
}
app.put('/update',handleupdate)


const serverOutput = () => {
  console.log(`Server is running at http://localhost:${port}`);
}
app.listen(port, serverOutput);