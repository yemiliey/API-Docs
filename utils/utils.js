// Conversion to slate configs maybe port somewhere else
// See https://github.com/Mermade/widdershins for more options and params
var options = {}; // defaults shown
options.codeSamples = true;
options.language_tabs = [
  { shell: "Shell" },
  { http: "HTTP" },
  { javascript: "JavaScript" }
];
options.httpsnippet = false;
options.templateCallback = function(templateName, stage, data) {
  return data;
};
options.theme = "darkula";
options.search = true;
options.sample = true; // set false by --raw
options.discovery = false;
options.includes = [];
options.shallowSchemas = false;
options.summary = false;
options.headings = 2;
options.yaml = false;

function inAllowList(schema, allowList) {
  for (var name in allowList) {
    if (name === schema) return true;
  }
  return false;
}

// handles the two cases : either the schema/dto is an array or single item
function getRef(property) {
  if (property.items) {
    return property.items["$ref"];
  }
  return property["$ref"];
}

function isUpperCase(aCharacter) {
  return aCharacter >= "A" && aCharacter <= "Z";
}

function getOperationVerb(str) {
  var newStr = str.charAt(0).toUpperCase();
  for (var i = 1; i < str.length && !isUpperCase(str.charAt(i)); ++i) {
    newStr += str.charAt(i);
  }
  return newStr + " ";
}

module.exports = {
  inAllowList: inAllowList,
  getRef: getRef,
  getOperationVerb: getOperationVerb,
  options: options
};
