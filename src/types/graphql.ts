export interface DomainAllowlist {
  id: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    givenName: string;
    surname: string;
  };
}

export interface User {
  id: string;
  email: string;
  givenName: string;
  surname: string;
  profileImageUrl?: string;
  isOnboarded: boolean;
  role?: string;
  inviteStatus?: string;
  lastLoginTs?: string;
  isSuperuser?: boolean;
}

export interface CreateDomainAllowlistInput {
  domain: string;
}

export interface UpdateDomainAllowlistInput {
  id: number;
  domain?: string;
}

export interface DeleteDomainAllowlistInput {
  id: number;
}

export interface InviteUserInput {
  workspaceId: string;
  email: string;
  role: string;
}

export interface UpdateUserInput {
  id: number;
  givenName?: string;
  preferredName?: string;
  surname?: string;
  profileImageUrl?: string;
  isOnboarded?: boolean;
  workspaceRole?: {
    workspaceId: number;
    role: string;
  };
  workspaceId: string;
}

export interface DeleteUserRoleInput {
  userId: number;
  workspaceId: number;
}

export interface WorkspaceFilter {
  search?: string;
}

export interface CreateWorkspaceInput {
  name: string;
  domain?: string;
  logoUrl?: string;
  owners?: CreateWorkspaceUserInput[];
  users?: CreateWorkspaceUserInput[];
  addCreatorAsOwner?: boolean;
}

export interface CreateWorkspaceUserInput {
  id: number;
}

export interface CreateWorkspace {
  success: boolean;
  workspace?: {
    id: string;
    name: string;
    domain?: string;
  };
  error?: string;
}

export interface UserSearchFilter {
  search?: string;

}