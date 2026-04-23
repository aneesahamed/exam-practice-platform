import { Amplify } from 'aws-amplify';

// Cognito configuration from backend deployment (Ireland region)
export const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_YqJFAZHjp',
      userPoolClientId: '47d9g6od7uuaqc9hjq7vlp4jho',
      region: 'eu-west-1',
      loginWith: {
        email: true,
      },
    },
  },
};

// Configure Amplify
Amplify.configure(cognitoConfig);

export default cognitoConfig;
