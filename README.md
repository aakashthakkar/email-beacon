# email-beacon
A simple POC for an email tracking app. Has 3 API's
1. Subscribe API - accepts raw JSON input with only one parameter of email with a value of the email address whom we want to add to our subscription database.

Example input:
`{
  email: "xzs@email.com"
}`

2. Image api - accepts two params using a get request, the first one being the API key and the second one being the fiiename requested. The system leverages the Json Web Token api to fetch encrypted data to avoid a db search request.

Example URL call:
`https://$HOST/$apikey/$filename`

3. Logs api - Implemented temporarily to check the log file.

Installation Steps:

1. Clone the repo.
2. Add email details in `config/emailConfig.js` file.
3. run `npm install`
4. run `node index.js`
