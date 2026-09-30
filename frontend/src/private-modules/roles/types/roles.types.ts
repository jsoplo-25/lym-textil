export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  badgeLabel?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
}

export interface CreateRoleDTO {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: string[];
}
