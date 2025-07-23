const express = require("express");
const app = express();
const {PORT} = require("./src/utils/constants");
const connectDB = require("./src/config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
})); 
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const stegoRouter = require("./src/routes/stego");
const userRouter = require("./src/routes/user");

app.use("",authRouter);
app.use("",profileRouter);
app.use("",stegoRouter);
app.use("",userRouter);


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