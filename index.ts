import express from "express";
import bodyParser from "body-parser";
const app = express();

// Middleware
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use("/categories", require("./routes/category"));
app.use("/users", require("./routes/user"));
app.use("/points", require("./routes/point"));

app.listen(5000, () => {
  console.log("Running on 5000");
});
