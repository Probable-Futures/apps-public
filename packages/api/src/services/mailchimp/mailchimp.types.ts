export type Status = "subscribed" | "unsubscribed" | "pending" | "archived";

export interface Tag {
  name: string;
  status: string;
}

export interface NewContact {
  emailAddress: string;
  mergeFields: { [name: string]: unknown };
  status: Status;
  tags?: Tag[];
  interests?: { [interestId: string]: boolean };
}

export interface TagsResponse {
  id: number;
  name: "string";
}

export interface Interest {
  id: string;
  name: string;
  display_order: number;
}

export interface InterestCategory {
  list_id: string;
  id: string;
  title: string;
  display_order: number;
  type: string;
}

export interface InterestCategories {
  list_id: string;
  categories: InterestCategory[];
}

export interface GroupsResponse {
  groupId: string;
  groupTitle: string;
  displayOrder: number;
  type: string;
  interests: Interest[];
}

export type Subscriber = {
  userId: string;
  status: Status;
};
