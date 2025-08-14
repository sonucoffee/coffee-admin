import { gql } from '@apollo/client';

export const CREATE_DOMAIN_ALLOWLIST = gql`
  mutation CreateDomainAllowlist($input: CreateDomainAllowlistInput!) {
    createDomainAllowlist(input: $input) {
      domainAllowlist {
        id
        domain
        createdAt
        updatedAt
        createdBy {
          id
          email
          givenName
          surname
        }
      }
    }
  }
`;

export const UPDATE_DOMAIN_ALLOWLIST = gql`
  mutation UpdateDomainAllowlist($input: UpdateDomainAllowlistInput!) {
    updateDomainAllowlist(input: $input) {
      domainAllowlist {
        id
        domain
        createdAt
        updatedAt
        createdBy {
          id
          email
          givenName
          surname
        }
      }
    }
  }
`;

export const DELETE_DOMAIN_ALLOWLIST = gql`
  mutation DeleteDomainAllowlist($input: DeleteDomainAllowlistInput!) {
    deleteDomainAllowlist(input: $input) {
      success
    }
  }
`;

export const INVITE_USER = gql`
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input) {
      user {
        id
        email
        givenName
        surname
        profileImageUrl
        isOnboarded
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        id
        email
        givenName
        surname
        profileImageUrl
        isOnboarded
      }
    }
  }
`;

export const DELETE_USER_ROLE = gql`
  mutation DeleteUserRole($input: DeleteUserRoleInput!) {
    deleteUserRole(input: $input) {
      success
      error
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      success
      workspace {
        id
        name
        domain
      }
      error
    }
  }
`;

export const UPDATE_WORKSPACE_PREFERENCES = gql`
  mutation UpdateWorkspacePreferences($input: UpdateWorkspacePreferencesInput!) {
    updatePreferences(input: $input) {
      preferences {
        id
        workspaceId
        preferences
        createTs
        updateTs
      }
    }
  }
`;