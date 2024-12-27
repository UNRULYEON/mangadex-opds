export type MD_List = {
  id: string;
  type: "custom_list";
  attributes: {
    name: string;
    version: number;
    visibility: string;
  };
  relationships: {
    id: string;
    type: "manga" | "user";
  }[];
};
