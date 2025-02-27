const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const connectdb = require("./config/connectdb");

const app = express();
const PORT = process.env.PORT || 5000;

// db connect
connectdb();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Server is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
