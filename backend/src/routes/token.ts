import { ConfidentialClientApplication } from '@azure/msal-node';
require('dotenv').config();

const msalConfig = {
  auth: {
    clientId: "bc69cb39-e2aa-4813-b275-ca0b1f34cdba",
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: 'bc69cb39-e2aa-4813-b275-ca0b1f34cdba',
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const tokenRequest = {
    scopes: ['https://outlook.office365.com/.default'],
  };
  const response = await cca.acquireTokenByClientCredential(tokenRequest);
  return response?.accessToken;
}
