export interface QueryTab {
  id: string;
  connectionId: string;
  database: string;
  initialSql?: string;
  title: string;
}
