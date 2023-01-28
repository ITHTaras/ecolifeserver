import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use("/categories", require("./routes/category"));
app.use("/users", require("./routes/user"));
app.use("/points", require("./routes/point"));

app.listen(port, () => {
  console.log(`Running on ${port}`);
});
