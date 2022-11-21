
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

export interface DictUI {
  [key: string] : any;
}

export interface AuthEditUI {
  author: AuthorUI;
  fetchAuthors: (params: DictUI) => void;
  changeRowSel: (position: number) => void;
  updateAuthor: (obj: { [ key: string] : string }) => void;
}

export interface PagingUI {
  numRec: number;
  numRecSave: number;
  page: number;
}

export interface AuthListUI {
  authors: AuthorUI[];
  loading: boolean;
  rowSel: number;

  numRec: number;
  numRecSave: number;
  page: number;
  numPages: number;
  cnt: number;

  updateNumRec: (size: number) => void;
  updateAuthor: (obj: { [ key: string] : string }) => void;

  changeRowSel: (position: number) => void;
  handleAuthorRemove: (id: string) => void;
}
