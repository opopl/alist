
export interface AuthorUI {
  [key: string] : any;
  id: number;
  url: string;
  name: string;
  plain: string;
  description: string;
}

export interface AuthListRowUI {
  position: number;
  select: boolean;
  author: AuthorUI;
  handleAuthorRemove: (id: number) => void;
  changeRowSel: (position: number) => void;
}

export interface AuthEditUI {
  fetchAuthors: () => void;
}

export interface AuthListUI {
  authors: AuthorUI[];
  loading: boolean;
  handleAuthorRemove: (id: number) => void;
}
