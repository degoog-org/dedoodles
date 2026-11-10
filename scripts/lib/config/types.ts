export type Author = { name: string; url?: string };

export type Title = Record<string, string>;

export type Logo = {
  date: string;
  id: string;
  query: string;
  title: Title;
  authors: Author[];
  image: string;
};

export type ManifestEntry = Omit<Logo, "date">;

export type Manifest = {
  version: number;
  commit: string;
  logos: Record<string, ManifestEntry[]>;
};

export type Listing = { dirs: string[]; files: string[] };

export type Harvest = { logos: Logo[]; errors: string[] };

export type Report = (path: string, messages: string[]) => void;

export type Sniffer = (bytes: Uint8Array) => boolean;
