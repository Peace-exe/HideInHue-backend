const express = require("express");
const app = express();
const {PORT} = require("./src/utils/constants");
const connectDB = require("./src/config/database");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");

app.use("",authRouter);
app.use("",profileRouter);



connectDB()
    .then(()=>{
        console.log("DB connection established.");
        app.listen(PORT,()=>{
        console.log(`Server is running on port:${PORT}`);
        });
    })
    .catch((err)=>{
        console.error(`couldn't connect to the database :( :\n ${err.message}`);
    })