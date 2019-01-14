"use strict";
var restrictData = require("./restrict_data.js");
var modifyStyling = require("./modify_styling.js");
var utils = require("./utils/utils.js");

const express = require("express");
const multer = require("multer");
const converter = require("widdershins");
const fs = require("fs");

// Constants
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";
const SWAGGER_UI_DIR = "/swaggerui";
const SWAGGER_FILE = "/swaggerui/venaswagger/swagger.json";
const ALLOW_LIST = "./utils/allowList.json";
var allowList = JSON.parse(fs.readFileSync(ALLOW_LIST, "utf8"));

// File uplolad configuration used to store swagger.json in appropriate location
var storage = multer.diskStorage({
  destination: "/swaggerui/venaswagger/",
  filename: function(req, file, callback) {
    callback(null, "swagger.json");
  }
});
var upload = multer({ storage: storage });

var app = express();

// Set the view engine
app.set("view engine", "pug");

// serve the static SwaggerUI files
app.use("/", express.static(SWAGGER_UI_DIR));

// show homepage with link
app.use("/home", function(request, response) {
  response.render("home");
});

// serve swagger.json spec
app.use("/swagger", express.static(SWAGGER_FILE));

// publish a new swagger.json spec
app.post("/update", upload.single("swaggerjson"), function(request, response) {
  console.log("Publishing new swagger json file!");
  response.render("update");
});

// Basically retrieves the existing swagger.json and convert it to slate compatible markdown
// Saves the slate compatible markdown into source/includes directory of slate as main.md which
// PM2 is watching the sources directory and rebuilds slate app on any activity hence the new docs show up
app.get("/slateit", function(request, response) {
  console.log(
    "Converting swagger.json to slate-compatible markdown and rebuilding slate with new content!"
  );
  modifyStyling.modifySlate(
    "/usr/src/slateapp/node-slate/source/javascripts/app/_toc.js",
    "/usr/src/slateapp/node-slate/source/stylesheets/screen.css.scss"
  );
  var obj = JSON.parse(fs.readFileSync(SWAGGER_FILE, "utf8"));

  obj = restrictData.restrictData(obj, allowList);

  converter.convert(obj, utils.options, function(err, str) {
    var newStr = modifyStyling.modifyMdFile(str, obj.paths, allowList);
    fs.writeFile(
      "/usr/src/slateapp/node-slate/source/includes/main.md",
      newStr,
      function(err) {
        if (err) {
          console.log("Error during conversion via Widdershin:");
          return console.log(err);
        }
        console.log("The file was saved!");
      }
    );
  });
});

// catch 404 errors
app.use(function(request, response, next) {
  response.status(404);
  response.json({
    message: "Not Found"
  });
});

// catch application errors
app.use(function(err, request, response, next) {
  response.status(500);
  response.json({
    message: err.message,
    error: err.stack
  });
});

// start the server and make it listen for connections
app.listen(PORT, function() {
  console.log(`Running on http://${HOST}:${PORT}`);
});
