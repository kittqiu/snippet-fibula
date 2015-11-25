'use strict';

/*
 * This is the default configuration for snippet-fibula.
 * 
 * DO NOT change it. Instead, make a copy and rename to:
 * "config_development.js" which is enabled in development environment.
 * "config_production.js" which is enabled in production environment.
 * Then edit settings you needed.
 */

 module.exports = {
	db: {
        // host or ip address of mysql, e.g. '192.168.1.123':
        host: 'localhost',
        // port of mysql, default to 3306:
        port: 3306,
        // user to login to mysql, change to your mysql user:
        user: 'www',
        // password to login to mysql, change to your mysql password:
        password: 'www',
        // database used in mysql, default to 'itranswarp':
        database: 'snippet-fibula',
        // timeout before initial a connection to mysql, default to 3 seconds:
        connectTimeout: 3000,
        // maximum concurrent db connections:
        connectionLimit: 20,
        // acquire timeout:
        acquireTimeout: 3000,
        // waiting queue size:
        queueLimit: 10
    },
 };