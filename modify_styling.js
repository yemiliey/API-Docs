"use strict";
const fs = require("fs");

// Widdershins-generated text that we need to get rid of
// should figure out a better way to keep code robust when those text changes
const DISCARD_FILE = "./utils/DiscardedText.md";
var DiscardText = fs.readFileSync(DISCARD_FILE, "utf8");

// the styling we want to add to the slate styling scss file
const STYLE_FILE = "./utils/StyleText.md";
var StyleText = fs.readFileSync(STYLE_FILE, "utf8");

// the part in slate styling scss file that we want to get rid of
const STYLE_DISCARD = "./utils/StyleDiscard.md";
var StyleDiscard = fs.readFileSync(STYLE_DISCARD, "utf8");

function modifyMdFile(mdFileStr, allEndpoints, allowList) {
  // replace the text at the top of the file that we want to discard
  mdFileStr = mdFileStr.replace(DiscardText, "");

  // replace all h3 and ### with **** (bold)
  mdFileStr = mdFileStr.replace(/\<h3.*Responses\<\/h3\>/g, "**Responses**");
  mdFileStr = mdFileStr.replace(
    /\<h3.*Response Schema\<\/h3\>/g,
    "**Response Schema**"
  );
  mdFileStr = mdFileStr.replace(/\<h3.*Parameters\<\/h3\>/g, "**Parameters**");
  mdFileStr = mdFileStr.replace(/### Properties/g, "**Properties**");

  // add subheader for all endpoints
  // eg. ("Blueprints" is the subheader for "Get BluePrints" and "Create BluePrints")
  let h2HeaderList = [];
  for (var pathName in allowList) {
    var path = pathName.slice(1);

    // replace all the h2 in md file to h3 (so all methods are in h3)
    for (var i = 0; i < allowList[pathName].methods.length; ++i) {
      var method = allowList[pathName].methods[i];
      var operationId = allEndpoints[path][method].operationId;
      var h2header = "## " + operationId;

      // for first method of that endpoint, add h2 header before it
      // eg. add "Job" in h2 before "Get Jobs" in h3
      if (i === 0 && h2HeaderList.indexOf(allowList[pathName].name)=== -1) {
        var newStr =
          "## " + allowList[pathName].name + "\n\n### " + operationId;
        h2HeaderList.push(allowList[pathName].name);
      } else {
        var newStr = "### " + operationId;
      }
      mdFileStr = mdFileStr.replace(h2header, newStr);
    }
  }
  return mdFileStr;
}

function modifySlate(TOC_FILE, CSS_FILE) {
  // add h3 selector to the _toc.js file
  fs.readFile(TOC_FILE, "utf8", function(err, data) {
    if (err) return console.log(err);
    var result = data.replace(/selectors: 'h1, h2'/, "selectors: 'h1, h2, h3'");
    fs.writeFile(TOC_FILE, result, "utf8", function(err) {
      if (err) return console.log(err);
    });
  });

  // add styling to the scss file
  fs.readFile(CSS_FILE, "utf8", function(err, data) {
    if (err) return console.log(err);
    var result = data.replace(StyleDiscard, StyleText);
    fs.writeFile(CSS_FILE, result, "utf8", function(err) {
      if (err) return console.log(err);
    });
  });
}

module.exports = {
  modifyMdFile: modifyMdFile,
  modifySlate: modifySlate
};
