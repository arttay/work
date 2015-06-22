#!/usr/bin/env node

"use strict";

var fs 			= require("fs");
var path 		= require("path");
var readline 	= require('readline');
var api 		= require('dr-connectjs')();
var ex 			= require("fs.extra");
var colors 		= require('colors/safe');
var schemaTmpl 	= require('./addPageTypeDir/baseSchemaTmpl.json');
var manifestTmpl= require('./addPageTypeDir/manifestTmpl.json');
var url 		= path.join(__dirname, "..", "widgets/Admin/PageLayout/PageLayoutView.js");


String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};


function addToPageLayout (capAnswer, lowerAnswer, data) {
	var constructor = "\n\t\t\tcase '" + lowerAnswer + "' :\n\t\t\t\teditor = new GenericPageEditor({\n\t\t\t\t\tparent: this.$el,\n\t\t\t\t\tparentId: this.id,\n\t\t\t\t\tpageId: pageId,\n\t\t\t\t\tid: 'editor_' + pageId,\n\t\t\t\t\tsettings: data\n\t\t\t\t});\n\t\t\t\tbreak;\n";

	var lastIndex 	= data.lastIndexOf("break");
	var newFile 	= data.splice((lastIndex + 6), 0, constructor);

	fs.writeFile(url, newFile, 'utf-8', function (err) {
		if (err) {
			console.log(err);
			throw err;
		}
	});
	console.log(colors.green("Added to page layout. File at: " + url));
}

function createSchema (fileName) {

	var filePath 	= path.join(__dirname, "..", "schemas/pages", fileName + ".json");
	schemaTmpl 		= JSON.stringify(schemaTmpl).replace(/\{pageTypeName\}/g, fileName)
			.replace(/\"\{tmplList\}\"/g, '["' + fileName + '"]');

	fs.writeFile(filePath, schemaTmpl, 'utf-8', function (err) {
		if (err) throw err;
	});
	console.log(colors.green("Created a schema for: " + fileName + ". File at: " + filePath));
}


function createDirs (dirName) {

	var basePath 	= path.join(__dirname, "..", "views", dirName);
	var dirPath 	= path.join(__dirname, "..", "views", dirName, dirName);
	manifestTmpl 	= JSON.stringify(manifestTmpl).replace(/\{displayName\}/g, dirName)

	ex.mkdirs(dirPath, function (err) {
	  if (err) console.error(err);
	  //mkdirp is an alias of mkdirs
	  fs.readFile(dirPath + "/" + "index.dust", function (err, data) {
	  	//if the file contains anything, do not overwrite it.
	  	if (err) {
	  		fs.closeSync(fs.openSync(dirPath + "/" + "index.dust", 'w'));
	  	} 
	  });
		fs.writeFile(dirPath + "/" + "manifest.json", manifestTmpl, function (err) {
			if (err) console.log(err);
		});
	})

	console.log(colors.green("Created a view folder for: " + dirName + ". Folder can be found at: " + dirPath));
}

function createRoute (fileName) {

	var baseRoutePath 	= path.join(__dirname, "addPageTypeDir/baseRoute.js");
	var routeOutput 	= path.join(__dirname, "..", "routes", fileName + ".js");
	var fileRoute 		= [fileName, fileName, "index.dust"].join("/");


	fs.readFile(baseRoutePath, 'utf-8', function (err, data) {
		data = data.replace(/\{filename\}/g, fileName).replace(/\{fileRoute\}/g, fileRoute);

		fs.writeFile(routeOutput, data, 'utf-8', function (err) {
			if (err) throw err;
		});
	});
}

function createCollection (val) {
 	var obj =  {
 		"template": val
 	};
 	var collectionObj = {
 		getSitelist: function () {
 			var self = this;
 			api.SiteService.getSitesList().then(function (data) {
 				data.forEach(function (item) {
 					self.setCollection(item.siteId, val, obj);
 				});
 			});
 		},
 		setCollection: function (siteId, pageId, collectionData) {
 			api.PageService.set(siteId, pageId, collectionData)
 	        .then(function (siteData) {
 	           //do someting here sometime
 	        }, function (err) {
 	            console.log(err);
 	        });
 		}
 	}
 	collectionObj.getSitelist();
 }



fs.readFile(url, 'utf-8', function(err, data){
	if (err) {
		console.log(err);
	} else {
		var rl = readline.createInterface({
		  input: process.stdin,
		  output: process.stdout
		});

		rl.question("What is the name of the pageType? ", function(answer) {
			var capAnswer 	= answer.charAt(0).toUpperCase() + answer.slice(1);
			var lowerAnswer = answer.charAt(0).toLowerCase() + answer.slice(1);

			createCollection(lowerAnswer);
			addToPageLayout(capAnswer, lowerAnswer, data);
			createSchema(lowerAnswer);
			createDirs(lowerAnswer);
			createRoute(lowerAnswer);
			
			rl.close();
		});
	}
});