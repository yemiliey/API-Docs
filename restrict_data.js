"use strict";
var utils = require("./utils/utils");

// takes in obj.definitions as allEntities, entityName (eg. ETLJobDTO), and the allowedEntities obj
function addEntityToAllowedEntities(allEntities, entityName, allowedEntities) {
  entityName = entityName.replace("#/definitions/", "");
  if (!allowedEntities[entityName]) {
    allowedEntities[entityName] = { ...allEntities[entityName] };
    //check through the properties of the parent entity
    // add related entity to allowedEntities
    for (let property in allEntities[entityName].properties) {
      var refEntity = utils.getRef(
        allEntities[entityName].properties[property]
      );
      if (refEntity) {
        // if the ref entity is not in allowedEntities, add it
        if (!allowedEntities[refEntity]) {
          allowedEntities = addEntityToAllowedEntities(
            allEntities,
            refEntity,
            allowedEntities
          );
        }
      }
    }
  }
  return allowedEntities;
}

// find related entity for an endpoint in its parameters
function getParamsEntity(endpoint) {
  var params = endpoint.parameters;
  for (let i = 0; i < params.length; ++i) {
    if (params[i].name === "body") {
      var entityName = utils.getRef(params[i].schema);
    }
  }
  return entityName;
}

// get replated entity name in responses
function getResponseEntity(endpoint) {
  var responses = endpoint.responses;
  if (responses[200]) {
    var entityName = utils.getRef(responses[200].schema);
  }
  return entityName;
}

// modifies the object to only contain endpoints in allowList
// and all entities related to the endpoint
function restrictData(obj, allowList) {
  var allowedEntities = {};
  var allowedEndpoints = {};
  for (var path in obj.paths) {
    if (utils.inAllowList(path, allowList)) {
      // get the array of methods allowed for this endpoint
      var methods = allowList[path].methods;

      for (var i = 0; i < methods.length; ++i) {
        var method = methods[i];
        var endpoint = { ...obj.paths[path][method] };
        var paramEntity = getParamsEntity(endpoint);
        var responseEntity = getResponseEntity(endpoint);

        // compare the two (to avoid duplicates) and add to allowedEntities
        if (paramEntity) {
          allowedEntities = addEntityToAllowedEntities(
            obj.definitions,
            paramEntity,
            allowedEntities
          );
        }
        if (responseEntity && responseEntity !== paramEntity) {
          allowedEntities = addEntityToAllowedEntities(
            obj.definitions,
            responseEntity,
            allowedEntities
          );
        }

        // change name of the endpoint to get rid of the slash/
        // eg. change /api/manager/folders/{fileId} to api/manager/folders/{fileId}
        var newPath = path.slice(1);
        if (!allowedEndpoints[newPath]) {
          allowedEndpoints[newPath] = {};
        }
        allowedEndpoints[newPath][method] = endpoint;
      }
    }
  }
  // renew the definitions field in obj
  obj.definitions = allowedEntities;
  obj.paths = allowedEndpoints;
  return obj;
}

module.exports = {
  restrictData: restrictData,
  getResponseEntity: getResponseEntity,
  getParamsEntity: getParamsEntity,
  addEntityToAllowedEntities: addEntityToAllowedEntities
};
