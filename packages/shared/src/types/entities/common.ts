// ─── Utility Type: Serialized<T> ────────────────────────
// Converts Date → string for JSON-serialized API responses

type SerializedValue<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<SerializedValue<U>>
    : T extends object
      ? Serialized<T>
      : T;

export type Serialized<T> = {
  [K in keyof T]: SerializedValue<T[K]>;
};

// ─── Common Nested Relation Shapes ──────────────────────

export interface UserBrief {
  id: string;
  name: string;
}

export interface UserBriefWithEmail extends UserBrief {
  email: string;
}

export interface PropertyBrief {
  id: string;
  address: string;
  city: string;
}

export interface PropertyBriefWithOwner extends PropertyBrief {
  user: UserBrief;
}
