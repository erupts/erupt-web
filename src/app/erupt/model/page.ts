/**
 * Created by liyuepeng on 10/24/18.
 */
export interface Page {
  pageNumber: number;
  pageSize: number;
  total?: number;
  list?: Array<object>;
}
