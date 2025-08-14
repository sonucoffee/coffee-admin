import { gql } from '@apollo/client';

export const GET_DOMAIN_ALLOWLISTS = gql`
  query GetDomainAllowlists($filter: DomainAllowlistFilter) {
    domainAllowlists(filter: $filter) {
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
`;

export const GET_USERS = gql`
  query GetUsers($filter: UserFilterInput!, $workspaceId: ID!, $first: Int, $after: String) {
    users(filter: $filter, first: $first, after: $after) {
      edges {
        node {
          id
          email
          givenName
          surname
          profileImageUrl
          isOnboarded
          role(workspaceId: $workspaceId)
          inviteStatus(workspaceId: $workspaceId)
          lastLoginTs(workspaceId: $workspaceId)
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ME = gql`
  query GetMe($lastWorkspaceId: ID) {
    me(lastWorkspaceId: $lastWorkspaceId) {
      id
      email
      givenName
      surname
      profileImageUrl
      isSuperuser
      workspaces {
        id
        name
        domain
      }
    }
  }
`;

export const GET_WORKSPACES = gql`
  query GetWorkspaces($filter: WorkspaceFilter, $first: Int, $after: String) {
    workspaces(filter: $filter, first: $first, after: $after) {
      edges {
        node {
          id
          name
          domain
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($filter: UserFilterInput!, $first: Int, $after: String) {
    users(filter: $filter, first: $first, after: $after) {
      edges {
        node {
          id
          email
          givenName
          surname
          profileImageUrl
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_WORKSPACE_PREFERENCES = gql`
  query GetWorkspacePreferences($workspaceId: ID!) {
    workspacePreferences(workspaceId: $workspaceId) {
      id
      workspaceId
      preferences
      createTs
      updateTs
    }
  }
`;