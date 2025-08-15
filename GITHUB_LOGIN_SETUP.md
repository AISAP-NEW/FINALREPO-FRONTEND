# GitHub Login Setup Guide

This guide explains how to set up and use the GitHub OAuth login functionality in your AISAP frontend application.

## Overview

The GitHub login feature allows users to authenticate using their GitHub accounts instead of (or in addition to) traditional username/password authentication. This provides:

- **Quick Access**: Users can sign in with one click using their GitHub credentials
- **Account Linking**: Existing users can link their accounts to GitHub
- **Profile Integration**: Automatically imports GitHub profile information (avatar, bio, etc.)
- **Secure Authentication**: Uses OAuth 2.0 flow for secure authentication

## Backend Requirements

The backend must have the following endpoints implemented (as shown in your backend code):

- `GET /api/auth/GitHubAuth/login` - Initiates OAuth flow
- `GET /api/auth/GitHubAuth/callback` - Handles OAuth callback
- `POST /api/auth/GitHubAuth/link-account` - Links existing account to GitHub
- `POST /api/auth/GitHubAuth/unlink-account` - Unlinks GitHub account

## Frontend Setup

### 1. Environment Configuration

Update your `src/environments/environment.ts` file:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5183',
  github: {
    clientId: 'your-actual-github-client-id',
    redirectUri: 'http://localhost:4200/login'
  }
};
```

### 2. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `AISAP - AI Solutions Platform`
   - **Homepage URL**: `http://localhost:4200` (or your production URL)
   - **Authorization callback URL**: `http://localhost:4200/login` (or your production login URL)
4. Click "Register application"
5. Copy the **Client ID** and update your environment file

### 3. Backend Configuration

Ensure your backend has the correct GitHub OAuth configuration:

```csharp
// In your GitHubOptions or appsettings.json
{
  "GitHub": {
    "ClientId": "your-github-client-id",
    "ClientSecret": "your-github-client-secret"
  }
}
```

## How It Works

### 1. User Clicks GitHub Login

When a user clicks the "Continue with GitHub" button:

1. Frontend calls `/api/auth/GitHubAuth/login`
2. Backend generates GitHub authorization URL with proper scopes
3. User is redirected to GitHub for authorization
4. GitHub redirects back to your callback URL with an authorization code

### 2. OAuth Callback Handling

When GitHub redirects back to your application:

1. Frontend detects the callback parameters (`code` and `state`)
2. Frontend calls `/api/auth/GitHubAuth/callback` with the authorization code
3. Backend exchanges the code for an access token
4. Backend fetches user information from GitHub
5. Backend creates/updates user account and returns JWT token
6. Frontend stores the token and user information
7. User is redirected to the home page

### 3. User Account Management

- **New Users**: Automatically created with GitHub profile information
- **Existing Users**: Can link their accounts to GitHub for future OAuth login
- **Profile Sync**: GitHub avatar and basic information are imported

## Security Features

- **CSRF Protection**: Uses `state` parameter to prevent CSRF attacks
- **Secure Token Storage**: JWT tokens are stored securely in localStorage
- **Scope Limitation**: Only requests necessary scopes (`read:user`, `user:email`)
- **Error Handling**: Comprehensive error handling for all failure scenarios

## User Experience Features

- **Loading States**: Shows appropriate loading indicators during OAuth flow
- **Error Messages**: Clear error messages for failed authentication attempts
- **Success Feedback**: Welcome message with username after successful login
- **Responsive Design**: GitHub button works on all device sizes

## Troubleshooting

### Common Issues

1. **"GitHub authentication service not found"**
   - Ensure backend GitHub endpoints are properly configured
   - Check that the GitHub OAuth service is registered in DI container

2. **"Failed to obtain access token from GitHub"**
   - Verify GitHub OAuth App credentials are correct
   - Check that callback URL matches exactly

3. **"Authorization code is required"**
   - Ensure user completes the GitHub authorization flow
   - Check that the callback URL is accessible

4. **"User not found" during callback**
   - Verify backend user creation/linking logic
   - Check database connection and user table structure

### Debug Steps

1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify GitHub OAuth App configuration
4. Test backend endpoints independently
5. Check network tab for failed requests

## Testing

### Local Development

1. Start your backend server
2. Start your frontend application
3. Navigate to the login page
4. Click "Continue with GitHub"
5. Complete GitHub authorization
6. Verify successful login and redirect

### Production Deployment

1. Update environment configuration with production URLs
2. Update GitHub OAuth App callback URL
3. Ensure HTTPS is enabled (required by GitHub)
4. Test the complete OAuth flow in production

## Customization

### Styling

The GitHub button styling can be customized in `login.component.scss`:

```scss
.github-button {
  background: #24292e; // GitHub's brand color
  // Add your custom styles here
}
```

### Scopes

To request additional GitHub permissions, modify the scopes in the backend:

```csharp
var scopes = "read:user,user:email,repo"; // Add 'repo' for repository access
```

### User Role Assignment

Customize the default role for GitHub users in the backend:

```csharp
Role = "Developer" // Change default role as needed
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for detailed error information
3. Verify GitHub OAuth App configuration
4. Test with a simple OAuth flow first
5. Ensure all required dependencies are properly installed

## Security Notes

- Never expose GitHub client secrets in frontend code
- Always use HTTPS in production
- Implement proper session management
- Consider implementing rate limiting for OAuth endpoints
- Regularly review and update OAuth scopes
