export class BuildConfig {
  static stConfig = {
    url: null,
    stPage: {
      placement: "center",
      pageSizes: [10, 20, 30, 50, 100],
      showSize: true,
      showQuickJumper: true,
      total: true,
      toTop: true,
      front: false
    },
    req: {
      param: {},
      headers: {},
      method: "POST",
      allInBody: true,
      reName: {
        pi: "_pageIndex",
        ps: "_pageSize"
      }
    },
    multiSort: {
      key: "_sort",
      separator: ",",
      nameSeparator: " "
    }
  };
}