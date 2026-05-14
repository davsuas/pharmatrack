export interface ImportResult {
  geocoded: number;
  failed: { hcp_id: string; reason: string }[];
}

export interface ProductLine {
  id: string;
  name: string;
}
