const { response } = require('express');
const Sequelize = require('sequelize');
const database  = 'd72md5p5mbmc3v';
const user      = 'bqouhbvwuhutsv';
const password  = 'a17ad075fcd517d81c9663d0567ab78db45bafdaf9f94b532366b0c73b4c88fd';
const hekHost   = 'ec2-54-83-82-187.compute-1.amazonaws.com';

var sequelize = new Sequelize(database, user, password, {
    host: hekHost,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: {rejectUnauthorized: false}
    },
    query: {raw: true}
});
var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});
var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});
module.exports.initialize = function () {
    return new Promise( (resolve, reject) => {
        sequelize.sync().then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Unable to sync with the database");
        })
    });
};
module.exports.getAllEmployees = function(){
    return new Promise( (resolve, reject) => {
        Employee.findAll().then((data)=>{
            resolve(data);
        }).catch((err)=>{
        reject();
        });
     });
};
module.exports.addEmployee = function (employeeData) {
    return new Promise( (resolve, reject) => {
        employeeData.isManager=(employeeData.isManager)?true:false;
        for(var d in employeeData){
            if(employeeData[d] == '') employeeData[d] = null;
        }
        Employee.create(employeeData).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Unable to add Employee to database");
        });
     });
};
module.exports.addDepartment = function (departmentData) {
    return new Promise((resolve, reject)=>{
        for(var d in departmentData){
            if(departmentData[d] == '') departmentData[d] = null;
        }
        Department.create(departmentData).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Unable to create department");
        });
    });
} 
module.exports.updateDepartment = function(departmentData) {
    return new Promise((resolve, reject)=>{
        for(var d in departmentData){
            if(departmentData[d] == '') departmentData[d] = null;
        }
        console.log(departmentData.departmentName);
        Department.update(departmentData).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Unable to update department");
        });
    });
}
module.exports.updateEmployee = function (employeeData) {
    return new Promise( (resolve, reject) => {
        employeeData.isManager=(employeeData.isManager)?true:false;
        for(var d in employeeData){
            if(employeeData[d] == '') employeeData[d] = null;
        }

        Employee.update(
            employeeData
            , {
                where: {employeeNum: employeeData.employeeNum}
            }).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Unable to update");
        });
     });
}
module.exports.deleteEmployeeByNum = function(empNum) {
    return new Promise((resolve, reject)=>{
        Employee.destroy({
            where:{
                employeeNum: empNum
            }
        }).then(()=>{
            resolve();
        }).catch((err)=>{
            reject("Employee not found");
        });
    });
}
module.exports.getEmployeeByNum = function (num) {
    return new Promise( (resolve, reject) => {
        Employee.findAll(
            {   
            where: {
                employeeNum: num
            }
        }).then((data)=>{
            resolve(data[0]);
        }).catch((err)=>{
          reject("No results found");  
        });
     });
};
module.exports.getDepartmentById = function(id) {
    return new Promise((resolve, reject)=>{
        Department.findAll(
            {
                where:{
                    departmentId: id
                }
            }).then((data)=>{
                resolve(data[0]);
            }).catch((err)=>{
                reject("Unable to find a Department with " + id);
            });
    });
};
module.exports.getEmployeesByStatus = function (status) {
    return new Promise( (resolve, reject) => {
        Employee.findAll(
            {   
            where: {
                status: status
            }
        }).then((data)=>{
            resolve(data);
        }).catch((err)=>{
          reject("No results found");  
        });
     });
};
module.exports.getEmployeesByDepartment = function (department) {
    return new Promise( (resolve, reject) => {
        Employee.findAll(
            {   
            where: {
                department: department
            }
        }).then((data)=>{
            resolve(data);
        }).catch((err)=>{
          reject("No results found");  
        });
     });
};
module.exports.getEmployeesByManager = function (manager) {
    return new Promise( (resolve, reject) => {
        Employee.findAll(
            {   
            where: {
                employeeManagerNum: status
            }
        }).then((data)=>{
            resolve(data);
        }).catch((err)=>{
          reject("No results found");  
        });
     });
};
module.exports.getManagers = function () {
    return new Promise( (resolve, reject) => {
        Employee.findAll(
            {   
            where: {
                isManager: true
            }
        }).then((data)=>{
            resolve(data);
        }).catch((err)=>{
          reject("No results found");  
        });
     });
};
module.exports.getDepartments = function(){
    return new Promise( (resolve, reject) => {
        Department.findAll().then((data)=>{
            resolve(data);
        }).catch(()=>{
          reject("No results found");  
        });
     });
}