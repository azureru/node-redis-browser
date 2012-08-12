/*
 * GET home page.
 */
var redis       = require('redis');
var util        = require('util');
var step        = require('step');

exports.index = function(req, res) {
  client = redis.createClient();	
  
  var self = res;
  renderData = {
	  title : "Node Redis Browser",
	  keys: [],
	  keyType: '',
	  key: '',
	  content: ''
  };
  
  var key = req.query.key;
  step(
     function getKey() {
		client.keys("*", this.parallel());	
		
		renderData.key = key;
		client.type(key, this.parallel());
	 }, 
	 
	 function getContent(err, keys, keyType) {
		renderData.keys = keys;
		
		if (typeof keyType != 'undefined') {
			renderData.keyType = keyType;
		} else {
			renderData.keyType = undefined;
		}
		
		if (renderData.keyType == 'string') {
			client.get(key, this);
		} else if (renderData.keyType == 'list') {
			client.lrange(key,0,-1, this);
		} else if (renderData.keyType == 'set') {
			
		} else if (renderData.keyType == 'zset') {
			
		} else if (renderData.keyType == 'hash') {
			client.hgetall(key, this);
		}
	 },	 	 
	 
	 function finalize(err, content) {
		if (!err) { 
			if (typeof content == 'string') {
				try {
					json = JSON.parse(content);
					content = JSON.stringify(json, null, 4);
				} catch (e) {
					// do nothing
				}
				renderData.content = (content); 
			} else {
				if (util.isArray(content)) {
					content.forEach(function(c,i) {
						try {
							json = JSON.parse(c);
							c = JSON.stringify(json, null, 4);
						} catch (e) {
							// do nothing
						}
						renderData.content += "\n" +  (c);
					});
				} else {
					renderData.content = JSON.stringify(content, null, 4);
				}	
			}
		} else {
			renderData.content = err;
		}
		
		self.render('index', renderData);		     
	 }
  );
  
};