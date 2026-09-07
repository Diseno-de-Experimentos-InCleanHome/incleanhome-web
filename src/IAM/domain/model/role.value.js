/**
 * Value Object Role — user's role in the system.
 * Layer: IAM / domain / model
 */
export const Role = Object.freeze({
  CLIENT: "client",
  WORKER: "worker",
});

export const ALL_ROLES = [Role.CLIENT, Role.WORKER];

export function isValidRole(role) {
  return ALL_ROLES.includes(role);
}
