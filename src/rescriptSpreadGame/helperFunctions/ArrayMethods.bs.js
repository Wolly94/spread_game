// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Curry from "rescript/lib/es6/curry.js";
import * as Caml_option from "rescript/lib/es6/caml_option.js";

function findAndMapi(mapi, l) {
  var result = {
    contents: undefined
  };
  l.find(function (val, index) {
        var b = Curry._2(mapi, val, index);
        if (b !== undefined) {
          result.contents = Caml_option.some(Caml_option.valFromOption(b));
          return true;
        } else {
          return false;
        }
      });
  return result.contents;
}

function findAndMap(map, l) {
  var result = {
    contents: undefined
  };
  l.find(function (val) {
        var b = Curry._1(map, val);
        if (b !== undefined) {
          result.contents = Caml_option.some(Caml_option.valFromOption(b));
          return true;
        } else {
          return false;
        }
      });
  return result.contents;
}

export {
  findAndMapi ,
  findAndMap ,
  
}
/* No side effect */
