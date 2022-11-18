
export interface AuthorUI {
  [key: string] : any;
  id: string;
  url: string;
  name: string;
  plain: string;
  description: string;
}

export interface AuthListRowUI {
  position: number;
  select: boolean;
  author: AuthorUI;
  handleAuthorRemove: (id: string) => void;
  changeRowSel: (position: number) => void;
  updateAuthor: (obj: { [ key: string] : string }) => void;
}

export interface AuthEditUI {
  fetchAuthors: () => void;
  author: AuthorUI;
  updateAuthor: (obj: { [ key: string] : string }) => void;
}

export interface AuthListUI {
  authors: AuthorUI[];
  loading: boolean;
  handleAuthorRemove: (id: string) => void;
  updateAuthor: (obj: { [ key: string] : string }) => void;
}
