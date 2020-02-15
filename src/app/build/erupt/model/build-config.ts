export class BuildConfig {
  public static pi = "_pageIndex";

  public static ps = "_pageSize";

  public stConfig: any = {
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
        pi: BuildConfig.pi,
        ps: BuildConfig.ps
      }
    },
    multiSort: {
      key: "_sort",
      separator: ",",
      nameSeparator: " "
    }
  };
}