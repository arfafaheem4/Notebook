export type Cell = {
  id: string;
  code: string;
  output: string;
  status: "idle" | "running" | "success" | "error";
  type: "code" | "markdown";
  image?: string;
};