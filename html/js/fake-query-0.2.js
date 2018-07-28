/*

	fakeQuery - v0.1
	
	Copyright (c) 2008 Mat Ryer
	
	Please visit the project home at http://fakequery.googlecode.com/
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

// make sure we have jQuery to work with
var jQuery = jQuery || null;

if (!jQuery)
	throw "You must include a version of jQuery _before_ the Fake Query script.  Please see http://jquery.com/";

/**
 * The primary fake query object.
 */
var $$ = {
	
	/**
	 * Reference to the original jQuery object
	 */
	jQuery: jQuery,

	/**
	 * Stores global calls
	 */
	calls: [],
	
	/**
	 * Stores instances (i.e. all calls to $(...))
	 */
	instances: {},
	
	/**
	 * Store the last calls
	 */
	lastCallTo: {},
	
	/**
	 * Store the number of calls to different methods
	 */
	callsTo: {},
	
	/**
	 * Stores when callbacks
	 */
	whenCallbacks: [],
	
	/**
	 * Whether calls will be recorded to $$.calls or not
	 */
	record: true,
	
	/**
	 * Placeholder denoting any or no arguments 
	 */
	anything: { toString: function(){ return "$$.anything"; } },
	
	/**
	 * Placeholder denoting an argument
	 */
	argument: { toString: function(){ return "$$.argument"; } },
	
	/**
	 * Placeholder denoting a function as an argument
	 */
	func: { toString: function(){ return "$$.func"; } },
	
	/**
	 * Resets Fake jQuery ready for new tests
	 */
	reset: function(){
		
		// reset the calls
		$$.calls = [];
		
		// reset the static calls
		$.$$.calls = [];
		
		// reset the last calls
		$$.lastCallTo = {};
		
		// reset the call counters
		$$.callsTo = {};
		
		// reset whenCallbacks
		$$.whenCallbacks = [];
		
		// ensure we are recording
		$$.startRecording();
		
	},
	
	/**
	 * Gets an array of strings describing the names of the arguments of a function
	 */
	args: function(f){
		// stolen from http://objx.googlecode.com/
	    var args = f.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",");
	        for (var i = 0, l = args.length; i < l; i++)
	            args[i] = $$.strip(args[i]);
	    return args.length == 1 && !args[0] ? [] : args;
	},
	
	/**
	 * Strips whitespace from either side of a string
	 */
	strip: function(s) {
        return s.replace(/^\s+/, '').replace(/\s+$/, '');
	},
	
	/**
	 * Saves the call to the global log and optionally to the context object
	 */
	saveCall: function(name, arguments, obj){
		
		var c = $$.createCallObject(name, arguments, name === "$")
		
		if (obj) {
			// add to the instance call log
			obj.$$ = obj.$$ || {};
			obj.$$.calls = obj.$$.calls || [];
			obj.$$.calls.push(c);
		}
		
		if ($$.record) {
		
			// save the last call
			$$.lastCallTo[name] = c;
			
			// make sure we have a callsTo array for this item
			$$.callsTo[name] = $$.callsTo[name] || [];
			$$.callsTo[name].push(c);
			
			// add to the global call log
			$$.calls.push(c);
		
		}
	},
	
	/**
	 * Gathers all calls together from either call arrays, or fakeQuery instance objects.
	 * Also accepts any number of different objects as arguments and collects all of the calls
	 * within them.
	 */
	getCalls: function() {
		
		var allCalls = new Array();
		
		for (var i = 0, l = arguments.length; i<l; i++) {
			
			var obj = arguments[i];
			var calls;
			
			// does the object look like an array?
			if (obj.$$)
                
                // get the calls from the fake query object
                calls = obj.$$.calls;
                
			else if (typeof obj.length != "undefined")
			
				// treat it thus
				calls = obj;

			else
				
				// return the individual call object in an array
				calls = [ obj ];
				
			// make sure calls is something
			calls = calls || [];
			
			// add all of these calls
			for (var ii = 0, ll = calls.length; ii<ll; ii++)
				allCalls.push(calls[ii]);
		
		};
		
		return allCalls;
		
	},
	
	/**
	 * Gets the number of times a function was called since the
	 * last $$.reset()
	 */
	getCallCount: function(functionName){
		
		if (!$$.callsTo[functionName]) return 0;
		return $$.callsTo[functionName].length;
		
	},
	
	/**
	 * Creates an object that stores the details of a call.
	 * Used internally
	 */
	createCallObject: function(name, arguments, isConstructor){
		
		// return a new object containing the data
		return {
			name: name,
			arguments: arguments,
			argument: arguments[0] || null,
			isConstructor: isConstructor,
			
			toString: function(){

				var argsString = "";
				for (var i = 0, l = this.arguments.length; i<l; i++)
					argsString += this.arguments[i] + ", ";
				argsString = argsString.substring(0, argsString.length - 2);
				
				return this.name + "(" + argsString + ")";
				
			}
		};
		
	},
	
	/**
	 * The actual fakeQuery object
	 */
	fakeQueryObject: function(){
	
		// return a new instance
		var newInstance = new $$.fakeQueryObject.fn.init();
		
		// save this call
		$$.saveCall("$", arguments, newInstance);
		
		// save this instance
		$$.instances[arguments[0]] = newInstance;
		
		// return the new instance
		return newInstance;
		
	},
	
	/**
	 * Binds an function to the specified context.
	 */
	bind: function(){

		// borrowed from objx bind method - see http://code.google.com/p/objx/source/browse/trunk/src/objx.js?spec=svn358&r=341#137

	    var _func = arguments[0] || null;
	    var _obj = arguments[1] || null;
	    var _args = [];
	    
	    if (!_func) throw "You must pass a function as the first argument to $$.bind().  Cannot be " + _func + ".";
	    if (!_obj)  throw "You must pass a context object as the second argument to $$.bind();";
	    
	    // add arguments
	    for (var i = 2, l = arguments.length; i<l; i++)
	            _args.push(arguments[i]);

	    // return a new function that wraps everything up
	    return function() {
	            
	            // start an array to get the args
	            var theArgs = [];
	    
	            // add every argument from _args
	            for (var i = 0, l = _args.length; i < l; i++)
	                    theArgs.push(_args[i]);
	            
	            // add any real arguments passed
	            for (var i = 0, l = arguments.length; i < l; i++)
	                    theArgs.push(arguments[i]);
	    
	            // call the function with the specified context and arguments
	            return _func.apply(_obj, theArgs);

	    };
	    
	},
	
	/**
	 * Object for storing the discovered methods from jQuery
	 */
	discovery: {
	
		/**
		 * Stores the static $. methods.
		 */
		staticMethods: null,
		
		/**
		 * Stores the instance $() methods.
		 */
		instanceMethods: null
		
	},
	
	
	/**
	 * Discovers static and instance methods from the real jQuery objects.
	 */
	discover: function(){
	
		// create arrays
		$$.discovery.staticMethods = [];
		$$.discovery.instanceMethods = [];
		
		// discover static methods
		for (var methodName in jQuery)
			if (typeof jQuery[methodName] == "function") {
				
				// save this property in the array
				$$.discovery.staticMethods.push(methodName)
				
				// and add this as a static method
				$$.addStaticMethod(methodName);
				
			}
		
		// discover instance methods
		var instance = jQuery("selector");
		for (var methodName in instance)
			if (typeof instance[methodName] == "function")
				$$.discovery.instanceMethods.push(methodName)
		
	},
	
	/**
	 * Adds a new static method to the global method
	 */
	addStaticMethod: function(name){
	
		$$.fakeQueryObject[name] = function(){
			
			var _methodName = name;
			
			return function(){
				
				// save this call in the log
				$$.saveCall(_methodName, arguments, this);
	
				var matchingWhen = $$.getMatchingWhen();
                
                if (matchingWhen) {
                    matchingWhen.usedCount++;
                    return matchingWhen.callback.apply(this, arguments);
                }
			
				// return the same object
				return this;
				
			}
			
		}();
		
	},
	
	/**
	 * Adds a new instance method to the object specified.
	 */
	addInstanceMethod: function(obj, name){
	
		obj[name] = function(){
			
			var _methodName = name;
			
			return function(){
				
				// save this call in the log
				$$.saveCall(_methodName, arguments, this);
				
				var matchingWhen = $$.getMatchingWhen();
				
				if (matchingWhen) {
				    matchingWhen.usedCount++;
				    return matchingWhen.callback.apply(this, arguments);
			    }
			    
				// return the same object
				return this;
				
			}
			
		}();
		
	},
	
	/**
	 *  Gets a string containing debug information about given calls.
	 */
	debug: function(){
	
		var calls;
		
		if (arguments && arguments.length && arguments.length > 1)
			calls = $$.getCalls.apply($$, arguments);
		else 
			calls = $$.calls;
	
		var output = "";
		
		if (calls.length == 0)
			output += "No calls have been made since the last $$.reset()";
	
		var instanceCount = 0;
	
		for (var i = 0, l = calls.length; i < l; i++){
			
			var call = calls[i];
			
			if (call.isConstructor) instanceCount++;
			
			if (call.isConstructor && i > 0)
				output += "\n";
			
			output += i + ".\t";
			
			if (!call.isConstructor)
				output += "   .";
				
			output += $$.getNiceFunctionName(call.name) + " ( ";
			
			var args = [];
			
			// collect the arguments
			if (call.arguments && call.arguments.length > 0) {
			
				for (var ai = 0, al = call.arguments.length; ai < al; ai++){
					var arg = call.arguments[ai];
					//if (typeof arg != "undefined")
						args.push(arg);
				};
				
			
				for (var ai = 0, al = args.length; ai < al; ai++){
					
					var arg = args[ai];
					
					output += $$.getNiceValueName(arg);
					
					if (ai < (al-1)) output += ", ";
					
				}
			
			}
			
			output += " )";
			
			output += "\n";
						
		};
		
		output += "\n---------------------------";
		output += "\n" + calls.length + " Call(s)\n" + instanceCount + " instance(s)\n";
		
		return output;
	
	},
	
	/**
	 * Gets a nice version of the function name.
	 */
	getNiceFunctionName: function(n){
		return n;
	},
	
	/*
	 * Gets a nice value name useful for debugging data.
	 * getNiceValueName( (object) value [, (Boolean) includeType])
	 * value - The value to get a nice string representation of
	 * includeType - Whether or not to include the type of the object
	 */
	getNiceValueName: function(n, includeType){
		
		var name = n;
		
		if (n == $$.anything || n == $$.func)
			return n.toString();
		
		if (typeof n == "undefined")
			return "{undefined}";
		
		switch (typeof n){
			case "string":
				name = "\"" + n + "\"";
				break;
			case "function":
				name = "function(){...}";
				break;
			case "undefined":
				name = "{undefined}";
				break;
		}
		
		if (includeType)
			name = "" + typeof n + ": " + name;
		
		return name;
		
	},
	
	/**
	 * Compares actual calls against an expected set and optionally throws an exception when something does not match.
	 */
	equal: function(actual, expected, throwErrors){
	
		// get the calls from the two objects
		var a_calls = $$.getCalls(expected);
		var b_calls = $$.getCalls(actual);
		
		// check every call
		for (var i = 0, l = Math.max(a_calls.length, b_calls.length); i<l; i++) {
			
			// get the calls
			a = a_calls[i]; 
			b = b_calls[i];
			
			if (!a)
				if (throwErrors)
					throw "(Call " + i + ") Method is missing.";
				else
					return false;	
			
			if (!b)
				if (throwErrors)
					throw "(Call " + i + ") Method '" + a.name + "' expected but was missing.";
				else
					return false;
			
			// check the name and arguments of these two objects
			if (a.name != b.name)
				if (throwErrors)
					throw "(Call " + i + ") Method '" + a.name + "' expected but was '" + b.name + "'.";
				else
					return false;
			
			if (a.arguments.length == 1 && a.arguments[0] === $$.anything)
				continue;
			if (a.arguments.length > 1 && a.arguments[0] === $$.anything)
				throw "Invalid use of $$.anything.  $$.anything must be the only argument in the method call.  Consider $$.argument instead.";
			
			// check the arguments too
			for (var ii = 0, ll = Math.max(a.arguments.length, b.arguments.length); ii<ll; ii++){

				if (a.arguments[ii] === $$.anything)
					throw "Invalid use of $$.anything.  $$.anything must be the only argument in the method call.  Consider $$.argument instead.";

				var match = true;

				if (a.arguments[ii] == $$.func)
					if (typeof b.arguments[ii] != "function")
						if (throwErrors)
							throw "(Call " + i + ") Function expected as argument " + ii + " on method '" + a.name + "' but was '" + b.arguments[ii] + "'.";
						else
							return false;
					else
						break;
				
				
				if (
					// are we comparing argument to the $$.argument placeholder?
					a.arguments[ii] !== $$.argument
				
					// strictly compare the arguments
					&& (a.arguments[ii] !== b.arguments[ii])
				)
					if (throwErrors)
						throw "(Call " + i + ") Argument '" + a.arguments[ii] + "' expected as argument " + ii + " on method '" + a.name + "' but was '" + b.arguments[ii] + "'.";
					else
						return false;
						
			}
			
		}
		
		return true;
		
	},
	
	/**
	 * Gets the index of a series of calls within another series of calls.
	 */
	indexOf: function(calls, callArray, startIndex, strict, throwErrors){
		
		callArray = callArray || $$.calls;
		callArray = $$.getCalls(callArray);
		startIndex = startIndex || 0;
		calls = $$.getCalls(calls);

		var nextExpectedIndex = 0;
		
		if (calls.length == 0) return -1;
		
		for (var ii = startIndex, ll = callArray.length; ii < ll; ii++) {
		
			nextExpectedIndex = 0;
		
			for (var i = ii, l = callArray.length; i<l; i++) {
			
				var call = calls[nextExpectedIndex];
				
				if ($$.equal(callArray[i], call, strict && throwErrors))
				
					// make some progress
					nextExpectedIndex++;
					
				else {
				
					if (strict)
						if (throwErrors)
							throw "$$.wasCalled failed because the first call in $$.calls did not match the first call specified in Strict mode.";
						else
							return -1;
				
					break;
					
				}
					
				// have we found them all?
				if (nextExpectedIndex == calls.length)
				
					// return the index, minus the length of the calls.length
					// so that the index of the start of the match is returned.
					return i - (calls.length - 1);
			
			}
		}
		
		// we didnt match everything we needed to
		return -1;
	
	},
	
	/**
	 * Whether a set of calls were called.
	 */
	wasCalled: function(test, strict, throwErrors){
		return $$.indexOf(test, $$.calls, 0, strict, throwErrors) != -1;
	},
	
	wasCalledOn: function(instanceName, method){
		
		var args = new Array();
		
		for (var i = 2, l = arguments.length; i<l; i++)
			args.push(arguments[i]);
		
		var instance = $$.instances[instanceName];
		
		if (!instance)
			throw "No instance could be found for \"" + instanceName + "\".";
		
		for (var i = 0, l = instance.$$.calls.length; i<l; i++){

			if ($$.equal(instance.$$.calls[i], $$.createCallObject(method, args, false)))
				return true;
	
		}

		return false;
		
	},
	
	startRecording: function(){
		$$.record = true;
	},
	stopRecording: function(){
		$$.record = false;
	},
	
	when: function(calls, callback, options){
        
        calls = $$.getCalls(calls);
        
        var whenObj = { 
            calls: calls,
            callback: callback,
            options: options,
            usedCount: 0
        }
        
        $$.whenCallbacks.push( whenObj );
        
        return whenObj;
        
	},
	
	getMatchingWhen: function(startIndex){
	   
	   for (var i in $$.whenCallbacks){
	   
	       var when = $$.whenCallbacks[i];       
	       var whenIndex = $$.indexOf(when.calls, $$.calls, startIndex);
	       
	       if (whenIndex > -1)
	           return when;
	   
	   }
	
	   return null;
	   
	}
	
};

/**
 * Functions for jQuery
 */
$$.fakeQueryObject.fn = {
	
	init: function(){
	
		this.$$ = {
				
			/**
			 * Something to help testing to ensure the right kind of
			 * instance is being generated.
			 */
			type: "fakeQuery",
			
			/**
			 * Internal call log for each instance
			 */
			calls: []

		};
		
		// add the instance methods
		for (var i in $$.discovery.instanceMethods)
			$$.addInstanceMethod(this, $$.discovery.instanceMethods[i]);
		
	}
	
};


$$.fakeQueryObject.$$ = {};


/* 
 *  begin the discovery process.
 */
$$.discover();



/*
 * Overwrite $ and jQuery to use the fake versions
 */
$ = jQuery = $$.fakeQueryObject;