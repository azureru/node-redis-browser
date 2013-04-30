/*
 * GET home page.
 */
var util        = require('util');
var step        = require('step');
var redis       = require('redis');

exports.index = function(req, res) {

  var self = res;

  var port = req.app.get('redisPort');
  var host = req.app.get('redisHost');
  var client = redis.createClient(port, host);

  var key = req.query.key;

  renderData = {
	title : "Node Redis Browser",
	keys: [],
	keyType: '',
	key: '',
	content: ''
  };

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
			client.smembers(key, this);
		} else if (renderData.keyType == 'zset') {
			client.zrange(key,0,-1,this);
		} else if (renderData.keyType == 'hash') {
			client.hgetall(key, this);
		} else {
			// to call next callback step
			this(null,'');
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
					var tempArray = new Array();
					content.forEach(function(c,i) {
						try {
							json = JSON.parse(c);
							c = JSON.stringify(json, null, 4);
						} catch (e) {
							// do nothing
						}
						tempArray.push(c);
					});
					renderData.content = tempArray;
				}

				renderData.content = JSON.stringify(content, null, 4);
			}
		} else {
			renderData.content = err;
		}
		(client && client.end());
		self.render('index', renderData);
	}
  );

};