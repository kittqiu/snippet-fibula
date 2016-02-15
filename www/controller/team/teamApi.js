'use strict';


module.exports = {
	'GET /team': function*(){
		this.redirect('/team/structure/build');
	}
};