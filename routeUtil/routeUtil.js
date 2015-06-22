'use strict';
var api = require('dr-connectjs')();
var fs = require("fs");
var path = require("path");
var Q = require('q');
var ex = require('fs.extra');
var _ = require('lodash');
var recursive = require('recursive-readdir');
var defaultThemeColors =  require('../assets/defaultThemeSettings.json');
var colors    = require('colors/safe');

var DEFAULTS = {
     IMAGE_FILE_SIZE: 9001,
     THEME_NAME: "spring"
};

var editSiteConfig = {
	 /**
     * put description here
     *
     * @param {String}
     * @param {Object}
     * @returns
     */
    getSchema: function (setting, asObject) {
      var schemaDir = path.join(__dirname, "..", "schemas");
      return this.readFilePromise(path.join(schemaDir, setting + ".json")).then(function (data) {
              return (asObject ? JSON.parse(data) : data);
          }, function (err) {
              console.log("Caught error", err);
              return undefined;
          });
    },
    readFilePromise: function (filename, options) {
      var deferred = new Q.defer();

      fs.readFile(filename, options, function (err, data) {
          if (err) {
              deferred.reject(err);
          } else {
              deferred.resolve(data);
          }
      });

      return deferred.promise;
    }

 };


 var category = {
	 /**
     * Takes products(category) object and cuts the display name to 43 and adds an elipse
     *
     * @param {Object} a list of products
     * @returns {defer.promise}
     */
    cutDisplayName: function (products) {
     	var name;

     	for (name in products) {
     		if (products.hasOwnProperty(name)) {
     			var key = name,
     			value = products[key].displayName;
     			if (value.length > 44) {
     				products[key].displayName = value.substring(0, 43).concat("...");
     			}
     		}
     	}

     	return products;
     }
 };

 var admin ={
	 /**
     * Creats an object for use when uploading an image to the db
     *
     * @param {Object} Multipart form data
     * @returns {Object} Path uploaded from, upload to, relative path, object used to upload to server and keyname for db
     */
    createImgObj: function (file) {
     	if (file.originalFilename !== '') {
               var re = /\.(png|jpg|jpeg|gif)$/.test(file.originalFilename);
               if (!re) {
                    //testing for file type so we dont wasting time
                    throw new Error("File type is unsupported");
               }

     	            var oldPath = file.path,
                      uploadPath  = path.join(__dirname, "../public/images", file.originalFilename),
     		              relPath = "/images/" + file.originalFilename,
     		              fieldName = file.fieldName,
                      self = this;

     	     fs.unlink(uploadPath, function (err) {
                    if (err && err.errno) {
                         if (err.errno !== 34) {
                          //file didnt exist
                              throw new Error("Something broke: Error " + err.errno + " Code " + err.code);
                         }
                         self.moveFile(oldPath, uploadPath);
                    } else {
                         self.moveFile(oldPath, uploadPath);
                    }
               });

     		var obj = {
     			src: relPath,
     			alt: "alt",
     			title: "title",
     			href: "/",
     			style: "logo"
     		};

     		return {
     			oldPath: oldPath,
     			uploadPath: uploadPath,
     			relPath: relPath,
     			obj: obj,
     			keyName: fieldName
     		};
     	}
     },

     /**
     * Moves a file
     *
     * @param {String} Path of file to move from
     * @param {String} Path of file to move to
     *
     */
     moveFile: function (oldPath, newPath) {
          ex.move (oldPath, newPath, function (err) {
               if (err) { throw err; }
          });
     },
	/**
     * Uploads to database
     *
     * @param {String} Id of site
     * @param {String} name of what to set
     * @param {Object} data to set in database
     */
    upload: function (siteId, keyName, obj) {
     	api.SiteService.set(siteId, "logo." + keyName, obj)
     	.then(function (msg) {
     		return msg;
     	});
     }
 };


 var util = {
	/**
     * Checks if a files exists in the file system.
     *
     * @param {String} file path
     * @returns {defer.promise} boolean
     */
    checkFile: function (filePath) {
     	var deferred = Q.defer();
     	fs.exists(filePath, function (result) {
     		return result ? deferred.resolve(filePath) : deferred.resolve(false);
     	});
     	return deferred.promise;
    },
	/**
     * Checks for a property in a given object. It resolves if true or false to allow the promise chain to finish caining before checking if an error occurred
     *
     * @param {String} property to search for
     * @param {Object} parent object to search in
     * @returns {defer.promise} boolean
     */
    checkProp: function (key, object) {

     	var deferred = Q.defer();
     	hasOwnProperty.call(object, key) ? deferred.resolve(true) : deferred.resolve(false);
     	return deferred.promise;
     },

    truncateString: function (products, startAt, endAt) {
     	var start 	= startAt || 0,
     		end 	= endAt || 40,
     		name;

     	if (typeof products === "object") {
     		for (name in products) {
     			if (products.hasOwnProperty(name)) {
     				var key = name,
     				value = products[key].displayName;

     				if (value.length > 44) {
     					products[key].displayName = value.substring(start, end).concat("...");
     				}
     			}
     		}
     		return products;
     	} else {
     		products = products.substring(start, end).concat("...");
     		return products;
     	}
    },

    /**
      * put description here
      *
      * @param {String}
      * @param {Object}
      * @returns
      */
     getSchema: function (setting, asObject) {
       var schemaDir = path.join(__dirname, "..", "schemas");
       return this.readFilePromise(path.join(schemaDir, setting + ".json")).then(function (data) {
               return (asObject ? JSON.parse(data) : data);
           }, function (err) {
               console.log("Caught error", err);
               return undefined;
           });
     },
     readFilePromise: function (filename, options) {
       var deferred = new Q.defer();

       fs.readFile(filename, options, function (err, data) {
           if (err) {
               deferred.reject(err);
           } else {
               deferred.resolve(data);
           }
       });

       return deferred.promise;
     },

     readDirPromise: function (filename) {
        var self      = this,
            deferred  = new Q.defer(),
            fileArray = [],
            dirArray  = [],
            obj       = {};
        recursive(filename, function (err, files) {
          if (!err) {
            var len = Object.keys(files).length; //used to get the number of files to detect the last iteration
            for (var key in files) {
              if(files[key].indexOf("manifest.json") !== -1) {
                var fileStructureArray = files[key].indexOf("/") == -1 ? files[key].split("\\") : files[key].split("/"); //distinguish between os/env
                var dirName = fileStructureArray[fileStructureArray.length-2];
                
              
                dirArray.push(dirName); //pushing into an array to be used when all promises have been fulfilled
                fileArray.push(self.readFilePromise(files[key], "utf-8"));
              }

              if ((len - 1) === parseInt(key)) { //Key is a string by default. Dont ask me why or how, it just is.
                Q.all(fileArray).then(function (data) {

                  data.forEach(function (item, key) {
                    var fileObj = {};
                    fileObj[dirArray[key]] = JSON.parse(item);
                    _.extend(obj, fileObj)
                  });
                  
                  deferred.resolve(obj);
                });
              }
            }
          } else {
            deferred.resolve(err); //reject is not the opposite of resolve
          }
        });

        return deferred.promise;
     },

     isDir: function (dirName) {
      return fs.lstatSync(dirName).isDirectory();
     }
 };

 var themes = {
      getThemeColors: function (siteId, theme) {
        var self    = this,
            obj;
            
        return api.SiteService.get(siteId, "themes", theme).then(function (data) {

          if (data === undefined) {
            //data was not returned from the database, we dont have any info on it the db
            var themeData = defaultThemeColors[theme];

            if (themeData === undefined) {
              //the current theme is not one we support (example: cerulean)
              //sets the default theme; spring
              themeData = defaultThemeColors[DEFAULTS.THEME_NAME];
              theme = DEFAULTS.THEME_NAME;

              //sets the theme in the db to the default
             self.setTheme(siteId, theme); 
             console.log(colors.red(siteId + " does not have a supported theme, setting default theme: " + DEFAULTS.THEME_NAME));
            }

            obj = {
              theme: theme,
              data: self.createFlatCssString(defaultThemeColors[theme], siteId)
            };

            self.postThemeData(themeData, theme, siteId);
          } else {
            obj = {
              theme: theme,
              data: self.createFlatCssString(data, siteId)
            };
          }
          return obj
        }, function () {
          //if an error occurs getting the theme settings, uses default colors
          self.postThemeData(defaultThemeColors[theme], theme, siteId);
          obj = {
            theme: theme,
            data: self.createFlatCssString(defaultThemeColors[theme], siteId)
          };

          return obj;
        });
     },

     createFlatCssString: function (obj, siteId) {
      if(_.isObject(obj)) {
        var str = "";
        for (var key in obj) {
          if (typeof obj[key] === "object") {
            //if the data returned from the database is in the incorrect format
            console.log(colors.red(siteId + "\'s theme data is not in the correct format, please look at it in the database. Continuing on without error."));
            return this.createFlatCssString(obj[key]);
          } else {
            if (str.length === 0) {
              str = "$" + key + ":" + obj[key] + ";";
            } else {
              str += "$" + key + ":" + obj[key] + ";";
            }
          }
        }
      return str;
      }
     },

     postThemeData: function (cssObj, theme, siteId) {
        if (_.isObject(cssObj)) {
          var obj = this.constructThemeObject(theme, cssObj);

         return api.SiteService.set(siteId, "themes", obj).then(function (data) {
          return data;
          }, function (err) {
            console.log(colors.red("looks like there was an err in: " + __filename));
            throw new Error(err);
          });

        } else {
          throw new Error("postThemeData requires an object as a param");
        }
     },

     constructThemeObject: function (themeName, jsonObj) {
      var obj = {};
      obj[themeName] = {
        value: themeName,
        displayName: themeName,
        defaults: jsonObj,
        values: jsonObj
      };
      return obj;
    },

    setTheme: function (siteId, themeName) {
        var obj = {
            "presentationCss": themeName
        };

        api.SiteService.set(siteId, "template", obj)
            .then(function (msg) {
              console.log(colors.green("Default theme set without error"));
                return msg;
            });
    }
 }; 
 module.exports = {
 	admin: admin,
 	util: util,
 	editSiteConfig: editSiteConfig,
 	category: category,
  themes: themes
 };
