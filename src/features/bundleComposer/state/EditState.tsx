export type EditOp = 'add' | 'update' | 'remove';
export type ID = string;

export interface EditsState {
  byId: Record<
    ID,
    { entity: 'plan' | 'bundle' | 'channel'; op: EditOp; changes?: Record<string, unknown> }
  >;
}
