var rd = require("../restrict_data");
var ms = require("../modify_styling");
var utils = require("../utils/utils");
var assert = require("assert");
const fs = require("fs");
const converter = require("widdershins");
const RAW = "./test/v2.json"; // with all endpoints & entities in it
var obj = JSON.parse(fs.readFileSync(RAW, "utf8"));
const ALLOW_LIST1 = "./test/allowList1.json";
const ALLOW_LIST2 = "./test/allowList2.json";
const ALLOW_LIST_ALL = "./test/allowListAll.json";
const TEST2_RESULTS = "./test/test2Results.json";
const TEST1_RESULTS = "./test/test1Results.json";
var allowList1 = JSON.parse(fs.readFileSync(ALLOW_LIST1, "utf8"));
var allowList2 = JSON.parse(fs.readFileSync(ALLOW_LIST2, "utf8"));
var allowListAll = JSON.parse(fs.readFileSync(ALLOW_LIST_ALL, "utf8"));
var test2Results = JSON.parse(fs.readFileSync(TEST2_RESULTS, "utf8"));
var test1Results = JSON.parse(fs.readFileSync(TEST1_RESULTS, "utf8"));

describe(" -- Test restrict_data File -- ", function() {
  var endpoint;
  describe("getResponseEntity()", function() {
    it("has related entity in 200 response", function() {
      endpoint =
        obj.paths[
          "/api/manager/processes/{processId}/activities/{activityId}/activityItems"
        ].post;
      assert.equal(
        rd.getResponseEntity(endpoint),
        "#/definitions/ActivityItemDTODisplayName"
      );
    });
    it("has array of related entity in 200 response", function() {
      endpoint =
        obj.paths[
          "/api/manager/processes/{processId}/activities/{activityId}/activityItems"
        ].get;
      assert.equal(
        rd.getResponseEntity(endpoint),
        "#/definitions/ActivityItemDTODisplayName"
      );
    });
    it("has no 200 response", function() {
      var endpoint =
        obj.paths["/api/manager/processes/{processId}/saves/csv"].get;
      assert.equal(rd.getResponseEntity(endpoint), undefined);
    });
    it("has no related entity in 200 response", function() {
      var endpoint =
        obj.paths["/api/manager/processes/{processId}/saves/filterSuggestions"]
          .get;
      assert.equal(rd.getResponseEntity(endpoint), undefined);
    });
  });

  describe("getParamsEntity()", function() {
    it("has no releted entity in all parameters", function() {
      endpoint =
        obj.paths["/api/manager/processes/{processId}/saves/filterSuggestions"]
          .get;
      assert.equal(rd.getParamsEntity(endpoint), undefined);
    });
    it("has related entity in first parameter", function() {
      endpoint =
        obj.paths["/api/manager/processes/{processId}/tasks/bulk"].delete;
      assert.equal(rd.getParamsEntity(endpoint), "#/definitions/IdDisplayName");
    });
    it("has an array fo related entity in one parameter", function() {
      endpoint =
        obj.paths["/api/manager/processes/{processId}/tasks/bulk/assignments"]
          .post;
      assert.equal(
        rd.getParamsEntity(endpoint),
        "#/definitions/AssignmentDTODisplayName"
      );
    });
    it("has related entity in third parameter", function() {
      endpoint =
        obj.paths[
          "/api/manager/processes/{processId}/tasks/{taskId}/assignments"
        ].post;
      assert.equal(
        rd.getParamsEntity(endpoint),
        "#/definitions/AssignmentDTODisplayName"
      );
    });
  });

  describe("addEntityToAllowedEntities()", function() {
    var allowed = {};
    describe("- add entity with nested related entitiy in properties", function() {
      it("count of all entities added to allowedEntities is correct", function() {
        countBefore = Object.keys(allowed).length;
        allowed = rd.addEntityToAllowedEntities(
          obj.definitions,
          "ETLJobDTODisplayName",
          allowed
        );
        countAfter = Object.keys(allowed).length;
        assert.equal(countBefore + 3, countAfter);
      });
    });
    describe("- add entity with related entities in multiple properties", function() {
      it("count of all entities added to allowedEntities is correct", function() {
        countBefore = Object.keys(allowed).length;
        allowed = rd.addEntityToAllowedEntities(
          obj.definitions,
          "BulkTaskUpdateDTODisplayName",
          allowed
        );
        countAfter = Object.keys(allowed).length;
        assert.equal(countBefore + 14, countAfter);
      });
    });
    describe("- add entity with no related entities in properties", function() {
      it("count of all entities added to allowed is correct", function() {
        countBefore = Object.keys(allowed).length;
        allowed = rd.addEntityToAllowedEntities(
          obj.definitions,
          "ContentDispositionDisplayName",
          allowed
        );
        countAfter = Object.keys(allowed).length;
        assert.equal(countBefore + 1, countAfter);
      });
      it("entity exists in allowed", function() {
        assert.equal(allowed["ContentDispositionDisplayName"].type, "object");
      });
    });
  });

  describe("restrictData()", function() {
    it("function successfully runs through all endpoints and entities", function() {
      obj = JSON.parse(fs.readFileSync(RAW, "utf8"));
      newObj = rd.restrictData(obj, allowListAll);
      assert.deepEqual(obj, newObj);
    });
    it("restrict to selected 5 endpoints and 15 entities", function() {
      obj = JSON.parse(fs.readFileSync(RAW, "utf8"));
      obj = rd.restrictData(obj, allowList2);
      assert.deepEqual(obj, test2Results);
    });
    it("restrict to 2 endpoints and 6 entities", function() {
      obj = JSON.parse(fs.readFileSync(RAW, "utf8"));
      obj = rd.restrictData(obj, allowList1);
      assert.deepEqual(obj, test1Results);
    });
  });
});

var jsonObj = JSON.parse(fs.readFileSync(RAW, "utf8"));
jsonObj = rd.restrictData(jsonObj, allowList1);
converter.convert(jsonObj, utils.options, function(err, str) {
  describe(" -- test modify_styling File -- ", function() {
    describe("modifyMdFile()", function() {
      it("replace all h3 and ### with **** (bold)", function() {
        var newStr = ms.modifyMdFile(str, obj.paths, allowList1);
        assert.equal(
          newStr.indexOf('<h3 id="get-jobs-responses">Responses</h3>'),
          -1
        );
        assert.equal(newStr.indexOf("### Properties"), -1);
        assert.equal(
          newStr.indexOf(
            '<h3 id="get-jobs-responseschema">Response Schema</h3>'
          ),
          -1
        );
        assert.equal(newStr.indexOf("**Responses**") !== -1, true);
        assert.equal(newStr.indexOf("**Properties**") !== -1, true);
        assert.equal(newStr.indexOf("**Response Schema**") !== -1, true);
      });
      it("replace all the h2 in md file to h3", function() {
        var newStr = ms.modifyMdFile(str, obj.paths, allowList1);
        assert.equal(newStr.indexOf("### Get etlJobs") !== -1, true);
        assert.equal(
          newStr.indexOf("### Update blueprints_{blueprintId}") !== -1,
          true
        );
      });
      it("add h2 header before first method of every endpoint", function() {
        var newStr = ms.modifyMdFile(str, obj.paths, allowList1);
        assert.equal(newStr.indexOf("## etlJobs") !== -1, true);
        assert.equal(
          newStr.indexOf("## blueprints_{blueprintId}") !== -1,
          true
        );
      });
    });
  });
});
