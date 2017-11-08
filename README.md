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

It is recommended to use an https server, because most email clients will reject the image, hence I have defaulted them with https prefix. I recommended using c9.io to run this project because they support https requests.

3. Logs api - Implemented temporarily to check the log file.

Example URL call:
`https://$HOST/logs`

Installation Steps:

1. Clone the repo.
2. Create a `logs` folder in root and create an empty file `logs.txt` inside that logs folder.
3. Add email details in `config/emailConfig.js` file.
4. run `npm install`
5. run `node index.js`
