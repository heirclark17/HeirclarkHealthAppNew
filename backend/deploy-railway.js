// Railway Deployment Script
const fs = require('fs');
const https = require('https');

const RAILWAY_TOKEN = '2ded2c03-f1de-45df-892e-65a6b0f0e081';
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';

// GraphQL query to get projects
const query = `
  query {
    projects {
      edges {
        node {
          id
          name
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

const data = JSON.stringify({
  query: query
});

const options = {
  hostname: 'backboard.railway.app',
  port: 443,
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${RAILWAY_TOKEN}`
  }
};

console.log('🚀 Connecting to Railway API...');

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      if (response.errors) {
        console.error('❌ Railway API Error:', JSON.stringify(response.errors, null, 2));
      } else {
        console.log('✅ Projects:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Parse Error:', error.message);
      console.error('Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(data);
req.end();
