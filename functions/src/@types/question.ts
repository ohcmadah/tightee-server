export interface Question {
  createdAt: string;
  options: { [id: string]: string };
  title: string;
}
