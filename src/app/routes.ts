import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("test", "routes/test.tsx"),
  route("3d", "routes/3d.tsx"),
] satisfies RouteConfig;
