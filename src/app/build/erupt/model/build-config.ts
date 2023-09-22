import {STPage, STReq, STRes} from "@delon/abc/st/st.interfaces";

export class BuildConfig {
    public static pi = "pageIndex";

    public static ps = "pageSize";


    public stConfig = {
        url: null,
        stPage: <STPage>{
            placement: "center",
            pageSizes: [10, 20, 30, 50, 100, 300, 500],
            showSize: true,
            showQuickJumper: true,
            total: true,
            toTop: false,
            front: false,
        },
        req: <STReq>{
            params: {},
            headers: {},
            method: "POST",
            allInBody: true,
            reName: {
                pi: BuildConfig.pi,
                ps: BuildConfig.ps
            }
        },
        multiSort: {
            key: "sort",
            separator: ",",
            nameSeparator: " "
        },
        res: <STRes>{}
    };
}
