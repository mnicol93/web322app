/********************************************************************************* 
 * WEB322 – Assignment 06 
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
 * No part of this assignment has been copied manually or electronically from any other source 
 * (including 3rd party web sites) or distributed to other students. 
 * Name: Marc Nicolas Oliva Student ID: 130943202 Date: 30-07-2021 
 * Online (Heroku) Link: https://web322-a4-mno.herokuapp.com/ 
 *  ********************************************************************************/

const express = require("express");
const path = require("path");
const data = require("./data-service.js");
const dataServiceAuth = require('./data-service-auth.js');
const bodyParser = require('body-parser');
const fs = require("fs");
const multer = require("multer");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const app = express();

function ensureLogin(req, res, next){
    if(!req.session.user) res.redirect("/login");
    else next();
}
app.engine('.hbs', exphbs({ 
    extname: '.hbs', 
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options){
            return '<li' + 
            ((url == app.locals.activeRoute) ? ' class="active"' : '') +
            '><a href="'+ url + '">'+options.fn(this)+'</a></li>';
        },
        equal: function(lvalue, rvalue, options){
            if(arguments.length<3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if(lvalue != rvalue){
                return options.inverse(this);
            }else{
                return options.fn(this);
            }
        }
    }
}));
app.set('view engine', '.hbs');

const HTTP_PORT = process.env.PORT || 8080;

// multer requires a few options to be setup to store files with file extensions
// by default it won't store extensions for security reasons
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
      // we write the filename as the current date down to the millisecond
      // in a large web service this would possibly cause a problem if two people
      // uploaded an image at the exact same time. A better way would be to use GUID's for filenames.
      // this is a simple example.
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  // tell multer to use the diskStorage function for naming files instead of the default.
  const upload = multer({ storage: storage });


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});
app.use(clientSessions({
    cookieName:     "session",
    secret:         "a6marcN",
    duration:       2*60*1000,
    activeDuration: 1000*60
}));

app.use(express.urlencoded({extended: false}));

app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
})
app.get("/", (req,res) => {
    res.render(path.join(__dirname, "/views/home.hbs"));
});

app.get("/about", (req,res) => {
    res.render(path.join(__dirname, "/views/about.hbs"));
});

app.get("/images/add", ensureLogin ,(req,res) => {
    res.render(path.join(__dirname, "/views/addImage.hbs"));
});

app.get("/employees/add", ensureLogin ,(req,res) => {
    data.getDepartments().then((data)=>{
        res.render("addEmployee", {departments: data});
    }).catch((err)=>{
        res.render("addEmployee", {departments: []});
    });
    
});

app.get("/images", ensureLogin ,(req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render("images", {items});
    });
});

app.get("/employees", ensureLogin ,(req, res) => {
    if (req.query.status) {
        data.getEmployeesByStatus(req.query.status).then((data) => {
            if(data.length>0){
                res.render("employees", {employees:data});
            }
            res.render("employees",{message: "no results"});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    } else if (req.query.department) {
        data.getEmployeesByDepartment(req.query.department).then((data) => {
            res.render("employees", {employees:data});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    } else if (req.query.manager) {
        data.getEmployeesByManager(req.query.manager).then((data) => {
            res.render("employees", {employees:data});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    } else {
        data.getAllEmployees().then((data) => {
            res.render("employees", {employees:data});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    }
});
app.get("/employees/delete/:empNum", ensureLogin ,(req,res)=>{
    data.deleteEmployeeByNum(req.params.empNum).then(() =>{
        res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Remove Employee/Employee not found");
    });
});

app.get("/employee/:empNum", ensureLogin ,(req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching
         // viewData.departments object
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
    }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if(viewData.employee == null) { // if no employee - return an error
            res.status(404).send("Employee Not Found");
        } else {
            res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });
   });
   
app.get("/department/:departmentId", ensureLogin ,(req,res)=>{
    data.getDepartmentById(req.params.departmentId).then((data)=>{
        res.render("department", {department: data});
    }).catch((err)=>{
        res.status(404).send("Department Not Found");
    });
});
app.get("/departments", ensureLogin ,(req,res) => {
    data.getDepartments().then((data)=>{
        if(data.length>0)
            res.render("departments", {departments: data});
        res.render("departments", {message: "no results"});
    });
});

app.get("/departments/add", ensureLogin ,(req,res)=>{
    res.render(path.join(__dirname, "/views/addDepartment.hbs"));
});
app.get("/login", (req, res)=>{
    res.render("login");
});
app.get("/register", (req, res)=>{
    res.render(path.join(__dirname, "/views/register.hbs"));
});
app.get("/logout", function(req, res){
    req.session.reset();
    res.redirect("/");
});
app.get("/userHistory", ensureLogin, (req, res)=>{
    res.render("userHistory", { history: req.session.user.loginHistory,
                                userName: req.session.user.userName,
                                email: req.session.user.email});
});
app.post("/register", (req,res)=>{
    dataServiceAuth.registerUser(req.body).then(user=>{
        res.render("register", {successMessage: "User Created!"});
    }).catch(err=>{
        res.render("register", {errorMessage: err, userName: req.body.userName})
    })
})
app.post("/login", (req, res)=>{
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then(user=>{
        req.session.user = {
            userName:       user.userName,
            email:          user.email,
            loginHistory:   user.loginHistory
        }
        res.redirect('/employees');
    }).catch(err=>{
        res.render("login", {errorMessage: err, userName: req.body.userName })
    });
});
app.post("/employees/add", ensureLogin ,(req, res) => {
    data.addEmployee(req.body).then(()=>{
      res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });;
  });
app.post("/departments/add", ensureLogin ,(req,res)=>{
    data.addDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });
}) 
app.post("/employee/update", ensureLogin ,(req,res)=>{
    data.updateEmployee(req.body).then(()=>{
        res.redirect("/employees");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });;
})
app.post("/department/update", ensureLogin, (req,res)=>{
    data.updateDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });;
})
app.post("/images/add", upload.single("imageFile"), ensureLogin, (req,res) =>{
    res.redirect("/images");
});


app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize().then(dataServiceAuth.initialize())
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
        })
    }).catch((err)=>{
        res.status(500).send("Unable to Update Employee");
    });

