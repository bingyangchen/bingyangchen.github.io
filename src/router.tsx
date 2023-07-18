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

// layer two
import Home from "./pages/Main/Home/Home";

export default function MyRouter() {
    return (
        <Routes>
            <Route path="" element={<Main />}>
                <Route path="" element={<Home />}></Route>
            </Route>
            <Route path="*" element={<Navigate to="" />} />
        </Routes>
    );
}

export interface IRouter {
    router: {
        location: Location;
        navigate: NavigateFunction;
        params: Params;
        searchParams: URLSearchParams;
        setSearchParams: ReturnType<typeof useSearchParams>[1];
    };
}

export function withRouter(Component: any) {
    return (props: any = {}) => {
        let location = useLocation();
        let navigate = useNavigate();
        let params = useParams();
        let [searchParams, setSearchParams] = useSearchParams();
        return (
            <Component
                {...props}
                router={{
                    location,
                    navigate,
                    params,
                    searchParams,
                    setSearchParams,
                }}
            />
        );
    };
}
