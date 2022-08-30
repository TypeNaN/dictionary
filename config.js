require('dotenv').config()


const config = {
  
  // Service
  nodeEnv: process.env.node_env || 'development',
  port: process.env.node_env == 'development' ? 8443 : parseInt(process.env.port),
  hostname: process.env.HOSTNAME || 'localhost',
  
  // SSL
  sslKey: process.env.ssl_key,
  sslCert: process.env.ssl_cert,
  sslCa: process.env.ssl_ca,
  servSecret: process.env.server_secret,
  
  // Database
  dbUser: process.env.db_user,
  dbPass: encodeURIComponent(process.env.db_pass),
  dbUrl: process.env.db_url,
  dbUse: process.env.db_name,
  
  // Allow Hostname
  whiteHost: process.env.whitelist_hostname.split(','),
}

module.exports = config