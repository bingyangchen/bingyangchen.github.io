import {
    Routes,
    Route,
    Navigate,
    Location,
    NavigateFunction,
    Params,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";

// layer one
import Main from "./pages/Main/Main";
import NotFound from "./pages/NotFound/NotFound";

// layer two

export default function MyRouter() {
    return (
        <Routes>
            <Route path="" element={<Main />}></Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export interface RouterInterface {
    router: {
        location: Location;
        navigate: NavigateFunction;
        params: Params;
        search_params: URLSearchParams;
        set_search_params: ReturnType<typeof useSearchParams>[1];
    };
}

export function withRouter(Component: any) {
    return (props: any = {}) => {
        let location = useLocation();
        let navigate = useNavigate();
        let params = useParams();
        let [search_params, set_search_params] = useSearchParams();
        return (
            <Component
                {...props}
                router={{
                    location,
                    navigate,
                    params,
                    search_params,
                    set_search_params,
                }}
            />
        );
    };
}
